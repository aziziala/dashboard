import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit, NgZone } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FleetService } from '../../services/fleet.service';
import { TaxiService } from '../../services/taxi.service';
import { FleetLocation, FleetStatus, FleetStatistics, NearbyTaxiResponse } from '../../models/fleet-location.model';
import { Taxi } from '../../models/taxi.model';
import { ChartType, revenueChartOptions, smsChartOptions, taxiActivityChartOptions, monthlyEarningChartOptions } from '../../models/chart.model';
import { WebsocketService } from '../../services/websocket.service';
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
export class FleetManagementComponent implements OnInit, OnDestroy, AfterViewInit {
  fleetLocations: FleetLocation[] = [];
  nearbyTaxis: NearbyTaxiResponse[] = [];
  selectedLocation: FleetLocation | null = null;
  isLoading = false;
  searchTerm = '';
  statusFilter = '';
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;

  Math = Math;
  FleetStatus = FleetStatus;

  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef;
  private map!: L.Map;
  private markers: L.Marker[] = [];
  private wsSubscription: any;
  private locationUpdateInterval: any;

  mapCenter = { lat: 34.0, lng: 9.0 };
  mapZoom = 6;
  showMap = true;

  fleetStats: FleetStatistics = {
    totalTaxis: 0, activeTaxis: 0, busyTaxis: 0, enrouteTaxis: 0,
    offlineTaxis: 0, totalRevenue: 0, averageRating: 0, totalRides: 0,
    averageResponseTime: 0, coverageArea: 0, averageEarnings: 0,
    topPerformers: [], statusDistribution: [], revenueTrend: [],
    performanceMetrics: {
      averageResponseTime: 0, averageCompletionTime: 0,
      customerSatisfaction: 0, fleetUtilization: 0,
      fuelEfficiency: 0, maintenanceCosts: 0
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
  // ✅ Force map to recalculate size after DOM settles
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
    this.wsSubscription.unsubscribe(); // ✅ Unsubscribe STOMP topic
  }
  if (this.map) {
    this.map.remove(); // ✅ Destroy Leaflet map to prevent DOM leaks
    this.map = null as any;
  }
  this.wsService.disconnect();
}

