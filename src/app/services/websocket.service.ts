import { Injectable } from '@angular/core';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import * as SockJS from 'sockjs-client';
import { environment } from '../../environments/environment';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  private client?: Client;
  private connected = false;
  private connectionSubject = new Subject<boolean>();

  connect(useAdminEndpoint: boolean = false): void {
    if (this.connected) {
      return;
    }

    const socketUrl = useAdminEndpoint
      ? environment.adminWsBaseUrl
      : environment.wsBaseUrl;

    this.client = new Client({
      webSocketFactory: () => new SockJS(socketUrl),
      reconnectDelay: 5000
    });

    // Enable debug logs so we can see STOMP frames in the browser console
    this.client.debug = (msg: string) => {
      // Prefix with [STOMP] so it's easy to filter
      // eslint-disable-next-line no-console
      console.log('[STOMP]', msg);
    };

    this.client.onConnect = () => {
      this.connected = true;
      this.connectionSubject.next(true);
      // eslint-disable-next-line no-console
      console.log('[WebSocket] Connected to', socketUrl);
    };

    this.client.onStompError = (frame) => {
      // eslint-disable-next-line no-console
      console.error('[WebSocket] Broker reported error:', frame.headers['message']);
      // eslint-disable-next-line no-console
      console.error('[WebSocket] Details:', frame.body);
    };

    this.client.onWebSocketClose = () => {
      this.connected = false;
      this.connectionSubject.next(false);
      // eslint-disable-next-line no-console
      console.warn('[WebSocket] Connection closed');
    };

    this.client.activate();
  }

  onConnected(): Observable<boolean> {
    return this.connectionSubject.asObservable();
  }

  subscribe(destination: string, cb: (msg: IMessage) => void): StompSubscription | undefined {
    if (!this.client) {
      console.error('STOMP client not initialized');
      return;
    }
    return this.client.subscribe(destination, cb);
  }

  send(destination: string, body: any): void {
    if (!this.client) {
      console.error('STOMP client not initialized');
      return;
    }
    this.client.publish({
      destination,
      body: JSON.stringify(body)
    });
  }

  disconnect(): void {
    if (this.client) {
      this.client.deactivate().finally(() => {
        this.connected = false;
        this.connectionSubject.next(false);
      });
    }
  }
}



