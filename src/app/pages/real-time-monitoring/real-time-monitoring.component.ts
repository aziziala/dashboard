import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FleetService } from '../../services/fleet.service';
import { TaxiService } from '../../services/taxi.service';
import { RideService } from '../../services/ride.service';
import { FleetLocation, FleetStatus } from '../../models/fleet-location.model';
import { Taxi } from '../../models/taxi.model';
import { RideRequest, RideOffer } from '../../models/ride.model';
import { firstValueFrom } from 'rxjs';
import * as L from 'leaflet';

@Component({
  selector: 'app-real-time-monitoring',
  templateUrl: './real-time-monitoring.component.html',
  styleUrls: ['./real-time-monitoring.component.scss']
})
export class RealTimeMonitoringComponent implements OnInit, OnDestroy, AfterViewInit {
  // Map properties
  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef;
  private map!: L.Map;
  private markers: L.Marker[] = [];
  private heatmapLayer: any;
  
  // Data arrays
  fleetLocations: FleetLocation[] = [];
  activeTaxis: Taxi[] = [];
  activeRides: (RideRequest | RideOffer)[] = [];
  nearbyTaxis: any[] = [];
  
  // Filtering and search
  searchTerm = '';
  statusFilter = '';
  taxiTypeFilter = '';
  locationFilter = '';
  
  // Real-time updates
  private locationUpdateInterval: any;
  private statusUpdateInterval: any;
  private rideUpdateInterval: any;
  
  // Statistics
  realTimeStats = {
    totalTaxis: 0,
    activeTaxis: 0,
    busyTaxis: 0,
    availableTaxis: 0,
    offlineTaxis: 0,
    activeRides: 0,
    pendingRequests: 0,
    averageResponseTime: 0,
    coverageArea: 0
  };

  // Map settings
  mapCenter = { lat: 33.9716, lng: -6.8498 }; // Default to Rabat, Morocco
  mapZoom = 12;
  showHeatmap = false;
  showTraffic = false;
  
  // Selected items
  selectedTaxi: Taxi | null = null;
  selectedLocation: FleetLocation | null = null;
  selectedRide: RideRequest | RideOffer | null = null;

  // Loading states
  isLoading = false;
  isUpdating = false;

  constructor(
    private modalService: NgbModal,
    private fleetService: FleetService,
    private taxiService: TaxiService,
    private rideService: RideService
  ) { }

  ngOnInit(): void {
    this.loadRealTimeData();
    this.startRealTimeUpdates();
  }

  ngAfterViewInit(): void {
    this.initializeMap();
  }

  ngOnDestroy(): void {
    this.stopRealTimeUpdates();
  }

  loadRealTimeData(): void {
    this.isLoading = true;
    
    Promise.all([
      this.loadFleetLocations(),
      this.loadActiveTaxis(),
      this.loadActiveRides(),
    
    ]).finally(() => {
      this.isLoading = false;
    });
  }

  loadFleetLocations(): Promise<void> {
    return new Promise((resolve) => {
      this.fleetService.getFleetLocations().subscribe({
        next: (locations) => {
          this.fleetLocations = locations;
          this.updateMapMarkers();
          resolve();
        },
        error: (error) => {
          console.error('Error loading fleet locations:', error);
          resolve();
        }
      });
    });
  }

  loadActiveTaxis(): Promise<void> {
    return new Promise((resolve) => {
      this.taxiService.getActiveTaxis().subscribe({
        next: (taxis) => {
          this.activeTaxis = taxis;
          resolve();
        },
        error: (error) => {
          console.error('Error loading active taxis:', error);
          resolve();
        }
      });
    });
  }

  async loadActiveRides(): Promise<void> {
    try {
      const [requests, offers] = await Promise.all([
        firstValueFrom(this.rideService.getRideRequests()),
        firstValueFrom(this.rideService.getActiveRides())
      ]);
      this.activeRides = [...requests, ...offers];
    } catch (error) {
      console.error('Error loading active rides:', error);
    }
  }


