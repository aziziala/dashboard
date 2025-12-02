import { Component, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { SmsService } from '../../services/sms.service';
import { SmsRecord, SmsStatus, SmsType, SmsStatistics } from '../../models/sms-record.model';
import { ChartType, smsChartOptions } from '../../models/chart.model';

@Component({
  selector: 'app-sms-management',
  templateUrl: './sms-management.component.html',
  styleUrls: ['./sms-management.component.scss']
})
export class SmsManagementComponent implements OnInit {
  smsRecords: SmsRecord[] = [];
  filteredSmsRecords: SmsRecord[] = [];
  paginatedSmsRecords: SmsRecord[] = [];
  selectedSmsRecord: SmsRecord | null = null;
  isLoading = false;
  searchTerm = '';
  statusFilter = '';
  typeFilter = '';
  dateRange = '';
  currentPage = 1;
  itemsPerPage = 15;
  totalItems = 0;
  isEditing = false;
  
  // Make Math available in template
  Math = Math;
  
  // SMS Statistics
  smsStats: SmsStatistics = {
    totalSms: 0,
    sentSms: 0,
    deliveredSms: 0,
    failedSms: 0,
    pendingSms: 0,
    successRate: 0,
    totalCost: 0,
    averageDeliveryTime: 0,
    smsByType: {} as { [key in SmsType]: number },
    smsByStatus: {} as { [key in SmsStatus]: number },
    dailyVolume: [],
    hourlyDistribution: []
  };

  // Chart options
  smsChartOptions: ChartType = smsChartOptions;
  
  // Chart data placeholders (replaced with simple HTML displays)
  
  smsForm: Partial<SmsRecord> = {
    telephone: '',
    contenu: '',
    type: SmsType.OUTGOING,
    status: SmsStatus.PENDING,
    priority: 'medium'
  };

  constructor(
    private modalService: NgbModal,
    private smsService: SmsService
  ) { }

  ngOnInit(): void {
    this.loadSmsRecords();
    this.loadSmsStatistics();
    this.loadSmsGatewayStatus();
  }

  loadSmsRecords(): void {
    this.isLoading = true;
    this.smsService.getSmsRecords().subscribe({
      next: (records) => {
        this.smsRecords = records;
        this.filteredSmsRecords = records;
        this.totalItems = records.length;
        this.updatePagination();
        this.calculateStatistics();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading SMS records:', error);
        this.isLoading = false;
      }
    });
  }

  loadSmsStatistics(): void {
    // Load total SMS count from SMSout backend
    this.smsService.getTotalSmsCount().subscribe({
      next: (totalCount) => {
        this.smsStats.totalSms = totalCount;
        // Calculate other statistics based on loaded records
        this.calculateStatistics();
      },
      error: (error) => {
        console.error('Error loading SMS statistics:', error);
        this.calculateStatistics();
      }
    });
  }

  calculateStatistics(): void {
    const records = this.smsRecords;
    this.smsStats.deliveredSms = records.filter(r => r.status === SmsStatus.DELIVERED).length;
    this.smsStats.sentSms = records.filter(r => r.status === SmsStatus.SENT).length;
    this.smsStats.failedSms = records.filter(r => r.status === SmsStatus.FAILED).length;
    this.smsStats.pendingSms = records.filter(r => r.status === SmsStatus.PENDING).length;
    
    const totalProcessed = this.smsStats.deliveredSms + this.smsStats.sentSms + this.smsStats.failedSms;
    this.smsStats.successRate = totalProcessed > 0 ? 
      ((this.smsStats.deliveredSms + this.smsStats.sentSms) / totalProcessed) * 100 : 0;
  }

  loadSmsGatewayStatus(): void {
    // Load SMS gateway status information
    // This would typically come from a monitoring service
    console.log('Loading SMS gateway status...');
  }

  filterSmsRecords(): void {
    this.filteredSmsRecords = this.smsRecords.filter(record => {
      const matchesSearch = !this.searchTerm || 
        record.telephone?.includes(this.searchTerm) ||
        record.contenu?.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      const matchesStatus = !this.statusFilter || record.status === this.statusFilter;
      const matchesType = !this.typeFilter || record.type === this.typeFilter;
      
      return matchesSearch && matchesStatus && matchesType;
    });
    
    this.totalItems = this.filteredSmsRecords.length;
    this.currentPage = 1;
    this.updatePagination();
  }

  updatePagination(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedSmsRecords = this.filteredSmsRecords.slice(startIndex, endIndex);
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

  openEditModal(modal: any, record: SmsRecord): void {
    this.isEditing = true;
    this.selectedSmsRecord = record;
    this.smsForm = { ...record };
    this.modalService.open(modal, { size: 'lg' });
  }

  openViewModal(modal: any, record: SmsRecord): void {
    this.selectedSmsRecord = record;
    this.modalService.open(modal, { size: 'lg' });
  }

  saveSmsRecord(): void {
    if (this.isEditing && this.selectedSmsRecord?.id) {
      this.smsService.updateSmsRecord(this.selectedSmsRecord.id, this.smsForm as SmsRecord).subscribe({
        next: () => {
          this.loadSmsRecords();
          this.loadSmsStatistics();
          this.modalService.dismissAll();
        },
        error: (error) => {
          console.error('Error updating SMS record:', error);
        }
      });
    } else {
      this.smsService.addSmsRecord(this.smsForm as SmsRecord).subscribe({
        next: () => {
          this.loadSmsRecords();
          this.loadSmsStatistics();
          this.modalService.dismissAll();
        },
        error: (error) => {
          console.error('Error adding SMS record:', error);
        }
      });
    }
  }

  deleteSmsRecord(id: number): void {
    if (confirm('Are you sure you want to delete this SMS record?')) {
      this.smsService.deleteSmsRecord(id).subscribe({
        next: () => {
          this.loadSmsRecords();
          this.loadSmsStatistics();
        },
        error: (error) => {
          console.error('Error deleting SMS record:', error);
        }
      });
    }
  }

  resetForm(): void {
    this.smsForm = {
      telephone: '',
      contenu: '',
      type: SmsType.OUTGOING,
      status: SmsStatus.PENDING
    };
  }

  getStatusBadgeClass(status: SmsStatus): string {
    switch (status) {
      case SmsStatus.DELIVERED:
        return 'bg-success';
      case SmsStatus.SENT:
        return 'bg-info';
      case SmsStatus.FAILED:
        return 'bg-danger';
      case SmsStatus.PENDING:
        return 'bg-warning';
      default:
        return 'bg-secondary';
    }
  }

  getTypeBadgeClass(type: SmsType): string {
    switch (type) {
      case SmsType.INCOMING:
        return 'bg-primary';
      case SmsType.OUTGOING:
        return 'bg-success';
      default:
        return 'bg-secondary';
    }
  }



  exportData(format: string): void {
    // Implementation for data export (CSV, PDF, Excel)
    console.log(`Exporting data in ${format} format`);
    // TODO: Implement actual export functionality
  }

  sendBulkSms(): void {
    // Implementation for bulk SMS sending
    console.log('Opening bulk SMS modal');
    // TODO: Implement bulk SMS functionality
  }

  retrySms(id: number): void {
    if (confirm('Are you sure you want to retry sending this SMS?')) {
      this.smsService.retrySms(id).subscribe({
        next: () => {
          this.loadSmsRecords();
          this.loadSmsStatistics();
        },
        error: (error) => {
          console.error('Error retrying SMS:', error);
        }
      });
    }
  }

  getSmsByMonth(month: number, year: number): void {
    this.smsService.getSmsByMonth(month, year).subscribe({
      next: (records) => {
        console.log(`SMS records for ${month}/${year}:`, records);
        // You can display these in a modal or update the current view
      },
      error: (error) => {
        console.error('Error loading SMS by month:', error);
      }
    });
  }
}
