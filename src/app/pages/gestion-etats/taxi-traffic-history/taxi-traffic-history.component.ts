// import { Component } from '@angular/core';

// @Component({
//   selector: 'app-taxi-traffic-history',
//   standalone: true,
//   imports: [],
//   templateUrl: './taxi-traffic-history.component.html',
//   styleUrl: './taxi-traffic-history.component.scss'
// })
// export class TaxiTrafficHistoryComponent {

// }



import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService }                      from 'ngx-toastr';
import { finalize, Subscription }             from 'rxjs';

import { GestionEtatsService }    from '../../../services/gestion-etats.service';
import { TaxiTrafficHistoryDto } from '../../../models/gestionEtat/TaxiTrafficHistoryDto.model';
import { TaxiCourse } from '../../../models/gestionEtat/TaxiCourse.model';
import { ApiError } from '../../../models/gestionEtat/ApiError .model';


// ── UI state machine ──────────────────────────────────────────────────────────
type ViewState = 'idle' | 'loading' | 'found' | 'not_found' | 'no_data' | 'error';

@Component({
  selector: 'app-taxi-traffic-history',
  templateUrl: './taxi-traffic-history.component.html',
  styleUrls: ['./taxi-traffic-history.component.scss']
})
export class TaxiTrafficHistoryComponent implements OnInit, OnDestroy {

  // ── State ─────────────────────────────────────────────────────────────────
  viewState: ViewState = 'idle';
  errorMessage = '';

  // ── Taxi info header ──────────────────────────────────────────────────────
  taxiInfo: Partial<TaxiTrafficHistoryDto> | null = null;

  // ── Data ──────────────────────────────────────────────────────────────────
  courses: TaxiCourse[] = [];
  totalCourses = 0;

  // ── Pagination ────────────────────────────────────────────────────────────
  currentPage     = 1;
  totalPages      = 0;
  totalElements   = 0;
  itemsPerPage    = 25;
  pageSizeOptions = [10, 25, 50, 100];

  // ── Forms ─────────────────────────────────────────────────────────────────
  searchForm!: FormGroup;

  // ── Export ────────────────────────────────────────────────────────────────
  isExporting = false;

  private sub = new Subscription();

  constructor(
    private gestionEtatsService: GestionEtatsService,
    private toastr: ToastrService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.searchForm = this.fb.group({
      telephone: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
      from:      [''],
      to:        ['']
    });
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  // ── Getters ───────────────────────────────────────────────────────────────

  get isLoading(): boolean { return this.viewState === 'loading'; }
  get isFound():   boolean { return this.viewState === 'found';   }

  private get telephone(): string {
    return this.searchForm.value.telephone?.trim();
  }

  private get fromValue(): string | undefined {
    return this.searchForm.value.from || undefined;
  }

  private get toValue(): string | undefined {
    return this.searchForm.value.to || undefined;
  }

  // ── Search ────────────────────────────────────────────────────────────────

  search(): void {
    if (this.searchForm.invalid || this.isLoading) {
      this.searchForm.markAllAsTouched();
      return;
    }
    this.currentPage = 1;
    this.load(1);
  }

  load(page: number): void {
    this.viewState = 'loading';

    this.sub.add(
      this.gestionEtatsService
        .getTaxiTrafficHistory(
          this.telephone,
          page - 1,
          this.itemsPerPage,
          this.fromValue,
          this.toValue
        )
        .pipe(finalize(() => {
          // viewState already set in next/error
        }))
        .subscribe({
          next: (res: TaxiTrafficHistoryDto) => {
            // Store taxi header info (stable across pages)
            this.taxiInfo = {
              taxiId:          res.taxiId,
              telephone:       res.telephone,
              nom:             res.nom,
              numeroMatricule: res.numeroMatricule,
              numeroCin:       res.numeroCin,
              numeroTaxi:      res.numeroTaxi
            };

            this.courses       = res.courses;
            this.totalCourses  = res.totalCourses;
            this.totalElements = res.page.totalElements;
            this.totalPages    = res.page.totalPages;
            this.currentPage   = page;

            this.viewState = 'found';
          },
          error: (err) => {
            this.handleError(err);
          }
        })
    );
  }

  // ── Error handler ─────────────────────────────────────────────────────────

  private handleError(err: any): void {
    if (err.status === 404) {
      const apiError: ApiError = err.error;

      // TAXI_NOT_FOUND  →  le numéro de téléphone n'existe pas en base
      if (apiError?.code === 'TAXI_NOT_FOUND') {
        this.viewState    = 'not_found';
        this.errorMessage = apiError.message || `Aucun taxi trouvé avec le numéro ${this.telephone}`;
        return;
      }

      // 404 sans code spécifique  →  taxi existe mais aucune course dans la période
      this.viewState    = 'no_data';
      this.errorMessage = 'Aucune course trouvée pour ce taxi sur la période sélectionnée.';
      return;
    }

    if (err.status === 400) {
      this.viewState    = 'error';
      this.errorMessage = err.error?.message || 'Paramètres de requête invalides.';
      return;
    }

    // Erreur réseau / serveur
    this.viewState    = 'error';
    this.errorMessage = 'Une erreur inattendue est survenue. Veuillez réessayer.';
  }

  // ── User actions ──────────────────────────────────────────────────────────

  reset(): void {
    this.searchForm.reset();
    this.viewState    = 'idle';
    this.errorMessage = '';
    this.courses      = [];
    this.taxiInfo     = null;
    this.currentPage  = 1;
  }

  onPageChange(page: number): void {
    this.load(page);
  }

  onPageSizeChange(size: number): void {
    this.itemsPerPage = size;
    this.currentPage  = 1;
    this.load(1);
  }

  min(a: number, b: number): number {
    return Math.min(a, b);
  }

  // ── PDF Export ────────────────────────────────────────────────────────────

  exportPdf(): void {
    if (this.isExporting || !this.taxiInfo) return;
    this.isExporting = true;

    this.sub.add(
      this.gestionEtatsService
        .exportTaxiTrafficHistoryPdf(this.telephone, this.fromValue, this.toValue)
        .pipe(finalize(() => (this.isExporting = false)))
        .subscribe({
          next: (blob: Blob) => {
            const url    = URL.createObjectURL(blob);
            const anchor = document.createElement('a');
            anchor.href     = url;
            anchor.download = `taxi-courses-details-${this.taxiInfo?.nom ?? this.telephone}.pdf`;
            anchor.click();
            URL.revokeObjectURL(url);
          },
          error: () => this.toastr.error('Impossible de générer le PDF', 'Erreur')
        })
    );
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  getEtatBadgeClass(etat: string): string {
    switch (etat?.toUpperCase()) {
      case 'TERMINATED': return 'bg-success';
      case 'CANCELLED':  return 'bg-danger';
      case 'PENDING':    return 'bg-warning text-dark';
      default:           return 'bg-secondary';
    }
  }

  isInvalid(control: string): boolean {
    const c = this.searchForm.get(control);
    return !!(c && c.invalid && c.touched);
  }
}