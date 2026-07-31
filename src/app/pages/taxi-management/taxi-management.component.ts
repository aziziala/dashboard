import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { TaxiService } from '../../services/taxi.service';
import { Taxi, TaxiStatus, PhoneType, TaxiStats, TaxiCriteriaFilters, TaxiSortBy } from '../../models/taxi.model';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { finalize, Subscription } from 'rxjs';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

declare const window: any;

type TaxiView =
  | 'all'
  | 'withSim'
  | 'withoutSim'
  | 'approved'
  | 'pending';

type ActiveTaxiFilters = { taxiStatus: TaxiStatus | ''; hide: boolean | null };

@Component({
  selector: 'app-taxi-management',
  templateUrl: './taxi-management.component.html',
  styleUrls: ['./taxi-management.component.scss']
})
export class TaxiManagementComponent implements OnInit, OnDestroy {
  // Enums
  TaxiStatus = TaxiStatus;
  PhoneType = PhoneType;

  // Data
  taxis: Taxi[] = [];
  selectedTaxi: Taxi | null = null;
  pendingTaxiData!: Taxi;

  // Pagination (values come straight from the backend response)
  currentPage = 1;
  itemsPerPage = 10;
  totalElements = 0;
  totalPages = 0;

  // Search
  searchTerm = '';
  statusFilter: TaxiStatus | '' = '';
  currentView: TaxiView = 'all';
  activeTaxiFilters: ActiveTaxiFilters = { taxiStatus: '', hide: null };
  currentSortField: TaxiSortBy | null = null;
  currentSortDirection: 'asc' | 'desc' = 'desc';
  searchPhone?: string;
  searchName?: string;

  // Loading states
  isLoading = false;
  isSending = false;
  isUpdating = false;
  isDeletingTaxi = false;

  // Forms
  taxiForm!: FormGroup;
  passwordForm!: FormGroup;
  confirmationForm!: FormGroup;
  verifyForm!: FormGroup;

  // Modal state
  isEditing = false;
  editingTaxiId: number | null = null;
  showNewPassword = false;
  showConfirmPassword = false;

  // Stats (always comes from response.stats)
  taxiStats: TaxiStats = {
    total: 0,
    withSim: 0,
    withoutSim: 0,
    approved: 0,
    waiting: 0
  };

  // Email autocomplete
  emailDomains = ['@sms.tn', '@gmail.com', '@hotmail.com', '@yahoo.com'];
  filteredDomains: string[] = [];
  showDropdown = false;

  // Modals refs
  deleteTaxiModalRef!: NgbModalRef;
  addEditModalRef!: NgbModalRef;
  passwordModalRef!: NgbModalRef;

  // Tokens
  token!: string;
  resetToken!: string;
  passwordTaxiId!: number;

  // Toast
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'danger' | 'warning' = 'warning';

  // Delete
  selectedTaxiId!: number;
  selectedTaxiPhone!: string;

  // Theme
  isDarkMode = false;
  currentApp = 'SMSTaxi';

  // View children
  @ViewChild('confirmationCodeModal') confirmationCodeModal!: any;
  @ViewChild('changePasswordModal1') changePasswordModal1!: any;
  @ViewChild('changePasswordModal2') changePasswordModal2!: any;
  @ViewChild('passwordModalForAdd') passwordModalForAdd!: any;
  @ViewChild('passwordModalForReset') passwordModalForReset!: any;

  // Subscriptions
  private sub = new Subscription();

  constructor(
    private modalService: NgbModal,
    private taxiService: TaxiService,
    private toastr: ToastrService,
    private fb: FormBuilder,
    private router: Router
  ) {
    this.initForms();
  }

