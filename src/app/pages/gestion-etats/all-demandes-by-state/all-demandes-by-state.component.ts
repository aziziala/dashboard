import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { finalize, Subscription } from 'rxjs';

import { GestionEtatsService } from '../../../services/gestion-etats.service';
import { DemandeOffreTaxiClient } from '../../../models/gestionEtat/DemandeOffreTaxiClient.model';
import { DemandeByStateResultDto } from '../../../models/gestionEtat/DemandeByStateResultDto.model';

@Component({
  selector: 'app-all-demandes-by-state',
  templateUrl: './all-demandes-by-state.component.html',
  styleUrls: ['./all-demandes-by-state.component.scss']
})
export class AllDemandesByStateComponent implements OnInit, OnDestroy {

  // ── Data ──────────────────────────────────────────────────────────────────
  demandes: DemandeOffreTaxiClient[] = [];
  totalDemandes = 0;

  // ── Pagination ────────────────────────────────────────────────────────────
  currentPage = 1;     // 1-based (UI)
  totalPages = 0;
  totalElements = 0;
  itemsPerPage = 25;
  pageSizeOptions = [10, 25, 50, 100];

  // ── Filters ───────────────────────────────────────────────────────────────
  filterForm!: FormGroup;

  readonly stateOptions = [
    { value: '', label: 'Tous les états' },
    { value: 'SATISFAIT', label: 'Demandes satisfaites' },
    { value: 'NON_SATISFAIT', label: 'Demandes non satisfaites' }
  ];

  // ── Loading / export ──────────────────────────────────────────────────────
  isLoading = false;
  isExporting = false;

  private sub = new Subscription();

  constructor(
    private gestionEtatsService: GestionEtatsService,
    private toastr: ToastrService,
    private fb: FormBuilder
  ) { }

  ngOnInit(): void {
    this.filterForm = this.fb.group({
      state: [''],
      from: [''],
      to: ['']
    });

    this.load(1);
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private get stateValue(): string | undefined {
    return this.filterForm.value.state || undefined;
  }

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
        .getAllDemandesByState(
          page - 1,
          this.itemsPerPage,
          this.stateValue,
          this.fromValue,
          this.toValue
        )
        .pipe(finalize(() => (this.isLoading = false)))
        .subscribe({
          next: (res: DemandeByStateResultDto) => {
            this.demandes = res.demandes;
            this.totalDemandes = res.totalDemandes;
            this.totalElements = res.page.totalElements;
            this.totalPages = res.page.totalPages;
            this.currentPage = page;
          },
          error: () => this.toastr.error('Impossible de charger les demandes', 'Erreur')
        })
    );
  }

  // ── User actions ──────────────────────────────────────────────────────────

  applyFilter(): void {
    this.currentPage = 1;
    this.load(1);
  }

  clearFilter(): void {
    this.filterForm.reset({ state: '', from: '', to: '' });
    this.currentPage = 1;
    this.load(1);
  }

  onPageChange(page: number): void {
    this.load(page);
  }

  onPageSizeChange(size: number): void {
    this.itemsPerPage = size;
    this.currentPage = 1;
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
        .exportAllDemandesByStatePdf(this.stateValue, this.fromValue, this.toValue)
        .pipe(finalize(() => (this.isExporting = false)))
        .subscribe({
          next: (blob: Blob) => {
            const suffix = this.stateValue ? this.stateValue.toLowerCase() : 'toutes';
            const url = URL.createObjectURL(blob);
            const anchor = document.createElement('a');
            anchor.href = url;
            anchor.download = `demandes-${suffix}.pdf`;
            anchor.click();
            URL.revokeObjectURL(url);
          },
          error: () => this.toastr.error('Impossible de générer le PDF', 'Erreur')
        })
    );
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  getEtatDemandeBadgeClass(etat: string): string {
    switch (etat?.toUpperCase()) {
      case 'TERMINATED':
        return 'bg-success';

      case 'WAITING':
        return 'bg-warning text-dark'; 

      case 'IN_PROGRESS':
        return 'bg-info text-dark'; 

      case 'STARTED':
        return 'bg-primary'; 

      case 'CANCELLED':
        return 'bg-secondary'; 

      case 'CANCELLED_BY_CLIENT':
        return 'bg-dark';

      case 'CANCELLED_BY_TAXI':
        return 'bg-purple'; 

      case 'EXPIRED':
        return 'bg-danger';

      default:
        return 'bg-light text-dark';
    }
  }

  /** Dérive SATISFAIT / NON_SATISFAIT depuis etatDemande pour affichage visuel rapide */
  getSatisfactionBadge(etat: string): { label: string; class: string } {
    const satisfaits = ['TERMINATED', 'IN_PROGRESS'];
    const isSatisfait = satisfaits.includes(etat?.toUpperCase());
    return isSatisfait
      ? { label: 'Satisfait', class: 'bg-success' }
      : { label: 'Non satisfait', class: 'bg-danger' };
  }

  hasOffre(demande: DemandeOffreTaxiClient): boolean {
    return demande.offreId !== null && demande.offreId !== undefined;
  }
}