import { Component, OnDestroy, OnInit, TemplateRef } from '@angular/core';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { PlanificationService } from '../../services/planification.service';
import { PlanificationWebsocketService } from '../../services/planification-websocket.service';
import { NotificationSoundService } from '../../services/notification-sound.service';
import {
  RESERVATION_STATUS_BADGE_CLASS,
  RESERVATION_STATUS_LABELS,
  ReservationNotificationType,
  ReservationResponse,
  ReservationStatus,
  UNASSIGNABLE_STATUSES
} from '../../models/reservation.model';
import { ReservationDetailsModalComponent } from '../reservation-details-modal/reservation-details-modal.component';

@Component({
  selector: 'app-reservation-list',
  templateUrl: './reservation-list.component.html',
  styleUrls: ['./reservation-list.component.scss']
})
export class ReservationListComponent implements OnInit, OnDestroy {
  reservations: ReservationResponse[] = [];
  isLoading = false;

  // Filtres
  statusFilter: ReservationStatus | '' = '';
  ReservationStatus = ReservationStatus;

  // Pagination — 1-based en UI, 0-based côté API (convention du projet)
  currentPage = 1;
  itemsPerPage = 10;
  pageSizeOptions = [10, 25, 50, 100];
  totalPages = 0;
  totalElements = 0;

  // Retrait d'affectation (confirmation + raison)
  reservationToUnassign: ReservationResponse | null = null;
  unassignReason = '';
  isUnassigning = false;

  // ── Temps réel (WebSocket) ─────────────────────────────────────────────
  /** ID de la réservation actuellement mise en évidence. */
  highlightReservationId: number | null = null;
  /** Nombre de nouvelles réservations reçues alors qu'on est sur une autre
   *  page ou que le filtre courant ne correspond pas. */
  pendingNewReservationsCount = 0;
  private highlightTimeoutId: ReturnType<typeof setTimeout> | null = null;

  readonly statusLabels = RESERVATION_STATUS_LABELS;
  readonly statusBadgeClass = RESERVATION_STATUS_BADGE_CLASS;
  readonly unassignableStatuses = UNASSIGNABLE_STATUSES;

  private reload$ = new Subject<void>();
  private destroy$ = new Subject<void>();

  constructor(
    private planificationService: PlanificationService,
    private wsService: PlanificationWebsocketService,
    private soundService: NotificationSoundService,
    private modalService: NgbModal,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.reload$.pipe(debounceTime(150), takeUntil(this.destroy$)).subscribe(() => this.fetchReservations());
    this.fetchReservations();

    // ── WebSocket : connexion + abonnement aux notifications ─────────────
    this.wsService.connect();

    this.wsService.reservation$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (notification) => {
          if (!notification) {
            return;
          }
          if (notification.type === ReservationNotificationType.RESERVATION_CREATED && notification.reservation) {
            this.handleReservationCreated(notification.reservation);
          }
        },
        error: (error) => {
          console.error('[RESERVATION LIST] Erreur WebSocket reservation$:', error);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    if (this.highlightTimeoutId) {
      clearTimeout(this.highlightTimeoutId);
      this.highlightTimeoutId = null;
    }
    // Le WebSocket n'est pas déconnecté volontairement (partagé entre pages).
  }

  fetchReservations(): void {
    this.isLoading = true;
    this.planificationService
      .list(this.currentPage - 1, this.itemsPerPage, this.statusFilter)
      .subscribe({
        next: (res) => {
          this.reservations = res.content;
          this.totalPages = res.totalPages;
          this.totalElements = res.totalElements;
          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
        }
      });
  }

  onStatusFilterChange(): void {
    this.currentPage = 1;
    this.reload$.next();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.reload$.next();
  }

  onPageSizeChange(size: string): void {
    this.itemsPerPage = Number(size);
    this.currentPage = 1;
    this.reload$.next();
  }

  goToCreate(): void {
    this.router.navigate(['/planification/reservations/nouvelle']);
  }

  // ── Détails (stepper : édition + affectation) ─────────────────────────

  openDetailsModal(reservation: ReservationResponse): void {
    const modalRef = this.modalService.open(ReservationDetailsModalComponent, {
      size: 'lg',
      centered: true
    });
    modalRef.componentInstance.reservation = reservation;
    modalRef.closed.subscribe(() => this.fetchReservations());
    modalRef.dismissed.subscribe(() => this.fetchReservations());
  }

  // ── Retrait rapide d'affectation depuis la liste ───────────────────────

  canUnassign(reservation: ReservationResponse): boolean {
    return !!reservation.assignment && this.unassignableStatuses.includes(reservation.status);
  }

  openUnassignConfirm(reservation: ReservationResponse, template: TemplateRef<any>): void {
    this.reservationToUnassign = reservation;
    this.unassignReason = '';
    this.modalService.open(template, { centered: true }).result.finally(() => {
      this.reservationToUnassign = null;
    });
  }

  confirmUnassign(modal: any): void {
    if (!this.reservationToUnassign) {
      return;
    }
    this.isUnassigning = true;
    this.planificationService
      .unassignTaxi(this.reservationToUnassign.id, 'admin', this.unassignReason || undefined)
      .subscribe({
        next: () => {
          this.isUnassigning = false;
          modal.close();
          this.fetchReservations();
        },
        error: () => {
          this.isUnassigning = false;
        }
      });
  }

  isAsap(reservation: ReservationResponse): boolean {
    return !reservation.reservationDateTime;
  }

  // ── Temps réel : nouvelle réservation reçue via WebSocket ─────────────

  private handleReservationCreated(reservation: ReservationResponse): void {
    // Son de notification
    try {
      this.soundService.playNotificationSound();
    } catch (error) {
      console.error('[RESERVATION LIST] Erreur son notification:', error);
    }

    const matchesCurrentFilter = !this.statusFilter || this.statusFilter === reservation.status;
    const onFirstPage = this.currentPage === 1;

    if (onFirstPage && matchesCurrentFilter) {
      const alreadyPresent = this.reservations.some((r) => r.id === reservation.id);

      if (!alreadyPresent) {
        // On recharge la page 1 via REST pour rester cohérent avec la pagination/tri du backend.
        this.planificationService
          .list(0, this.itemsPerPage, this.statusFilter)
          .subscribe({
            next: (res) => {
              this.reservations = res.content;
              this.totalPages = res.totalPages;
              this.totalElements = res.totalElements;
              this.highlightNewReservation(reservation.id);
            },
            error: (error) => {
              console.error('[RESERVATION LIST] Erreur REST après RESERVATION_CREATED:', error);
            }
          });
      } else {
        this.highlightNewReservation(reservation.id);
      }
    } else {
      // Nouvelle réservation hors page 1 ou hors filtre courant : on prévient via la bannière.
      this.pendingNewReservationsCount++;
    }
  }

  private highlightNewReservation(id: number): void {
    if (this.highlightTimeoutId) {
      clearTimeout(this.highlightTimeoutId);
    }

    this.highlightReservationId = id;

    this.highlightTimeoutId = setTimeout(() => {
      this.highlightReservationId = null;
      this.highlightTimeoutId = null;
    }, 5000);
  }

  jumpToLatestReservations(): void {
    this.pendingNewReservationsCount = 0;
    this.currentPage = 1;
    this.fetchReservations();
  }

  dismissNewReservationsBanner(): void {
    this.pendingNewReservationsCount = 0;
  }
}