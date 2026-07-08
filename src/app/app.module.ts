import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { ToastrModule } from 'ngx-toastr';

// ngx-translate
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import {
  TranslateHttpLoader,
  TRANSLATE_HTTP_LOADER_CONFIG
} from '@ngx-translate/http-loader';

// Bootstrap
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

// Charts
import { NgApexchartsModule } from 'ng-apexcharts';

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

import { TaxisActifsComponent } from './pages/gestion-etats/taxis-actifs/taxis-actifs.component';
import { PaginationComponent } from './components/shared//pagination/pagination.component';
import { GestionEtatsService  }    from './services/gestion-etats.service';

// Layout
import { LayoutSettingsComponent } from './components/layout-settings/layout-settings.component';
import { TopbarComponent } from './components/topbar/topbar.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { RightSidebarComponent } from './components/right-sidebar/right-sidebar.component';

// Routing
import { AppRoutingModule } from './app-routing.module';

// Services
import { TaxiService } from './services/taxi.service';
import { SmsService } from './services/sms.service';
import { FleetService } from './services/fleet.service';
import { ClientService } from './services/client.service';
import { AuthService } from './services/auth.service';
import { NotificationService } from './services/notification.service';
import { ReclamationsComponent } from './pages/reclamations/reclamations/reclamations.component';
import { SyncTaxiAccountComponent } from './pages/sync-taxi-account/sync-taxi-account.component';
import { TaxisInactifsComponent } from './pages/gestion-etats/taxis-inactifs/taxis-inactifs.component';
import { TaxisEarningsComponent } from './pages/gestion-etats/taxis-earnings/taxis-earnings.component';
import { TaxisCoursesComponent } from './pages/gestion-etats/taxis-courses/taxis-courses.component';
import { TaxisBonusComponent } from './pages/gestion-etats/taxis-bonus/taxis-bonus.component';
import { TaxiTrafficHistoryComponent } from './pages/gestion-etats/taxi-traffic-history/taxi-traffic-history.component';
import { SendNotificationComponent } from './pages/notification/send-notification/send-notification.component';
import { Notificationv2Service } from './services/notificationv2.service';
import { ListeNotificationComponent } from './pages/notification/liste-notification/liste-notification.component';
import { AllTrafficHistoryComponent } from './pages/gestion-etats/all-traffic-history/all-traffic-history.component';
import { AllDemandesByStateComponent } from './pages/gestion-etats/all-demandes-by-state/all-demandes-by-state.component';
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
    
  ReclamationsComponent,
    SyncTaxiAccountComponent,
  TaxisActifsComponent,
  TaxisInactifsComponent,
  TaxisEarningsComponent,
  TaxisCoursesComponent,
  TaxisBonusComponent,
  TaxiTrafficHistoryComponent,
  PaginationComponent,
  SendNotificationComponent,
  ListeNotificationComponent,
  AllTrafficHistoryComponent,
  AllDemandesByStateComponent
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

    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useClass: TranslateHttpLoader
      },
      fallbackLang: 'fr' // ✅ replaces defaultLanguage
    }),

    ToastrModule.forRoot({
   timeOut: 3500,
  positionClass: 'toast-bottom-center',
  preventDuplicates: true,
  progressBar: true,
  closeButton: true,
  newestOnTop: true,
  easeTime: 300,
  tapToDismiss: true
})
  ],

  providers: [
    TaxiService,
    SmsService,
    FleetService,
    ClientService,
    AuthService,
    NotificationService,
    GestionEtatsService,
    Notificationv2Service,

    // ✅ REQUIRED for new ngx-translate-http-loader
    {
      provide: TRANSLATE_HTTP_LOADER_CONFIG,
      useValue: {
        prefix: './assets/i18n/',
        suffix: '.json'
      }
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}