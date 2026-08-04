import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  AfterViewInit,
  NgZone
} from '@angular/core';

import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FleetService } from '../../services/fleet.service';
import { TaxiService } from '../../services/taxi.service';

import {
  FleetLocation,
  FleetStatus,
  FleetStatistics,
  NearbyTaxiResponse
} from '../../models/fleet-location.model';

import {
  FleetV2Statistics,
  FLEET_LOCATIONS_V2_TOPIC,
  FLEET_SUBSCRIBE_APP_DESTINATION
} from '../../models/fleet-locations-v2.model';

import {
  isFleetLocationsV2Payload,
  isRideActiveForAssignment,
  mapFleetLocationsV2Payload,
  mergeV2StatisticsIntoFleetStats
} from '../../utils/fleet-locations-v2.mapper';

import {
  buildTariffTaxiMarkerHtml,
  feesOptionToTariffPinClass
} from '../../utils/taxi-tariff-marker.util';

import {
  ChartType,
  revenueChartOptions,
  taxiActivityChartOptions
} from '../../models/chart.model';

import { WebsocketService } from '../../services/websocket.service';

type FleetStatView = 'all' | 'withSim' | 'withoutSim' | 'approved' | 'pending';

import * as L from 'leaflet';

delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'assets/marker-icon-2x.png',
  iconUrl: 'assets/marker-icon.png',
  shadowUrl: 'assets/marker-shadow.png',
});

@Component({
  selector: 'app-fleet-management',
  templateUrl: './fleet-management.component.html',
  styleUrls: ['./fleet-management.component.scss']
})
export class FleetManagementComponent
  implements OnInit, OnDestroy, AfterViewInit {

  fleetLocations: FleetLocation[] = [];
  nearbyTaxis: NearbyTaxiResponse[] = [];
  selectedLocation: FleetLocation | null = null;

  isLoading = false;

  searchTerm = '';
  statusFilter = '';

  currentView: FleetStatView = 'all';

  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;

  Math = Math;
  FleetStatus = FleetStatus;

  @ViewChild('mapContainer', { static: false })
  mapContainer!: ElementRef;

  private map!: L.Map;

  /**
   * ✅ IMPORTANT
   * Store markers by taxiId
   * instead of recreating all markers every update
   */
  private markers: Map<number, L.Marker> = new Map();

  private wsSubscription: any;
  private locationUpdateInterval: any;

  /**
   * ✅ Prevent map auto recenter every websocket update
   */
  private isFirstMapLoad = true;

  mapCenter = {
    lat: 34.0,
    lng: 9.0
  };

  mapZoom = 6;

  showMap = true;

  fleetV2Stats: FleetV2Statistics | null = null;

  fleetStats: FleetStatistics = {
    totalTaxis: 0,
    activeTaxis: 0,
    busyTaxis: 0,
    enrouteTaxis: 0,
    offlineTaxis: 0,
    totalRevenue: 0,
    averageRating: 0,
    totalRides: 0,
    averageResponseTime: 0,
    coverageArea: 0,
    averageEarnings: 0,

    topPerformers: [],
    statusDistribution: [],
    revenueTrend: [],

    performanceMetrics: {
      averageResponseTime: 0,
      averageCompletionTime: 0,
      customerSatisfaction: 0,
      fleetUtilization: 0,
      fuelEfficiency: 0,
      maintenanceCosts: 0
    }
  };

  fleetChartOptions: ChartType = taxiActivityChartOptions;
  revenueChartOptions: ChartType = revenueChartOptions;

  constructor(
    private modalService: NgbModal,
    private fleetService: FleetService,
    private taxiService: TaxiService,
    private ngZone: NgZone,
    private wsService: WebsocketService
  ) {}

  ngOnInit(): void {
    this.initializeCharts();
    this.initFleetWebSocket();
  }

  ngAfterViewInit(): void {
    this.initializeMap();

    setTimeout(() => {
      if (this.map) {
        this.map.invalidateSize();
      }
    }, 200);
  }

  ngOnDestroy(): void {

    if (this.locationUpdateInterval) {
      clearInterval(this.locationUpdateInterval);
    }

    if (this.wsSubscription) {
      this.wsSubscription.unsubscribe();
    }

    if (this.map) {
      this.map.remove();
    }

    this.wsService.disconnect();
  }

  // ======================================================
  // MAP
  // ======================================================

  initializeMap(): void {

    if (!this.mapContainer?.nativeElement) {
      return;
    }

    this.map = L.map(this.mapContainer.nativeElement, {
      center: [34.0, 9.0],
      zoom: 6,
      zoomControl: false
    });

    L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        attribution: '© OpenStreetMap contributors'
      }
    ).addTo(this.map);

    L.control.zoom({
      position: 'topright'
    }).addTo(this.map);

    this.map.on(
      'click',
      (e: L.LeafletMouseEvent) => this.onMapClick(e)
    );
  }

  // ======================================================
  // WEBSOCKET
  // ======================================================

  private initFleetWebSocket(): void {

    this.wsService.connect(true);

    this.wsService.onConnected().subscribe((connected) => {

      if (connected) {

        this.wsSubscription = this.wsService.subscribe(
          FLEET_LOCATIONS_V2_TOPIC,
          (message) => this.handleFleetLocationsFromSocket(message)
        );

        this.wsService.send(
          FLEET_SUBSCRIBE_APP_DESTINATION,
          {}
        );
      }
    });
  }

  private handleFleetLocationsFromSocket(message: any): void {

    this.ngZone.run(() => {

      try {

        const body = JSON.parse(message.body);

        if (!isFleetLocationsV2Payload(body)) {
          return;
        }

        const { locations, statistics } =
          mapFleetLocationsV2Payload(body);

        this.fleetLocations = locations;

        this.totalItems = locations.length;

        this.fleetV2Stats = statistics;

        this.fleetStats =
          mergeV2StatisticsIntoFleetStats(
            this.fleetStats,
            statistics
          );

        /**
         * ✅ Center map ONLY first time
         */
        if (this.isFirstMapLoad) {
          this.updateMapCenter();
          this.isFirstMapLoad = false;
        }

        /**
         * ✅ Smooth marker update
         */
        this.updateMapMarkers();

        this.updateCharts();

      } catch (e) {

        console.error(
          '[FleetManagement] Parse error:',
          e
        );
      }
    });
  }

  // ======================================================
  // MAP CENTER
  // ======================================================

  updateMapCenter(): void {

    if (!this.map || this.fleetLocations.length === 0) {
      return;
    }

    const avgLat =
      this.fleetLocations.reduce(
        (sum, loc) => sum + (loc.latitude || 0),
        0
      ) / this.fleetLocations.length;

    const avgLng =
      this.fleetLocations.reduce(
        (sum, loc) => sum + (loc.longitude || 0),
        0
      ) / this.fleetLocations.length;

    this.mapCenter = {
      lat: avgLat,
      lng: avgLng
    };

    this.map.setView([avgLat, avgLng], 8);
  }

  // ======================================================
  // MARKERS
  // ======================================================

