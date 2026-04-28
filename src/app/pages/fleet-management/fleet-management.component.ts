import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit, NgZone } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FleetService } from '../../services/fleet.service';
import { TaxiService } from '../../services/taxi.service';
import { FleetLocation, FleetStatus, FleetStatistics, NearbyTaxiResponse } from '../../models/fleet-location.model';
import { Taxi } from '../../models/taxi.model';
import { ChartType, revenueChartOptions, smsChartOptions, taxiActivityChartOptions, monthlyEarningChartOptions } from '../../models/chart.model';
import { WebsocketService } from '../../services/websocket.service';
import * as L from 'leaflet';

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
  
  // Make Math and FleetStatus available in template
  Math = Math;
  FleetStatus = FleetStatus;
  
  // Map properties
  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef;
  private map!: L.Map;
  private markers: L.Marker[] = [];
  private wsSubscription: any;
  
  // Map properties - Initialize to Tunisia
  mapCenter = { lat: 34.0, lng: 9.0 }; // Tunisia center
  mapZoom = 6;
  showMap = true;

  // Car icons from assets
private createModernIcon(color: 'green' | 'red' | 'yellow'): L.DivIcon {
  return L.divIcon({
    className: 'modern-marker',
    html: `
  <div class="marker ${color}">
    <span class="pulse"></span>
    <i class="fas fa-car"></i>
  </div>
`,
    iconSize: [40, 40],
    iconAnchor: [20, 20]
  });
}
  // Map styles for a modern look
  mapStyles = [
    {
      featureType: 'all',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#7c93a3' }, { lightness: -10 }]
    },
    {
      featureType: 'all',
      elementType: 'labels.text.stroke',
      stylers: [{ color: '#ffffff' }, { lightness: 16 }]
    },
    {
      featureType: 'all',
      elementType: 'labels.icon',
      stylers: [{ visibility: 'off' }]
    },
    {
      featureType: 'administrative',
      elementType: 'geometry.fill',
      stylers: [{ color: '#fefefe' }]
    },
    {
      featureType: 'administrative',
      elementType: 'geometry.stroke',
      stylers: [{ color: '#c9c9c9' }]
    },
    {
      featureType: 'landscape',
      elementType: 'geometry',
      stylers: [{ color: '#f5f5f5' }]
    },
    {
      featureType: 'landscape.man_made',
      elementType: 'geometry.stroke',
      stylers: [{ color: '#e4e4e4' }]
    },
    {
      featureType: 'poi',
      elementType: 'geometry',
      stylers: [{ color: '#e5e5e5' }]
    },
    {
      featureType: 'poi.park',
      elementType: 'geometry',
      stylers: [{ color: '#c8e6c9' }]
    },
    {
      featureType: 'road',
      elementType: 'geometry',
      stylers: [{ color: '#ffffff' }]
    },
    {
      featureType: 'road.highway',
      elementType: 'geometry.stroke',
      stylers: [{ color: '#dadada' }]
    },
    {
      featureType: 'transit',
      elementType: 'geometry',
      stylers: [{ color: '#e5e5e5' }]
    },
    {
      featureType: 'water',
      elementType: 'geometry',
      stylers: [{ color: '#c9d9f3' }]
    }
  ];
  
  // Fleet Statistics
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

  // Real-time updates
  private locationUpdateInterval: any;
  
  // Chart options
  fleetChartOptions: ChartType = taxiActivityChartOptions;
  revenueChartOptions: ChartType = revenueChartOptions;

  constructor(
    private modalService: NgbModal,
    private fleetService: FleetService,
    private taxiService: TaxiService,
    private ngZone: NgZone,
    private wsService: WebsocketService // Injected WebSocketService
  ) { }

  private taxiSubscription: any;

  ngOnInit(): void {
    //this.loadFleetData(); // Keep existing HTTP call
    this.initializeCharts();
    //this.startRealTimeUpdates();
    this.initFleetWebSocket(); // Initialize WebSocket
  
  }

  ngAfterViewInit(): void {
    this.initializeMap();
  }

  initializeMap(): void {
    if (this.mapContainer && this.mapContainer.nativeElement) {
      // Initialize the map centered on Tunisia
      this.map = L.map(this.mapContainer.nativeElement, {
        center: [34.0, 9.0], // Tunisia approximate center
        zoom: 6,
        zoomControl: false // Disable default top-left control
      });

      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(this.map);

      // Add zoom control at top-right
      L.control.zoom({ position: 'topright' }).addTo(this.map);

      // Add map click event
      this.map.on('click', (e: L.LeafletMouseEvent) => {
        this.onMapClick(e);
      });
    }
  }
 
  ngOnDestroy(): void {
    if (this.locationUpdateInterval) {
      clearInterval(this.locationUpdateInterval);
    }
    this.wsService.disconnect(); // Disconnect WebSocket
  }

  loadFleetData(): void {
    this.isLoading = true;
    this.fleetService.getFleetLocations().subscribe({
      next: (locations) => {
        this.fleetLocations = locations;
        this.totalItems = locations.length;
        this.updateMapCenter();
        this.updateMapMarkers();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading fleet data:', error);
        this.isLoading = false;
      }
    });
  }

 startRealTimeUpdates(): void {
    // Update fleet locations every 30 seconds
    this.locationUpdateInterval = setInterval(() => {
      this.loadFleetData();
    }, 30000);
  }
  
  updateMapCenter(): void {
    if (this.fleetLocations.length > 0) {
      const avgLat = this.fleetLocations.reduce((sum, loc) => sum + (loc.latitude || 0), 0) / this.fleetLocations.length;
      const avgLng = this.fleetLocations.reduce((sum, loc) => sum + (loc.longitude || 0), 0) / this.fleetLocations.length;
      this.mapCenter = { lat: avgLat, lng: avgLng };
    }

  }

  filterFleet(): void {
    // Implement filtering logic
    console.log('Filtering fleet data...');
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
      next: () => {
        this.loadFleetData();
      },
      error: (error) => {
        console.error('Error updating taxi status:', error);
      }
    });
  }

  getStatusBadgeClass(status: FleetStatus): string {
    switch (status) {
      case FleetStatus.ACTIVE:
        return 'bg-danger';
      case FleetStatus.BUSY:
        return 'bg-success';
      case FleetStatus.EN_ROUTE:
        return 'bg-warning';
      //case FleetStatus.MAINTENANCE:
        //return 'bg-info';
      default:
        return 'bg-secondary';
    }
  }

  getStatusIcon(status: FleetStatus): string {
    switch (status) {
      case FleetStatus.ACTIVE:
        return 'fas fa-times fa-lg me-1 text-dark';
      case FleetStatus.BUSY:
        return 'fas fa-check fa-lg me-1 text-dark';
      case FleetStatus.EN_ROUTE:
        return 'fas fa-spinner fa-lg me-1 text-dark';
      //case FleetStatus.MAINTENANCE:
       // return 'fas fa-circle text-white';
      default:
        return 'fas fa-circle text-dark';
    }
  }
