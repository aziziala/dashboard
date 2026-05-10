import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

// ─── Models (adapt to your real models) ──────────────────────────────────────
export interface Parrainage {
  id:           number;
  parrainNom:   string;
  parrainPhone: string;
  filleulNom:   string;
  filleulPhone: string;
  code:         string;
  date:         Date | string;
  statut:       'ACTIVE' | 'PENDING' | 'EXPIRED';
}

type SearchMode = 'phone' | 'name' | 'none';

@Component({
  selector: 'app-reclamations',
  templateUrl: './reclamations.component.html',
  styleUrls: ['./reclamations.component.scss']
})
export class ReclamationsComponent implements OnInit, OnDestroy {

  // ─── Data ──────────────────────────────────────────────────────────────────
  items: Parrainage[]          = [];
  filteredItems: Parrainage[]  = [];
  paginatedItems: Parrainage[] = [];
  selectedItem: Parrainage | null = null;

  // ─── Stats ─────────────────────────────────────────────────────────────────
  stats = { total: 0, active: 0, pending: 0, expired: 0 };

  // ─── UI flags ──────────────────────────────────────────────────────────────
  isLoading  = false;
  isEditing  = false;
  isSaving   = false;
  isDeleting = false;

  // ─── Search ────────────────────────────────────────────────────────────────
  searchTerm   = '';
  statusFilter = '';
  searchMode: SearchMode = 'none';

  // ─── Pagination ────────────────────────────────────────────────────────────
  currentPage  = 1;
  itemsPerPage = 10;
  totalItems   = 0;

