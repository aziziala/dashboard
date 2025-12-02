import { Component, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TaxiService } from '../../services/taxi.service';
import { ClientService } from '../../services/client.service';
import { SmsService } from '../../services/sms.service';
import { FleetService } from '../../services/fleet.service';
import { ChartType, revenueChartOptions, smsChartOptions, taxiActivityChartOptions, monthlyEarningChartOptions } from '../../models/chart.model';

@Component({
  selector: 'app-analytics',
  templateUrl: './analytics.component.html',
  styleUrls: ['./analytics.component.scss']
})
export class AnalyticsComponent implements OnInit {
  isLoading = false;
  selectedPeriod = 'monthly';
  selectedYear = new Date().getFullYear();
  
  // Performance Data
  topTaxis: any[] = [];
  topClients: any[] = [];
  revenueData: any[] = [];
  rideFrequency: any[] = [];
  
  // Chart Options
  revenueChartOptions: ChartType = revenueChartOptions;
  performanceChartOptions: ChartType = smsChartOptions;
  rideFrequencyChartOptions: ChartType = taxiActivityChartOptions;
  topPerformersChartOptions: ChartType = monthlyEarningChartOptions;
  
  // Statistics
  totalRevenue = 0;
  totalRides = 0;
  averageRating = 0;
  totalClients = 0;
  totalTaxis = 0;
  successRate = 0;

  constructor(
    private modalService: NgbModal,
    private taxiService: TaxiService,
    private clientService: ClientService,
    private smsService: SmsService,
    private fleetService: FleetService
  ) { }

  ngOnInit(): void {
    this.loadAnalyticsData();
    this.initializeCharts();
  }

  loadAnalyticsData(): void {
    this.isLoading = true;
    
    // Load various analytics data
    Promise.all([
      this.loadTopPerformers(),
      this.loadRevenueData(),
      this.loadRideFrequency(),
      this.loadOverallStatistics()
    ]).finally(() => {
      this.isLoading = false;
    });
  }

  loadTopPerformers(): Promise<void> {
    return new Promise((resolve) => {
      // Simulate loading top performing taxis
      this.topTaxis = [
        { id: 1, name: 'Taxi-001', driver: 'Ahmed Hassan', revenue: 2500, rides: 45, rating: 4.8 },
        { id: 2, name: 'Taxi-002', driver: 'Fatima Zahra', revenue: 2300, rides: 42, rating: 4.7 },
        { id: 3, name: 'Taxi-003', driver: 'Mohammed Ali', revenue: 2100, rides: 38, rating: 4.6 },
        { id: 4, name: 'Taxi-004', driver: 'Amina Ben', revenue: 1900, rides: 35, rating: 4.5 },
        { id: 5, name: 'Taxi-005', driver: 'Omar Khalil', revenue: 1800, rides: 33, rating: 4.4 }
      ];
      
      this.topClients = [
        { id: 1, name: 'Karim Ben', phone: '+212-6-1234-5678', rides: 28, totalSpent: 850, lastRide: '2024-01-15' },
        { id: 2, name: 'Sara Ahmed', phone: '+212-6-2345-6789', rides: 25, totalSpent: 780, lastRide: '2024-01-14' },
        { id: 3, name: 'Youssef Ali', phone: '+212-6-3456-7890', rides: 22, totalSpent: 720, lastRide: '2024-01-13' },
        { id: 4, name: 'Layla Hassan', phone: '+212-6-4567-8901', rides: 20, totalSpent: 680, lastRide: '2024-01-12' },
        { id: 5, name: 'Adam Khalil', phone: '+212-6-5678-9012', rides: 18, totalSpent: 620, lastRide: '2024-01-11' }
      ];
      
      resolve();
    });
  }

  loadRevenueData(): Promise<void> {
    return new Promise((resolve) => {
      // Simulate revenue data based on period
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      this.revenueData = months.map((month, index) => ({
        month,
        revenue: Math.floor(Math.random() * 5000) + 10000,
        rides: Math.floor(Math.random() * 200) + 300,
        profit: Math.floor(Math.random() * 2000) + 4000
      }));
      
      resolve();
    });
  }

