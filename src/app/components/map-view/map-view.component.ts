import { Component, OnDestroy, OnInit } from '@angular/core';
import * as L from 'leaflet';
import { WebsocketService } from '../../services/websocket.service';

interface TaxiLocationMessage {
  taxiId: number;
  taxiNumber: string;
  latitude: number;
  longitude: number;
  // Backend StatusEnum: WAITING, IN_PROGRESS, TERMINATED, etc.
  rideStatus: 'WAITING' | 'IN_PROGRESS' | 'TERMINATED' | string;
  driverName?: string;
}

@Component({
  selector: 'app-map-view',
  templateUrl: './map-view.component.html',
  styleUrls: ['./map-view.component.scss']
})
export class MapViewComponent implements OnInit, OnDestroy {
  private map?: L.Map;
  private taxiMarkers = new Map<number, L.Marker>();
  private subscription?: any;

  connectionStatus: 'connecting' | 'connected' | 'disconnected' = 'connecting';

  // Car icons from assets instead of default pins
  private waitingIcon = L.icon({
    iconUrl: 'assets/car_icon.png',
    iconSize: [18, 18],
    iconAnchor: [9, 9]
  });

  private inProgressIcon = L.icon({
    iconUrl: 'assets/car-booked.png',
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });

  constructor(private wsService: WebsocketService) {}

  ngOnInit(): void {
    this.initMap();

    this.wsService.connect(true);
    this.wsService.onConnected().subscribe((connected) => {
      this.connectionStatus = connected ? 'connected' : 'disconnected';
      // eslint-disable-next-line no-console
      console.log('[MapView] WebSocket connection status:', this.connectionStatus);

      if (connected) {
        this.subscription = this.wsService.subscribe(
          '/topic/fleet/locations',
          (message) => this.handleFleetLocations(message)
        );

        // Ask backend to broadcast current fleet locations
        this.wsService.send('/app/fleet.subscribe', {});
      }
    });
  }

  ngOnDestroy(): void {
    this.wsService.disconnect();
    this.taxiMarkers.forEach(marker => marker.remove());
    this.taxiMarkers.clear();
    if (this.map) {
      this.map.remove();
    }
  }

  private initMap(): void {
    // Center the map on Tunisia
    const tunisiaCenter: [number, number] = [34.0, 9.0];

    this.map = L.map('taxiMap').setView(tunisiaCenter, 6);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);
  }

  private handleFleetLocations(message: any): void {
    // eslint-disable-next-line no-console
    console.log('[MapView] Received fleet locations message:', message);

    const body: TaxiLocationMessage[] = JSON.parse(message.body);

    body.forEach((taxi) => {
      const position: [number, number] = [taxi.latitude, taxi.longitude];
      const normalizedStatus = (taxi.rideStatus || '').toUpperCase();

      // WAITING → waiting icon; IN_PROGRESS or TERMINATED → booked icon
      const icon = normalizedStatus === 'WAITING'
        ? this.waitingIcon
        : this.inProgressIcon;

      const existing = this.taxiMarkers.get(taxi.taxiId);

      if (existing) {
        existing.setLatLng(position);
        existing.setIcon(icon);
      } else if (this.map) {
        const marker = L.marker(position, { icon })
          .bindPopup(
            `<b>${taxi.taxiNumber}</b><br>${taxi.driverName || ''}<br>Status: ${normalizedStatus}`
          )
          .addTo(this.map);

        this.taxiMarkers.set(taxi.taxiId, marker);
      }
    });
  }
}
