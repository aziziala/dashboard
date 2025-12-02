import { Component, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ClientService } from '../../services/client.service';
import { Client, ClientRide, RideStatus } from '../../models/client.model';

@Component({
  selector: 'app-client-management',
  templateUrl: './client-management.component.html',
  styleUrls: ['./client-management.component.scss']
})
export class ClientManagementComponent implements OnInit {
  clients: Client[] = [];
  filteredClients: Client[] = [];
  paginatedClients: Client[] = [];
  selectedClient: Client | null = null;
  isLoading = false;
  searchTerm = '';
  statusFilter = '';
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;
  isEditing = false;
  
  // Make Math available in template
  Math = Math;
  
  clientForm: Partial<Client> = {
    nom: '',
    prenom: '',
    telephone: '',
    email: '',
    adresse: '',
    status: 'ACTIVE',
    note: ''
  };

  constructor(
    private modalService: NgbModal,
    private clientService: ClientService
  ) { }

  ngOnInit(): void {
    this.loadClients();
  }

  loadClients(): void {
    this.isLoading = true;
    this.clientService.getClients().subscribe({
      next: (clients) => {
        this.clients = clients;
        this.filteredClients = clients;
        this.totalItems = clients.length;
        this.updatePagination();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading clients:', error);
        this.isLoading = false;
      }
    });
  }

  filterClients(): void {
    this.filteredClients = this.clients.filter(client => {
      const matchesSearch = !this.searchTerm || 
        client.nom?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        client.prenom?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        client.telephone?.includes(this.searchTerm) ||
        client.email?.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      const matchesStatus = !this.statusFilter || client.status === this.statusFilter;
      
      return matchesSearch && matchesStatus;
    });
    
    this.totalItems = this.filteredClients.length;
    this.currentPage = 1;
    this.updatePagination();
  }

  updatePagination(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedClients = this.filteredClients.slice(startIndex, endIndex);
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= Math.ceil(this.totalItems / this.itemsPerPage)) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  openAddModal(modal: any): void {
    this.isEditing = false;
    this.resetForm();
    this.modalService.open(modal, { size: 'lg' });
  }

  openEditModal(modal: any, client: Client): void {
    this.isEditing = true;
    this.selectedClient = client;
    this.clientForm = { ...client };
    this.modalService.open(modal, { size: 'lg' });
  }

  openViewModal(modal: any, client: Client): void {
    this.selectedClient = client;
    this.modalService.open(modal, { size: 'lg' });
  }

  saveClient(): void {
    if (this.isEditing && this.selectedClient?.id) {
      this.clientService.updateClient(this.selectedClient.id, this.clientForm as Client).subscribe({
        next: () => {
          this.loadClients();
          this.modalService.dismissAll();
        },
        error: (error) => {
          console.error('Error updating client:', error);
        }
      });
    } else {
      this.clientService.addClient(this.clientForm as Client).subscribe({
        next: () => {
          this.loadClients();
          this.modalService.dismissAll();
        },
        error: (error) => {
          console.error('Error adding client:', error);
        }
      });
    }
  }

  deleteClient(id: number): void {
    if (confirm('Are you sure you want to delete this client?')) {
      this.clientService.deleteClient(id).subscribe({
        next: () => {
          this.loadClients();
        },
        error: (error) => {
          console.error('Error deleting client:', error);
        }
      });
    }
  }

  resetForm(): void {
    this.clientForm = {
      nom: '',
      prenom: '',
      telephone: '',
      email: '',
      adresse: '',
      status: 'ACTIVE',
      note: ''
    };
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'ACTIVE':
        return 'bg-success';
      case 'INACTIVE':
        return 'bg-secondary';
      case 'BLOCKED':
        return 'bg-danger';
      case 'PENDING':
        return 'bg-warning';
      default:
        return 'bg-secondary';
    }
  }

  getRideStatusBadgeClass(status: RideStatus): string {
    switch (status) {
      case RideStatus.COMPLETED:
        return 'bg-success';
      case RideStatus.IN_PROGRESS:
        return 'bg-warning';
      case RideStatus.CANCELLED:
        return 'bg-danger';
      case RideStatus.PENDING:
        return 'bg-info';
      default:
        return 'bg-secondary';
    }
  }
}
