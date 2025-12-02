import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FleetService } from '../../services/fleet.service';
import { TaxiService } from '../../services/taxi.service';
import { FleetLocation, FleetStatus, FleetStatistics, NearbyTaxiResponse } from '../../models/fleet-location.model';
import { Taxi } from '../../models/taxi.model';
import { ChartType, revenueChartOptions, smsChartOptions, taxiActivityChartOptions, monthlyEarningChartOptions } from '../../models/chart.model';
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
  
  // Map properties
  mapCenter = { lat: 33.9716, lng: -6.8498 }; // Default to Rabat, Morocco
  mapZoom = 12;
  showMap = true;
  
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
    private taxiService: TaxiService
  ) { }

  ngOnInit(): void {
    this.loadFleetData();
    this.loadFleetStatistics();
    this.initializeCharts();
    this.startRealTimeUpdates();
  }

  ngAfterViewInit(): void {
    this.initializeMap();
  }

  ngOnDestroy(): void {
    if (this.locationUpdateInterval) {
      clearInterval(this.locationUpdateInterval);
    }
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

  loadFleetStatistics(): void {
    this.fleetService.getFleetStatistics().subscribe({
      next: (stats) => {
        this.fleetStats = stats;
        this.updateCharts();
      },
      error: (error) => {
        console.error('Error loading fleet statistics:', error);
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
        this.loadFleetStatistics();
      },
      error: (error) => {
        console.error('Error updating taxi status:', error);
      }
    });
  }

  getStatusBadgeClass(status: FleetStatus): string {
    switch (status) {
      case FleetStatus.ACTIVE:
        return 'bg-success';
      case FleetStatus.BUSY:
        return 'bg-warning';
      case FleetStatus.OFFLINE:
        return 'bg-secondary';
      case FleetStatus.MAINTENANCE:
        return 'bg-info';
      default:
        return 'bg-secondary';
    }
  }

  getStatusIcon(status: FleetStatus): string {
    switch (status) {
      case FleetStatus.ACTIVE:
        return 'fas fa-circle text-success';
      case FleetStatus.BUSY:
        return 'fas fa-circle text-warning';
      case FleetStatus.OFFLINE:
        return 'fas fa-circle text-secondary';
      case FleetStatus.MAINTENANCE:
        return 'fas fa-circle text-info';
      default:
        return 'fas fa-circle text-secondary';
    }
  }

  initializeMap(): void {
    if (this.mapContainer && this.mapContainer.nativeElement) {
      // Initialize the map
      this.map = L.map(this.mapContainer.nativeElement).setView([this.mapCenter.lat, this.mapCenter.lng], this.mapZoom);
      
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

  updateMapMarkers(): void {
    // Clear existing markers
    this.markers.forEach(marker => marker.remove());
    this.markers = [];
    
    // Add new markers for each fleet location
    this.fleetLocations.forEach(location => {
      if (location.latitude && location.longitude) {
        const marker = L.marker([location.latitude, location.longitude], {
          icon: this.createCustomIcon(location.status)
        }).addTo(this.map);
        
        // Add popup
        const popupContent = `
          <div class="info-window">
            <h6>${location.taxiNumber}</h6>
            <p><strong>Driver:</strong> ${location.driverName}</p>
            <p><strong>Status:</strong> 
              <span class="badge ${this.getStatusBadgeClass(location.status)}">
                ${location.status}
              </span>
            </p>
            <p><strong>Phone:</strong> ${location.telephone}</p>
            <button class="btn btn-sm btn-primary" onclick="document.dispatchEvent(new CustomEvent('openLocationModal', {detail: ${location.id}}))">
              View Details
            </button>
          </div>
        `;
        
        marker.bindPopup(popupContent);
        
        // Add click event
        marker.on('click', () => {
          this.onMarkerClick(location);
        });
        
        this.markers.push(marker);
      }
    });
  }

  createCustomIcon(status: FleetStatus): L.DivIcon {
    const iconColor = this.getMarkerColor(status);
    
    return L.divIcon({
      className: 'custom-marker',
      html: `<div style="background-color: ${iconColor}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });
  }

  getMarkerColor(status: FleetStatus): string {
    switch (status) {
      case FleetStatus.ACTIVE:
        return '#28a745'; // green
      case FleetStatus.BUSY:
        return '#ffc107'; // yellow
      case FleetStatus.OFFLINE:
        return '#6c757d'; // gray
      case FleetStatus.MAINTENANCE:
        return '#17a2b8'; // blue
      default:
        return '#6c757d';
    }
  }

  initializeCharts(): void {
    // Fleet Status Chart
    this.fleetChartOptions = {
      series: [this.fleetStats.activeTaxis, this.fleetStats.busyTaxis, this.fleetStats.offlineTaxis],
      chart: {
        type: 'donut',
        height: 300
      },
      labels: ['Active', 'Busy', 'Offline'],
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
      this.fleetStats.offlineTaxis
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
