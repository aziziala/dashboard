import { Component, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { RideService } from '../../services/ride.service';
import { RideRequest, RideOffer, RideStatus, RideMatching } from '../../models/ride.model';
import { TaxiService } from '../../services/taxi.service';
import { ClientService } from '../../services/client.service';

@Component({
  selector: 'app-ride-management',
  templateUrl: './ride-management.component.html',
  styleUrls: ['./ride-management.component.scss']
})
export class RideManagementComponent implements OnInit {
  // Expose Math for template usage (pagination calculations)
  Math = Math;
  // Ride data
  rideRequests: RideRequest[] = [];
  rideOffers: RideOffer[] = [];
  rideMatchings: RideMatching[] = [];
  
  // Filtering and pagination
  searchTerm = '';
  statusFilter = '';
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;
  
  // Loading states
  isLoading = false;
  isProcessing = false;
  
  // Statistics
  rideStats = {
    totalRequests: 0,
    pendingRequests: 0,
    activeRides: 0,
    completedRides: 0,
    cancelledRides: 0,
    totalRevenue: 0,
    averageResponseTime: 0,
    successRate: 0
  };

  // Selected items
  selectedRequest: RideRequest | null = null;
  selectedOffer: RideOffer | null = null;
  selectedMatching: RideMatching | null = null;

  // Available taxis and clients for assignment
  availableTaxis: any[] = [];
  availableClients: any[] = [];

  constructor(
    private modalService: NgbModal,
    private rideService: RideService,
    private taxiService: TaxiService,
    private clientService: ClientService
  ) { }

  ngOnInit(): void {
    this.loadRideData();
    this.loadStatistics();
    this.loadAvailableTaxis();
    this.loadAvailableClients();
  }

  loadRideData(): void {
    this.isLoading = true;
    
    Promise.all([
      this.loadRideRequests(),
      this.loadRideOffers(),
      this.loadRideMatchings()
    ]).finally(() => {
      this.isLoading = false;
    });
  }

  loadRideRequests(): Promise<void> {
    return new Promise((resolve) => {
      this.rideService.getRideRequests().subscribe({
        next: (requests) => {
          this.rideRequests = requests;
          this.totalItems = requests.length;
          resolve();
        },
        error: (error) => {
          console.error('Error loading ride requests:', error);
          resolve();
        }
      });
    });
  }

  loadRideOffers(): Promise<void> {
    return new Promise((resolve) => {
      this.rideService.getRideOffers().subscribe({
        next: (offers) => {
          this.rideOffers = offers;
          resolve();
        },
        error: (error) => {
          console.error('Error loading ride offers:', error);
          resolve();
        }
      });
    });
  }

  loadRideMatchings(): Promise<void> {
    // No backend endpoint available yet; clear for now
    this.rideMatchings = [];
    return Promise.resolve();
  }

  loadStatistics(): void {
    this.rideService.getRideStatistics().subscribe({
      next: (stats) => {
        this.rideStats = {
          totalRequests: stats.totalRides,
          pendingRequests: 0,
          activeRides: 0,
          completedRides: stats.completedRides,
          cancelledRides: stats.cancelledRides,
          totalRevenue: stats.totalRevenue,
          averageResponseTime: stats.averageDuration || 0,
          successRate: stats.successRate
        };
      },
      error: (error) => {
        console.error('Error loading ride statistics:', error);
      }
    });
  }

  loadAvailableTaxis(): void {
    // Fallback: reuse ride offers taxis if no endpoint
    this.taxiService.getActiveTaxis?.().subscribe({
      next: (taxis) => {
        this.availableTaxis = taxis;
      },
      error: (error) => {
        console.error('Error loading available taxis:', error);
      }
    });
  }

  loadAvailableClients(): void {
    this.clientService.getClients().subscribe({
      next: (clients) => {
        this.availableClients = clients;
      },
      error: (error) => {
        console.error('Error loading clients:', error);
      }
    });
  }

  // Ride request management
  approveRideRequest(request: RideRequest): void {
    this.isProcessing = true;
    this.rideService.updateRideRequestStatus(request.id, RideStatus.IN_PROGRESS).subscribe({
      next: () => {
        this.loadRideData();
        this.isProcessing = false;
      },
      error: (error) => {
        console.error('Error approving ride request:', error);
        this.isProcessing = false;
      }
    });
  }

  rejectRideRequest(request: RideRequest): void {
    this.isProcessing = true;
    this.rideService.updateRideRequestStatus(request.id, RideStatus.CANCELLED).subscribe({
      next: () => {
        this.loadRideData();
        this.isProcessing = false;
      },
      error: (error) => {
        console.error('Error rejecting ride request:', error);
        this.isProcessing = false;
      }
    });
  }

  assignTaxiToRequest(request: RideRequest, taxiId: number): void {
    this.isProcessing = true;
    this.rideService.assignTaxiToRequest(request.id, taxiId).subscribe({
      next: () => {
        this.loadRideData();
        this.isProcessing = false;
      },
      error: (error) => {
        console.error('Error assigning taxi:', error);
        this.isProcessing = false;
      }
    });
  }

  // Ride offer management
  approveRideOffer(offer: RideOffer): void {
    this.isProcessing = true;
    this.rideService.updateRideOfferStatus(offer.id, RideStatus.IN_PROGRESS).subscribe({
      next: () => {
        this.loadRideData();
        this.isProcessing = false;
      },
      error: (error) => {
        console.error('Error approving ride offer:', error);
        this.isProcessing = false;
      }
    });
  }

  rejectRideOffer(offer: RideOffer): void {
    this.isProcessing = true;
    this.rideService.updateRideOfferStatus(offer.id, RideStatus.CANCELLED).subscribe({
      next: () => {
        this.loadRideData();
        this.isProcessing = false;
      },
      error: (error) => {
        console.error('Error rejecting ride offer:', error);
        this.isProcessing = false;
      }
    });
  }

  // Ride matching management
  createRideMatching(request: RideRequest, offer: RideOffer): void {
    this.isProcessing = true;
    // No matching endpoint yet; simulate success and refresh
    setTimeout(() => {
      this.loadRideData();
      this.isProcessing = false;
    }, 300);
  }

  updateRideStatus(matching: RideMatching, status: RideStatus): void {
    this.isProcessing = true;
    // No matching ID or endpoint; update offers as fallback
    this.rideService.updateRideOfferStatus((matching as any).rideOfferId || 0, status).subscribe({
      next: () => {
        this.loadRideData();
        this.isProcessing = false;
      },
      error: (error) => {
        console.error('Error updating ride status:', error);
        this.isProcessing = false;
      }
    });
  }

  // Filtering and search
  filterRides(): void {
    // Implement filtering logic
  }

  onSearch(): void {
    this.currentPage = 1;
    this.filterRides();
  }

  onStatusFilterChange(): void {
    this.currentPage = 1;
    this.filterRides();
  }

  // Pagination
  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadRideData();
  }

  // Modal operations
  openRideDetailsModal(content: any, ride: any): void {
    this.selectedRequest = ride;
    this.modalService.open(content, { size: 'lg' });
  }

  openOfferDetailsModal(content: any, offer: any): void {
    this.selectedOffer = offer;
    this.modalService.open(content, { size: 'lg' });
  }

  openMatchingDetailsModal(content: any, matching: any): void {
    this.selectedMatching = matching;
    this.modalService.open(content, { size: 'lg' });
  }

  // Utility methods
  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'PENDING': return 'bg-warning';
      case 'APPROVED': return 'bg-success';
      case 'REJECTED': return 'bg-danger';
      case 'IN_PROGRESS': return 'bg-info';
      case 'COMPLETED': return 'bg-success';
      case 'CANCELLED': return 'bg-secondary';
      default: return 'bg-secondary';
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
}
