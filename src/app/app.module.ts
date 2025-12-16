import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatSnackBarModule } from '@angular/material/snack-bar';



// Bootstrap
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

// Charts
import { NgApexchartsModule } from 'ng-apexcharts';

// Environment
import { environment } from '../environments/environment';

// Components
import { AppComponent } from './app.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { TaxiManagementComponent } from './pages/taxi-management/taxi-management.component';
import { ClientManagementComponent } from './pages/client-management/client-management.component';
import { SmsManagementComponent } from './pages/sms-management/sms-management.component';
import { FleetManagementComponent } from './pages/fleet-management/fleet-management.component';
import { AffectationClientComponent } from './pages/affectation-client/affectation-client.component';
import { AnalyticsComponent } from './pages/analytics/analytics.component';
import { RideManagementComponent } from './pages/ride-management/ride-management.component';
import { RealTimeMonitoringComponent } from './pages/real-time-monitoring/real-time-monitoring.component';
import { SmsGatewayMonitoringComponent } from './pages/sms-gateway-monitoring/sms-gateway-monitoring.component';


// import { MapViewComponent } from './components/map-view/map-view.component';
// import { TaxiProfileComponent } from './components/taxi-profile/taxi-profile.component';
// import { ClientProfileComponent } from './components/client-profile/client-profile.component';
// import { NotificationCenterComponent } from './components/notification-center/notification-center.component';

// Services
import { TaxiService } from './services/taxi.service';
import { SmsService } from './services/sms.service';
import { FleetService } from './services/fleet.service';
import { ClientService } from './services/client.service';
import { AuthService } from './services/auth.service';
import { NotificationService } from './services/notification.service';

// Models
import { Taxi } from './models/taxi.model';
import { SmsRecord } from './models/sms-record.model';
import { FleetLocation } from './models/fleet-location.model';
import { Client } from './models/client.model';

// Routing
import { AppRoutingModule } from './app-routing.module';
import { LayoutSettingsComponent } from './components/layout-settings/layout-settings.component';
import { TopbarComponent } from './components/topbar/topbar.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { RightSidebarComponent } from './components/right-sidebar/right-sidebar.component';





@NgModule({
  declarations: [
    AppComponent,
    DashboardComponent,
    TaxiManagementComponent,
    ClientManagementComponent,
    SmsManagementComponent,
    FleetManagementComponent,
    AffectationClientComponent,
    AnalyticsComponent,
    RideManagementComponent,
    RealTimeMonitoringComponent,
    SmsGatewayMonitoringComponent,
    LayoutSettingsComponent,
    TopbarComponent,
    SidebarComponent,
    RightSidebarComponent,
    // MapViewComponent,
    // TaxiProfileComponent,
    // ClientProfileComponent,
    // NotificationCenterComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    NgbModule,
    NgApexchartsModule,
    AppRoutingModule,
    MatSnackBarModule,
    BrowserAnimationsModule
  ],
  providers: [
    TaxiService,
    SmsService,
    FleetService,
    ClientService,
    AuthService,
    NotificationService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