  startRealTimeUpdates(): void {
    // Update fleet locations every 10 seconds
    this.locationUpdateInterval = setInterval(() => {
      this.loadFleetLocations();
    }, 10000);

    // Update taxi status every 30 seconds
    this.statusUpdateInterval = setInterval(() => {
      this.loadActiveTaxis();
    }, 30000);

    // Update ride status every 60 seconds
    this.rideUpdateInterval = setInterval(() => {
      this.loadActiveRides();
    }, 60000);
  }

  stopRealTimeUpdates(): void {
    if (this.locationUpdateInterval) {
      clearInterval(this.locationUpdateInterval);
    }
    if (this.statusUpdateInterval) {
      clearInterval(this.statusUpdateInterval);
    }
    if (this.rideUpdateInterval) {
      clearInterval(this.rideUpdateInterval);
    }
  }

  initializeMap(): void {
    if (!this.mapContainer) return;

    // Initialize Leaflet map
    this.map = L.map(this.mapContainer.nativeElement).setView([this.mapCenter.lat, this.mapCenter.lng], this.mapZoom);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    // Add custom map controls
    this.addMapControls();
    
    // Initialize markers
    this.updateMapMarkers();
  }

  addMapControls(): void {
    // Add custom control for heatmap toggle
    const heatmapControl = L.Control.extend({
      options: { position: 'topright' },
      onAdd: () => {
        const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
        container.innerHTML = `
          <button class="btn btn-sm btn-outline-secondary" id="heatmapToggle" title="Toggle Heatmap">
            <i class="fas fa-fire"></i>
          </button>
        `;
        
        L.DomEvent.on(container, 'click', () => {
          this.toggleHeatmap();
        });
        
        return container;
      }
    });

    // Add custom control for traffic toggle
    const trafficControl = L.Control.extend({
      options: { position: 'topright' },
      onAdd: () => {
        const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
        container.innerHTML = `
          <button class="btn btn-sm btn-outline-secondary" id="trafficToggle" title="Toggle Traffic">
            <i class="fas fa-car"></i>
          </button>
        `;
        
        L.DomEvent.on(container, 'click', () => {
          this.toggleTraffic();
        });
        
        return container;
      }
    });

    this.map.addControl(new heatmapControl());
    this.map.addControl(new trafficControl());
  }

  updateMapMarkers(): void {
    // Clear existing markers
    this.markers.forEach(marker => marker.remove());
    this.markers = [];

    // Add markers for each fleet location
    this.fleetLocations.forEach(location => {
      const marker = this.createTaxiMarker(location);
      this.markers.push(marker);
      marker.addTo(this.map);
    });

    // Update heatmap if enabled
    if (this.showHeatmap) {
      this.updateHeatmap();
    }
  }

  createTaxiMarker(location: FleetLocation): L.Marker {
    const icon = this.createCustomIcon(location.status);
    const marker = L.marker([location.latitude, location.longitude], { icon });
    
    // Add popup with taxi information
    const popupContent = this.createTaxiPopup(location);
    marker.bindPopup(popupContent);
    
    // Add click event
    marker.on('click', () => {
      this.onTaxiMarkerClick(location);
    });
    
    return marker;
  }

  createCustomIcon(status: FleetStatus): L.DivIcon {
    const color = this.getMarkerColor(status);
    const iconHtml = `
      <div class="custom-marker" style="
        background-color: ${color};
        width: 20px;
        height: 20px;
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 10px;
        font-weight: bold;
      ">
        <i class="fas fa-taxi"></i>
      </div>
    `;
    
    return L.divIcon({
      html: iconHtml,
      className: 'custom-marker-container',
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });
  }

  getMarkerColor(status: FleetStatus): string {
    switch (status) {
      case FleetStatus.ACTIVE:
        return '#28a745'; // Green
      case FleetStatus.BUSY:
        return '#ffc107'; // Yellow
      case FleetStatus.OFFLINE:
        return '#6c757d'; // Gray
      case FleetStatus.MAINTENANCE:
        return '#dc3545'; // Red
      default:
        return '#007bff'; // Blue
    }
  }

