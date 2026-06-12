import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup }        from '@angular/forms';
import { ToastrService }                 from 'ngx-toastr';
import { finalize, Subscription }        from 'rxjs';

import { GestionEtatsService }  from '../../../services/gestion-etats.service';
import { TaxiBonus } from '../../../models/gestionEtat/Taxibonus.model';
import { TaxiBonusResultDto } from '../../../models/gestionEtat/Taxibonusresultdto.model';


@Component({
  selector: 'app-taxis-bonus',
  templateUrl: './taxis-bonus.component.html',
  styleUrls: ['./taxis-bonus.component.scss']
})
export class TaxisBonusComponent implements OnInit, OnDestroy {

  // ── Data ──────────────────────────────────────────────────────────────────
  taxiBonus: TaxiBonus[] = [];

  stats = {
    totalParrainage: 0,
    totaleReduction: 0,
    totalCourses:    0
  };

  // ── Pagination ────────────────────────────────────────────────────────────
  currentPage     = 1;
  totalPages      = 0;
  totalElements   = 0;
  itemsPerPage    = 25;
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
    this.filterForm = this.fb.group({ from: [''], to: [''] });
    this.load(1);
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  // ── Private helpers ───────────────────────────────────────────────────────

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

    this.sub.add(
      this.gestionEtatsService
        .getTaxiBonus(page - 1, this.itemsPerPage, this.fromValue, this.toValue)
        .pipe(finalize(() => (this.isLoading = false)))
        .subscribe({
          next: (res: TaxiBonusResultDto) => {
            this.taxiBonus     = res.taxiBonus;
            this.totalElements = res.page.totalElements;
            this.totalPages    = res.page.totalPages;
            this.currentPage   = page;

            this.stats = {
              totalParrainage: res.sommesTotalParrainage,
              totaleReduction: res.sommesTotaleReduction,
              totalCourses:    res.sommesTotalCourses
            };
          },
          error: () => this.toastr.error('Impossible de charger les bonus', 'Erreur')
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

  min(a: number, b: number): number {
    return Math.min(a, b);
  }

  // ── PDF Export ────────────────────────────────────────────────────────────

  exportPdf(): void {
    if (this.isExporting) return;
    this.isExporting = true;

    this.sub.add(
      this.gestionEtatsService
        .exportTaxiBonusPdf(this.fromValue, this.toValue)
        .pipe(finalize(() => (this.isExporting = false)))
        .subscribe({
          next: (blob: Blob) => {
            const url    = URL.createObjectURL(blob);
            const anchor = document.createElement('a');
            anchor.href     = url;
            anchor.download = 'taxis-bonus-Avec-Validite-de-course.pdf';
            anchor.click();
            URL.revokeObjectURL(url);
          },
          error: () => this.toastr.error('Impossible de générer le PDF', 'Erreur')
        })
    );
  }
}


