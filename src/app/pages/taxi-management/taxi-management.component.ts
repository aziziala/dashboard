import { Component, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TaxiService } from '../../services/taxi.service';
import { Taxi, TaxiStatus } from '../../models/taxi.model';

@Component({
  selector: 'app-taxi-management',
  templateUrl: './taxi-management.component.html',
  styleUrls: ['./taxi-management.component.scss']
})
export class TaxiManagementComponent implements OnInit {
  taxis: Taxi[] = [];
  filteredTaxis: Taxi[] = [];
  selectedTaxi: Taxi | null = null;
  isLoading = false;
  searchTerm = '';
  statusFilter = '';
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;
  
  // Taxi Statistics
  taxiStats = {
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
    online: 0,
    offline: 0
  };

  // Form for adding/editing taxis
  taxiForm: any = {
    nom: '',
    telephone: '',
    numero_matricule: '',
    numero_cin: '',
    constructeur: '',
    numero_taxi: '',
    email: '',
    destination: '',
    location: '',
    lat_gps: 0,
    lng_gps: 0,
    taxiStatus: TaxiStatus.PENDING
  };

  isEditing = false;
  editingTaxiId: number | null = null;

  constructor(
    private modalService: NgbModal,
    private taxiService: TaxiService
  ) { }

  showFormErrorToast = false;

  ngOnInit(): void {
    this.loadTaxis();
    this.loadTaxiStatistics();
  }

  loadTaxis(): void {
    this.isLoading = true;
    this.taxiService.getTaxis().subscribe({
      next: (taxis) => {
        this.taxis = taxis;
        this.filteredTaxis = taxis;
        this.totalItems = taxis.length;
        this.updateStatistics();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading taxis:', error);
        this.isLoading = false;
      }
    });
  }

  loadTaxiStatistics(): void {
    // Calculate statistics from loaded data
    this.updateStatistics();
  }

  updateStatistics(): void {
    this.taxiStats.total = this.taxis.length;
    this.taxiStats.approved = this.taxis.filter(t => t.taxiStatus === TaxiStatus.APPROVED).length;
    this.taxiStats.pending = this.taxis.filter(t => t.taxiStatus === TaxiStatus.PENDING).length;
    this.taxiStats.rejected = this.taxis.filter(t => t.taxiStatus === TaxiStatus.REJECTED).length;
    this.taxiStats.online = this.taxis.filter(t => t.traitement).length;
    this.taxiStats.offline = this.taxis.filter(t => !t.traitement).length;
  }

  filterTaxis(): void {
    this.filteredTaxis = this.taxis.filter(taxi => {
      const matchesSearch = !this.searchTerm || 
        taxi.nom?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        taxi.telephone?.includes(this.searchTerm) ||
        taxi.numero_taxi?.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      const matchesStatus = !this.statusFilter || taxi.taxiStatus === this.statusFilter;
      
      return matchesSearch && matchesStatus;
    });
    
    this.totalItems = this.filteredTaxis.length;
    this.currentPage = 1;
  }

  onPageChange(page: number): void {
    this.currentPage = page;
  }

  openAddModal(modal: any): void {
    this.isEditing = false;
    this.editingTaxiId = null;
    this.resetForm();
    this.modalService.open(modal, { size: 'lg' });
  }

  openEditModal(modal: any, taxi: Taxi): void {
    this.isEditing = true;
    this.editingTaxiId = taxi.id || 0;
    this.taxiForm = { ...taxi };
    this.modalService.open(modal, { size: 'lg' });
  }

  openViewModal(modal: any, taxi: Taxi): void {
    this.selectedTaxi = taxi;
    this.modalService.open(modal, { size: 'lg' });
  }

saveTaxi(): void {
  if (!this.taxiForm.nom || !this.taxiForm.telephone || !this.taxiForm.numero_taxi) {
    this.showFormErrorToast = true;

    // Scroll vers le premier champ invalide
    const firstInvalidField = document.querySelector('.is-invalid');
    if (firstInvalidField) {
      (firstInvalidField as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    setTimeout(() => {
      this.showFormErrorToast = false;
    }, 5000);
    
    return;
  }

  if (this.isEditing && this.editingTaxiId) {
    this.taxiService.updateTaxi(this.editingTaxiId, this.taxiForm).subscribe({
      next: () => {
        this.loadTaxis();
        this.modalService.dismissAll();
      },
      error: (error) => {
        console.error('Error updating taxi:', error);
      }
    });
  } else {
    this.taxiService.addTaxi(this.taxiForm).subscribe({
      next: () => {
        this.loadTaxis();
        this.modalService.dismissAll();
      },
      error: (error) => {
        console.error('Error adding taxi:', error);
      }
    });
  }
}

  deleteTaxi(taxiId: number): void {
    if (confirm('Are you sure you want to delete this taxi?')) {
      this.taxiService.deleteTaxi(taxiId).subscribe({
        next: () => {
          this.loadTaxis();
        },
        error: (error) => {
          console.error('Error deleting taxi:', error);
        }
      });
    }
  }

  updateTaxiStatus(taxiId: number, newStatus: TaxiStatus): void {
    this.taxiService.updateTaxiStatus(taxiId, newStatus).subscribe({
      next: () => {
        this.loadTaxis();
      },
      error: (error) => {
        console.error('Error updating taxi status:', error);
      }
    });
  }

  updateTaxiLocation(taxiId: number, lat: number, lng: number): void {
    // Find the taxi to get its phone number
    const taxi = this.taxis.find(t => t.id === taxiId);
    if (taxi && taxi.telephone) {
      this.taxiService.updateTaxiLocation(taxi.telephone, { latitude: lat, longitude: lng }).subscribe({
        next: () => {
          this.loadTaxis();
        },
        error: (error) => {
          console.error('Error updating taxi location:', error);
        }
      });
    }
  }

  resetForm(): void {
    this.taxiForm = {
      nom: '',
      telephone: '',
      numero_matricule: '',
      numero_cin: '',
      constructeur: '',
      numero_taxi: '',
      email: '',
      destination: '',
      location: '',
      lat_gps: 0,
      lng_gps: 0,
      taxiStatus: TaxiStatus.PENDING
    };
  }

  getStatusBadgeClass(status: TaxiStatus): string {
    switch (status) {
      case TaxiStatus.APPROVED:
        return 'bg-success';
      case TaxiStatus.PENDING:
        return 'bg-warning';
      case TaxiStatus.REJECTED:
        return 'bg-danger';
      default:
        return 'bg-secondary';
    }
  }

  getOnlineStatusClass(isOnline: boolean): string {
    return isOnline ? 'text-success' : 'text-secondary';
  }

  get paginatedTaxis(): Taxi[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredTaxis.slice(startIndex, endIndex);
  }

  // Make enums and Math available in template
  TaxiStatus = TaxiStatus;
  Math = Math;
}
