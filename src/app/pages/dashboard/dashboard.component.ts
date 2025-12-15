import { Component, OnInit } from '@angular/core';
import { TaxiService } from '../../services/taxi.service';
import { SmsService } from '../../services/sms.service';
import { FleetService } from '../../services/fleet.service';
import { ClientService } from '../../services/client.service';
import { ChartType, revenueChartOptions, smsChartOptions, taxiActivityChartOptions, monthlyEarningChartOptions } from '../../models/chart.model';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  
  // Dashboard statistics
  totalTaxis: number = 0;
  activeTaxis: number = 0;
  totalClients: number = 0;
  totalSmsSent: number = 0;
  totalSmsReceived: number = 0;
  totalRevenue: number = 0;
  fleetLocations: any[] = [];
  
  // Chart data
  revenueChartOptions: ChartType = revenueChartOptions;
  smsChartOptions: ChartType = smsChartOptions;
  taxiActivityChartOptions: ChartType = taxiActivityChartOptions;
  monthlyEarningChartOptions: ChartType = monthlyEarningChartOptions;
  
  // Recent activities
  recentTaxis: any[] = [];
  recentClients: any[] = [];
  recentSms: any[] = [];
  
  constructor(
    private taxiService: TaxiService,
    private smsService: SmsService,
    private fleetService: FleetService,
    private clientService: ClientService
  ) { }

  ngOnInit(): void {
    this.loadDashboardData();
    this.loadRecentActivities();
    this.initializeCharts();
  }

  loadDashboardData(): void {
    // Load taxi statistics
    /*this.taxiService.getTaxis().subscribe(taxis => {
      this.totalTaxis = taxis.length;
      this.activeTaxis = taxis.filter(t => t.taxiStatus === 'APPROVED').length;
    });
    */
    // Load SMS statistics
    this.smsService.getTotalSmsCount().subscribe(count => {
      this.totalSmsSent = count;
    });
    
    // Load fleet data
    this.fleetService.getFleetLocations().subscribe(locations => {
      this.fleetLocations = locations;
    });
  }

  initializeCharts(): void {
    // Charts are already initialized from the imported configurations
    // This method can be used for dynamic chart updates if needed
    console.log('Charts initialized');
  }



  loadRecentActivities(): void {
    // Load recent taxis
    /*this.taxiService.getTaxis().subscribe(taxis => {
      this.recentTaxis = taxis.slice(0, 5);
    });
    */
    // Load recent clients
    this.clientService.getClients().subscribe(clients => {
      this.recentClients = clients.slice(0, 5);
    });
    
    // Load recent SMS
    this.smsService.getSmsRecords().subscribe(sms => {
      this.recentSms = sms.slice(0, 5);
    });
  }
}