/*
  initializeMap(): void {
    if (this.mapContainer && this.mapContainer.nativeElement) {
      // Initialize the map centered on Tunisia
      this.map = L.map(this.mapContainer.nativeElement).setView(
        [34.0, 9.0], // Tunisia approximate center
        6
      );
      
      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(this.map);
      
      // Add map click event
      this.map.on('click', (e: L.LeafletMouseEvent) => {
        this.onMapClick(e);
      });
    }
  }
*/
  private initFleetWebSocket(): void {
    this.wsService.connect(true);
    this.wsService.onConnected().subscribe((connected) => {
      console.log('[FleetManagement] WebSocket connection status:', connected ? 'connected' : 'disconnected');
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
    console.log('[FleetManagement] Received fleet locations via WS:', message);

    try {
      const body = JSON.parse(message.body);

      if (!Array.isArray(body) || body.length === 0) {
        console.warn('[FleetManagement] Empty fleet array received.');
        return;
      }

      // ✅ FIX STATUS MAPPING
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
            rideStatus === 'IN_PROGRESS'
              ? FleetStatus.BUSY        // ✅ occupé
              : rideStatus === 'EN_ROUTE'
              ? FleetStatus.EN_ROUTE    // ✅ en approche
              : FleetStatus.ACTIVE,     // ✅ libre

          isOnline: true
        };
      });

      this.totalItems = this.fleetLocations.length;

      // ✅ FIX STATS (NO MORE Math.max ❌)
      this.fleetStats = {
        ...this.fleetStats,

        totalTaxis: body.length,

        activeTaxis: body.filter(t => {
          const s = t.rideStatus?.toUpperCase();
          return !s || s === 'WAITING';
        }).length,

        busyTaxis: body.filter(t =>
          t.rideStatus?.toUpperCase() === 'IN_PROGRESS'
        ).length,

        enrouteTaxis: body.filter(t =>
          t.rideStatus?.toUpperCase() === 'EN_ROUTE'
        ).length
      };

      this.updateMapCenter();
      this.updateMapMarkers();

    } catch (e) {
      console.error('[FleetManagement] Failed to parse WS fleet locations:', e);
    }
  });
}
  updateMapMarkers(): void {
  // ✅ FULL CLEAN (not only markers array)
  this.map.eachLayer((layer: any) => {
    if (layer instanceof L.Marker) {
      this.map.removeLayer(layer);
    }
  });

  this.markers = [];

  // ✅ Add fresh markers
  this.fleetLocations.forEach(location => {
    if (location.latitude && location.longitude) {
      const icon = this.getMarkerIcon(location.status);

      const marker = L.marker([location.latitude, location.longitude], {
        icon: icon
      }).addTo(this.map);

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
    case FleetStatus.BUSY:
      return this.createModernIcon('green');

    case FleetStatus.EN_ROUTE:
      return this.createModernIcon('yellow');

    case FleetStatus.ACTIVE:
    default:
      return this.createModernIcon('red');
  }
}
  initializeCharts(): void {
    // Fleet Status Chart
    this.fleetChartOptions = {
      series: [this.fleetStats.activeTaxis, this.fleetStats.busyTaxis, this.fleetStats.enrouteTaxis],
      chart: {
        type: 'donut',
        height: 300
      },
      labels: ['Active', 'Busy', 'En approche'],
      colors: ['#28a745', '#ffc107', '#6c757d'],
      legend: {
        position: 'bottom'
      },
      plotOptions: {
        pie: {
          donut: {
            size: '70%'
          }
        }
      }
    };

    // Revenue Chart
    this.revenueChartOptions = {
      series: [{
        name: 'Revenue',
        data: [12000, 15000, 18000, 22000, 25000, 28000, 32000, 35000, 38000, 42000, 45000, 48000]
      }],
      chart: {
        type: 'area',
        height: 300,
        toolbar: {
          show: false
        }
      },
      colors: ['#0d6efd'],
      dataLabels: {
        enabled: false
      },
      stroke: {
        curve: 'smooth',
        width: 2
      },
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.7,
          opacityTo: 0.2
        }
      },
      xaxis: {
        categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      },
      tooltip: {
        x: {
          format: 'MMM'
        },
        y: {
          formatter: (value: number) => `$${value.toLocaleString()}`
        }
      }
    };
  }

  updateCharts(): void {
    this.fleetChartOptions.series = [
      this.fleetStats.activeTaxis, 
      this.fleetStats.busyTaxis, 
      this.fleetStats.enrouteTaxis
    ];
  }

  toggleMapView(): void {
    this.showMap = !this.showMap;
  }

  get paginatedFleet(): FleetLocation[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.fleetLocations.slice(startIndex, endIndex);
  }

  onMapClick(event: L.LeafletMouseEvent): void {
    console.log('Map clicked at:', event.latlng);
    // Handle map click events
  }

  onMarkerClick(location: FleetLocation): void {
    this.selectedLocation = location;
    // Center map on selected location
    this.mapCenter = { lat: location.latitude || 0, lng: location.longitude || 0 };
    this.mapZoom = 15;
  }

}
