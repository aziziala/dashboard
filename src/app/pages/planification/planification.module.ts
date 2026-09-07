import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { PlanificationRoutingModule } from './planification-routing.module';

import { ReservationListComponent } from './components/reservation-list/reservation-list.component';
import { ReservationDetailsModalComponent } from './components/reservation-details-modal/reservation-details-modal.component';
import { ReservationCreateComponent } from './components/reservation-create/reservation-create.component';
import { TaxiPickerComponent } from './components/taxi-picker/taxi-picker.component';

import { SharedModule } from '../../components/shared/shared.module';



@NgModule({
  declarations: [
    ReservationListComponent,
    ReservationDetailsModalComponent,
    ReservationCreateComponent,
    TaxiPickerComponent,
  ],
  imports: [
    CommonModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    NgbModule,
    PlanificationRoutingModule,
    SharedModule
  ]
})
export class PlanificationModule {}
