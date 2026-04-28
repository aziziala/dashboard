import { Component, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { SmsService } from '../../services/sms.service';
import { SmsRecord, SmsStatus, SmsType, SmsStatistics, SmsInStatistics } from '../../models/sms-record.model';
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
  totalSmsCount: number = 0;
  
  // Make Math available in template
  Math = Math;
  
// stats

dailyStats = {
  today: 0,
  yesterday: 0,
  trend: 0
};

monthlyStats = {
  thisMonth: 0,
  lastMonth: 0,
  trend: 0
};

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
  smsStatsIn: SmsInStatistics = {
  totalSms: 0,
  processedSms: 0,
  unprocessedSms: 0,
  processingRate: 0,
  monthlyVolume: {}
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
    this.loadTotalSmsCount();
  }
loadTotalSmsCount(): void {
  this.smsService.getTotalSmsCount().subscribe({
    next: (count) => {
      this.totalSmsCount = count;
    },
    error: (err) => {
      console.error('Error loading total SMS count', err);
    }
  });
}
  loadSmsRecords(): void {
  this.isLoading = true;
  this.smsService.getSmsRecords().subscribe({
    next: (records) => {
      // Map API response to match template usage
      this.smsRecords = records.map(record => ({
        ...record,
        // Optionally compute extra fields if needed
        // For example, you can set a default SMS gateway or status text
        smscId: record['smscId'] || 'Default', // optional
        // If you want, map traitement to status text
        statusLabel: record.traitement ? 'Delivered' : 'Pending'
      }));
      this.filteredSmsRecords = this.smsRecords;
      this.totalItems = this.smsRecords.length;
      this.updatePagination();
      this.calculateStatistics(records);
      this.isLoading = false;
    },
    error: (error) => {
      console.error('Error loading SMS records:', error);
      this.isLoading = false;
    }
  });
}


loadSmsStatistics(): void {
  this.smsService.getSmsRecords().subscribe({
    next: (records) => {
      this.calculateStatistics(records);
      this.startCounters();     // ✅ Perfect location
      this.buildMonthlyChart();
      console.log('Records:', records);
    },
    error: (error) => {
      console.error('Error loading SMS statistics:', error);
    }
  });
}
buildMonthlyChart(): void {
  const categories = Object.keys(this.smsStatsIn.monthlyVolume).sort();
  const data = categories.map(key => this.smsStatsIn.monthlyVolume[key]);

  this.smsChartOptions = {
    ...this.smsChartOptions,
    series: [{
      name: 'Incoming SMS',
      data
    }],
    xaxis: {
      categories
    }
  };
}

  calculateStatistics(records: any[]): void {

  const total = records.length;

  const delivered = records.filter(r => r.traitement === true).length;
  const pending = records.filter(r => r.traitement === false).length;

  this.smsStats.totalSms = total;
  this.smsStats.deliveredSms = delivered;
  this.smsStats.pendingSms = pending;

  // You don't have real sent/failed fields in backend
  this.smsStats.sentSms = total;        // optional
  this.smsStats.failedSms = 0;          // unless backend provides

  this.smsStats.successRate =
    total > 0 ? (delivered / total) * 100 : 0;

  console.log('Calculated Stats:', this.smsStats);
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

animatedStats: any = {};

ngAfterViewInit() {
  setTimeout(() => {
    this.startCounters();
  }, 200);
}

startCounters() {
   this.animatedStats = {}; 
  const stats = [
    { key: 'Total', value: this.smsStats.totalSms },
    { key: 'Delivered', value: this.smsStats.deliveredSms },
    { key: 'Sent', value: this.smsStats.sentSms },
    { key: 'Pending', value: this.smsStats.pendingSms },
    { key: 'Failed', value: this.smsStats.failedSms },
    { key: 'Success %', value: this.smsStats.successRate }
  ];

  stats.forEach(stat => {
    this.animateValue(stat.key, stat.value, 1000);
  });
}

animateValue(key: string, end: number, duration: number) {
  const start = 0;
  const startTime = performance.now();

  const update = (currentTime: number) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const value = Math.floor(progress * (end - start) + start);

    this.animatedStats[key] = key === 'Success %'
      ? value.toFixed(1) + '%'
      : value;

    if (progress < 1) {
      requestAnimationFrame(update);
    }
  };

  requestAnimationFrame(update);
}

get statsCards() {
  return [
    { label: 'Total', value: this.totalSmsCount || 0, color: '#211F54' },
    { label: 'Delivered', value: this.smsStats?.deliveredSms || 0, color: '#198754' },
    //{ label: 'Sent', value: this.smsStats?.sentSms || 0, color: '#4B4BAF' },
    { label: 'Pending', value: this.smsStats?.pendingSms || 0, color: '#FFC900' },
    //{ label: 'Failed', value: this.smsStats?.failedSms || 0, color: '#FF0000' },
    { label: 'Success %', value: (this.smsStats?.successRate || 0).toFixed(1) + '%', color: '#0dcaf0' }
    
  ];
}

}