  initializeMap(): void {
    if (!this.mapContainer?.nativeElement) return;

    this.map = L.map(this.mapContainer.nativeElement, {
      center: [34.0, 9.0],
      zoom: 6,
      zoomControl: false
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    L.control.zoom({ position: 'topright' }).addTo(this.map);

    this.map.on('click', (e: L.LeafletMouseEvent) => this.onMapClick(e));
  }

  // ─── WebSocket ──────────────────────────────────────────
  private initFleetWebSocket(): void {
    this.wsService.connect(true);
    this.wsService.onConnected().subscribe((connected) => {
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
      try {
        const body = JSON.parse(message.body);
        if (!Array.isArray(body) || body.length === 0) return;

        this.fleetLocations = body.map(taxi => {
          const rideStatus = taxi.rideStatus?.toUpperCase();
          return {
            taxiId: taxi.taxiId,
            taxiNumber: taxi.taxiNumber,
            driverName: taxi.driverName || '',
            telephone: taxi.phone || '',
            latitude: taxi.latitude,
            longitude: taxi.longitude,
            totalTaxis: taxi.totalTaxis,
            inProgressCount: taxi.inProgressCount,
            startedRide: taxi.startedRide,
            waitingCount: taxi.waitingCount,
            status:
              rideStatus === 'IN_PROGRESS' ? FleetStatus.BUSY
              : rideStatus === 'EN_ROUTE' ? FleetStatus.EN_ROUTE
              : FleetStatus.ACTIVE,
            isOnline: true
          };
        });

        this.totalItems = this.fleetLocations.length;

        this.fleetStats = {
          ...this.fleetStats,
          totalTaxis: body.length,
          activeTaxis: body.filter(t => !t.rideStatus || t.rideStatus?.toUpperCase() === 'WAITING').length,
          busyTaxis: body.filter(t => t.rideStatus?.toUpperCase() === 'IN_PROGRESS').length,
          enrouteTaxis: body.filter(t => t.rideStatus?.toUpperCase() === 'EN_ROUTE').length
        };

        this.updateMapCenter();
        this.updateMapMarkers();
        this.updateCharts();

      } catch (e) {
        console.error('[FleetManagement] Parse error:', e);
      }
    });
  }

  // ─── Map Helpers ────────────────────────────────────────
updateMapCenter(): void {
  if (!this.map || this.fleetLocations.length === 0) return;

  const avgLat = this.fleetLocations.reduce((sum, loc) => sum + (loc.latitude || 0), 0) / this.fleetLocations.length;
  const avgLng = this.fleetLocations.reduce((sum, loc) => sum + (loc.longitude || 0), 0) / this.fleetLocations.length;
  this.mapCenter = { lat: avgLat, lng: avgLng };
  this.map.setView([avgLat, avgLng], 8);
}

 updateMapMarkers(): void {
  if (!this.map) {
    console.warn('[FleetManagement] Map not initialized yet, skipping marker update.');
    return;
  }

  this.map.eachLayer((layer: any) => {
    if (layer instanceof L.Marker) {
      this.map.removeLayer(layer);
    }
  });

  this.markers = [];

  this.fleetLocations.forEach(location => {
    if (location.latitude && location.longitude) {
      const icon = this.getMarkerIcon(location.status);
      const marker = L.marker([location.latitude, location.longitude], { icon }).addTo(this.map);

      marker.bindPopup(`
        <div class="info-window">
          <h6>${location.taxiNumber}</h6>
          <p><strong>Driver:</strong> ${location.driverName}</p>
          <p><strong>Status:</strong> ${location.status}</p>
          <p><strong>Phone:</strong> ${location.telephone}</p>
        </div>
      `);

      this.markers.push(marker);
    }
  });
}

  private getMarkerIcon(status: FleetStatus): L.DivIcon {
    switch (status) {
      case FleetStatus.BUSY:     return this.createModernIcon('green');
      case FleetStatus.EN_ROUTE: return this.createModernIcon('yellow');
      case FleetStatus.ACTIVE:
      default:                   return this.createModernIcon('red');
    }
  }

  private createModernIcon(color: 'green' | 'red' | 'yellow'): L.DivIcon {
    return L.divIcon({
      className: 'modern-marker',
      html: `<div class="marker ${color}"><span class="pulse"></span><i class="fas fa-car"></i></div>`,
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });
  }

  // ─── Filtering ──────────────────────────────────────────
  get filteredFleetLocations(): FleetLocation[] {
  let result = this.fleetLocations;

  // Search filter
  if (this.searchTerm) {
    const term = this.searchTerm.toLowerCase();
    result = result.filter(loc =>
      loc.taxiNumber?.toLowerCase().includes(term) ||
      loc.driverName?.toLowerCase().includes(term) ||
      loc.telephone?.toLowerCase().includes(term)
    );
  }

  // Status filter
  if (this.statusFilter) {
    result = result.filter(loc => loc.status === this.statusFilter);
  }

  return result;
}

get paginatedFleet(): FleetLocation[] {
  const data = this.filteredFleetLocations;
  this.totalItems = data.length; // ✅ Update total for pagination
  const startIndex = (this.currentPage - 1) * this.itemsPerPage;
  return data.slice(startIndex, startIndex + this.itemsPerPage);
}

filterFleet(): void {
  this.currentPage = 1; // Reset to first page on filter change
}
  // ─── Actions ────────────────────────────────────────────
refreshFleetData(): void {
    this.wsService.send('/app/fleet.subscribe', {});
}
onMarkerClick(location: FleetLocation): void {
  this.selectedLocation = location;
  if (this.map && location.latitude && location.longitude) {
    this.map.setView([location.latitude, location.longitude], 15, { animate: true });
  }
}

  onPageChange(page: number): void {
    this.currentPage = page;
  }

  openLocationModal(modal: any, location: FleetLocation): void {
    this.selectedLocation = location;
    this.modalService.open(modal, { size: 'lg' });
  }

  updateTaxiStatus(taxiId: number, newStatus: FleetStatus): void {
    this.fleetService.updateFleetStatus(taxiId, newStatus).subscribe({
      next: () => this.refreshFleetData(),
      error: (err) => console.error('Error updating taxi status:', err)
    });
  }

  toggleMapView(): void {
    this.showMap = !this.showMap;
    if (this.showMap) {
      setTimeout(() => { if (this.map) this.map.invalidateSize(); }, 100);
    }
  }

  onMapClick(event: L.LeafletMouseEvent): void {
    console.log('Map clicked at:', event.latlng);
  }

getStatusBadgeClass(status: FleetStatus): string {
  switch (status) {
    case FleetStatus.ACTIVE:    // Libre (free)
      return 'bg-danger';       // Red — matches map
    case FleetStatus.BUSY:      // Occupé (busy)
      return 'bg-success';      // Green — matches map
    case FleetStatus.EN_ROUTE:  // En approche
      return 'bg-warning';      // Yellow — matches map
    default:
      return 'bg-secondary';
  }
}

getStatusIcon(status: FleetStatus): string {
  switch (status) {
    case FleetStatus.ACTIVE:
      return 'fas fa-times me-1';           // ❌ Free
    case FleetStatus.BUSY:
      return 'fas fa-check me-1';           // ✅ Busy
    case FleetStatus.EN_ROUTE:
      return 'fas fa-spinner me-1';         // ⏳ En route
    default:
      return 'fas fa-circle me-1';
  }
}

  // ─── Charts ─────────────────────────────────────────────
  initializeCharts(): void { /* keep existing */ }
  updateCharts(): void {
    this.fleetChartOptions.series = [
      this.fleetStats.activeTaxis,
      this.fleetStats.busyTaxis,
      this.fleetStats.enrouteTaxis
    ];
  }
  
}
