import { Component, OnDestroy, OnInit } from '@angular/core';
import * as L from 'leaflet';
import { WebsocketService } from '../../services/websocket.service';
import {
  FLEET_LOCATIONS_V2_TOPIC,
  FLEET_SUBSCRIBE_APP_DESTINATION
} from '../../models/fleet-locations-v2.model';
import { isFleetLocationsV2Payload, isRideActiveForAssignment, mapFleetLocationsV2Payload } from '../../utils/fleet-locations-v2.mapper';
import {
  buildTariffTaxiMarkerHtml,
  feesOptionToTariffPinClass
} from '../../utils/taxi-tariff-marker.util';

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

  constructor(private wsService: WebsocketService) {}

  private tariffMarkerIcon(
    feesOption: string | null | undefined,
    options: { inProgress: boolean; compact: boolean }
  ): L.DivIcon {
    const tariffClass = feesOptionToTariffPinClass(feesOption);
    const cls = options.compact ? 'leaflet-taxi-tariff-marker compact' : 'leaflet-taxi-tariff-marker';
    return L.divIcon({
      className: cls,
      html: buildTariffTaxiMarkerHtml(tariffClass, { inProgress: options.inProgress }),
      iconSize: options.compact ? [32, 32] : [40, 40],
      iconAnchor: options.compact ? [16, 16] : [20, 20]
    });
  }

  ngOnInit(): void {
    this.initMap();

    this.wsService.connect(true);
    this.wsService.onConnected().subscribe((connected) => {
      this.connectionStatus = connected ? 'connected' : 'disconnected';
      // eslint-disable-next-line no-console
      console.log('[MapView] WebSocket connection status:', this.connectionStatus);

      if (connected) {
        this.subscription = this.wsService.subscribe(
          FLEET_LOCATIONS_V2_TOPIC,
          (message) => this.handleFleetLocations(message)
        );

        // Ask backend to broadcast current fleet locations
        this.wsService.send(FLEET_SUBSCRIBE_APP_DESTINATION, {});
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

    const parsed = JSON.parse(message.body);
    if (!isFleetLocationsV2Payload(parsed)) {
      // eslint-disable-next-line no-console
      console.warn('[MapView] Unexpected fleet WS payload (expected v2 object with statistics + locations).');
      return;
    }

    const { locations } = mapFleetLocationsV2Payload(parsed);
    const seenIds = new Set<number>();

    locations.forEach((taxi) => {
      if (taxi.latitude == null || taxi.longitude == null) {
        return;
      }
      seenIds.add(taxi.taxiId);
      const position: [number, number] = [taxi.latitude, taxi.longitude];
      const normalizedStatus = (taxi.rideStatus || '').toUpperCase();
      const onRide = isRideActiveForAssignment(taxi.rideStatus);

      const icon = this.tariffMarkerIcon(taxi.feesOption, {
        inProgress: onRide,
        compact: true
      });

      const existing = this.taxiMarkers.get(taxi.taxiId);

      if (existing) {
        existing.setLatLng(position);
        existing.setIcon(icon);
      } else if (this.map) {
        const marker = L.marker(position, { icon })
          .bindPopup(
            `<b>${taxi.taxiNumber}</b><br>${taxi.driverName || ''}<br>Statut: ${normalizedStatus || '—'}` +
              (taxi.feesOption ? `<br>Tarif: ${taxi.feesOption}` : '')
          )
          .addTo(this.map);

        this.taxiMarkers.set(taxi.taxiId, marker);
      }
    });

    this.taxiMarkers.forEach((marker, taxiId) => {
      if (!seenIds.has(taxiId)) {
        marker.remove();
        this.taxiMarkers.delete(taxiId);
      }
    });
  }
}
