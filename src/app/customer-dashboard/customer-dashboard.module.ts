import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CustomerDashboardRoutingModule } from './customer-dashboard-routing.module';
import { CustomerDashboardComponent } from './customer-dashboard.component';
import { CustomerMapComponent } from './customer-map/customer-map.component';
import { SharedModule } from '../shared/shared.module';
import { DockingStationsListComponent } from './docking-stations-list/docking-stations-list.component';
import { BikesListComponent } from './bikes-list/bikes-list.component';

@NgModule({
  imports: [
    CommonModule,
    SharedModule,
    CustomerDashboardRoutingModule
  ],
  declarations: [
    CustomerDashboardComponent,
    CustomerMapComponent,
    DockingStationsListComponent,
    BikesListComponent
  ]
})
export class CustomerDashboardModule { }
