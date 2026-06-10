import { Component, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import {
  StatisticsService,
  StatisticsOverviewDto,
  TimeSeriesPointDto,
  TaxiPerformanceDto,
  ClientPerformanceDto,
  ReferralTaxiStatsDto,
  BucketSize,
} from '../../services/statistics.service';

// ─────────────────────────────────────────────────────────────────────────────
// BRAND COLORS
// ─────────────────────────────────────────────────────────────────────────────

const NAVY = '#211F54';
const YELLOW = '#FFC900';
const NAVY60 = '#4B4BAF';
const NAVY40 = '#7B7BC7';

@Component({
  selector: 'app-analytics',
  templateUrl: './analytics.component.html',
  styleUrls: ['./analytics.component.scss'],
})
export class AnalyticsComponent implements OnInit {

  // ───────────────────────────────────────────────────────────────────────────
  // STATE
  // ───────────────────────────────────────────────────────────────────────────

  isLoading = false;

  selectedPeriod:
    | 'daily'
    | 'weekly'
    | 'monthly'
    | 'quarterly'
    | 'yearly' = 'monthly';

  selectedYear = new Date().getFullYear();

  years = [2022, 2023, 2024, 2025, 2026];

  // ───────────────────────────────────────────────────────────────────────────
  // KPI VALUES
  // ───────────────────────────────────────────────────────────────────────────

  totalRevenue = 0;
  totalRides = 0;
  averageRating = 0;
  totalClients = 0;
  totalTaxis = 0;
  successRate = 0;

  // ───────────────────────────────────────────────────────────────────────────
  // TABLE DATA
  // ───────────────────────────────────────────────────────────────────────────

  topTaxis: TaxiPerformanceDto[] = [];

  topClients: ClientPerformanceDto[] = [];

  topReferrals: ReferralTaxiStatsDto[] = [];

  // ───────────────────────────────────────────────────────────────────────────
  // CHARTS
  // ───────────────────────────────────────────────────────────────────────────

  revenueChartOptions: any = {};

  performanceChartOptions: any = {};

  rideFrequencyChartOptions: any = {};

  topPerformersChartOptions: any = {};

  constructor(
    private modalService: NgbModal,
    private statisticsService: StatisticsService
  ) {}

  // ───────────────────────────────────────────────────────────────────────────
  // INIT
  // ───────────────────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.loadAll();
  }

  // ───────────────────────────────────────────────────────────────────────────
  // DATE HELPERS
  // ───────────────────────────────────────────────────────────────────────────

  private get dateRange(): { from: string; to: string } {

    return StatisticsService.buildDateRange(
      this.selectedPeriod,
      this.selectedYear
    );
  }

  private get bucket(): BucketSize {

    return StatisticsService.periodToBucket(
      this.selectedPeriod
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // LOAD ALL DATA
  // ───────────────────────────────────────────────────────────────────────────

  loadAll(): void {

    this.isLoading = true;

    const { from, to } = this.dateRange;

    let done = 0;

   const totalRequests = 4;

    const check = () => {

      done++;

      if (done >= totalRequests) {
        this.isLoading = false;
      }
    };

    // ────────────────────────────────────────────────────────────────────────
    // OVERVIEW
    // ────────────────────────────────────────────────────────────────────────

    this.statisticsService.getOverview(from, to).subscribe({

      next: (res: StatisticsOverviewDto) => {

        this.totalRevenue = res.totalRevenue ?? 0;

        this.totalRides = res.totalRides ?? 0;

        this.totalClients = res.totalClients ?? 0;

        this.totalTaxis = res.totalTaxis ?? 0;

        this.successRate = (res.successRate ?? 0) * 100;
      },

      error: (err) => {
        console.error('Overview error', err);
              check();
      },

      complete: check,
    });

    // ────────────────────────────────────────────────────────────────────────
    // REVENUE CHART
    // ────────────────────────────────────────────────────────────────────────

    this.statisticsService
      .getRevenueTrends(from, to, this.bucket, 20)
      .subscribe({

        next: (points: TimeSeriesPointDto[]) => {

          this.buildRevenueChart(points);

          this.buildPerformanceChart(points);
        },

        error: (err) => {
          console.error('Revenue trends error', err);
                check();
      },

        complete: check,
      });

    // ────────────────────────────────────────────────────────────────────────
    // TOP TAXIS
    // ────────────────────────────────────────────────────────────────────────

    this.statisticsService
      .getTopTaxis(from, to, 'RIDES', 0, 10)
      .subscribe({

        next: (taxis) => {

          this.topTaxis = taxis || [];

          if (taxis?.length) {

            this.averageRating =
              taxis.reduce(
                (sum, taxi) => sum + (taxi.rating ?? 0),
                0
              ) / taxis.length;
          }

          this.buildTopPerformersChart(taxis);
        },

        error: (err) => {
          console.error('Top taxis error', err);
                check();
      },

        complete: check,
      });

    // ────────────────────────────────────────────────────────────────────────
    // TOP CLIENTS
    // ────────────────────────────────────────────────────────────────────────

    this.statisticsService
      .getTopClients(from, to, 'RIDES', 0, 10)
      .subscribe({

        next: (clients) => {

          this.topClients = clients || [];
        },

        error: (err) => {
          console.error('Top clients error', err);
                check();
      },

        complete: check,
      });

    // ────────────────────────────────────────────────────────────────────────
    // TOP REFERRALS
    // ────────────────────────────────────────────────────────────────────────

    this.statisticsService
      .getTopReferralTaxis(0, 10)
      .subscribe({

        next: (referrals) => {

          this.topReferrals = referrals || [];
        },

        error: (err) => {

          console.error('Top referrals error', err);

          this.topReferrals = [];
                check();
      },

        complete: check,
      });
  }

  // ───────────────────────────────────────────────────────────────────────────
  // CHART BUILDERS
  // ───────────────────────────────────────────────────────────────────────────

  private buildRevenueChart(
    points: TimeSeriesPointDto[]
  ): void {

    const labels = points.map(p =>
      this.formatBucket(p.bucketStart)
    );

    const revenues = points.map(
      p => +(p.revenue ?? 0).toFixed(2)
    );

    const profits = points.map(
      p => +(p.profit ?? 0).toFixed(2)
    );

    this.revenueChartOptions = {

      series: [
        {
          name: 'Revenue',
          data: revenues,
        },
        {
          name: 'Profit',
          data: profits,
        },
      ],

      chart: {
        type: 'area',
        height: 350,
        toolbar: { show: false },
        fontFamily: 'All round gothic, sans-serif',
      },

      colors: [NAVY, YELLOW],

      dataLabels: {
        enabled: false,
      },

      stroke: {
        curve: 'smooth',
        width: 2,
      },

      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.55,
          opacityTo: 0.05,
        },
      },

      xaxis: {
        categories: labels,
        labels: {
          style: {
            colors: '#6c757d',
            fontSize: '12px',
          },
        },
      },

      yaxis: {
        labels: {
          formatter: (v: number) =>
            `${v.toLocaleString()} DT`,
        },
      },

      tooltip: {
        y: {
          formatter: (v: number) =>
            `${v.toLocaleString()} DT`,
        },
      },

      legend: {
        position: 'top',
      },

      grid: {
        borderColor: '#f1f1f1',
      },
    };
  }

  private buildPerformanceChart(
    points: TimeSeriesPointDto[]
  ): void {

    const labels = points.map(p =>
      this.formatBucket(p.bucketStart)
    );

    const rides = points.map(
      p => p.rides ?? 0
    );

    this.performanceChartOptions = {

      series: [
        {
          name: 'Rides',
          data: rides,
        },
      ],

      chart: {
        type: 'bar',
        height: 350,
        toolbar: { show: false },
        fontFamily: 'All round gothic, sans-serif',
      },

      colors: [NAVY60],

      dataLabels: {
        enabled: false,
      },

      xaxis: {
        categories: labels,
      },

      yaxis: {
        labels: {
          formatter: (v: number) =>
            v.toLocaleString(),
        },
      },

      plotOptions: {
        bar: {
          borderRadius: 4,
          columnWidth: '55%',
        },
      },

      grid: {
        borderColor: '#f1f1f1',
      },
    };
  }

  private buildTopPerformersChart(
    taxis: TaxiPerformanceDto[]
  ): void {

    if (!taxis?.length) {
      return;
    }

    this.topPerformersChartOptions = {

      series: taxis.map(
        t => +(t.revenue ?? 0).toFixed(2)
      ),

      chart: {
        type: 'donut',
        height: 300,
      },

      labels: taxis.map(
        t => t.nom || t.telephone
      ),

      colors: [
        NAVY,
        YELLOW,
        NAVY60,
        NAVY40,
        '#6c757d',
      ],

      legend: {
        position: 'bottom',
      },

      plotOptions: {
        pie: {
          donut: {
            size: '60%',
          },
        },
      },

      tooltip: {
        y: {
          formatter: (v: number) =>
            `${v.toLocaleString()} DT`,
        },
      },
    };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // PERIOD CHANGES
  // ───────────────────────────────────────────────────────────────────────────

  onPeriodChange(): void {
    this.loadAll();
  }

  onYearChange(): void {
    this.loadAll();
  }

  // ───────────────────────────────────────────────────────────────────────────
  // EXPORT
  // ───────────────────────────────────────────────────────────────────────────

  exportReport(format: string): void {

    console.log(
      `Exporting ${format} for ${this.selectedPeriod} ${this.selectedYear}`
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // MODAL
  // ───────────────────────────────────────────────────────────────────────────

  openDetailedReport(
    modal: any,
    type: string
  ): void {

    console.log(`Opening detailed ${type} report`);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // HELPERS
  // ───────────────────────────────────────────────────────────────────────────

  get avgRidesPerDayBarWidth(): number {

    return Math.min(
      ((this.totalRides / 30) / 50) * 100,
      100
    );
  }

  getPerformanceColor(value: number): string {

    if (value >= 90) {
      return 'text-success';
    }

    if (value >= 75) {
      return 'text-warning';
    }

    return 'text-danger';
  }

  getRatingStars(rating: number): string {

    const full = Math.floor(rating ?? 0);

    const half =
      (rating ?? 0) % 1 >= 0.5 ? 1 : 0;

    const empty = 5 - full - half;

    return (
      '★'.repeat(full) +
      (half ? '½' : '') +
      '☆'.repeat(empty)
    );
  }

  private formatBucket(iso: string): string {

    if (!iso) {
      return '';
    }

    const d = new Date(iso);

    if (this.bucket === 'DAY') {

      return d.toLocaleDateString('fr-TN', {
        day: '2-digit',
        month: 'short',
      });
    }

    if (this.bucket === 'MONTH') {

      return d.toLocaleDateString('fr-TN', {
        month: 'short',
        year: 'numeric',
      });
    }

    return String(d.getFullYear());
  }
}