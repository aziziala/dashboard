import { Component, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';
import { SyncTaxiAccountService } from '../../services/sync-taxi-account.service';
import {
  SyncTaxiAccountResponse,
  SyncTaxiRegistrationPayload
} from '../../models/sync-taxi-account.model';

@Component({
  selector: 'app-sync-taxi-account',
  templateUrl: './sync-taxi-account.component.html',
  styleUrls: ['./sync-taxi-account.component.scss']
})
export class SyncTaxiAccountComponent {
  private readonly syncApi = inject(SyncTaxiAccountService);
  private readonly toastr = inject(ToastrService);

  phone = '';
  loading = false;
  showRegistration = false;
  registration: SyncTaxiRegistrationPayload = {};

  submit(): void {
    const phone = this.phone.trim();
    if (!phone) {
      this.toastr.warning('Veuillez saisir le numéro de téléphone du taxi.');
      return;
    }

    const body = this.buildBody();
    this.loading = true;
    this.syncApi
      .sync(phone, body)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (res) => this.handleSuccess(res),
        error: (err: HttpErrorResponse) => this.handleError(err)
      });
  }

  private buildBody(): SyncTaxiRegistrationPayload | undefined {
    if (!this.showRegistration) {
      return undefined;
    }
    const r = this.registration;
    const out: SyncTaxiRegistrationPayload = {};
    if (r.nom?.trim()) out.nom = r.nom.trim();
    if (r.numeroCin?.trim()) out.numeroCin = r.numeroCin.trim();
    if (r.numeroMatricule?.trim()) out.numeroMatricule = r.numeroMatricule.trim();
    if (r.numeroTaxi?.trim()) out.numeroTaxi = r.numeroTaxi.trim();
    if (r.constructeur?.trim()) out.constructeur = r.constructeur.trim();
    if (r.type?.trim()) out.type = r.type.trim();
    if (r.contenu?.trim()) out.contenu = r.contenu.trim();
    return Object.keys(out).length ? out : {};
  }

  private handleSuccess(res: SyncTaxiAccountResponse): void {
    this.showRegistration = false;
    const action = res.actionPerformed ?? '';
    const msg = res.message;
    switch (action) {
      case 'NONE':
        this.toastr.info(msg || 'Compte déjà synchronisé (aucune action).');
        break;
      case 'CREATED_TAXI_CLIENT':
        this.toastr.success(msg || 'Client taxi créé.');
        break;
      case 'CREATED_JWT_ACCOUNT':
        this.toastr.success(msg || 'Compte JWT créé.');
        break;
      case 'CREATED_BOTH':
        this.toastr.success(msg || 'Client taxi et compte JWT créés.');
        break;
      default:
        this.toastr.success(msg || `Synchronisation terminée (${action || 'OK'}).`);
    }
  }

  private handleError(err: HttpErrorResponse): void {
    if (err.status === 400) {
      this.showRegistration = true;
      const body = err.error;
      const hint =
        (typeof body === 'string' ? body : null) ||
        body?.message ||
        body?.error ||
        'Données d’inscription manquantes ou invalides. Complétez le formulaire puis réessayez.';
      this.toastr.warning(hint, 'Données requises');
      const missing: string[] | undefined = body?.missingFields;
      if (missing?.length) {
        this.toastr.info(`Champs attendus : ${missing.join(', ')}`);
      }
      return;
    }

    const serverMsg =
      typeof err.error === 'string'
        ? err.error
        : err.error?.message || err.error?.error || err.message;
    this.toastr.error(serverMsg || 'Erreur lors de la synchronisation.', 'Erreur');
  }
}
