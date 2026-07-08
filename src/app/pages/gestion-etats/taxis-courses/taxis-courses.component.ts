import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup }       from '@angular/forms';
import { ToastrService }                from 'ngx-toastr';
import { finalize, Subscription }       from 'rxjs';

import { GestionEtatsService }    from '../../../services/gestion-etats.service';
import { TaxiCoursesResultDto } from '../../../models/gestionEtat/Taxicoursesresultdto.model';
import { TaxiCourses } from '../../../models/gestionEtat/TaxiCourses.model';

@Component({
  selector: 'app-taxis-courses',
  templateUrl: './taxis-courses.component.html',
  styleUrls: ['./taxis-courses.component.scss']
})
export class TaxisCoursesComponent implements OnInit, OnDestroy {

  // ── Data ──────────────────────────────────────────────────────────────────
  taxiCourses: TaxiCourses[] = [];

  stats = {
    t1: 0,
    t2: 0,
    t3: 0,
    total: 0
  };

  // ── Pagination ────────────────────────────────────────────────────────────
  currentPage     = 1;     // 1-based (UI)
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
        .getTaxiCourses(zeroBasedPage, this.itemsPerPage, this.fromValue, this.toValue)
        .pipe(finalize(() => (this.isLoading = false)))
        .subscribe({
          next: (res: TaxiCoursesResultDto) => {
            this.taxiCourses   = res.taxiCourses;
            this.totalElements = res.page.totalElements;
            this.totalPages    = res.page.totalPages;
            this.currentPage   = page;

            this.stats = {
              t1:    res.t1sommesTotalCourses,
              t2:    res.t2sommesTotalCourses,
              t3:    res.t3sommesTotalCourses,
              total: res.sommesTotalCourses
            };
          },
          error: () => {
            this.toastr.error('Impossible de charger les courses', 'Erreur');
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
        .exportTaxiCoursesPdf(this.fromValue, this.toValue)
        .pipe(finalize(() => (this.isExporting = false)))
        .subscribe({
          next: (blob: Blob) => {
            const url      = URL.createObjectURL(blob);
            const anchor   = document.createElement('a');
            anchor.href    = url;
            anchor.download = 'taxis-courses.pdf';
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