import { Component, OnInit, OnDestroy } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { SmsService } from '../../services/sms.service';
import { FleetService } from '../../services/fleet.service';
import { SmsRecord, SmsStatus } from '../../models/sms-record.model';
import { ChartType, smsChartOptions } from '../../models/chart.model';

@Component({
  selector: 'app-sms-gateway-monitoring',
  templateUrl: './sms-gateway-monitoring.component.html',
  styleUrls: ['./sms-gateway-monitoring.component.scss']
})
export class SmsGatewayMonitoringComponent implements OnInit, OnDestroy {
  // SMS Gateway data
  gatewayStatus: any[] = [];
  smsQueue: SmsRecord[] = [];
  failedSms: SmsRecord[] = [];
  gatewayMetrics: any = {};
  
  // Real-time updates
  private statusUpdateInterval: any;
  private queueUpdateInterval: any;
  
  // Statistics
  gatewayStats = {
    totalSms: 0,
    queuedSms: 0,
    failedSms: 0,
    deliveredSms: 0,
    pendingSms: 0,
    successRate: 0,
    averageDeliveryTime: 0,
    queueSize: 0,
    gatewayUptime: 0,
    lastError: null
  };

  // Chart options
  smsChartOptions: ChartType = smsChartOptions;

  // Filtering and search
  searchTerm = '';
  statusFilter = '';
  gatewayFilter = '';
  priorityFilter = '';
  
  // Loading states
  isLoading = false;
  isProcessing = false;

  // Selected items
  selectedSms: SmsRecord | null = null;
  selectedGateway: any = null;

  constructor(
    private modalService: NgbModal,
    private smsService: SmsService,
    private fleetService: FleetService
  ) { }

  ngOnInit(): void {
    this.loadGatewayData();
    this.startRealTimeUpdates();
  }

  ngOnDestroy(): void {
    this.stopRealTimeUpdates();
  }

  loadGatewayData(): void {
    this.isLoading = true;
    
    Promise.all([
      this.loadGatewayStatus(),
      this.loadSmsQueue(),
      this.loadFailedSms(),
      this.loadGatewayMetrics(),
      this.loadGatewayStatistics()
    ]).finally(() => {
      this.isLoading = false;
    });
  }

  loadGatewayStatus(): Promise<void> {
    return new Promise((resolve) => {
      // Simulate gateway status data
      this.gatewayStatus = [
        {
          id: 1,
          name: 'Primary Gateway',
          status: 'ONLINE',
          uptime: '99.9%',
          lastHeartbeat: new Date(),
          queueSize: 1250,
          errorRate: '0.1%',
          responseTime: '45ms',
          ipAddress: '192.168.1.100',
          port: 8080
        },
        {
          id: 2,
          name: 'Secondary Gateway',
          status: 'MAINTENANCE',
          uptime: '95.2%',
          lastHeartbeat: new Date(Date.now() - 300000),
          queueSize: 0,
          errorRate: '2.1%',
          responseTime: '120ms',
          ipAddress: '192.168.1.101',
          port: 8080
        },
        {
          id: 3,
          name: 'Backup Gateway',
          status: 'STANDBY',
          uptime: '98.7%',
          lastHeartbeat: new Date(Date.now() - 60000),
          queueSize: 0,
          errorRate: '0.5%',
          responseTime: '85ms',
          ipAddress: '192.168.1.102',
          port: 8080
        }
      ];
      resolve();
    });
  }

  loadSmsQueue(): Promise<void> {
    return new Promise((resolve) => {
      this.smsService.getSmsRecords().subscribe({
        next: (records) => {
          this.smsQueue = records.filter(sms => sms.status === SmsStatus.PENDING);
          this.gatewayStats.queuedSms = this.smsQueue.length;
          resolve();
        },
        error: (error) => {
          console.error('Error loading SMS queue:', error);
          resolve();
        }
      });
    });
  }

  loadFailedSms(): Promise<void> {
    return new Promise((resolve) => {
      this.smsService.getSmsRecords().subscribe({
        next: (records) => {
          this.failedSms = records.filter(sms => sms.status === SmsStatus.FAILED);
          this.gatewayStats.failedSms = this.failedSms.length;
          resolve();
        },
        error: (error) => {
          console.error('Error loading failed SMS:', error);
          resolve();
        }
      });
    });
  }

