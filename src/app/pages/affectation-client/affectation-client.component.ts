import { AfterViewInit, Component, ElementRef, NgZone, OnDestroy, OnInit, ViewChild } from '@angular/core';
import * as L from 'leaflet';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FleetService } from '../../services/fleet.service';
import { FleetLocation, FleetStatus } from '../../models/fleet-location.model';
import { ClientInjectionService } from '../../services/client-injection.service';
import { WebsocketService } from '../../services/websocket.service';

@Component({
  selector: 'app-affectation-client',
  templateUrl: './affectation-client.component.html',
  styleUrls: ['./affectation-client.component.scss']
})
export class AffectationClientComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('affectationMap', { static: false }) mapContainer!: ElementRef;

  private map!: L.Map;
  private taxiMarkers: L.Marker[] = [];
  private pickupMarker?: L.Marker;
  private destinationMarker?: L.Marker;

  pickupLatLng: L.LatLng | null = null;
  destinationLatLng: L.LatLng | null = null;

  // Icons
  private activeCarIcon = L.icon({
    iconUrl: 'assets/car_icon.png',
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });

  private busyCarIcon = L.icon({
    iconUrl: 'assets/car-booked.png',
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });

  private pickupIcon = L.divIcon({
    className: 'custom-pickup-marker',
    html: '<div class="marker-pickup"></div>',
    iconSize: [32, 32],
    iconAnchor: [16, 32]
  });

  private destinationIcon = L.divIcon({
    className: 'custom-destination-marker',
    html: '<div class="marker-destination"></div>',
    iconSize: [32, 32],
    iconAnchor: [16, 32]
  });

  taxis: FleetLocation[] = [];
  private wsSubscription: any;

  affectationForm!: FormGroup;

  selectedTariff: 'T1' | 'T2' | 'T3' | null = null;
  isSubmitting = false;

  readonly FleetStatus = FleetStatus;

  constructor(
    private ngZone: NgZone,
    private fleetService: FleetService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private clientInjectionService: ClientInjectionService,
    private wsService: WebsocketService
  ) { }

  ngOnInit(): void {
    this.buildForm();
    this.loadAvailableTaxis();
    this.initFleetWebSocket();
  }

  ngAfterViewInit(): void {
    this.initializeMap();
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.off();
      this.map.remove();
    }
    if (this.wsSubscription) {
      this.wsSubscription.unsubscribe();
    }
    this.wsService.disconnect();
  }

  private buildForm(): void {
    this.affectationForm = this.fb.group({
      clientPhone: ['', [Validators.required, Validators.pattern(/^[0-9]{8,15}$/)]]
    });
  }

  private initializeMap(): void {
    if (!this.mapContainer || !this.mapContainer.nativeElement) {
      return;
    }

    this.map = L.map(this.mapContainer.nativeElement, {
      center: [34.0, 9.0],
      zoom: 6,
      zoomControl: false
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    L.control.zoom({ position: 'topright' }).addTo(this.map);

    this.map.on('click', (e: L.LeafletMouseEvent) => {
      this.ngZone.run(() => this.onMapClick(e));
    });

    this.updateTaxiMarkers();
  }

  private loadAvailableTaxis(): void {
    this.fleetService.getFleetLocations().subscribe({
      next: (locations) => {
        this.taxis = locations;
        this.updateTaxiMarkers();
      },
      error: (err) => {
        console.error('Error loading taxis for affectation:', err);
      }
    });
  }

  private initFleetWebSocket(): void {
    this.wsService.connect(true);
    this.wsService.onConnected().subscribe((connected) => {
      console.log('[AffectationClient] WebSocket connection status:', connected ? 'connected' : 'disconnected');
      if (connected) {
        this.wsSubscription = this.wsService.subscribe(
          '/topic/fleet/locations',
          (message) => this.handleFleetLocationsFromSocket(message)
        );
        this.wsService.send('/app/fleet.subscribe', {});
      }
    });
  }

  private handleFleetLocationsFromSocket(message: any): void {
    this.ngZone.run(() => {
      console.log('[AffectationClient] Received fleet locations via WS:', message);

      try {
        const body = JSON.parse(message.body);

        if (!Array.isArray(body) || body.length === 0) {
          console.warn('[AffectationClient] Empty fleet array received.');
          return;
        }

        this.taxis = body.map(taxi => ({
          taxiId: taxi.taxiId,
          taxiNumber: taxi.taxiNumber,
          driverName: taxi.driverName || '',
          telephone: taxi.phone || '',
          latitude: taxi.latitude,
          longitude: taxi.longitude,
          status: ['IN_PROGRESS', 'TERMINATED'].includes(taxi.rideStatus?.toUpperCase())
            ? FleetStatus.BUSY
            : FleetStatus.ACTIVE,
          isOnline: true,
          waitingCount: taxi.waitingCount || 0,
          inProgressCount: taxi.inProgressCount || 0,
          totalTaxis: taxi.totalTaxis || 0
        }));

        this.updateTaxiMarkers();
      } catch (e) {
        console.error('[AffectationClient] Failed to parse WS fleet locations:', e);
      }
    });
  }

  private updateTaxiMarkers(): void {
    if (!this.map) {
      return;
    }

    this.taxiMarkers.forEach(m => m.remove());
    this.taxiMarkers = [];

    this.taxis.forEach(location => {
      if (location.latitude && location.longitude) {
        const icon = this.getTaxiIcon(location.status);
        const marker = L.marker([location.latitude, location.longitude], { icon }).addTo(this.map);
        marker.bindPopup(`
          <div class="info-window">
            <h6>${location.taxiNumber}</h6>
            <p><strong>Driver:</strong> ${location.driverName}</p>
            <p><strong>Phone:</strong> ${location.telephone}</p>
          </div>
        `);
        this.taxiMarkers.push(marker);
      }
    });
  }

  private getTaxiIcon(status: FleetStatus | undefined): L.Icon {
    if (status === FleetStatus.BUSY) {
      return this.busyCarIcon;
    }
    return this.activeCarIcon;
  }

  onMapClick(event: L.LeafletMouseEvent): void {
    const { latlng } = event;

    if (!this.pickupLatLng) {
      this.pickupLatLng = latlng;
      this.setPickupMarker(latlng);
      this.snackBar.open('Point de prise en charge sélectionné.', 'Fermer', { duration: 2000 });
      return;
    }

    if (!this.destinationLatLng) {
      this.destinationLatLng = latlng;
      this.setDestinationMarker(latlng);
      this.snackBar.open('Destination sélectionnée.', 'Fermer', { duration: 2000 });
      return;
    }

    // If both are set, update destination by default
    this.destinationLatLng = latlng;
    this.setDestinationMarker(latlng);
    this.snackBar.open('Destination mise à jour.', 'Fermer', { duration: 2000 });
  }

  private setPickupMarker(latlng: L.LatLng): void {
    if (this.pickupMarker) {
      this.pickupMarker.setLatLng(latlng);
    } else {
      this.pickupMarker = L.marker(latlng, { icon: this.pickupIcon }).addTo(this.map);
    }
  }

  private setDestinationMarker(latlng: L.LatLng): void {
    if (this.destinationMarker) {
      this.destinationMarker.setLatLng(latlng);
    } else {
      this.destinationMarker = L.marker(latlng, { icon: this.destinationIcon }).addTo(this.map);
    }
  }

  resetPoints(): void {
    this.pickupLatLng = null;
    this.destinationLatLng = null;

    if (this.pickupMarker) {
      this.pickupMarker.remove();
      this.pickupMarker = undefined;
    }

    if (this.destinationMarker) {
      this.destinationMarker.remove();
      this.destinationMarker = undefined;
    }
  }

  selectTariff(tariff: 'T1' | 'T2' | 'T3'): void {
    this.selectedTariff = tariff;
  }

  getTariffPrefix(): string | null {
    switch (this.selectedTariff) {
      case 'T1':
        return 'TGPS1';
      case 'T2':
        return 'TGPS2';
      case 'T3':
        return 'TGPS3';
      default:
        return null;
    }
  }

  submit(): void {
    if (this.isSubmitting) {
      return;
    }

    if (!this.pickupLatLng || !this.destinationLatLng) {
      this.snackBar.open('Veuillez sélectionner les points de départ et d’arrivée sur la carte.', 'Fermer', { duration: 3000 });
      return;
    }

    const prefix = this.getTariffPrefix();
    if (!prefix) {
      this.snackBar.open('Veuillez sélectionner un tarif (T1, T2 ou T3).', 'Fermer', { duration: 3000 });
      return;
    }

    if (this.affectationForm.invalid) {
      this.affectationForm.markAllAsTouched();
      return;
    }

    const clientPhone = this.affectationForm.value.clientPhone;

    const contenu = `${prefix} ${this.pickupLatLng.lat},${this.pickupLatLng.lng},${this.destinationLatLng.lat},${this.destinationLatLng.lng}`;

    this.isSubmitting = true;

    this.clientInjectionService.injectSms(contenu, clientPhone).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.snackBar.open('Demande injectée avec succès.', 'Fermer', { duration: 3000 });
        this.resetPoints();
        this.affectationForm.reset({ clientPhone: '' });
        this.selectedTariff = null;
      },
      error: (err) => {
        console.error('Erreur lors de l\'injection SMS:', err);
        this.isSubmitting = false;
        this.snackBar.open('Échec de l\'injection de la demande.', 'Fermer', { duration: 4000 });
      }
    });
  }
}





