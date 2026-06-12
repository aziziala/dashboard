import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup }       from '@angular/forms';
import { ToastrService }                from 'ngx-toastr';
import { finalize, Subscription }       from 'rxjs';

import { GestionEtatsService }    from '../../../services/gestion-etats.service';
import { TaxiEarnings } from '../../../models/gestionEtat/TaxiEarnings.model';
import { TaxiEarningsResultDto } from '../../../models/gestionEtat/TaxiEarningsResultDto.model';


@Component({
  selector: 'app-taxis-earnings',
  templateUrl: './taxis-earnings.component.html',
  styleUrls: ['./taxis-earnings.component.scss']
})
export class TaxisEarningsComponent implements OnInit, OnDestroy {

  // ── Data ──────────────────────────────────────────────────────────────────
  taxiEarnings: TaxiEarnings[] = [];

  stats = {
    totalCourses:   0,
    totalCompteur:  0,
    totalExtrat:    0,
    sommeTotal:     0
  };

  // ── Pagination ────────────────────────────────────────────────────────────
  currentPage    = 1;     // 1-based (UI)
  totalPages     = 0;
  totalElements  = 0;
  itemsPerPage   = 25;
  pageSizeOptions = [10, 25, 50, 100];

  // ── Filters ───────────────────────────────────────────────────────────────
  filterForm!: FormGroup;

  // ── Loading / export ──────────────────────────────────────────────────────
  isLoading   = false;
  isExporting = false;

  private sub = new Subscription();

  constructor(
    private gestionEtatsService: GestionEtatsService,
    private toastr: ToastrService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.filterForm = this.fb.group({
      from: [''],
      to:   ['']
    });

    this.load(1);
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private get fromValue(): string | undefined {
    return this.filterForm.value.from || undefined;
  }

  private get toValue(): string | undefined {
    return this.filterForm.value.to || undefined;
  }

  // ── Data loading ──────────────────────────────────────────────────────────

  load(page: number): void {
    if (this.isLoading) return;
    this.isLoading = true;

    const zeroBasedPage = page - 1;   // API is 0-based

    this.sub.add(
      this.gestionEtatsService
        .getTaxiEarnings(zeroBasedPage, this.itemsPerPage, this.fromValue, this.toValue)
        .pipe(finalize(() => (this.isLoading = false)))
        .subscribe({
          next: (res: TaxiEarningsResultDto) => {
            this.taxiEarnings  = res.taxiEarnings;
            this.totalElements = res.page.totalElements;
            this.totalPages    = res.page.totalPages;
            this.currentPage   = page;

            this.stats = {
              totalCourses:  res.sommesTotalCourses,
              totalCompteur: res.sommesTotalCompteur,
              totalExtrat:   res.sommesTotalExtrat,
              sommeTotal:    res.sommeTotal
            };
          },
          error: () => {
            this.toastr.error('Impossible de charger les revenus', 'Erreur');
          }
        })
    );
  }

  // ── User actions ──────────────────────────────────────────────────────────

  applyFilter(): void {
    this.currentPage = 1;
    this.load(1);
  }

  clearFilter(): void {
    this.filterForm.reset({ from: '', to: '' });
    this.currentPage = 1;
    this.load(1);
  }

  onPageChange(page: number): void {
    this.load(page);
  }

  onPageSizeChange(size: number): void {
    this.itemsPerPage = size;
    this.currentPage  = 1;
    this.load(1);
  }

  // ── PDF Export ────────────────────────────────────────────────────────────

  exportPdf(): void {
    if (this.isExporting) return;
    this.isExporting = true;

    this.sub.add(
      this.gestionEtatsService
        .exportTaxiEarningsPdf(this.fromValue, this.toValue)
        .pipe(finalize(() => (this.isExporting = false)))
        .subscribe({
          next: (blob: Blob) => {
            const url      = URL.createObjectURL(blob);
            const anchor   = document.createElement('a');
            anchor.href    = url;
            anchor.download = 'taxis-chiffre-affaire.pdf';
            anchor.click();
            URL.revokeObjectURL(url);
          },
          error: () => {
            this.toastr.error('Impossible de générer le PDF', 'Erreur');
          }
        })
    );
  }
}