updateMapMarkers(): void {

  if (!this.map) {
    return;
  }

  const activeTaxiIds = new Set<number>();

  this.fleetLocations

    // ✅ Hide expired taxis from map
    .filter(location => location.rideStatus !== 'EXPIRED')

    .forEach((location) => {

      if (!location.latitude || !location.longitude) {
        return;
      }

      activeTaxiIds.add(location.taxiId);

      const existingMarker =
        this.markers.get(location.taxiId);

      if (existingMarker) {

        existingMarker.setLatLng([
          location.latitude,
          location.longitude
        ]);

        const icon =
          this.createTariffMarkerIcon(location);

        existingMarker.setIcon(icon);

      } else {

        const icon =
          this.createTariffMarkerIcon(location);

        const marker = L.marker(
          [location.latitude, location.longitude],
          { icon }
        ).addTo(this.map);

        marker.bindPopup(`
          <div class="info-window">
            <h6>${location.taxiNumber}</h6>

            <p>
              <strong>Conducteur:</strong>
              ${location.driverName}
            </p>

            <p>
              <strong>Course:</strong>
              ${this.getRideStatusLabel(location)}
            </p>
          </div>
        `);

        this.markers.set(location.taxiId, marker);
      }
    });

  this.markers.forEach((marker, taxiId) => {

    if (!activeTaxiIds.has(taxiId)) {

      this.map.removeLayer(marker);

      this.markers.delete(taxiId);
    }
  });
}
  // ======================================================
  // MARKER ICON
  // ======================================================

  private createTariffMarkerIcon(
    location: FleetLocation
  ): L.DivIcon {

    const tariffClass =
      feesOptionToTariffPinClass(
        location.feesOption
      );

    const inProgress =
      isRideActiveForAssignment(
        location.rideStatus
      );

    return L.divIcon({
      className: 'leaflet-taxi-tariff-marker',

      html: buildTariffTaxiMarkerHtml(
        tariffClass,
        { inProgress }
      ),

      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });
  }

  // ======================================================
  // FILTERING
  // ======================================================

  get filteredFleetLocations(): FleetLocation[] {

    let result = this.fleetLocations;

    if (this.searchTerm) {

      const term = this.searchTerm.toLowerCase();

      result = result.filter(loc =>
        loc.taxiNumber?.toLowerCase().includes(term) ||
        loc.driverName?.toLowerCase().includes(term) ||
        loc.telephone?.toLowerCase().includes(term)
      );
    }

    if (this.statusFilter) {

      result = result.filter(
        loc => loc.status === this.statusFilter
      );
    }

    if (this.currentView !== 'all') {

      result = result.filter((loc) => {

        switch (this.currentView) {

          case 'withSim':
            return isRideActiveForAssignment(loc.rideStatus);

          case 'withoutSim':
            return (loc.rideStatus || '').toUpperCase() === 'EXPIRED';

          case 'approved':
            return (loc.rideStatus || '').toUpperCase() === 'TERMINATED';

          case 'pending':
            return (loc.rideStatus || '').toUpperCase() === 'WAITING';

          default:
            return true;
        }
      });
    }

    return result;
  }

  get paginatedFleet(): FleetLocation[] {

    const data = this.filteredFleetLocations;

    this.totalItems = data.length;

    const startIndex =
      (this.currentPage - 1) * this.itemsPerPage;

    return data.slice(
      startIndex,
      startIndex + this.itemsPerPage
    );
  }

  filterFleet(): void {
    this.currentPage = 1;
  }

  changeView(view: FleetStatView): void {
    this.currentView = view;
    this.currentPage = 1;
  }

  // ======================================================
  // ACTIONS
  // ======================================================

  refreshFleetData(): void {

    this.wsService.send(
      FLEET_SUBSCRIBE_APP_DESTINATION,
      {}
    );
  }

  onMarkerClick(location: FleetLocation): void {

    this.selectedLocation = location;

    if (
      this.map &&
      location.latitude &&
      location.longitude
    ) {

      this.map.setView(
        [location.latitude, location.longitude],
        15,
        { animate: true }
      );
    }
  }

  onPageChange(page: number): void {
    this.currentPage = page;
  }

  openLocationModal(
    modal: any,
    location: FleetLocation
  ): void {

    this.selectedLocation = location;

    this.modalService.open(modal, {
      size: 'lg'
    });
  }

  updateTaxiStatus(
    taxiId: number,
    newStatus: FleetStatus
  ): void {

    this.fleetService
      .updateFleetStatus(taxiId, newStatus)
      .subscribe({
        next: () => this.refreshFleetData(),

        error: (err) =>
          console.error(
            'Error updating taxi status:',
            err
          )
      });
  }

  toggleMapView(): void {

    this.showMap = !this.showMap;

    if (this.showMap) {

      setTimeout(() => {

        if (this.map) {
          this.map.invalidateSize();
        }

      }, 100);
    }
  }

  onMapClick(event: L.LeafletMouseEvent): void {
    console.log('Map clicked at:', event.latlng);
  }

  // ======================================================
  // STATUS
  // ======================================================

  getLocationBadgeClass(
    location: FleetLocation
  ): string {

    const rs =
      (location.rideStatus || '').toUpperCase();

    if (rs === 'IN_PROGRESS') {
      return 'bg-success';
    }

    if (
      rs === 'STARTED' ||
      rs === 'EN_ROUTE'
    ) {
      return 'bg-warning';
    }

    if (
      rs === 'WAITING' ||
      rs === 'EXPIRED' ||
      !rs
    ) {
      return 'bg-danger';
    }

    if (
      rs === 'TERMINATED' ||
      rs.includes('CANCEL')
    ) {
      return 'bg-secondary';
    }

    return this.getStatusBadgeClass(location.status);
  }

  getRideStatusLabel(
    location: FleetLocation
  ): string {

    const raw =
      (location.rideStatus || '').toUpperCase();

    const labels: Record<string, string> = {

      WAITING: 'En attente',
      EXPIRED: 'Expirée',
      IN_PROGRESS: 'En course',
      STARTED: 'Démarrée',
      EN_ROUTE: 'En approche',
      TERMINATED: 'Terminée',
      CANCELLED: 'Annulée',
      CANCELLED_BY_CLIENT: 'Annulée (client)',
      CANCELLED_BY_TAXI: 'Annulée (taxi)'
    };

    return labels[raw]
      || location.rideStatus
      || location.status;
  }

  getStatusBadgeClass(
    status: FleetStatus
  ): string {

    switch (status) {

      case FleetStatus.ACTIVE:
        return 'bg-danger';

      case FleetStatus.BUSY:
        return 'bg-success';

      case FleetStatus.EN_ROUTE:
        return 'bg-warning';

      default:
        return 'bg-secondary';
    }
  }

  getStatusIcon(
    status: FleetStatus
  ): string {

    switch (status) {

      case FleetStatus.ACTIVE:
        return 'fas fa-times me-1';

      case FleetStatus.BUSY:
        return 'fas fa-check me-1';

      case FleetStatus.EN_ROUTE:
        return 'fas fa-spinner me-1';

      default:
        return 'fas fa-circle me-1';
    }
  }

  // ======================================================
  // CHARTS
  // ======================================================

  initializeCharts(): void {}

  updateCharts(): void {

    this.fleetChartOptions.series = [
      this.fleetStats.activeTaxis,
      this.fleetStats.busyTaxis,
      this.fleetStats.enrouteTaxis
    ];
  }
}