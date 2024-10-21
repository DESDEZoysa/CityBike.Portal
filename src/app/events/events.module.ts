import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EventsComponent } from './events.component';
import { EventsRoutingModule } from './events-routing.module';
import { SharedModule } from '../shared/shared.module';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

@NgModule({
  imports: [
    CommonModule,
    EventsRoutingModule,
    SharedModule,
    MatDatepickerModule,
    MatNativeDateModule,
    NgxMatSelectSearchModule
  ],
  declarations: [EventsComponent]
})
export class EventsModule { }
