import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService }                      from 'ngx-toastr';
import {
  finalize, Subject, debounceTime, distinctUntilChanged, takeUntil
} from 'rxjs';

import { Notificationv2Service } from '../../../services/notificationv2.service';
import { TaxiCriteria }         from '../../../models/notification/TaxiCriteria.model';
import { ClientCriteria }       from '../../../models/notification/ClientCriteria.model';
import {
  NotificationChannel,
  NotificationTargetType,
  NotificationType
} from '../../../models/notification/SendNotificationRequest.model';

type TargetTab = 'TAXI' | 'CLIENT' | 'ADMIN';

@Component({
  selector: 'app-send-notification',
  templateUrl: './send-notification.component.html',
  styleUrls: ['./send-notification.component.scss']
})
export class SendNotificationComponent implements OnInit, OnDestroy {

  // ── Stepper ───────────────────────────────────────────────────────────────
  currentStep = 1;

  // ── Step 1 form ───────────────────────────────────────────────────────────
  notifForm!: FormGroup;

  readonly typeOptions: NotificationType[]       = ['INFO', 'WARNING', 'ERROR'];
  readonly channelOptions: NotificationChannel[] = ['PUSH', 'SMS', 'EMAIL', 'WHATSAPP'];

  // ── Step 2 — target tab ───────────────────────────────────────────────────
  activeTab: TargetTab = 'TAXI';

  // ── TAXI list state ───────────────────────────────────────────────────────
  taxis:           TaxiCriteria[] = [];
  taxiSearchTerm   = '';          // ← unique champ de recherche taxi
  taxiPage         = 0;
  taxiTotalPages   = 0;
  taxiTotalEls     = 0;
  taxiPageSize     = 10;
  isTaxiLoading    = false;

  selectedTaxiIds  = new Set<string>();
  allTaxisSelected = false;

  // ── CLIENT list state ─────────────────────────────────────────────────────
  clients:            ClientCriteria[] = [];
  clientSearchTerm    = '';       // ← unique champ de recherche client
  clientPage          = 0;
  clientTotalPages    = 0;
  clientTotalEls      = 0;
  clientPageSize      = 10;
  isClientLoading     = false;

  selectedClientIds   = new Set<string>();
  allClientsSelected  = false;

  // ── Send state ────────────────────────────────────────────────────────────
  isSending = false;

  // ── Search debounce ───────────────────────────────────────────────────────
  private taxiSearch$   = new Subject<string>();
  private clientSearch$ = new Subject<string>();
  private destroy$      = new Subject<void>();

  readonly pageSizeOptions = [10, 25, 50, 100];

  constructor(
    private fb: FormBuilder,
    private notifService: Notificationv2Service,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.notifForm = this.fb.group({
      title:   ['', Validators.required],
      message: ['', Validators.required],
      type:    ['INFO', Validators.required],
      channel: ['PUSH', Validators.required]
    });

    // FIX 1 : on passe la valeur dans le pipe pour que distinctUntilChanged
    //         détecte vraiment un changement de texte et déclenche à chaque frappe
    this.taxiSearch$.pipe(
      debounceTime(350),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.taxiPage = 0;
      this.loadTaxis();
    });

