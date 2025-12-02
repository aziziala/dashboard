import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormControl } from '@angular/forms';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

@Component({
  selector: 'app-inscription-taxi',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './inscription-taxi.component.html',
  styleUrl: './inscription-taxi.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})

export class InscriptionTaxiComponent {
  
   taxiForm: FormGroup;

  constructor(private fb: FormBuilder, private snackBar: MatSnackBar) {
    this.taxiForm = this.fb.group({
      nomPrenom: ['', Validators.required],
      cin: ['', [Validators.required, this.cinValidator]],
      email: ['', [Validators.required, Validators.email]],
      modelevoiture: ['', Validators.required],
      numeroMatricule: ['', [Validators.required, this.matriculeValidator.bind(this)]],
      numeroTaxi: ['', [Validators.required,Validators.pattern(/^\d+$/),Validators.minLength(4),Validators.maxLength(5)]],
      typeTelephone: ['GSM', Validators.required],
      telephone: ['', [Validators.required, this.telephoneValidator]]
    });
  }

cinValidator(control: FormControl) {
  const value = control.value;
  const cinRegex = /^[0-9]{8}$/; 

  return cinRegex.test(value) ? null : { invalidCIN: true };
}

telephoneValidator(control: FormControl) {
  const value = control.value;
  const phoneRegex = /^(2|4|5|7|9)[0-9]{7}$/;   

  return phoneRegex.test(value) ? null : { invalidTelephone: true };
}

matriculeValidator(control: FormControl) {
  const value = control.value?.toUpperCase() || '';
  const matriculeRegex = /^\d{3}TU\d{4}$/;
  return matriculeRegex.test(value) ? null : { invalidMatricule: true };
}

get numeroTaxi() {
  return this.taxiForm.get('numeroTaxi');
}

onSubmit() {
  if (this.taxiForm.invalid) {
    const controls = this.taxiForm.controls;

    if (controls['nomPrenom']?.hasError('required')) {
      this.showToast("Le nom et prénom sont obligatoires.");
    }


    if (controls['cin']?.hasError('invalidCIN') || controls['cin']?.hasError('required')) {
      this.showToast("CIN invalide : il doit contenir exactement 8 chiffres.");
    }

    if (controls['email']?.hasError('email') || controls['email']?.hasError('required')) {
      this.showToast("Adresse e-mail invalide.");
    }

    if (controls['modelevoiture']?.hasError('required')) {
      this.showToast("Le modèle de voiture est obligatoire.");
    }

    if (controls['numeroMatricule']?.hasError('invalidMatricule') || controls['numeroMatricule']?.hasError('required')) {
      this.showToast("Numéro de matricule invalide. Format attendu : 3 chiffres + TU + 4 chiffres (ex: 123TU4567).");
    }

    if (controls['numeroTaxi']?.hasError('required')) {
      this.showToast("La plaque de taxi est requise.");
    } else if (controls['numeroTaxi']?.hasError('pattern')) {
      this.showToast("La plaque de taxi ne doit contenir que des chiffres.");
    } else if (controls['numeroTaxi']?.hasError('minlength')) {
      this.showToast("La plaque de taxi doit contenir au moins 4 chiffres.");
    } else if (controls['numeroTaxi']?.hasError('maxlength')) {
      this.showToast("La plaque de taxi ne doit pas dépasser 5 chiffres.");
    }

    if (controls['typeTelephone']?.hasError('required')) {
      this.showToast("Veuillez sélectionner un type de téléphone.");
    }

    if (controls['telephone']?.hasError('invalidTelephone') || controls['telephone']?.hasError('required')) {
      this.showToast("Numéro de téléphone invalide — il doit contenir 8 chiffres et commencer par 2, 4, 5, 7 ou 9.");
    }

    return;
  }

  console.log(this.taxiForm.value);
  this.showToast("Formulaire soumis avec succès.", 'success');
}
  
showToast(message: string, type: 'error' | 'success' = 'error') {
  this.snackBar.open(message, 'Fermer', {
    duration: 2000,
    horizontalPosition: 'right',
    verticalPosition: 'bottom',
    panelClass: type === 'error' ? 'toast-error' : 'toast-success'
  });
}
}