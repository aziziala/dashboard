import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { Router } from '@angular/router';
import {
  AssignmentType,
  ReservationLanguage,
  ReservationSource,
  ReservationWithAssignmentRequest
} from '../../models/reservation.model';
import { GetAllTaxisDtoResponse } from '../../models/taxi.model';
import { PlanificationService } from '../../services/planification.service';

import {   } from '@angular/forms';

type CreateStep = 'reservation' | 'assignment';

/**
 * Page dédiée (routée) — 2 étapes :
 *  1. Détails de la réservation
 *  2. Affectation d'un taxi (optionnelle : "sans affectation" possible)
 * Envoie tout en un seul appel à POST /with-assignment.
 */
@Component({
  selector: 'app-reservation-create',
  templateUrl: './reservation-create.component.html',
  styleUrls: ['./reservation-create.component.scss']
})
export class ReservationCreateComponent implements OnInit {
  currentStep: CreateStep = 'reservation';

  reservationForm!: FormGroup;

  assignNow = false; // false = créer sans affectation immédiate
  selectedTaxi: GetAllTaxisDtoResponse | null = null;
  assignComment = '';
  assignedBy = 'admin'; // TODO: brancher sur l'utilisateur connecté

  isSubmitting = false;
  errorMessage: string | null = null;

  readonly ReservationSource = ReservationSource;
  readonly ReservationLanguage = ReservationLanguage;

  constructor(
    private fb: FormBuilder,
    private planificationService: PlanificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
      this.reservationForm = this.fb.group({

    telephone: ['',
      [
        Validators.required,
        this.tunisianOrLibyanPhoneValidator()
      ]
    ],

    pickup: ['',
      [
        Validators.required,
        Validators.minLength(2),
        this.notOnlyNumbersValidator()
      ]
    ],

    destination: ['',
      [
        Validators.required,
        Validators.minLength(2),
        this.notOnlyNumbersValidator()
      ]
    ],
    reservationDateTime: [
      null,[this.reservationDateValidator()]],
    source: [
      ReservationSource.DASHBOARD,
      Validators.required],
    language: [ReservationLanguage.FR],
    commentaire: ['']
  });
  }

  goToAssignmentStep(): void {
    if (this.reservationForm.invalid) {
      this.reservationForm.markAllAsTouched();
      return;
    }
    this.currentStep = 'assignment';
  }

  backToReservationStep(): void {
    this.currentStep = 'reservation';
  }

  onTaxiSelected(taxi: GetAllTaxisDtoResponse): void {
    this.selectedTaxi = taxi;
  }

  isInvalid(controlName: string): boolean {
    const control = this.reservationForm.get(controlName);
    return !!control && control.invalid && (control.touched || control.dirty);
  }

  submit(): void {
    if (this.reservationForm.invalid) {
      this.reservationForm.markAllAsTouched();
      this.currentStep = 'reservation';
      return;
    }
    if (this.assignNow && !this.selectedTaxi) {
      this.errorMessage = 'Sélectionnez un taxi ou désactivez l’affectation immédiate.';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = null;

    const raw = this.reservationForm.value;
    const payload: ReservationWithAssignmentRequest = {
      reservation: {
        telephone: raw.telephone,
        pickup: raw.pickup,
        destination: raw.destination,
        reservationDateTime: raw.reservationDateTime ? new Date(raw.reservationDateTime).toISOString() : null,
        source: ReservationSource.DASHBOARD,
        commentaire: raw.commentaire
      }
    };

    if (this.assignNow && this.selectedTaxi) {
      payload.assignment = {
        taxiId: this.selectedTaxi.id,
        assignmentType: AssignmentType.MANUAL,
        assignedBy: this.assignedBy,
        comment: this.assignComment || undefined
      };
    }

    this.planificationService.createWithAssignment(payload).subscribe({
      next: (created) => {
        this.isSubmitting = false;
        this.router.navigate(['/planification/reservations'], {
          queryParams: { created: created.id }
        });
      },
      error: (err) => {

        this.errorMessage =
          err?.error?.message ||
          "Échec de l'affectation du taxi.";
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/planification/reservations']);
  }



/**
 * Vérifie qu'un champ texte n'est pas composé uniquement de chiffres.
 */
private notOnlyNumbersValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {

    const value = control.value?.toString().trim();

    if (!value) {
      return null;
    }

    // Autorise lettres, chiffres, espaces, accents, ponctuation...
    // mais refuse une valeur composée uniquement de chiffres.
    if (/^\d+$/.test(value)) {
      return { onlyNumbers: true };
    }

    return null;
  };
}


/**
 * Numéro tunisien ou libyen.
 */
private tunisianOrLibyanPhoneValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {

    const value = control.value?.toString().trim();

    if (!value) {
      return null;
    }

    // On supprime espaces, tirets et parenthèses pour faciliter le contrôle.
    const phone = value.replace(/[\s\-().]/g, '');

    /*
     * Tunisie :
     *  +216XXXXXXXX
     *  216XXXXXXXX
     *  8 chiffres commençant généralement par 2, 3, 4, 5, 7 ou 9
     *
     * Libye :
     *  +218XXXXXXXXX
     *  218XXXXXXXXX
     */

    const tunisianRegex = /^(?:\+216|216)?[2-9]\d{7}$/;

    const libyanRegex = /^(?:\+218|218)\d{9}$/;

    if (
      tunisianRegex.test(phone) ||
      libyanRegex.test(phone)
    ) {
      return null;
    }

    return {
      invalidPhone: true
    };
  };
}


/**
 * Vérifie que la date de réservation n'est pas dans le passé.
 */
private reservationDateValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {

    const value = control.value;

    // Champ optionnel : vide = réservation ASAP
    if (!value) {
      return null;
    }

    const selectedDate = new Date(value);
    const now = new Date();

    if (isNaN(selectedDate.getTime())) {
      return {
        invalidDate: true
      };
    }

    if (selectedDate < now) {
      return {
        pastDate: true
      };
    }

    return null;
  };
}

}