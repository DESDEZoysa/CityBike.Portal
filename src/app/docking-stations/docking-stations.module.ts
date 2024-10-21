import { AddPriorityGroupPopupComponent } from './../users/add-priority-group-popup/add-priority-group-popup.component';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DockingStationsRoutingModule } from './docking-stations-routing.module';
import { SharedModule } from '../shared/shared.module';
import { DockingStationsComponent } from './docking-stations.component';
import { StationsMapComponent } from './stations-map/stations-map.component';
import { AllStationsMapComponent } from './all-stations-map/all-stations-map.component';
import { CreateDockingStationsComponent } from './create-docking-stations/create-docking-stations.component';
import { NgxSpinnerModule } from 'ngx-spinner';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { AddPriorityGroupPopupModule } from '../users/add-priority-group-popup/add-priority-group-popup.component.module';
import { StationTechnicalDetailsComponent } from './station-technical-details/station-technical-details.component';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { DisableStationConfirmationPopupComponent } from './create-docking-stations/disable-station-confirmation-popup/disable-station-confirmation-popup.component';

@NgModule({
  imports: [
    CommonModule,
    DockingStationsRoutingModule,
    SharedModule,
    NgxSpinnerModule,
    NgxMatSelectSearchModule,
    AddPriorityGroupPopupModule,
    MatDatepickerModule,
    MatInputModule,
    MatFormFieldModule
  ],
  exports: [
    DockingStationsComponent
  ],
  declarations: [
    DockingStationsComponent,
    StationsMapComponent,
    AllStationsMapComponent,
    CreateDockingStationsComponent,
    StationTechnicalDetailsComponent,
    DisableStationConfirmationPopupComponent,
  ],
  entryComponents: [
    AddPriorityGroupPopupComponent
  ]
})
export class DockingStationsModule { }
