import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ReservationListComponent } from './components/reservation-list/reservation-list.component';
import { ReservationCreateComponent } from './components/reservation-create/reservation-create.component';

const routes: Routes = [
  { path: 'reservations', component: ReservationListComponent },
  { path: 'reservations/nouvelle', component: ReservationCreateComponent },
  { path: '', redirectTo: 'reservations', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PlanificationRoutingModule {}