import { Component, OnInit } from '@angular/core';
import { StatisticsService } from '../../services/statistics.service';

@Component({
  selector: 'app-analytics',
  templateUrl: './analytics.component.html',
  styleUrls: ['./analytics.component.scss']
})
export class AnalyticsComponent implements OnInit {

  stats: any;
  revenueStats: any;
  trendChart: any;
  ridesChart: any;

  from = '2026-01-01';
  to = new Date().toISOString().split('T')[0];

  loading = false;
  error = false;
  activePreset = '';
  periodLabel = '';

  constructor(private statsService: StatisticsService) {}

  ngOnInit(): void {
    this.loadStats();
  }

  // ─── DATE PRESETS ────────────────────────────────
  setPreset(preset: string): void {
    this.activePreset = preset;
    const today = new Date();
    const yyyy  = today.getFullYear();
    const mm    = today.getMonth();
    const dd    = today.getDate();

    switch (preset) {
      case 'today':
        this.from = this.to = this.fmt(today);
        this.periodLabel = "Aujourd'hui";
        break;

      case 'week': {
        const d = new Date(today);
        d.setDate(dd - 6);
        this.from = this.fmt(d);
        this.to   = this.fmt(today);
        this.periodLabel = 'Cette semaine';
        break;
      }

      case 'month':
        this.from = this.fmt(new Date(yyyy, mm, 1));
        this.to   = this.fmt(today);
        this.periodLabel = 'Ce mois';
        break;

      case 'year':
        this.from = `${yyyy}-01-01`;
        this.to   = this.fmt(today);
        this.periodLabel = 'Cette année';
        break;
    }

    this.loadStats();
  }

  private fmt(d: Date): string {
    return d.toISOString().split('T')[0];
  }

  // ─── LOAD DATA ───────────────────────────────────
  loadStats(): void {
    this.loading = true;
    this.error   = false;

    // Overview
    this.statsService.getOverview(this.from, this.to).subscribe({
      next: (res) => {
        this.stats   = res;
        this.loading = false;
        this.initRidesChart();
      },
      error: () => {
        this.error   = true;
        this.loading = false;
      }
    });

    // Revenue details
    this.statsService.getRevenueStats(this.from, this.to).subscribe({
      next: (res) => this.revenueStats = res,
      error: () => {}
    });

    // Trends
    this.statsService.getRevenueTrends(this.from, this.to).subscribe({
      next: (res) => this.initTrendChart(res),
      error: () => {}
    });
  }

  // ─── RIDES BAR CHART ────────────────────────────
  private initRidesChart(): void {
    if (!this.stats) return;

    this.ridesChart = {
      series: [{
        name: 'Courses',
        data: [
          this.stats.avgRidesPerDay   || 0,
          this.stats.avgRidesPerMonth || 0,
          this.stats.avgRidesPerYear  || 0
        ]
      }],
      chart: {
        type: 'bar',
        height: 300,
        toolbar: { show: false },
        fontFamily: 'inherit'
      },
      xaxis: {
        categories: ['Jour', 'Mois', 'Année'],
        labels: { style: { fontWeight: 500 } }
      },
      colors: ['#4B4BAF'],
      plotOptions: {
        bar: {
          borderRadius: 8,
          columnWidth: '50%'
        }
      },
      dataLabels: {
        enabled: true,
        style: { fontSize: '12px', fontWeight: 600 },
        formatter: (val: number) => val.toFixed(1)
      },
      tooltip: {
        y: {
          formatter: (val: number) => `${val.toFixed(1)} courses`
        }
      }
    };
  }

  // ─── TREND CHART ────────────────────────────────
  private initTrendChart(data: any[]): void {
    if (!data || !data.length) {
      this.trendChart = { series: [] };
      return;
    }

    this.trendChart = {
      series: [
        {
          name: 'Courses',
          type: 'area',
          data: data.map(d => d.rides || 0)
        },
        {
          name: 'Revenus',
          type: 'line',
          data: data.map(d => d.revenue || 0)
        }
      ],
      chart: {
        height: 380,
        type: 'line',
        toolbar: {
          show: true,
          tools: { download: true, selection: false, zoom: true, zoomin: true, zoomout: true, pan: false }
        },
        fontFamily: 'inherit',
        animations: { enabled: true, easing: 'easeinout', speed: 800 }
      },
      stroke: {
        width: [2, 3],
        curve: 'smooth'
      },
      colors: ['#22c55e', '#4B4BAF'],
      fill: {
        type: 'gradient',
        gradient: {
          opacityFrom: 0.35,
          opacityTo: 0.05,
          shade: 'light',
          type: 'vertical'
        }
      },
      tooltip: {
        shared: true,
        intersect: false,
        y: {
          formatter: (val: number, opts: any) =>
            opts.seriesIndex === 1
              ? `${val.toLocaleString()} DT`
              : `${val} courses`
        }
      },
      xaxis: {
        categories: data.map(d =>
          new Date(d.bucketStart).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
        ),
        labels: { style: { fontSize: '11px' } },
        tickAmount: 10
      },
      yaxis: [
        {
          title: { text: 'Courses', style: { fontSize: '12px', fontWeight: 500 } },
          labels: { formatter: (val: number) => val.toFixed(0) }
        },
        {
          opposite: true,
          title: { text: 'Revenus (DT)', style: { fontSize: '12px', fontWeight: 500 } },
          labels: { formatter: (val: number) => val.toLocaleString() }
        }
      ],
      legend: {
        position: 'top',
        horizontalAlign: 'right',
        fontSize: '13px',
        markers: { width: 10, height: 10, radius: 4 }
      },
      dataLabels: { enabled: false },
      grid: {
        borderColor: '#f1f5f9',
        strokeDashArray: 4
      }
    };
  }

  // ─── EXPORT CSV ─────────────────────────────────
  exportCSV(): void {
    if (!this.stats && !this.revenueStats) return;

    const rows = [
      ['Indicateur', 'Valeur'],
      ['Revenus Totaux',      this.stats?.totalRevenue || 0],
      ['Courses Totales',     this.stats?.totalRides || 0],
      ['Moyenne / Course',    this.revenueStats?.avgRevenuePerRide || 0],
      ['Médiane / Course',    this.revenueStats?.medianRevenuePerRide || 0],
      ['Courses Complétées',  this.revenueStats?.completedRides || 0],
      ['Moy. Courses / Jour', this.stats?.avgRidesPerDay || 0],
      ['Moy. Courses / Mois', this.stats?.avgRidesPerMonth || 0],
      ['Moy. Courses / Année',this.stats?.avgRidesPerYear || 0]
    ];

    const csv  = rows.map(r => r.join(';')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `stats_revenus_${this.from}_${this.to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}