  loadGatewayMetrics(): Promise<void> {
    return new Promise((resolve) => {
      // Simulate gateway metrics
      this.gatewayMetrics = {
        throughput: {
          current: 1250,
          average: 1100,
          peak: 1800
        },
        latency: {
          current: 45,
          average: 52,
          peak: 120
        },
        errors: {
          current: 12,
          average: 8,
          peak: 25
        },
        queueDepth: {
          current: 1250,
          average: 980,
          peak: 2000
        }
      };
      resolve();
    });
  }

  loadGatewayStatistics(): Promise<void> {
    return new Promise((resolve) => {
      this.smsService.getTotalSmsCount().subscribe({
        next: (total) => {
          this.gatewayStats.totalSms = total;
          this.gatewayStats.successRate = this.calculateSuccessRate();
          resolve();
        },
        error: (error) => {
          console.error('Error loading gateway statistics:', error);
          resolve();
        }
      });
    });
  }

  startRealTimeUpdates(): void {
    // Update gateway status every 30 seconds
    this.statusUpdateInterval = setInterval(() => {
      this.loadGatewayStatus();
    }, 30000);

    // Update SMS queue every 60 seconds
    this.queueUpdateInterval = setInterval(() => {
      this.loadSmsQueue();
      this.loadFailedSms();
    }, 60000);
  }

  stopRealTimeUpdates(): void {
    if (this.statusUpdateInterval) {
      clearInterval(this.statusUpdateInterval);
    }
    if (this.queueUpdateInterval) {
      clearInterval(this.queueUpdateInterval);
    }
  }

  // Gateway management
  restartGateway(gatewayId: number): void {
    this.isProcessing = true;
    // Simulate gateway restart
    setTimeout(() => {
      this.loadGatewayStatus();
      this.isProcessing = false;
    }, 2000);
  }

  switchToGateway(gatewayId: number): void {
    this.isProcessing = true;
    // Simulate gateway switch
    setTimeout(() => {
      this.loadGatewayStatus();
      this.isProcessing = false;
    }, 1500);
  }

  clearQueue(gatewayId: number): void {
    this.isProcessing = true;
    // Simulate queue clearing
    setTimeout(() => {
      this.loadSmsQueue();
      this.isProcessing = false;
    }, 1000);
  }

  // SMS management
  retrySms(smsId: number): void {
    this.isProcessing = true;
    this.smsService.retrySms(smsId).subscribe({
      next: () => {
        this.loadSmsQueue();
        this.loadFailedSms();
        this.isProcessing = false;
      },
      error: (error) => {
        console.error('Error retrying SMS:', error);
        this.isProcessing = false;
      }
    });
  }

  cancelSms(smsId: number): void {
    this.isProcessing = true;
    // Simulate SMS cancellation
    setTimeout(() => {
      this.loadSmsQueue();
      this.isProcessing = false;
    }, 1000);
  }

  // Utility methods
  calculateSuccessRate(): number {
    if (this.gatewayStats.totalSms === 0) return 0;
    const successful = this.gatewayStats.totalSms - this.gatewayStats.failedSms;
    return Math.round((successful / this.gatewayStats.totalSms) * 100);
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'ONLINE': return 'bg-success';
      case 'MAINTENANCE': return 'bg-warning';
      case 'STANDBY': return 'bg-info';
      case 'OFFLINE': return 'bg-danger';
      default: return 'bg-secondary';
    }
  }

  getStatusText(status: string): string {
    return status.replace('_', ' ').toLowerCase();
  }

  getGatewayHealthClass(gateway: any): string {
    if (gateway.status === 'ONLINE' && gateway.uptime >= '99.0%') return 'text-success';
    if (gateway.status === 'ONLINE' && gateway.uptime >= '95.0%') return 'text-warning';
    return 'text-danger';
  }

  // Modal operations
  openSmsDetailsModal(content: any, sms: SmsRecord): void {
    this.selectedSms = sms;
    this.modalService.open(content, { size: 'lg' });
  }

  openGatewayDetailsModal(content: any, gateway: any): void {
    this.selectedGateway = gateway;
    this.modalService.open(content, { size: 'lg' });
  }

  // Filtering methods
  filterData(): void {
    // Implement filtering logic
  }

  onSearch(): void {
    this.filterData();
  }

  onStatusFilterChange(): void {
    this.filterData();
  }

  onGatewayFilterChange(): void {
    this.filterData();
  }

  onPriorityFilterChange(): void {
    this.filterData();
  }

  // Manual refresh
  refreshData(): void {
    this.isLoading = true;
    this.loadGatewayData();
    setTimeout(() => {
      this.isLoading = false;
    }, 2000);
  }
}
