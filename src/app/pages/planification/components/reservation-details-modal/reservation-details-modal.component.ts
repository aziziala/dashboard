import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { PlanificationService } from '../../services/planification.service';
import {
  AssignmentType,
  RESERVATION_STATUS_BADGE_CLASS,
  RESERVATION_STATUS_LABELS,
  ReservationResponse,
  ReservationStatus,
  UNASSIGNABLE_STATUSES
} from '../../models/reservation.model';
import { GetAllTaxisDtoResponse } from '../../models/taxi.model';

type Step = 'details' | 'assignment';

/**
 * Ouverte via NgbModal depuis reservation-list au clic sur l'icône "détails".
 * Étape 1 : champs de base (PUT /{id})
 * Étape 2 : affectation courante — assigner / réaffecter / retirer (PUT|DELETE /{id}/assignment)
 */
@Component({
  selector: 'app-reservation-details-modal',
  templateUrl: './reservation-details-modal.component.html',
  styleUrls: ['./reservation-details-modal.component.scss']
})
export class ReservationDetailsModalComponent implements OnInit, OnDestroy {
  @Input() reservation!: ReservationResponse;

  currentStep: Step = 'details';

  detailsForm!: FormGroup;
  isSavingDetails = false;
  isSavingFinalPrice = false;

  private destroy$ = new Subject<void>();

  // Étape affectation
  showTaxiPicker = false;
  pendingTaxi: GetAllTaxisDtoResponse | null = null;
  assignComment = '';
  assignedBy = 'admin'; // TODO: brancher sur l'utilisateur connecté
  isAssigning = false;

  // Confirmation de retrait d'affectation
  showUnassignConfirm = false;
  unassignReason = '';
  isUnassigning = false;

  errorMessage: string | null = null;

  readonly statusLabels = RESERVATION_STATUS_LABELS;
  readonly statusBadgeClass = RESERVATION_STATUS_BADGE_CLASS;
  readonly unassignableStatuses = UNASSIGNABLE_STATUSES;

