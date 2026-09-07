import { Injectable, OnDestroy } from '@angular/core';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { ReservationNotification } from '../models/reservation.model';
import { environment } from '../../../../environments/environment';

/**
 * Gère UNIQUEMENT la connexion STOMP/SockJS et l'abonnement à
 * /topic/planifications
 */
@Injectable({ providedIn: 'root' })
export class PlanificationWebsocketService implements OnDestroy {
  private client?: Client;
  private subscription?: StompSubscription;

  private readonly connectedSubject = new BehaviorSubject<boolean>(false);
  private readonly reservationSubject = new Subject<ReservationNotification>();

  private static readonly TOPIC = '/topic/planifications';

  get connectionStatus$(): Observable<boolean> {
    return this.connectedSubject.asObservable();
  }

  /** Flux global : un ReservationNotification à chaque événement reçu sur /topic/planifications. */
  get reservation$(): Observable<ReservationNotification> {
    return this.reservationSubject.asObservable();
  }

  connect(): void {
    // Évite plusieurs connexions simultanées si plusieurs composants appellent connect().
    if (this.client?.active) {
      return;
    }

    this.client = new Client({
      webSocketFactory: () => new SockJS(environment.planificationWsUrl),
      reconnectDelay: 5000, // reconnexion automatique STOMP en cas de coupure
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      debug: (str: string) => console.log('%c[STOMP RAW]', 'color: orange; font-weight: bold', str)
    });

    this.client.onConnect = () => {
      this.connectedSubject.next(true);
      this.subscribeToTopic();
    };

    this.client.onWebSocketClose = () => {
      this.connectedSubject.next(false);
      this.subscription = undefined;
    };

    this.client.onStompError = (frame) => {
      console.error('Erreur STOMP planification-service :', frame.headers, frame.body);

      this.subscription = undefined;
    };

    this.client.activate();
  }

  disconnect(): void {
    this.subscription?.unsubscribe();
    this.subscription = undefined;
    this.client?.deactivate();
    this.connectedSubject.next(false);
  }

  private subscribeToTopic(): void {
    if (!this.client?.connected || this.subscription) {
      return;
    }
    this.subscription = this.client.subscribe(PlanificationWebsocketService.TOPIC, (frame: IMessage) => {
      console.log('%c[STOMP MESSAGE BRUT] frame reçue sur /topic/planifications', 'color: green; font-weight: bold', frame);
      try {
        const notification = JSON.parse(frame.body) as ReservationNotification;
        this.reservationSubject.next(notification);
      } catch (e) {
        console.error('Message /topic/planifications illisible :', frame.body, e);
      }
    });
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}