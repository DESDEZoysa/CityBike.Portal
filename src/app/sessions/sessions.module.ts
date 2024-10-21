import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SessionsComponent } from './sessions.component';
import { SessionsRoutingModule } from './sessions-routing.module';
import { SharedModule } from '../shared/shared.module';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { RideSessionComponent } from './ride-session/ride-session.component';
import { SessionHistorySupportComponent } from './session-history-support/session-history-support.component';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { SessionStartEndReasonsPipe } from '../core/pipes/session-reason.pipe';

@NgModule({
  imports: [
    CommonModule,
    SessionsRoutingModule,
    SharedModule,
    MatDatepickerModule,
    MatNativeDateModule,
    NgxMatSelectSearchModule,
  ],
  declarations: [
    SessionStartEndReasonsPipe,
    SessionsComponent,
    RideSessionComponent,
    SessionHistorySupportComponent
  ]
})
export class SessionsModule { }
