import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { PlanificationService } from '../../services/planification.service';
import { GetAllTaxisDtoResponse } from '../../models/taxi.model';

/**
 * Liste de taxis avec recherche + <app-pagination>, sélection unique.
 * Réutilisé par :
 *  - reservation-create (étape 2 : affectation à la création)
 *  - reservation-details-modal (étape 2 : (ré)affecter un taxi)
 */
@Component({
  selector: 'app-taxi-picker',
  templateUrl: './taxi-picker.component.html',
  styleUrls: ['./taxi-picker.component.scss']
})
export class TaxiPickerComponent implements OnInit {
  /** Taxi déjà sélectionné (pré-sélection en cas de réaffectation) */
  @Input() selectedTaxiId: number | null = null;
  @Output() taxiSelected = new EventEmitter<GetAllTaxisDtoResponse>();

  taxis: GetAllTaxisDtoResponse[] = [];
  isLoading = false;

  searchTerm = '';
  private searchSubject = new Subject<string>();

  page = 0; // 0-based (API)
  pageSize = 10;
  totalPages = 0;
  totalElements = 0;

  constructor(private planificationService: PlanificationService) {}

  ngOnInit(): void {
    this.searchSubject.pipe(debounceTime(350), distinctUntilChanged()).subscribe(() => {
      this.page = 0;
      this.fetchTaxis();
    });
    this.fetchTaxis();
  }

  onSearchChange(): void {
    this.searchSubject.next(this.searchTerm);
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.onSearchChange();
  }

  fetchTaxis(): void {
    this.isLoading = true;
    this.planificationService
      .getAllTaxisCriteria(this.page, this.pageSize, [{ field: 'phone', direction: 'desc' }], this.searchTerm)
      .subscribe({
        next: (res) => {
          this.taxis = res.content;
          this.totalPages = res.totalPages;
          this.totalElements = res.totalElements;
          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
        }
      });
  }

  // app-pagination émet une page 1-based
  onPageChange(page1Based: number): void {
    this.page = page1Based - 1;
    this.fetchTaxis();
  }

  selectTaxi(taxi: GetAllTaxisDtoResponse): void {
    this.selectedTaxiId = taxi.id;
    this.taxiSelected.emit(taxi);
  }
}