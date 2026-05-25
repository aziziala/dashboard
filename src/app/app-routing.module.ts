import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { InscriptionTaxiComponent } from './pages/TaxiCrud/inscription-taxi/inscription-taxi.component';
import { LoginComponent } from './pages/sign-in-up/login/login.component';
import { SignUpComponent } from './pages/sign-in-up/sign-up/sign-up.component';
import { ForgotPassComponent } from './pages/sign-in-up/forgot-pass/forgot-pass.component';
import { TaxiManagementComponent } from './pages/taxi-management/taxi-management.component';
import { ClientManagementComponent } from './pages/client-management/client-management.component';
import { SmsManagementComponent } from './pages/sms-management/sms-management.component';
import { FleetManagementComponent } from './pages/fleet-management/fleet-management.component';
import { AffectationClientComponent } from './pages/affectation-client/affectation-client.component';
import { AnalyticsComponent } from './pages/analytics/analytics.component';
import { RideManagementComponent } from './pages/ride-management/ride-management.component';
import { RealTimeMonitoringComponent } from './pages/real-time-monitoring/real-time-monitoring.component';
import { SmsGatewayMonitoringComponent } from './pages/sms-gateway-monitoring/sms-gateway-monitoring.component';
import { ReclamationsComponent } from './pages/reclamations/reclamations/reclamations.component';
import { PromoManagementComponent } from './pages/promo-management/promo-management.component';


const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'add-taxi', component: InscriptionTaxiComponent },
  { path: 'login', component: LoginComponent, data: { noLayout: true } },
  { path: 'signup', component: SignUpComponent, data: { noLayout: true } },
  { path: 'forgotPass', component: ForgotPassComponent, data: { noLayout: true } },
  { path: 'taxis', component: TaxiManagementComponent },
  { path: 'clients', component: ClientManagementComponent },
  { path: 'sms', component: SmsManagementComponent },
  { path: 'fleet', component: FleetManagementComponent },
  { path: 'affectation-client', component: AffectationClientComponent },
  { path: 'analytics', component: AnalyticsComponent },
  { path: 'rides', component: RideManagementComponent },
  { path: 'monitoring', component: RealTimeMonitoringComponent },
  { path: 'sms-gateway', component: SmsGatewayMonitoringComponent },
  { path: 'reclamations', component: ReclamationsComponent },
  { path: 'promotion', component: PromoManagementComponent },
  { path: '**', redirectTo: '/dashboard' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