  ngOnInit(): void {

    const savedApp = localStorage.getItem('currentApp') as
      'SMSTaxi' | 'TaxiSelect';

    if (savedApp) {
      this.currentApp = savedApp;
      this.taxiService.notifyAppChanged(savedApp);
    }

    this.resetQueryState();
    this.fetchTaxis();

    this.sub.add(
      this.taxiService.appChanged$.subscribe(app => {

        this.currentApp = app;

        this.resetQueryState();

        this.fetchTaxis();

      })
    );

  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  // ===== QUERY STATE =====

  private resetQueryState(): void {
    this.currentPage = 1;
    this.itemsPerPage = 10;
    this.currentView = 'all';
    this.activeTaxiFilters = { taxiStatus: '', hide: null };
    this.currentSortField = null;
    this.currentSortDirection = 'desc';

    this.searchTerm = '';
    this.searchPhone = undefined;
    this.searchName = undefined;
    this.statusFilter = '';
  }

  private buildFilters(): TaxiCriteriaFilters {
    return {
      taxiStatus: this.activeTaxiFilters.taxiStatus || undefined,
      hide: this.activeTaxiFilters.hide ?? undefined,
      phone: this.searchPhone?.trim() || undefined,
      name: this.searchName?.trim() || undefined,
      sortBy: this.currentSortField || undefined
    };
  }

  private fetchTaxis(): void {
    this.isLoading = true;

    const pageIndex = this.currentPage - 1;

    this.taxiService
      .getAllTaxisCriteria(pageIndex, this.itemsPerPage, this.buildFilters())
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
      next: (response) => {

  console.log(response);

  try {

    console.log(response.taxis);

    console.log(response.taxis.content);

    console.log(response.stats);

    this.taxis = response.taxis.content;

    this.totalElements = response.taxis.totalElements;

    this.totalPages = response.taxis.totalPages;

    this.currentPage = response.taxis.number + 1;

    this.taxiStats = response.stats;

    console.log('Assigned taxis:', this.taxis);

  } catch (e) {

    console.error('Mapping error', e);

  }

  },
        error: () => {
          this.toastr.error('Impossible de charger les taxis', 'Erreur');
        }
      });
  }

  private syncViewFromFilters(): void {
    const { taxiStatus, hide } = this.activeTaxiFilters;

    if (taxiStatus) {
      this.currentView =
        taxiStatus === TaxiStatus.APPROVED
          ? 'approved'
          : taxiStatus === TaxiStatus.PENDING
            ? 'pending'
            : 'all';
} else if (hide === true) {
  this.currentView = 'withSim';
} else if (hide === false) {
  this.currentView = 'withoutSim';
}else {
      this.currentView = 'all';
    }
  }

  private applyCurrentState(): void {
    this.syncViewFromFilters();
    this.fetchTaxis();
  }

  // ===== SEARCH & FILTER =====

  searchTaxis(): void {
    const term = this.searchTerm.trim();

    this.searchPhone = undefined;
    this.searchName = undefined;

    if (term) {
      if (/^\d+$/.test(term)) {
        this.searchPhone = term;
      } else {
        this.searchName = term;
      }
    }

    this.currentPage = 1;
    this.fetchTaxis();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.searchPhone = undefined;
    this.searchName = undefined;
    this.currentPage = 1;
    this.fetchTaxis();
  }

  onStatusFilterChange(): void {
    this.activeTaxiFilters = { taxiStatus: this.statusFilter, hide: null };
    this.currentPage = 1;
    this.applyCurrentState();
  }

  changeView(view: TaxiView): void {
    this.currentView = view;
    this.currentPage = 1;

    switch (view) {
      case 'all':
        this.activeTaxiFilters = { taxiStatus: '', hide: null };
        break;
case 'withSim':
  this.activeTaxiFilters = { taxiStatus: '', hide: true };
  break;

case 'withoutSim':
  this.activeTaxiFilters = { taxiStatus: '', hide: false };
  break;
      case 'approved':
        this.activeTaxiFilters = { taxiStatus: TaxiStatus.APPROVED, hide: null };
        break;
      case 'pending':
        this.activeTaxiFilters = { taxiStatus: TaxiStatus.PENDING, hide: null };
        break;
    }

    this.statusFilter = this.activeTaxiFilters.taxiStatus;
    this.fetchTaxis();
  }

  // ===== PAGINATION =====

  onPageChange(page: number): void {
    if (page < 1 || page > this.totalPages) {
      return;
    }
    this.currentPage = page;
    this.fetchTaxis();
  }

  onPageSizeChange(size: number): void {
    this.itemsPerPage = Number(size);
    this.currentPage = 1;
    this.fetchTaxis();
  }

  get visiblePages(): number[] {

    const pages: number[] = [];

    const start = Math.max(1, this.currentPage - 2);
    const end = Math.min(this.totalPages, this.currentPage + 2);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;

  }

  // ===== SORTING =====

  onSortByCourses(sortField: TaxiSortBy): void {
    if (this.currentSortField === sortField) {
      this.currentSortDirection = this.currentSortDirection === 'desc' ? 'asc' : 'desc';
    } else {
      this.currentSortField = sortField;
      this.currentSortDirection = 'desc';
    }

    this.currentPage = 1;
    this.fetchTaxis();
  }

  // ===== FORM INITIALIZATION =====

  initForms(): void {
    this.taxiForm = this.fb.group({
      nomPrenom: ['', Validators.required],
      cin: ['', Validators.required],
      immatricule: ['', Validators.required],
      plaqueTaxi: ['', Validators.required],
      modeleVoiture: ['', Validators.required],
      taxiStatus: [TaxiStatus.PENDING, Validators.required],
      typeTel: [PhoneType.gsm, Validators.required],
      numTel: ['', Validators.required],
      email: ['', [Validators.email]],
      hide: [false],
      numeroSim: ['']
    });

    this.passwordForm = this.fb.group(
      {
        newPassword: [
          '',
          [Validators.required, Validators.minLength(6), Validators.maxLength(40)]
        ],
        confirmPassword: ['', Validators.required]
      },
      { validators: this.passwordMatchValidator }
    );

    this.confirmationForm = this.fb.group({
      code1: ['', Validators.required],
      code2: ['', Validators.required],
      code3: ['', Validators.required],
      code4: ['', Validators.required]
    });

    this.verifyForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      numTel: ['', Validators.required]
    });
  }

  passwordMatchValidator(group: FormGroup) {
    const password = group.get('newPassword')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  // ===== MODALS =====

  openAddModal(content: any): void {
    this.isEditing = false;
    this.editingTaxiId = null;
    this.taxiForm.reset({
      taxiStatus: TaxiStatus.PENDING,
      typeTel: PhoneType.gsm,
      hide: false
    });

    this.addEditModalRef = this.modalService.open(content, {
      size: 'lg',
      backdrop: 'static',
      centered: true
    });
  }

  openEditModal(content: any, taxi: Taxi): void {
    if (!taxi || !taxi.id) return;

    this.isEditing = true;
    this.editingTaxiId = taxi.id;
    this.selectedTaxi = taxi;

    this.taxiForm.patchValue({
      nomPrenom: taxi.nom,
      cin: taxi.numeroCin,
      immatricule: taxi.numeroMatricule,
      plaqueTaxi: taxi.numeroTaxi,
      modeleVoiture: taxi.constructeur,
      taxiStatus: taxi.taxiStatus,
      typeTel: taxi.type,
      numTel: taxi.telephone,
      email: taxi.email,
      numeroSim: taxi.numeroSim,
      hide: taxi.hide,
    });
    this.addEditModalRef = this.modalService.open(content, {
      size: 'lg',
      backdrop: 'static',
      centered: true
    });
  }

  openDetailsModal(content: any, taxi: Taxi): void {

    this.selectedTaxi = taxi;

    this.modalService.open(content, {
      size: 'lg',
      backdrop: 'static',
      centered: true
    });

  }

  openDeleteModal(content: any, taxiId: number, telephone: string): void {
    if (!taxiId) {
      console.error('Invalid taxi ID');
      return;
    }

    this.selectedTaxiId = taxiId;
    this.selectedTaxiPhone = telephone;

    this.deleteTaxiModalRef = this.modalService.open(content, {
      centered: true,
      backdrop: 'static'
    });
  }

  openVerifyIdentityModal(content: any, taxi: Taxi): void {
    if (!taxi.email || !taxi.telephone) {
      this.toastr.warning('Email ou téléphone manquant');
      return;
    }

    this.verifyForm.reset();
    this.passwordTaxiId = taxi.id!;

    this.verifyForm.patchValue({
      email: taxi.email,
      numTel: taxi.telephone
    });

    this.modalService.open(content, { centered: true, backdrop: 'static' });
  }

  // ===== CRUD OPERATIONS =====

  saveTaxi(): void {
    if (this.taxiForm.invalid) {
      this.taxiForm.markAllAsTouched();
      return;
    }

    const taxiData: Taxi = {
      id: this.editingTaxiId || 0,
      nom: this.taxiForm.value.nomPrenom,
      numeroCin: this.taxiForm.value.cin,
      numeroMatricule: this.taxiForm.value.immatricule,
      numeroTaxi: this.taxiForm.value.plaqueTaxi,
      constructeur: this.taxiForm.value.modeleVoiture,
      taxiStatus: this.taxiForm.value.taxiStatus,
      type: this.taxiForm.value.typeTel,
      telephone: this.taxiForm.value.numTel,
      email: this.taxiForm.value.email,
      hide: this.taxiForm.value.hide,
      numeroSim: this.taxiForm.value.numeroSim,
      traitement: false,
      destination: '',
      contenu: ''
    };

    if (this.isEditing && this.editingTaxiId) {
      this.updateTaxiAndUser(taxiData);
      return;
    }

    this.pendingTaxiData = taxiData;
    this.passwordForm.reset();
    this.passwordModalRef = this.modalService.open(this.passwordModalForAdd, {
      centered: true,
      backdrop: 'static'
    });
  }

updateTaxiAndUser(taxiData: Taxi): void {
  if (this.isUpdating) {
    return;
  }

  this.isUpdating = true;

  this.taxiService
    .updateTaxiAndUser(taxiData)
    .pipe(
      finalize(() => {
        this.isUpdating = false;
      })
    )
    .subscribe({
      next: () => {
        this.toastr.success(
          'Taxi et compte utilisateur mis à jour',
          'Succès'
        );

        // Close the modal immediately
        this.addEditModalRef?.close();

        // Reset edit state
        this.isEditing = false;
        this.editingTaxiId = null;
        this.taxiForm.reset();

        // Wait briefly to ensure the backend has committed the update,
        // then refresh the current page while preserving filters/pagination.
        setTimeout(() => {
          this.fetchTaxis();
        }, 300);
      },
      error: (err) => {
        const message =
          err?.error?.message || 'Erreur lors de la mise à jour';

        this.toastr.error(message, 'Échec');
      }
    });
}

  submitNewPassword(modal: any): void {
    if (this.passwordForm.invalid || this.isSending) return;

    this.isSending = true;
    const password = this.passwordForm.value.newPassword;

    this.taxiService
      .addTaxiWithUser(this.pendingTaxiData, password)
      .pipe(finalize(() => (this.isSending = false)))
      .subscribe({
        next: () => {
          this.toastr.success('Taxi créé avec succès', 'Succès');
          this.passwordModalRef.close();
          this.addEditModalRef.close();
          this.taxiForm.reset();
          this.passwordForm.reset();
          this.fetchTaxis();
        },
        error: (err) => {
          const message = err.error?.message || 'Erreur lors de la création';
          this.toastr.error(message, 'Échec');
        }
      });
  }

  confirmDelete(): void {
    if (this.isDeletingTaxi) return;

    this.isDeletingTaxi = true;

    this.taxiService
      .deleteTaxi(this.selectedTaxiId)
      .pipe(finalize(() => (this.isDeletingTaxi = false)))
      .subscribe({
        next: () => {
          this.toastr.error('Taxi supprimé', 'Suppression');
          this.fetchTaxis();
          this.deleteTaxiModalRef.close();
        },
        error: (err) => {
          const message = err.error?.message || 'Erreur lors de la suppression';
          this.toastr.error(message, 'Échec');
        }
      });
  }

  // ===== PASSWORD RESET =====

  sendVerificationCode(modal: any): void {
    if (this.verifyForm.invalid) return;

    const payload = {
      email: this.verifyForm.get('email')?.value,
      phone: this.verifyForm.get('numTel')?.value
    };

    this.taxiService.sendPasswordResetCode(payload).subscribe({
      next: () => {
        modal.close();
        this.modalService.open(this.confirmationCodeModal, {
          centered: true,
          backdrop: 'static'
        });
      },
      error: () => {
        console.error('Error sending code');
        this.toastr.error('Impossible d\'envoyer le code');
      }
    });
  }

  submitConfirmationCode(modal: any): void {
    if (this.confirmationForm.invalid) return;

    const token =
      this.confirmationForm.value.code1 +
      this.confirmationForm.value.code2 +
      this.confirmationForm.value.code3 +
      this.confirmationForm.value.code4;

    this.isSending = true;

    this.taxiService.verifyResetCode(token).subscribe({
      next: () => {
        this.isSending = false;
        this.token = token;
        modal.close();
        this.modalService.open(this.passwordModalForReset, {
          centered: true,
          backdrop: 'static'
        });
      },
      error: () => {
        this.isSending = false;
        this.toastr.error('Code incorrect ou expiré');
      }
    });
  }

  submitPasswordReset(modal: any): void {
    if (this.passwordForm.invalid) return;

    const payload = { password: this.passwordForm.value.newPassword };
    this.isSending = true;

    this.taxiService.resetPassword(this.token, payload).subscribe({
      next: () => {
        this.isSending = false;
        modal.close();
        this.toastr.success('Mot de passe réinitialisé');
        this.router.navigate(['/taxis']);
      },
      error: () => {
        this.isSending = false;
        this.toastr.error('Impossible de réinitialiser le mot de passe');
      }
    });
  }

  moveFocus(event: any, index: number): void {
    const input = event.target;
    const value = input.value;

    if (value.length > 1) {
      input.value = value.slice(0, 1);
    }

    if (value.length === 1 && index < 3) {
      const nextInput = input.parentElement.children[index + 1];
      nextInput?.focus();
    }

    if (value.length === 0 && index > 0) {
      const prevInput = input.parentElement.children[index - 1];
      prevInput?.focus();
    }
  }

  // ===== EMAIL AUTOCOMPLETE =====
  onEmailInput(): void {
    const emailControl = this.taxiForm.get('email')!;
    const value = emailControl.value;
    const atIndex = value.indexOf('@');

    if (atIndex === -1) {
      this.filteredDomains = this.emailDomains;
    } else {
      const typedDomain = value.slice(atIndex);
      this.filteredDomains = this.emailDomains.filter((d) => d.startsWith(typedDomain));
    }
  }

  getInputName(): string {
    const value = this.taxiForm.get('email')!.value;
    const atIndex = value.indexOf('@');
    return atIndex === -1 ? value : value.slice(0, atIndex);
  }

  selectDomain(domain: string): void {
    this.taxiForm.get('email')!.setValue(this.getInputName() + domain);
    this.showDropdown = false;
  }

  onBlur(): void {
    setTimeout(() => (this.showDropdown = false), 100);
  }

  useDefaultEmail(): void {
    this.verifyForm.get('email')?.setValue('boshra.beldi@smstaxi.tn');
  }

  // ===== HELPERS =====

  isInvalid(controlName: string): boolean {
    const control = this.taxiForm.get(controlName);
    return !!(control && control.invalid && control.touched);
  }

  getStatusLabel(status: TaxiStatus): string {
    switch (status) {
      case TaxiStatus.APPROVED:
        return 'Approuvé';
      case TaxiStatus.PENDING:
        return 'En attente';
      case TaxiStatus.REJECTED:
        return 'Rejeté';
      default:
        return status;
    }
  }

  getTypeLabel(typeTel: PhoneType): string {
    switch (typeTel) {
      case PhoneType.gsm:
        return 'Téléphone classique';
      case PhoneType.smartphone:
        return 'Smartphone';
      default:
        return 'Inconnu';
    }
  }

  getStatusBadgeClass(status: TaxiStatus): string {
    switch (status) {
      case TaxiStatus.APPROVED:
        return 'bg-success';
      case TaxiStatus.PENDING:
        return 'bg-warning text-dark';
      case TaxiStatus.REJECTED:
        return 'bg-danger';
      default:
        return 'bg-secondary';
    }
  }

  getStatusIconClass(status: TaxiStatus | null): string {
    switch (status) {
      case TaxiStatus.APPROVED:
        return 'text-success';
      case TaxiStatus.PENDING:
        return 'text-warning';
      case TaxiStatus.REJECTED:
        return 'text-danger';
      default:
        return 'text-secondary';
    }
  }

  get passwordLength(): number {
    return this.passwordForm.get('newPassword')?.value?.length || 0;
  }

  // ===== EXPORTS =====

  async exportData(type: string): Promise<void> {
    if (!this.taxis.length) {
      this.toastr.warning('Aucune donnée à exporter');
      return;
    }

    const translateStatus = (status: string): string => {
      switch (status) {
        case 'APPROVED':
          return 'Approuvé';
        case 'REJECTED':
          return 'Refusé';
        case 'PENDING':
          return 'En attente';
        default:
          return status || '';
      }
    };

    const data = this.taxis.map((t) => ({
      ID: t.id,
      Nom: t.nom || '',
      CIN: t.numeroCin || '',
      Immatriculation: t.numeroMatricule || '',
      'Plaque Taxi': t.numeroTaxi || '',
      Modèle: t.constructeur || '',
      Téléphone: t.telephone || '',
      Statut: translateStatus(t.taxiStatus)
    }));

    switch (type) {
      case 'excel': {
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Taxis');

        XLSX.utils.sheet_add_aoa(ws, [['TAXICHY']], { origin: 'A1' });
        XLSX.utils.sheet_add_aoa(ws, [['© SMS TAXI 2025 – service autorisé et conforme à la législation tunisienne']], { origin: 'A2' });
        XLSX.utils.sheet_add_aoa(ws, [['Répertoire des Taxistes Inscrits']], { origin: 'A4' });

        ws['!merges'] = [{ s: { r: 3, c: 0 }, e: { r: 3, c: 7 } }];

        ws['!cols'] = [
          { wch: 5 },
          { wch: 20 },
          { wch: 15 },
          { wch: 15 },
          { wch: 12 },
          { wch: 15 },
          { wch: 15 },
          { wch: 12 }
        ];

        const headers = ['ID', 'Nom', 'CIN', 'Immatriculation', 'Plaque', 'Modèle', 'Téléphone', 'Statut'];
        headers.forEach((header, i) => {
          const cell = ws[XLSX.utils.encode_cell({ r: 5, c: i })];
          if (cell) {
            cell.s = {
              font: { bold: true, color: { rgb: 'FFFFFF' } },
              fill: { fgColor: { rgb: '211F54' } },
              alignment: { horizontal: 'center' }
            };
          }
        });

        XLSX.writeFile(wb, 'taxis.xlsx');
        break;
      }

      case 'pdf': {
        const doc = new jsPDF();
        const logo = await this.loadImageBase64('assets/logoY2.png');

        doc.addImage(logo, 'PNG', 60, 10, 90, 0);
        doc.setFontSize(20);
        doc.text('Répertoire des Taxistes Inscrits', 105, 45, { align: 'center' });

        const tableBody = data.map((t) => [
          t.ID,
          t.Nom,
          t.CIN,
          t.Immatriculation,
          t['Plaque Taxi'],
          t.Modèle,
          t.Téléphone,
          t.Statut
        ]);

        autoTable(doc, {
          head: [['ID', 'Nom', 'CIN', 'Immatriculation', 'Plaque', 'Modèle', 'Téléphone', 'Statut']],
          body: tableBody as any,
          startY: 50,
          theme: 'grid',
          headStyles: {
            fillColor: [33, 31, 84],
            textColor: 255,
            halign: 'center',
            valign: 'middle',
            fontStyle: 'bold'
          }
        });

        doc.save('taxis.pdf');
        break;
      }

      default:
        console.error('Type d\'export inconnu');
    }
  }

  async downloadDetailsPDF(): Promise<void> {
    if (!this.selectedTaxi) return;

    const taxi = this.selectedTaxi;
    const logo = await this.loadImageBase64('assets/logoY2.png');

    const doc = new jsPDF();
    doc.addImage(logo, 'PNG', 60, 10, 90, 0);
    doc.setFontSize(20);
    doc.text('Détails du Taxi', 105, 45, { align: 'center' });

    autoTable(doc, {
      body: [
        ['Nom et Prénom', taxi.nom || ''],
        ['Carte d\'identité', taxi.numeroCin || ''],
        ['Immatriculation', taxi.numeroMatricule || ''],
        ['Plaque taxi', taxi.numeroTaxi || ''],
        ['Modèle de fabrication', taxi.constructeur || ''],
        ['Téléphone', taxi.telephone || ''],
        ['Adresse Email', taxi.email || '']
      ],
      startY: 50,
      theme: 'striped',
      styles: { fontSize: 10 }
    });

    doc.save(`taxi-${taxi.id}.pdf`);
  }

  private async loadImageBase64(path: string): Promise<string> {
    const response = await fetch(path);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  }
}
