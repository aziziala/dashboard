import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { ClientService } from '../../services/client.service';
import { TaxiService } from '../../services/taxi.service';
import { Client, PhoneType } from '../../models/client.model';
import {
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ValidationErrors
} from '@angular/forms';
import { switchMap, finalize, takeUntil } from 'rxjs/operators';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ToastrService } from 'ngx-toastr';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

// ─── Export type ──────────────────────────────────────────────────────────────
type ExportType = 'excel' | 'csv' | 'pdf';

// ─── App switcher type ────────────────────────────────────────────────────────
type AppType = 'SMSTaxi' | 'TaxiSelect';

// ─── Search mode ──────────────────────────────────────────────────────────────
type SearchMode = 'phone' | 'name' | 'none';

@Component({
  selector: 'app-client-management',
  templateUrl: './client-management.component.html',
  styleUrls: ['./client-management.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush   // 🚀 performance boost
})
export class ClientManagementComponent implements OnInit, OnDestroy {

  // ─── Data ────────────────────────────────────────────────────────────────────
  clients: Client[]          = [];
  filteredClients: Client[]  = [];
  paginatedClients: Client[] = [];
  selectedClient: Client | null = null;

  // ─── UI state ────────────────────────────────────────────────────────────────
  isLoading        = false;
  isEditing        = false;
  isCreatingClient = false;
  isUpdating       = false;
  isDeleting       = false;
  showNewPassword  = false;
  showConfirmPassword = false;

  // ─── Search ───────────────────────────────────────────────────────────────────
  searchTerm  = '';
  searchMode: SearchMode = 'none';
  statusFilter = '';

  // ─── Pagination ───────────────────────────────────────────────────────────────
  currentPage  = 1;
  itemsPerPage = 10;
  totalItems   = 0;

  // ─── Computed pagination helpers ─────────────────────────────────────────────
  get totalPages(): number {
    return Math.ceil(this.totalItems / this.itemsPerPage);
  }
  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }
  get canGoPrev(): boolean { return this.currentPage > 1; }
  get canGoNext(): boolean { return this.currentPage < this.totalPages; }

  // ─── Stats ────────────────────────────────────────────────────────────────────
  clientStats = { total: 0, filtered: 0 };

  // ─── App switcher ─────────────────────────────────────────────────────────────
  currentApp: AppType = 'SMSTaxi';

  // ─── Forms ────────────────────────────────────────────────────────────────────
  clientForm!: FormGroup;
  passwordForm!: FormGroup;

  // ─── Pending data (create flow) ───────────────────────────────────────────────
  private pendingClientData!: Client;

  // ─── Editing state ────────────────────────────────────────────────────────────
  private editingClientId: number | null = null;

  // ─── Delete targets ───────────────────────────────────────────────────────────
  private selectedClientId!: number;
  private selectedClientPhone!: string;

  // ─── Modal refs ───────────────────────────────────────────────────────────────
  deleteModalRef!: NgbModalRef;
  clientPasswordModalRef?: NgbModalRef;
  addClientModalRef?: NgbModalRef;

  // ─── Email autocomplete ───────────────────────────────────────────────────────
  readonly emailDomains = ['@sms.tn', '@gmail.com', '@hotmail.com', '@yahoo.com'];
  filteredDomains: string[] = [];
  showDropdown = false;

  // ─── Phone types ──────────────────────────────────────────────────────────────
  readonly phoneTypeList = Object.values(PhoneType);

  // ─── Template helper ─────────────────────────────────────────────────────────
  readonly Math = Math;

  // ─── RxJS cleanup ────────────────────────────────────────────────────────────
  private readonly destroy$     = new Subject<void>();
  private readonly searchSubject = new Subject<string>();

  // ─── ViewChild ───────────────────────────────────────────────────────────────
  @ViewChild('changePasswordModal') changePasswordModal!: any;

  // ─────────────────────────────────────────────────────────────────────────────
  constructor(
    private readonly modalService:   NgbModal,
    private readonly clientService:  ClientService,
    private readonly taxiService:    TaxiService,
    private readonly toastr:         ToastrService,
    private readonly fb:             FormBuilder,
    private readonly cdr:            ChangeDetectorRef
  ) {}

  // ══════════════════════════════════════════════════════════════════════════════
  // LIFECYCLE
  // ══════════════════════════════════════════════════════════════════════════════

  ngOnInit(): void {
    this.initForms();
    this.restoreApp();
    this.listenAppSwitch();
    this.listenSearch();
    this.loadClients();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // INIT HELPERS
  // ══════════════════════════════════════════════════════════════════════════════

  private initForms(): void {
    this.clientForm = this.fb.group({
      nomPrenom:  ['', Validators.required],
      telephone:  ['', [Validators.required, Validators.pattern(/^\d{8,15}$/)]],
      type:       [null, Validators.required],
      email:      ['', [Validators.required, Validators.email]]
    });

    this.passwordForm = this.fb.group(
      {
        newPassword:     ['', [Validators.required, Validators.minLength(6), Validators.maxLength(40)]],
        confirmPassword: ['', Validators.required]
      },
      { validators: this.passwordMatchValidator }
    );
  }

  private restoreApp(): void {
    const saved = localStorage.getItem('currentApp') as AppType | null;
    if (saved) {
      this.currentApp = saved;
      this.taxiService.notifyAppChanged(saved);
    }
  }

  private listenAppSwitch(): void {
    this.taxiService.appChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(app => {
        this.currentApp = app;
        this.resetSearch();
        this.loadClients();
      });
  }

  private listenSearch(): void {
    this.searchSubject.pipe(
      debounceTime(350),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(term => this.performSearch(term));
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // DATA LOADING
  // ══════════════════════════════════════════════════════════════════════════════

  loadClients(): void {
    this.isLoading = true;

    this.clientService.getAllClients()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoading = false;
          this.cdr.markForCheck();  // notify OnPush
        })
      )
      .subscribe({
        next: (clients) => {
          this.clients           = clients;
          this.clientStats.total = clients.length;
          this.applyFilters();
        },
        error: (err) => {
          console.error('Error loading clients:', err);
          this.toastr.error('Impossible de charger les clients.', 'Erreur');
        }
      });
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // FILTERING & PAGINATION  (single source of truth)
  // ══════════════════════════════════════════════════════════════════════════════

  /**
   * Central filter method — always call this instead of touching
   * filteredClients / paginatedClients manually.
   */
  private applyFilters(): void {
    const term = this.searchTerm.trim().toLowerCase();

    this.filteredClients = this.clients.filter(client => {
      const matchesSearch = this.matchesSearchTerm(client, term);
      const matchesStatus = !this.statusFilter || (client as any).status === this.statusFilter;
      return matchesSearch && matchesStatus;
    });

    this.clientStats.filtered = this.filteredClients.length;
    this.totalItems           = this.filteredClients.length;

    // Keep current page valid
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = this.totalPages;
    }

    this.refreshPage();
    this.cdr.markForCheck();
  }

  private matchesSearchTerm(client: Client, term: string): boolean {
    if (!term) return true;

    switch (this.searchMode) {
      case 'phone':
        return client.telephone?.includes(term) ?? false;

      case 'name':
        return (
          client.nom?.toLowerCase().includes(term)  ||
          client.email?.toLowerCase().includes(term) ||
          false
        );

      default:
        // Fallback: try everything
        return (
          client.nom?.toLowerCase().includes(term)       ||
          client.telephone?.includes(this.searchTerm.trim()) ||
          client.email?.toLowerCase().includes(term)     ||
          false
        );
    }
  }

  private refreshPage(): void {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    this.paginatedClients = this.filteredClients.slice(start, start + this.itemsPerPage);
  }

  // ── Public filter helpers (called from template) ──────────────────────────

  /** Called by status dropdown */
  onStatusFilterChange(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // SEARCH
  // ══════════════════════════════════════════════════════════════════════════════

  /** Called on every keystroke — pushes to debounced subject */
  onSearchInput(): void {
    this.searchSubject.next(this.searchTerm);
  }

  private performSearch(term: string): void {
    const value = term.trim();
    this.currentPage = 1;

    if (!value) {
      this.searchMode = 'none';
    } else if (/^\d+$/.test(value)) {
      this.searchMode = 'phone';
    } else {
      this.searchMode = 'name';
    }

    this.applyFilters();
  }

  clearSearch(): void {
    this.resetSearch();
    this.applyFilters();
  }

  private resetSearch(): void {
    this.searchTerm  = '';
    this.searchMode  = 'none';
    this.currentPage = 1;
  }

  get isSearching(): boolean {
    return this.searchTerm.trim().length > 0;
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // PAGINATION
  // ══════════════════════════════════════════════════════════════════════════════

  onPageChange(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.refreshPage();
    this.cdr.markForCheck();
  }

  onItemsPerPageChange(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // MODAL OPENERS
  // ══════════════════════════════════════════════════════════════════════════════

  openAddModal(content: any): void {
    this.isEditing      = false;
    this.editingClientId = null;
    this.selectedClient  = null;

    this.clientForm.reset();
    this.setNomPrenomRequired(true);

    this.addClientModalRef = this.modalService.open(content, {
      size: 'lg',
      backdrop: 'static',
      centered: true
    });
  }

  openEditModal(content: any, client: Client): void {
    if (!client?.id) return;

    this.isEditing       = true;
    this.editingClientId = client.id;
    this.selectedClient  = client;

    this.setNomPrenomRequired(false);

    this.clientForm.patchValue({
      nomPrenom: client.nom,
      telephone: client.telephone,
      type:      client.type,
      email:     client.email
    });

    this.addClientModalRef = this.modalService.open(content, {
      size: 'lg',
      backdrop: 'static',
      centered: true
    });
  }

  openDetailsModal(content: any, client: Client): void {
    this.selectedClient = client;
    this.modalService.open(content, { size: 'lg', backdrop: 'static' });
  }

  openDeleteModal(modal: any, client: Client): void {
    this.selectedClient      = client;
    this.selectedClientId    = client.id!;
    this.selectedClientPhone = client.telephone!;

    this.deleteModalRef = this.modalService.open(modal, {
      centered: true,
      backdrop: 'static'
    });
  }

  openChangePasswordModal(): void {
    if (!this.selectedClient) return;

    this.passwordForm.reset();

    this.clientPasswordModalRef = this.modalService.open(
      this.changePasswordModal,
      { centered: true, backdrop: 'static' }
    );
  }

  // ─── Helper ──────────────────────────────────────────────────────────────────
  private setNomPrenomRequired(required: boolean): void {
    const ctrl = this.clientForm.get('nomPrenom');
    if (required) {
      ctrl?.setValidators(Validators.required);
    } else {
      ctrl?.clearValidators();
    }
    ctrl?.updateValueAndValidity();
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // SAVE / CREATE / UPDATE
  // ══════════════════════════════════════════════════════════════════════════════

  saveClient(): void {
    if (this.clientForm.invalid) {
      this.clientForm.markAllAsTouched();
      return;
    }

    const { nomPrenom, email, type, telephone } = this.clientForm.value;

    const clientData: Client = {
      id:        this.editingClientId ?? 0,
      nom:       this.isEditing ? (this.selectedClient?.nom ?? '') : nomPrenom,
      email,
      type,
      telephone
    };

    if (this.isEditing && this.editingClientId) {
      this.updateClient(clientData);
    } else {
      this.pendingClientData = clientData;
      this.passwordForm.reset();
      this.clientPasswordModalRef = this.modalService.open(
        this.changePasswordModal,
        { centered: true, backdrop: 'static' }
      );
    }
  }

  submitClientPassword(modal: any): void {
    if (this.passwordForm.invalid || this.isCreatingClient) return;

    this.isCreatingClient = true;
    const password = this.passwordForm.value.newPassword as string;

    this.clientService
      .addClientWithUser(this.pendingClientData, password)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isCreatingClient = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: () => {
          this.toastr.success('Le client a été ajouté avec succès.', 'Création réussie');
          this.clientPasswordModalRef?.close();
          this.addClientModalRef?.close();
          this.clientForm.reset();
          this.passwordForm.reset();
          this.loadClients();
        },
        error: (err) => this.handleHttpError(err, 'Création échouée')
      });
  }

  private updateClient(clientData: Client): void {
    if (this.isUpdating || !this.selectedClient) return;

    this.isUpdating = true;
    const oldTelephone = this.selectedClient.telephone!;

    this.clientService
      .updateClient(clientData, oldTelephone)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isUpdating = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: () => {
          this.toastr.success(
            'Le client et le compte utilisateur ont été mis à jour.',
            'Modification réussie'
          );
          this.addClientModalRef?.close();
          this.isEditing       = false;
          this.editingClientId = null;
          this.clientForm.reset();
          this.loadClients();
        },
        error: (err) => this.handleHttpError(err, 'Modification échouée')
      });
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // DELETE
  // ══════════════════════════════════════════════════════════════════════════════

  confirmDelete(): void {
    if (this.isDeleting) return;

    this.isDeleting = true;

    this.clientService
      .deleteClient(this.selectedClientId)
      .pipe(
        switchMap(() => this.clientService.deleteAccount(this.selectedClientPhone)),
        takeUntil(this.destroy$),
        finalize(() => {
          this.isDeleting = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: () => {
          this.toastr.success('Le client a été supprimé.', 'Suppression réussie');
          this.deleteModalRef?.close();

          // Optimistic local removal — no full reload needed
          this.clients = this.clients.filter(c => c.id !== this.selectedClientId);
          this.clientStats.total = this.clients.length;
          this.applyFilters();
        },
        error: (err) => this.handleHttpError(err, 'Suppression échouée')
      });
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // VALIDATION
  // ══════════════════════════════════════════════════════════════════════════════

  isInvalid(controlName: string): boolean {
    const control = this.clientForm.get(controlName);
    return !!(control?.invalid && control.touched);
  }

  isPasswordInvalid(controlName: string): boolean {
    const control = this.passwordForm.get(controlName);
    return !!(control?.invalid && control.touched);
  }

  get passwordMismatch(): boolean {
    return !!(
      this.passwordForm.errors?.['mismatch'] &&
      this.passwordForm.get('confirmPassword')?.touched
    );
  }

  get passwordLength(): number {
    return this.passwordForm.get('newPassword')?.value?.length ?? 0;
  }

  /** Static validator — defined as arrow fn to avoid `this` binding issues */
  private readonly passwordMatchValidator = (group: AbstractControl): ValidationErrors | null => {
    const pw  = group.get('newPassword')?.value;
    const cpw = group.get('confirmPassword')?.value;
    return pw === cpw ? null : { mismatch: true };
  };

  // ══════════════════════════════════════════════════════════════════════════════
  // EMAIL AUTOCOMPLETE
  // ══════════════════════════════════════════════════════════════════════════════

  onEmailInput(): void {
    const value: string = this.clientForm.get('email')?.value ?? '';
    const atIdx = value.indexOf('@');

    this.filteredDomains = atIdx === -1
      ? [...this.emailDomains]
      : this.emailDomains.filter(d => d.startsWith(value.slice(atIdx)));

    this.showDropdown = true;
  }

  onEmailBlur(): void {
    setTimeout(() => {
      this.showDropdown = false;
      this.cdr.markForCheck();
    }, 150);
  }

  selectDomain(domain: string): void {
    const localPart = this.emailLocalPart;
    this.clientForm.get('email')!.setValue(localPart + domain);
    this.showDropdown = false;
  }

  get emailLocalPart(): string {
    const value: string = this.clientForm.get('email')?.value ?? '';
    const atIdx = value.indexOf('@');
    return atIdx === -1 ? value : value.slice(0, atIdx);
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // LABELS
  // ══════════════════════════════════════════════════════════════════════════════

  getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      [PhoneType.gsm]:        'GSM (Téléphone classique)',
      [PhoneType.smartphone]: 'Smartphone'
    };
    return labels[type] ?? type;
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // EXPORT
  // ══════════════════════════════════════════════════════════════════════════════

  async exportData(type: ExportType): Promise<void> {
    const source = this.filteredClients.length ? this.filteredClients : this.clients;

    if (!source.length) {
      this.toastr.warning('Aucune donnée à exporter.', 'Export');
      return;
    }

    const rows = source.map(c => ({
      ID:         c.id,
      Nom:        c.nom        ?? '',
      Téléphone:  c.telephone  ?? '',
      Email:      c.email      ?? '',
      Type:       this.getTypeLabel(c.type ?? '')
    }));

    switch (type) {
      case 'excel': this.exportExcel(rows); break;
      case 'csv':   this.exportCsv(rows);   break;
      case 'pdf':   await this.exportPdf(rows); break;
    }
  }

 private exportExcel(rows: object[]): void {
  // ✅ Step 1: create sheet normally (no origin)
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Clients');

  // ✅ Step 2: shift all existing cells down by 6 rows manually
  //    to make room for branding header rows above the data
  const range = XLSX.utils.decode_range(ws['!ref'] ?? 'A1');
  
  // Shift cells from bottom-up to avoid overwriting
  for (let R = range.e.r; R >= range.s.r; R--) {
    for (let C = range.s.c; C <= range.e.c; C++) {
      const oldRef = XLSX.utils.encode_cell({ r: R, c: C });
      const newRef = XLSX.utils.encode_cell({ r: R + 6, c: C });
      if (ws[oldRef]) {
        ws[newRef] = ws[oldRef];
        delete ws[oldRef];
      }
    }
  }

  // Update the sheet range to include the new rows
  ws['!ref'] = XLSX.utils.encode_range({
    s: { r: 0, c: range.s.c },
    e: { r: range.e.r + 6, c: range.e.c }
  });

  // ── Branding cells ──────────────────────────────────────────────────
  ws['A1'] = {
    v: 'TAXICHY',
    s: { font: { bold: true, sz: 12, color: { rgb: '211F54' } } }
  };
  ws['A2'] = {
    v: '© SMS TAXI 2025 – service autorisé et conforme à la législation tunisienne',
    s: { font: { sz: 7, color: { rgb: '211F54' } } }
  };
  ws['A4'] = {
    v: 'Répertoire des Clients Inscrits',
    s: {
      font: { bold: true, sz: 20, color: { rgb: '211F54' } },
      alignment: { horizontal: 'center' }
    }
  };

  ws['!merges'] = [{ s: { r: 3, c: 0 }, e: { r: 3, c: 7 } }];
  ws['!cols']   = [{ wch: 5 }, { wch: 22 }, { wch: 28 }, { wch: 16 }, { wch: 16 }];

  // ── Header row styling (row 7 = index 6) ───────────────────────────
  ['A', 'B', 'C', 'D', 'E'].forEach(col => {
    const ref = `${col}7`;
    if (ws[ref]) {
      ws[ref].s = {
        font:      { bold: true, color: { rgb: 'FFFFFF' } },
        fill:      { fgColor: { rgb: '211F54' } },
        alignment: { horizontal: 'center' }
      };
    }
  });

  XLSX.writeFile(wb, `clients_${this.todaySlug()}.xlsx`);
}

  private exportCsv(rows: object[]): void {
    const ws  = XLSX.utils.json_to_sheet(rows);
    const csv = XLSX.utils.sheet_to_csv(ws);
    this.downloadBlob(csv, `clients_${this.todaySlug()}.csv`, 'text/csv;charset=utf-8;');
  }

  private async exportPdf(rows: object[]): Promise<void> {
    const doc       = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // ── Legal header ─────────────────────────────────────────────────────
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(33, 31, 84);
    doc.text('TAXICHY – © SMS TAXI 2025, service autorisé et conforme à la législation tunisienne', 10, 8);

    // ── Logo ─────────────────────────────────────────────────────────────
    try {
      const logo = await this.loadImageBase64('assets/logoY2.png');
      doc.addImage(logo, 'PNG', (pageWidth - 90) / 2, 10, 90, 0);
    } catch {
      // logo optional — continue without it
    }

    // ── Title ─────────────────────────────────────────────────────────────
    doc.setFontSize(20);
    doc.text('Répertoire des Clients Inscrits', pageWidth / 2, 45, { align: 'center' });
    doc.setDrawColor(33, 31, 84);
    doc.setLineWidth(0.5);
    doc.line(60, 48, pageWidth - 60, 48);

    // ── Meta line ─────────────────────────────────────────────────────────
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text(
      `Exporté le ${new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })} – ${rows.length} client(s)`,
      pageWidth / 2, 54, { align: 'center' }
    );

    // ── Table ─────────────────────────────────────────────────────────────
    autoTable(doc, {
      head: [['ID', 'Nom et Prénom', 'Email', 'Téléphone', 'Type']],
      body: (rows as any[]).map(r => [r.ID, r.Nom, r.Email, r.Téléphone, r.Type]),
      startY: 58,
      theme: 'grid',
      headStyles: {
        fillColor: [33, 31, 84],
        textColor: 255,
        halign: 'center',
        fontStyle: 'bold'
      },
      alternateRowStyles: { fillColor: [245, 245, 255] },
      styles: { fontSize: 9 }
    });

    // ── Footer on every page ──────────────────────────────────────────────
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      const h = doc.internal.pageSize.getHeight();
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`TAXICHY – Répertoire Clients`, 14, h - 10);
      doc.text(`Page ${i} / ${pageCount}`, pageWidth - 14, h - 10, { align: 'right' });
    }

    doc.save(`clients_${this.todaySlug()}.pdf`);
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  private downloadBlob(content: string, filename: string, mime: string): void {
    const blob = new Blob([content], { type: mime });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);   // 🧹 clean up memory
  }

  private todaySlug(): string {
    return new Date().toISOString().slice(0, 10); // "2025-05-08"
  }

  private loadImageBase64(path: string): Promise<string> {
    return fetch(path)
      .then(r => r.blob())
      .then(blob => new Promise<string>((resolve, reject) => {
        const reader  = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      }));
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // ERROR HANDLER  (centralised — no more duplicated switch blocks)
  // ══════════════════════════════════════════════════════════════════════════════

  private handleHttpError(err: any, fallbackTitle: string): void {
    console.error(err);
    const msg = err?.error?.message ?? 'Une erreur inattendue est survenue.';

    const map: Record<number, () => void> = {
      400: () => this.toastr.warning(msg, 'Requête invalide'),
      404: () => this.toastr.error(msg || 'Ressource introuvable.', 'Introuvable'),
      409: () => this.toastr.error(msg || 'Conflit de données.', 'Conflit'),
      500: () => this.toastr.error('Erreur interne du serveur.', 'Erreur serveur')
    };

    (map[err?.status] ?? (() => this.toastr.error(msg, fallbackTitle)))();
  }
}