    this.clientSearch$.pipe(
      debounceTime(350),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.clientPage = 0;
      this.loadClients();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Stepper ───────────────────────────────────────────────────────────────

  goToStep2(): void {
    if (this.notifForm.invalid) { this.notifForm.markAllAsTouched(); return; }
    this.currentStep = 2;
    this.loadTaxis();
  }

  goBackToStep1(): void { this.currentStep = 1; }

  // ── Tab ───────────────────────────────────────────────────────────────────

  setTab(tab: TargetTab): void {
    this.activeTab = tab;
    if (tab === 'TAXI'   && !this.taxis.length)   this.loadTaxis();
    if (tab === 'CLIENT' && !this.clients.length)  this.loadClients();
  }

  // ── SEARCH HELPERS ────────────────────────────────────────────────────────

  /**
   * FIX 2 : détection automatique du critère.
   * Si le terme ne contient que des chiffres → phone, sinon → name.
   */
  private resolveSearch(term: string): { phone?: string; name?: string } {
    const t = term.trim();
    if (!t) return {};
    return /^\d+$/.test(t) ? { phone: t } : { name: t };
  }

  // ── TAXI ──────────────────────────────────────────────────────────────────

  loadTaxis(): void {
    if (this.isTaxiLoading) return;
    this.isTaxiLoading = true;

    const { phone, name } = this.resolveSearch(this.taxiSearchTerm);

    this.notifService
      .getTaxisByCriteria(this.taxiPage, this.taxiPageSize, phone, name)
      .pipe(finalize(() => (this.isTaxiLoading = false)))
      .subscribe({
        next: res => {
          this.taxis          = res.content;
          this.taxiTotalPages = res.totalPages;
          this.taxiTotalEls   = res.totalElements;
        },
        error: () => this.toastr.error('Impossible de charger les taxis', 'Erreur')
      });
  }

  // FIX 1 : on émet la valeur courante à chaque changement → déclenche bien le debounce
  onTaxiSearchChange(): void {
    this.taxiSearch$.next(this.taxiSearchTerm);
  }

  onTaxiPageChange(page: number): void {
    this.taxiPage = page - 1;
    this.loadTaxis();
  }

  onTaxiPageSizeChange(size: number): void {
    this.taxiPageSize = size;
    this.taxiPage     = 0;
    this.loadTaxis();
  }

  toggleTaxi(id: string): void {
    this.allTaxisSelected = false;
    this.selectedTaxiIds.has(id)
      ? this.selectedTaxiIds.delete(id)
      : this.selectedTaxiIds.add(id);
  }

  toggleAllTaxis(): void {
    this.allTaxisSelected = !this.allTaxisSelected;
    if (this.allTaxisSelected) this.selectedTaxiIds.clear();
  }

  isTaxiSelected(id: string): boolean { return this.selectedTaxiIds.has(id); }

  get taxiSelectionLabel(): string {
    if (this.allTaxisSelected) return 'Tous les taxis sélectionnés';
    const n = this.selectedTaxiIds.size;
    return n === 0 ? 'Aucun taxi sélectionné' : `${n} taxi(s) sélectionné(s)`;
  }

  // ── CLIENT ────────────────────────────────────────────────────────────────

  loadClients(): void {
    if (this.isClientLoading) return;
    this.isClientLoading = true;

    const { phone, name } = this.resolveSearch(this.clientSearchTerm);

    this.notifService
      .getClientsByCriteria(this.clientPage, this.clientPageSize, phone, name)
      .pipe(finalize(() => (this.isClientLoading = false)))
      .subscribe({
        next: res => {
          this.clients          = res.content;
          this.clientTotalPages = res.totalPages;
          this.clientTotalEls   = res.totalElements;
        },
        error: () => this.toastr.error('Impossible de charger les clients', 'Erreur')
      });
  }

  onClientSearchChange(): void {
    this.clientSearch$.next(this.clientSearchTerm);
  }

  onClientPageChange(page: number): void {
    this.clientPage = page - 1;
    this.loadClients();
  }

  onClientPageSizeChange(size: number): void {
    this.clientPageSize = size;
    this.clientPage     = 0;
    this.loadClients();
  }

  toggleClient(id: string): void {
    this.allClientsSelected = false;
    this.selectedClientIds.has(id)
      ? this.selectedClientIds.delete(id)
      : this.selectedClientIds.add(id);
  }

  toggleAllClients(): void {
    this.allClientsSelected = !this.allClientsSelected;
    if (this.allClientsSelected) this.selectedClientIds.clear();
  }

  isClientSelected(id: string): boolean { return this.selectedClientIds.has(id); }

  get clientSelectionLabel(): string {
    if (this.allClientsSelected) return 'Tous les clients sélectionnés';
    const n = this.selectedClientIds.size;
    return n === 0 ? 'Aucun client sélectionné' : `${n} client(s) sélectionné(s)`;
  }

  // ── Validation / send ─────────────────────────────────────────────────────

  get canSend(): boolean {
    if (this.activeTab === 'TAXI')   return this.allTaxisSelected  || this.selectedTaxiIds.size > 0;
    if (this.activeTab === 'CLIENT') return this.allClientsSelected || this.selectedClientIds.size > 0;
    return true;
  }

  get targetType(): NotificationTargetType { return this.activeTab as NotificationTargetType; }

  get targetIds(): string[] {
    if (this.activeTab === 'ADMIN')                             return ['ALL'];
    if (this.activeTab === 'TAXI'   && this.allTaxisSelected)   return ['ALL'];
    if (this.activeTab === 'CLIENT' && this.allClientsSelected) return ['ALL'];
    if (this.activeTab === 'TAXI')   return Array.from(this.selectedTaxiIds);
    if (this.activeTab === 'CLIENT') return Array.from(this.selectedClientIds);
    return [];
  }

  isInvalid(field: string): boolean {
    const c = this.notifForm.get(field);
    return !!(c && c.invalid && c.touched);
  }

  send(): void {
    if (!this.canSend || this.isSending) return;
    this.isSending = true;

    const payload = {
      ...this.notifForm.value,
      targetType: this.targetType,
      targetIds:  this.targetIds
    };

    this.notifService.send(payload)
      .pipe(finalize(() => (this.isSending = false)))
      .subscribe({
        next: () => {
          this.toastr.success('Notification envoyée avec succès', 'Succès');
          this.resetAll();
        },
        error: err => {
          const apiErr = err.error;
          if (err.status === 400 && apiErr?.validationErrors) {
            const msgs = Object.values(apiErr.validationErrors).join(' · ');
            this.toastr.error(msgs, 'Validation');
          } else if (err.status === 404) {
            this.toastr.error(apiErr?.message || 'Destinataire introuvable', 'Introuvable');
          } else {
            this.toastr.error('Une erreur est survenue', 'Erreur');
          }
        }
      });
  }

  private resetAll(): void {
    this.notifForm.reset({ type: 'INFO', channel: 'PUSH' });
    this.currentStep        = 1;
    this.activeTab          = 'TAXI';
    this.taxiSearchTerm     = '';
    this.clientSearchTerm   = '';
    this.selectedTaxiIds.clear();
    this.selectedClientIds.clear();
    this.allTaxisSelected   = false;
    this.allClientsSelected = false;
  }

  // ── Template helpers ──────────────────────────────────────────────────────

  getTypeIcon(type: string): string {
    switch (type) {
      case 'INFO':    return 'fas fa-info-circle text-info';
      case 'WARNING': return 'fas fa-exclamation-triangle text-warning';
      case 'ERROR':   return 'fas fa-times-circle text-danger';
      default:        return 'fas fa-bell';
    }
  }

  getChannelIcon(ch: string): string {
    switch (ch) {
      case 'PUSH':     return 'fas fa-bell';
      case 'SMS':      return 'fas fa-sms';
      case 'EMAIL':    return 'fas fa-envelope';
      case 'WHATSAPP': return 'fab fa-whatsapp';
      default:         return 'fas fa-paper-plane';
    }
  }
}