import { Component, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TaxiService } from '../../services/taxi.service';
import { ClientService } from '../../services/client.service';
import { SmsService } from '../../services/sms.service';
import { FleetService } from '../../services/fleet.service';
import { StatisticsService } from '../../services/statistics.service';
import {  } from '../../services/fleet.service';
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
    private fleetService: FleetService,
    private statisticsService: StatisticsService
  ) { }

  ngOnInit(): void {
    this.loadAnalyticsData();
    this.initializeCharts();
  }

loadAnalyticsData(): void {
  this.isLoading = true;

  Promise.all([
    this.loadTopPerformers(),
    this.loadRevenueData(),
    this.loadRideFrequency(),
    this.loadOverview() // ✅ NEW
  ]).finally(() => {
    this.isLoading = false;
  });
}

loadTopPerformers(): Promise<void> {
  return new Promise((resolve) => {

    this.statisticsService.getTopTaxis()
      .subscribe((res) => {
        this.topTaxis = res;
      });

    this.statisticsService.getTopClients()
      .subscribe((res) => {
        this.topClients = res;
      });

    resolve();
  });
}

loadRevenueData(): Promise<void> {
  return new Promise((resolve) => {

    this.statisticsService.getRevenueTrends(this.from, this.to)
      .subscribe((res: any[]) => {

        // store raw data if you need it
        this.revenueData = res;

        // 🔥 map data for charts
        const categories = res.map(item => item.bucketStart);
        const revenues = res.map(item => item.revenue);
        const rides = res.map(item => item.rides);
        const profits = res.map(item => item.profit ?? 0);

        // ✅ update chart directly (better than re-init)
        this.revenueChartOptions.series = [
          {
            name: 'Revenue',
            data: revenues
          },
          {
            name: 'Profit',
            data: profits
          }
        ];

        this.revenueChartOptions.xaxis = {
          categories: categories
        };

        resolve();
      });

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

from = '2026-04-01';
to = '2026-04-30';

loadOverview(): Promise<void> {
  return new Promise((resolve) => {

    this.statisticsService.getOverview(this.from, this.to)
      .subscribe((res: any) => {

        this.totalRevenue = res.totalRevenue;
        this.totalRides = res.totalRides;
        this.totalClients = res.totalClients;
        this.totalTaxis = res.totalTaxis;
        this.successRate = res.successRate * 100;

        resolve();
      });
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