  createTaxiPopup(location: FleetLocation): string {
    return `
      <div class="taxi-popup">
        <h6><strong>Taxi #${location.taxiNumber}</strong></h6>
        <p><strong>Status:</strong> ${location.status}</p>
        <p><strong>Driver:</strong> ${location.driverName || 'N/A'}</p>
        <p><strong>Phone:</strong> ${location.telephone || 'N/A'}</p>
        <p><strong>Last Update:</strong> ${new Date(location.lastUpdate).toLocaleTimeString()}</p>
        <button class="btn btn-sm btn-primary" onclick="window.openTaxiDetails(${location.taxiId})">
          View Details
        </button>
      </div>
    `;
  }

  onTaxiMarkerClick(location: FleetLocation): void {
    this.selectedLocation = location;
    // You can open a modal or update a sidebar here
  }

  toggleHeatmap(): void {
    this.showHeatmap = !this.showHeatmap;
    if (this.showHeatmap) {
      this.updateHeatmap();
    } else {
      this.removeHeatmap();
    }
  }

  updateHeatmap(): void {
    if (this.heatmapLayer) {
      this.map.removeLayer(this.heatmapLayer);
    }

    const heatmapData = this.fleetLocations.map(location => ({
      lat: location.latitude,
      lng: location.longitude,
      value: location.status === FleetStatus.ACTIVE ? 1 : 0.5
    }));

    // Create a simple heatmap using circle markers
    this.heatmapLayer = L.layerGroup();
    heatmapData.forEach(point => {
      const circle = L.circle([point.lat, point.lng], {
        radius: 100,
        color: point.value === 1 ? 'red' : 'orange',
        fillColor: point.value === 1 ? '#ff4444' : '#ff8800',
        fillOpacity: 0.3
      });
      this.heatmapLayer.addLayer(circle);
    });

    this.heatmapLayer.addTo(this.map);
  }

  removeHeatmap(): void {
    if (this.heatmapLayer) {
      this.map.removeLayer(this.heatmapLayer);
      this.heatmapLayer = null;
    }
  }

  toggleTraffic(): void {
    this.showTraffic = !this.showTraffic;
    // Implement traffic layer toggle
  }

  // Filtering methods
  filterTaxis(): void {
    // Implement filtering logic
  }

  onSearch(): void {
    this.filterTaxis();
  }

  onStatusFilterChange(): void {
    this.filterTaxis();
  }

  onTaxiTypeFilterChange(): void {
    this.filterTaxis();
  }

  onLocationFilterChange(): void {
    this.filterTaxis();
  }

  // Modal operations
  openTaxiDetailsModal(content: any, taxi: Taxi): void {
    this.selectedTaxi = taxi;
    this.modalService.open(content, { size: 'lg' });
  }

  openLocationDetailsModal(content: any, location: FleetLocation): void {
    this.selectedLocation = location;
    this.modalService.open(content, { size: 'lg' });
  }

  openRideDetailsModal(content: any, ride: RideRequest | RideOffer): void {
    this.selectedRide = ride;
    this.modalService.open(content, { size: 'lg' });
  }

  // Utility methods
  isRideRequest(ride: RideRequest | RideOffer): boolean {
    return 'clientPhone' in ride;
  }

  getRidePhone(ride: RideRequest | RideOffer): string {
    return this.isRideRequest(ride) ? (ride as RideRequest).clientPhone : (ride as RideOffer).taxiPhone;
  }

  getRideNotes(ride: RideRequest | RideOffer): string {
    return this.isRideRequest(ride) ? ((ride as RideRequest).notes || 'No notes') : 'N/A';
  }

  getRidePrice(ride: RideRequest | RideOffer): number | null {
    return this.isRideRequest(ride) ? null : Number((ride as RideOffer).totalPrice || 0);
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'AVAILABLE': return 'bg-success';
      case 'BUSY': return 'bg-warning';
      case 'OFFLINE': return 'bg-secondary';
      case 'MAINTENANCE': return 'bg-danger';
      default: return 'bg-info';
    }
  }

  getStatusText(status: string): string {
    return status.replace('_', ' ').toLowerCase();
  }

  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return Math.round(distance * 100) / 100;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }

  // Manual refresh
  refreshData(): void {
    this.isUpdating = true;
    this.loadRealTimeData();
    setTimeout(() => {
      this.isUpdating = false;
    }, 2000);
  }
}