  get totalPages(): number {
    return Math.ceil(this.totalItems / this.itemsPerPage) || 1;
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  // ─── Forms ─────────────────────────────────────────────────────────────────
  parrainageForm!: FormGroup;

  // ─── Modal refs ────────────────────────────────────────────────────────────
  private modalRef?: NgbModalRef;

  // ─── RxJS cleanup ──────────────────────────────────────────────────────────
  private readonly destroy$      = new Subject<void>();
  private readonly searchSubject = new Subject<string>();

  // ───────────────────────────────────────────────────────────────────────────
  constructor(
    private readonly fb:           FormBuilder,
    private readonly modalService: NgbModal
  ) {}

  // ══════════════════════════════════════════════════════════════════════════
  // LIFECYCLE
  // ══════════════════════════════════════════════════════════════════════════

  ngOnInit(): void {
    this.initForm();
    this.listenSearch();
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ══════════════════════════════════════════════════════════════════════════
  // INIT
  // ══════════════════════════════════════════════════════════════════════════

  private initForm(): void {
    this.parrainageForm = this.fb.group({
      parrainNom:   ['', Validators.required],
      parrainPhone: ['', [Validators.required, Validators.pattern(/^\d{8,15}$/)]],
      filleulNom:   ['', Validators.required],
      filleulPhone: ['', [Validators.required, Validators.pattern(/^\d{8,15}$/)]],
      code:         ['', Validators.required],
      statut:       ['', Validators.required]
    });
  }

  private listenSearch(): void {
    this.searchSubject.pipe(
      debounceTime(350),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(term => this.performSearch(term));
  }

  // ══════════════════════════════════════════════════════════════════════════
  // DATA  (replace with real service calls)
  // ══════════════════════════════════════════════════════════════════════════

  loadData(): void {
    this.isLoading = true;

    // ── Replace this mock with: this.parrainageService.getAll().subscribe(...)
    const mock: Parrainage[] = [
      { id:1, parrainNom:'Ali Ben Salem',    parrainPhone:'22334455', filleulNom:'Sami Trabelsi',  filleulPhone:'55667788', code:'PAR001', date:'2025-01-10', statut:'ACTIVE'  },
      { id:2, parrainNom:'Fatma Karoui',     parrainPhone:'33445566', filleulNom:'Nour Hamdi',     filleulPhone:'66778899', code:'PAR002', date:'2025-02-14', statut:'PENDING' },
      { id:3, parrainNom:'Mohamed Jarray',   parrainPhone:'44556677', filleulNom:'Ines Bouaziz',   filleulPhone:'77889900', code:'PAR003', date:'2025-03-05', statut:'EXPIRED' },
      { id:4, parrainNom:'Salma Chaabane',   parrainPhone:'55667788', filleulNom:'Yassine Riahi',  filleulPhone:'88990011', code:'PAR004', date:'2025-04-20', statut:'ACTIVE'  },
      { id:5, parrainNom:'Omar Gharbi',      parrainPhone:'66778899', filleulNom:'Amira Mejri',    filleulPhone:'99001122', code:'PAR005', date:'2025-05-01', statut:'ACTIVE'  },
    ];

    // Simulate async
    setTimeout(() => {
      this.items     = mock;
      this.isLoading = false;
      this.computeStats();
      this.applyFilters();
    }, 300);
  }

  private computeStats(): void {
    this.stats = {
      total:   this.items.length,
      active:  this.items.filter(i => i.statut === 'ACTIVE').length,
      pending: this.items.filter(i => i.statut === 'PENDING').length,
      expired: this.items.filter(i => i.statut === 'EXPIRED').length
    };
  }

  // ══════════════════════════════════════════════════════════════════════════
  // FILTERING & PAGINATION
  // ══════════════════════════════════════════════════════════════════════════

  private applyFilters(): void {
    const term = this.searchTerm.trim().toLowerCase();

    this.filteredItems = this.items.filter(p => {
      const matchesSearch = this.matchesTerm(p, term);
      const matchesStatus = !this.statusFilter || p.statut === this.statusFilter;
      return matchesSearch && matchesStatus;
    });

    this.totalItems  = this.filteredItems.length;
    this.currentPage = Math.min(this.currentPage, this.totalPages);

    this.refreshPage();
  }

  private matchesTerm(p: Parrainage, term: string): boolean {
    if (!term) return true;

    switch (this.searchMode) {
      case 'phone':
        return p.parrainPhone.includes(term) || p.filleulPhone.includes(term);
      case 'name':
        return (
          p.parrainNom.toLowerCase().includes(term) ||
          p.filleulNom.toLowerCase().includes(term) ||
          p.code.toLowerCase().includes(term)
        );
      default:
        return (
          p.parrainNom.toLowerCase().includes(term)  ||
          p.filleulNom.toLowerCase().includes(term)   ||
          p.parrainPhone.includes(term)               ||
          p.filleulPhone.includes(term)               ||
          p.code.toLowerCase().includes(term)
        );
    }
  }

  private refreshPage(): void {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    this.paginatedItems = this.filteredItems.slice(start, start + this.itemsPerPage);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SEARCH  (called from template)
  // ══════════════════════════════════════════════════════════════════════════

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
    this.searchTerm  = '';
    this.searchMode  = 'none';
    this.currentPage = 1;
    this.applyFilters();
  }

  onStatusFilterChange(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PAGINATION  (called from template)
  // ══════════════════════════════════════════════════════════════════════════

  onPageChange(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.refreshPage();
  }

  // ══════════════════════════════════════════════════════════════════════════
  // MODAL OPENERS  (called from template)
  // ══════════════════════════════════════════════════════════════════════════

  openAddModal(content: any): void {
    this.isEditing = false;
    this.selectedItem = null;
    this.parrainageForm.reset();

    this.modalRef = this.modalService.open(content, {
      size: 'lg', backdrop: 'static', centered: true
    });
  }

  openEditModal(content: any, item: Parrainage): void {
    this.isEditing    = true;
    this.selectedItem = item;

    this.parrainageForm.patchValue({
      parrainNom:   item.parrainNom,
      parrainPhone: item.parrainPhone,
      filleulNom:   item.filleulNom,
      filleulPhone: item.filleulPhone,
      code:         item.code,
      statut:       item.statut
    });

    this.modalRef = this.modalService.open(content, {
      size: 'lg', backdrop: 'static', centered: true
    });
  }

  openDetailsModal(content: any, item: Parrainage): void {
    this.selectedItem = item;
    this.modalService.open(content, { size: 'lg', backdrop: 'static' });
  }

  openDeleteModal(content: any, item: Parrainage): void {
    this.selectedItem = item;
    this.modalRef = this.modalService.open(content, {
      centered: true, backdrop: 'static'
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SAVE  (called from template)
  // ══════════════════════════════════════════════════════════════════════════

  save(modal: any): void {
    if (this.parrainageForm.invalid || this.isSaving) return;

    this.isSaving = true;
    const formValue = this.parrainageForm.value;

    setTimeout(() => {
      if (this.isEditing && this.selectedItem) {
        // ── UPDATE
        const idx = this.items.findIndex(i => i.id === this.selectedItem!.id);
        if (idx !== -1) {
          this.items[idx] = { ...this.selectedItem, ...formValue };
        }
      } else {
        // ── CREATE
        const newItem: Parrainage = {
          id:   (Math.max(...this.items.map(i => i.id), 0)) + 1,
          date: new Date().toISOString().slice(0, 10),
          ...formValue
        };
        this.items = [newItem, ...this.items];
      }

      this.isSaving = false;
      this.computeStats();
      this.applyFilters();
      modal.close();
      this.parrainageForm.reset();
    }, 400);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // DELETE  (called from template)
  // ══════════════════════════════════════════════════════════════════════════

  confirmDelete(modal: any): void {
    if (this.isDeleting || !this.selectedItem) return;

    this.isDeleting = true;

    setTimeout(() => {
      this.items      = this.items.filter(i => i.id !== this.selectedItem!.id);
      this.isDeleting = false;
      this.selectedItem = null;
      this.computeStats();
      this.applyFilters();
      modal.close();
    }, 400);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // HELPERS  (called from template)
  // ══════════════════════════════════════════════════════════════════════════

  isInvalid(controlName: string): boolean {
    const ctrl = this.parrainageForm.get(controlName);
    return !!(ctrl?.invalid && ctrl.touched);
  }

  getStatusLabel(statut?: string): string {
    const labels: Record<string, string> = {
      ACTIVE:  'Actif',
      PENDING: 'En attente',
      EXPIRED: 'Expiré'
    };
    return labels[statut ?? ''] ?? statut ?? '';
  }

  getStatusBadgeClass(statut?: string): Record<string, boolean> {
    return {
      'bg-success':   statut === 'ACTIVE',
      'bg-warning':   statut === 'PENDING',
      'bg-danger':    statut === 'EXPIRED',
      'text-white':   statut === 'ACTIVE' || statut === 'EXPIRED',
      'text-dark':    statut === 'PENDING'
    };
  }

  exportData(type: 'excel' | 'pdf'): void {
    // Wire up to your real export logic
    console.log(`Exporting as ${type}`, this.filteredItems);
  }

  downloadPDF(): void {
    // Wire up to your real PDF generation
    console.log('Downloading PDF for', this.selectedItem);
  }
}