  constructor(
    public activeModal: NgbActiveModal,
    private fb: FormBuilder,
    private planificationService: PlanificationService,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    this.detailsForm = this.fb.group({
      telephone: [this.reservation.telephone, Validators.required],
      pickup: [this.reservation.pickup, Validators.required],
      destination: [this.reservation.destination, Validators.required],
      reservationDateTime: [this.toDatetimeLocal(this.reservation.reservationDateTime)],
      commentaire: [this.reservation.commentaire],
      finalPrice: [this.reservation.finalPrice ?? null, Validators.min(0)]
    });

    // Autosave du prix final dès qu'il change (pas besoin de cliquer sur "Enregistrer")
    this.detailsForm
      .get('finalPrice')!
      .valueChanges
      .pipe(debounceTime(2000), takeUntil(this.destroy$))
      .subscribe((value) => this.saveFinalPrice(this.toNullableNumber(value)));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private toNullableNumber(value: any): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }
    const n = Number(value);
    return Number.isNaN(n) ? null : n;
  }

  // Envoie uniquement finalPrice via PUT /{id} — appelé automatiquement à la saisie
  private saveFinalPrice(value: number | null): void {
    const current = this.reservation.finalPrice ?? null;
    if (value === current || this.isSavingFinalPrice) {
      return;
    }
    this.isSavingFinalPrice = true;

    this.planificationService
      .update(this.reservation.id, { finalPrice: value })
      .subscribe({
        next: (updated) => {
          this.reservation = updated;
          this.isSavingFinalPrice = false;
          const control = this.detailsForm.get('finalPrice')!;
          if (control.value !== updated.finalPrice) {
            control.setValue(updated.finalPrice ?? null, { emitEvent: false });
          }
          this.toastr.success('Le prix final a bien été pris en compte.', 'Prix final');
        },
        error: () => {
          this.isSavingFinalPrice = false;
          this.detailsForm
            .get('finalPrice')!
            .setValue(this.reservation.finalPrice ?? null, { emitEvent: false });
          this.toastr.error("Erreur lors de l'enregistrement du prix final.", 'Prix final');
        }
      });
  }

  goToStep(step: Step): void {
    this.currentStep = step;
    this.errorMessage = null;
  }

  // ── Étape 1 : détails ────────────────────────────────────────────────

  saveDetails(): void {
    if (this.detailsForm.invalid) {
      return;
    }
    this.isSavingDetails = true;
    this.errorMessage = null;

    const raw = this.detailsForm.value;
    const finalPrice =
      raw.finalPrice === '' || raw.finalPrice === null || raw.finalPrice === undefined
        ? null
        : Number(raw.finalPrice);
    const finalPriceChanged = finalPrice !== (this.reservation.finalPrice ?? null);

    this.planificationService
      .update(this.reservation.id, {
        telephone: raw.telephone,
        pickup: raw.pickup,
        destination: raw.destination,
        reservationDateTime: raw.reservationDateTime ? new Date(raw.reservationDateTime).toISOString() : null,
        commentaire: raw.commentaire,
        finalPrice
      })
      .subscribe({
        next: (updated) => {
          this.reservation = updated;
          this.isSavingDetails = false;
          if (finalPriceChanged) {
            this.toastr.success('Le prix final a bien été pris en compte.', 'Prix final');
          }
        },
        error: (err) => {
          this.isSavingDetails = false;

          console.log('Erreur mise à jour réservation:', err);

          if (err.status === 409) {
            this.errorMessage =
              err?.error?.message ||
              "Cette réservation ne peut pas être modifiée.";
          } else {
            this.errorMessage =
              "Une erreur est survenue lors de la mise à jour de la réservation.";
          }
        }
      });
  }

  // ── Étape 2 : affectation ────────────────────────────────────────────

  openTaxiPicker(): void {
    this.pendingTaxi = null;
    this.showTaxiPicker = true;
  }

  onTaxiSelected(taxi: GetAllTaxisDtoResponse): void {
    this.pendingTaxi = taxi;
  }

  confirmAssignment(): void {
    if (!this.pendingTaxi) {
      return;
    }
    this.isAssigning = true;
    this.errorMessage = null;

    this.planificationService
      .assignTaxi(this.reservation.id, {
        taxiId: this.pendingTaxi.id,
        assignmentType: AssignmentType.MANUAL,
        assignedBy: this.assignedBy,
        comment: this.assignComment || undefined
      })
      .subscribe({
        next: (updated) => {
          this.reservation = updated;
          this.isAssigning = false;
          this.showTaxiPicker = false;
          this.pendingTaxi = null;
          this.assignComment = '';
        },

       error: (err) => {
        this.isAssigning = false;

        this.errorMessage =
          err?.error?.message ||
          "Échec de l'affectation du taxi.";
      }
    });
  }

  cancelTaxiPicker(): void {
    this.showTaxiPicker = false;
    this.pendingTaxi = null;
    this.assignComment = '';
  }

  openUnassignConfirm(): void {
    this.unassignReason = '';
    this.showUnassignConfirm = true;
  }

  confirmUnassign(): void {
    this.isUnassigning = true;
    this.errorMessage = null;

    this.planificationService
      .unassignTaxi(this.reservation.id, this.assignedBy, this.unassignReason || undefined)
      .subscribe({
        next: (updated) => {
          this.reservation = updated;
          this.isUnassigning = false;
          this.showUnassignConfirm = false;
        },

        error: (err) => {
          this.isUnassigning = false;

          console.log('Erreur lors du retrait de l’affectation :', err);

          this.errorMessage =
            err?.error?.message ||
            "Échec du retrait de l'affectation.";
        }
      });
  }

  get canUnassign(): boolean {
    return !!this.reservation.assignment && this.unassignableStatuses.includes(this.reservation.status);
  }

  get isAsap(): boolean {
    return !this.reservation.reservationDateTime;
  }

  private toDatetimeLocal(iso: string | null): string | null {
    if (!iso) {
      return null;
    }
    // format attendu par <input type="datetime-local"> : yyyy-MM-ddTHH:mm
    return iso.substring(0, 16);
  }
}