  loadRideFrequency(): Promise<void> {
    return new Promise((resolve) => {
      // Simulate ride frequency data
      const hours = Array.from({length: 24}, (_, i) => i);
      this.rideFrequency = hours.map(hour => ({
        hour: `${hour}:00`,
        rides: Math.floor(Math.random() * 50) + 10,
        revenue: Math.floor(Math.random() * 500) + 100
      }));
      
      resolve();
    });
  }

  loadOverallStatistics(): Promise<void> {
    return new Promise((resolve) => {
      // Simulate overall statistics
      this.totalRevenue = 125000;
      this.totalRides = 2847;
      this.averageRating = 4.6;
      this.totalClients = 456;
      this.totalTaxis = 89;
      this.successRate = 94.2;
      
      resolve();
    });
  }

  initializeCharts(): void {
    // Revenue Chart
    this.revenueChartOptions = {
      series: [{
        name: 'Revenue',
        data: this.revenueData.map(d => d.revenue)
      }, {
        name: 'Profit',
        data: this.revenueData.map(d => d.profit)
      }],
      chart: {
        type: 'area',
        height: 350,
        toolbar: {
          show: false
        }
      },
      colors: ['#0d6efd', '#28a745'],
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
        categories: this.revenueData.map(d => d.month)
      },
      yaxis: {
        labels: {
          formatter: (value: number) => `$${value.toLocaleString()}`
        }
      },
      tooltip: {
        y: {
          formatter: (value: number) => `$${value.toLocaleString()}`
        }
      }
    };

    // Performance Chart
    this.performanceChartOptions = {
      series: [{
        name: 'Rides',
        data: this.revenueData.map(d => d.rides)
      }],
      chart: {
        type: 'bar',
        height: 350,
        toolbar: {
          show: false
        }
      },
      colors: ['#17a2b8'],
      dataLabels: {
        enabled: false
      },
      xaxis: {
        categories: this.revenueData.map(d => d.month)
      },
      yaxis: {
        labels: {
          formatter: (value: number) => value.toLocaleString()
        }
      }
    };

    // Ride Frequency Chart
    this.rideFrequencyChartOptions = {
      series: [{
        name: 'Rides per Hour',
        data: this.rideFrequency.map(d => d.rides)
      }],
      chart: {
        type: 'line',
        height: 300,
        toolbar: {
          show: false
        }
      },
      colors: ['#ffc107'],
      dataLabels: {
        enabled: false
      },
      stroke: {
        curve: 'smooth',
        width: 3
      },
      xaxis: {
        categories: this.rideFrequency.map(d => d.hour)
      },
      yaxis: {
        labels: {
          formatter: (value: number) => value.toLocaleString()
        }
      }
    };

    // Top Performers Chart
    this.topPerformersChartOptions = {
      series: this.topTaxis.map(taxi => taxi.revenue),
      chart: {
        type: 'donut',
        height: 300
      },
      labels: this.topTaxis.map(taxi => taxi.name),
      colors: ['#28a745', '#17a2b8', '#ffc107', '#dc3545', '#6c757d'],
      legend: {
        position: 'bottom'
      },
      plotOptions: {
        pie: {
          donut: {
            size: '60%'
          }
        }
      }
    };
  }

  onPeriodChange(): void {
    this.loadAnalyticsData();
  }

  onYearChange(): void {
    this.loadAnalyticsData();
  }

  exportReport(format: string): void {
    console.log(`Exporting ${format} report for ${this.selectedPeriod} ${this.selectedYear}`);
    // TODO: Implement actual export functionality
  }

  openDetailedReport(modal: any, type: string): void {
    console.log(`Opening detailed ${type} report`);
    // TODO: Implement detailed report modal
  }

  getPerformanceColor(performance: number): string {
    if (performance >= 90) return 'text-success';
    if (performance >= 75) return 'text-warning';
    return 'text-danger';
  }

  getRatingStars(rating: number): string {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    return '★'.repeat(fullStars) + (hasHalfStar ? '☆' : '') + '☆'.repeat(emptyStars);
  }
}
