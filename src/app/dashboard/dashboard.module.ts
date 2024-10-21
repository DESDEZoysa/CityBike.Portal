import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardComponent } from './dashboard.component';
import { DashboardRoutingModule } from './dashboard-routing.module';
import { SharedModule } from '../shared/shared.module';
import { DashboardFilterMapComponent } from './dashboard-filter-map/dashboard-filter-map.component';
import { MatSelectModule } from '@angular/material/select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { NgxSpinnerModule } from 'ngx-spinner';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

@NgModule({
  imports: [
    CommonModule,
    SharedModule,
    DashboardRoutingModule,
    NgxSpinnerModule,
    MatSidenavModule,
    MatSelectModule,
    NgxMatSelectSearchModule
  ],
  exports: [
    DashboardComponent

  ],
  declarations: [
    DashboardComponent,
    DashboardFilterMapComponent
  ]
})
export class DashBoardModule { }
