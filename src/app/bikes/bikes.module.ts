import { BikeLockPipe } from './../core/pipes/lock-state-pipe';
import { RepairModule } from './../repair/repair.module';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { BikesRoutingModule } from './bikes-routing.module';
import { SharedModule } from '../shared/shared.module';
import { BikesComponent } from './bikes.component';
import { NotOnTripsComponent } from './not-on-trips/not-on-trips.component';
import { OnTripsComponent } from './on-trips/on-trips.component';
import { BikeDetailsComponent } from './bike-details/bike-details.component';
import { BikePcbComponent } from './bike-pcb/bike-pcb.component';
import { BikePartsComponent } from './bike-parts/bike-parts.component';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, MAT_DATE_LOCALE } from '@angular/material/core';
import { BikeMapTrackComponent } from './bike-map-track/bike-map-track.component';
import { BikeMaintenanceComponent } from './bike-maintenance/bike-maintenance.component';
import { BikeStatusPipe } from '../core/pipes/bike-status.pipe';
import { BikeEventsComponent } from './bike-events/bike-events.component';
import { BikeLiveMapComponent } from './bike-live-map/bike-live-map.component';
import { BikeSupportComponent } from './bike-support/bike-support.component';
import { BikeCommentComponent } from './bike-comment/bike-comment.component';
import { BikeRepairHistoryComponent } from './bike-repair-history/bike-repair-history.component';
import { NgxSpinnerModule } from 'ngx-spinner';
import { ReportErrorComponent } from './bike-support/report-error/report-error.component';
import { MatExpansionModule } from '@angular/material/expansion';
import { BikeIssuesComponent } from './bike-issues/bike-issues.component';
import { IndividualErrorComponent } from './bike-support/individual-error/individual-error.component';
import { BikeModePipe } from '../core/pipes/bike-modes.pipe';
import { BikeSessionsComponent } from './bike-sessions/bike-sessions.component';
import { RepairRegisterPopupComponent } from './bike-support/repair-register-popup/repair-register-popup.component';
import { CreateRepairActionPopupComponent } from '../repair/create-repair-action/create-repair-action-popup/create-repair-action-popup.component';
import { ViewRepairActionsComponent } from './bike-support/view-repair-actions/view-repair-actions.component';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { RepairRegisterFormPopupComponent } from './bike-details/repair-register-form-popup/repair-register-form-popup.component';
import { BikeWorkHistoryComponent } from './bike-work-history/bike-work-history.component';
import { WorkshopHistoryDetailsPopupComponent } from './bike-work-history/workshop-history-details-popup/workshop-history-details-popup.component';
import { WorkshopRepairModule } from '../workshop-repair/workshop-repair.module';
import { BikeSignalComponent } from './bike-signal/bike-signal.component';
import { BikeWarrantyReportComponent } from './bike-warranty-report/bike-warranty-report.component';
import { BikeDockingHistoryComponent } from './bike-docking-history/bike-docking-history.component';
import { MatFormFieldModule } from '@angular/material/form-field';

@NgModule({
  imports: [
    CommonModule,
    BikesRoutingModule,
    SharedModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatFormFieldModule,
    NgxSpinnerModule,
    MatExpansionModule,
    RepairModule,
    NgxMatSelectSearchModule,
    WorkshopRepairModule
  ],
  declarations: [
    BikesComponent,
    NotOnTripsComponent,
    OnTripsComponent,
    BikeDetailsComponent,
    BikePcbComponent,
    BikePartsComponent,
    BikeMapTrackComponent,
    BikeMaintenanceComponent,
    BikeStatusPipe,
    BikeModePipe,
    BikeLockPipe,
    BikeEventsComponent,
    BikeLiveMapComponent,
    BikeSupportComponent,
    BikeCommentComponent,
    BikeRepairHistoryComponent,
    ReportErrorComponent,
    BikeIssuesComponent,
    IndividualErrorComponent,
    BikeSessionsComponent,
    RepairRegisterPopupComponent,
    ViewRepairActionsComponent,
    RepairRegisterFormPopupComponent,
    BikeWorkHistoryComponent,
    WorkshopHistoryDetailsPopupComponent,
    BikeSignalComponent,
    BikeWarrantyReportComponent,
    BikeDockingHistoryComponent
  ],
  entryComponents: [
    CreateRepairActionPopupComponent,
    RepairRegisterFormPopupComponent,
    WorkshopHistoryDetailsPopupComponent
  ],
  providers: [
    BikeModePipe,
    BikeLockPipe,
    { provide: MAT_DATE_LOCALE, useValue: 'en-GB' }
  ]
})
export class BikesModule { }
