


import {
  Component,
  OnDestroy,
  OnInit
} from '@angular/core';

import {
  Router,
  NavigationEnd,
  ActivatedRoute
} from '@angular/router';

import { filter, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

import { ToastrService } from 'ngx-toastr';

import { UiService } from './services/ui.service';

import {
  PlanificationWebsocketService
} from './pages/planification/services/planification-websocket.service';

import {
  NotificationSoundService
} from './pages/planification/services/notification-sound.service';

import {
  ReservationNotificationType,
  ReservationResponse
} from './pages/planification/models/reservation.model';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {

  title = 'SMS-Taxi Dashboard';

  /**
   * Permet de savoir si le layout principal
   * doit être affiché.
   *
   * Exemple :
   * /login -> noLayout = true
   * /planification -> layout affiché
   */
  showLayout = true;

  /**
   * État du menu mobile.
   */
  mobileOpen = false;

  /**
   * Permet de nettoyer les subscriptions
   * lorsque le composant est détruit.
   */
  private destroy$ = new Subject<void>();


  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private ui: UiService,

    // WebSocket planification
    private planifWsService: PlanificationWebsocketService,

    // Son notification
    private soundService: NotificationSoundService,

    // Toast
    private toastr: ToastrService
  ) {}


  ngOnInit(): void {

    /*
     * ============================================================
     * 1. GESTION DU LAYOUT
     * ============================================================
     */

    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {

        const currentRoute =
          this.getCurrentChild(this.activatedRoute);

        this.showLayout =
          !currentRoute.snapshot.data['noLayout'];
      });


    /*
     * ============================================================
     * 2. GESTION DU MENU MOBILE
     * ============================================================
     */

    this.ui.mobileMenu$
      .pipe(
        takeUntil(this.destroy$)
      )
      .subscribe((open: boolean) => {

        this.mobileOpen = open;

      });


    /*
     * ============================================================
     * 3. CONNEXION WEBSOCKET
     * ============================================================
     *
     * Une seule connexion pour toute l'application.
     */

    this.planifWsService.connect();


    /*
     * ============================================================
     * 4. ÉCOUTE DES NOTIFICATIONS DE RÉSERVATION
     * ============================================================
     */

    this.planifWsService.reservation$
      .pipe(
        takeUntil(this.destroy$)
      )
      .subscribe({

        next: (notification) => {

          // Sécurité
          if (!notification) {
            return;
          }


          /*
           * Nouvelle réservation
           */
          if (
            notification.type ===
              ReservationNotificationType.RESERVATION_CREATED
            &&
            notification.reservation
          ) {

            this.showNewReservationToast(
              notification.reservation
            );
          }

        },

        error: (error) => {

          console.error(
            '[APP] Erreur WebSocket reservation$:',
            error
          );

        }

      });
  }




  getCurrentChild(
    route: ActivatedRoute
  ): ActivatedRoute {

    while (route.firstChild) {

      route = route.firstChild;

    }

    return route;
  }


  isSmsPage(): boolean {

    return this.router.url.includes('/sms');

  }

  closeMobileMenu(): void {

    this.ui.closeMobileMenu();

  }


  /*
   * ============================================================
   * 8. AFFICHER UNE NOUVELLE RÉSERVATION
   * ============================================================
   */

  private showNewReservationToast(
    reservation: ReservationResponse
  ): void {

    /*
     * ------------------------------------------------------------
     * Jouer le son
     * ------------------------------------------------------------
     */

    try {

      this.soundService.playNotificationSound();

    } catch (error) {

      console.error(
        '[APP] Erreur son notification:',
        error
      );

    }

    const toast = this.toastr.info(
      `${reservation.pickup} → ${reservation.destination}`,
      `Nouvelle réservation #${reservation.id}`,
      {
        timeOut: 6000,
        tapToDismiss: true
      }
    );


    /*
     * ------------------------------------------------------------
     * Cliquer sur le Toast
     * -> aller vers les réservations
     * ------------------------------------------------------------
     */

    toast.onTap
      .pipe(
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.router.navigate([
          '/planification/reservations'
        ]);
      });
  }


  /*
   * ============================================================
   * 9. DESTROY
   * ============================================================
   */

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

}