import { EventDetailsDialogComponent } from './../events/event-details-dialog/event-details-dialog.component';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { FlexLayoutModule } from '@angular/flex-layout';

import { AppMaterialModule } from './app-material.module';
import { AddressPipe, BikeAddressPipe, ReplacePipe } from '../core/pipes';
import { MapComponent } from './map/map.component';
import { DateRangeSelectorComponent } from './date-range-selector/date-range-selector.component';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { TrackMapComponent } from './track-map/track-map.component';
import { UserMapComponent } from './user-map/user-map.component';
import { BikeAddressComponent } from './bike-address/bike-address.component';
import { StationStatusComponent } from './station-status/station-status.component';
import { TranslateManualPipe } from '../core/pipes/translate-manual.pipe';
import { LiveMapComponent } from './live-map/live-map.component';
import { DockingPointStatePipe } from '../core/pipes/docking-point-state.pipe';
import { ConfirmDialogComponent } from './confirm-dialog/confirm-dialog.component';
import { ImagePopUpDialog } from './Image-popup/image-popup.component';
import { CreateActionPopUpDialog } from './repair-action-popup/repair-action-popup';
import { NgxSpinnerModule } from 'ngx-spinner';
import { ConvertTimePipe } from '../core/pipes/convert-time.pipe';
import { SessionTerminateDialogComponent } from '../sessions/session-terminate-dialog/session-terminate-dialog.component';
import { FreeBikePopupComponent } from './free-bike-popup/free-bike-popup.component';
import { TimeZonePipe } from '../core/pipes/time-zone.pipe';
import { StringFilterByPipe } from '../core/pipes/string-filter.pipe';
import { LiveMapConfirmPopupComponent } from './live-map-confirm-popup/live-map-confirm-popup.component';
import { CarBikeDetailsPopupComponent } from './car-bike-details-popup/car-bike-details-popup.component';
import { DeliverWorkshopPopupComponent } from './deliver-workshop-popup/deliver-workshop-popup.component';
import { WorkshopSelectionPopupComponent } from './workshop-selection-popup/workshop-selection-popup.component';
import { AlertDialogComponent } from './alert-dialog/alert-dialog.component';
import { DashboardGraphComponent } from './dashboard-graph/dashboard-graph.component';
import { HighchartsChartModule } from 'highcharts-angular';
import { StorageSelectionPopupComponent } from './storage-selection-popup/storage-selection-popup.component';
import { RemoveCommaPipe } from '../core/pipes/remove-comma.pipe';
import { DockingPointDetailsPopupComponent } from './docking-point-details-popup/docking-point-details-popup.component';
import { ConfirmationDpCheckPopupComponent } from './confirmation-dp-check-popup/confirmation-dp-check-popup.component';
import { DockingPointErrorReportPopupComponent } from './docking-point-error-report-popup/docking-point-error-report-popup.component';
import { DockingPointIssueFixComponent } from './docking-point-issue-fix/docking-point-issue-fix.component';
import { ConfirmationDpRepairReportPopupComponent } from './confirmation-dp-repair-report-popup/confirmation-dp-repair-report-popup.component';
import { DockingPointRepairHistoryPopupComponent } from './docking-point-repair-history-popup/docking-point-repair-history-popup.component';
import { DockingPointRepairHistoryDetailsPopupComponent } from './docking-point-repair-history-details-popup/docking-point-repair-history-details-popup.component';
import { AllDockingPointRepairHistoryPopupComponent } from './all-docking-point-repair-history-popup/all-docking-point-repair-history-popup.component';
import { RouteMapComponent } from './route-map/route-map.component';
import { BikesSumOperatonalDialogPopupComponent } from './bikes-sum-operatonal-dialog-popup/bikes-sum-operatonal-dialog-popup.component';

@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    FlexLayoutModule,
    AppMaterialModule,
    TranslateModule,
    NgxDatatableModule,
    MatDatepickerModule,
    MatNativeDateModule,
    NgxSpinnerModule,
    MatSidenavModule,
    MatSelectModule,
    HighchartsChartModule
  ],
  exports: [
    FlexLayoutModule,
    AppMaterialModule,
    TranslateModule,
    NgxDatatableModule,
    MapComponent,
    DateRangeSelectorComponent,
    TrackMapComponent,
    UserMapComponent,
    BikeAddressComponent,
    StationStatusComponent,
    AddressPipe,
    BikeAddressPipe,
    ReplacePipe,
    TranslateManualPipe,
    LiveMapComponent,
    DockingPointStatePipe,
    ConfirmDialogComponent,
    ImagePopUpDialog,
    CreateActionPopUpDialog,
    ConvertTimePipe,
    TimeZonePipe,
    StringFilterByPipe,
    DashboardGraphComponent,
    RemoveCommaPipe,
    RouteMapComponent
  ],
  declarations: [
    MapComponent,
    DateRangeSelectorComponent,
    TrackMapComponent,
    UserMapComponent,
    AddressPipe,
    BikeAddressPipe,
    ReplacePipe,
    BikeAddressComponent,
    StationStatusComponent,
    TranslateManualPipe,
    LiveMapComponent,
    DockingPointStatePipe,
    ConfirmDialogComponent,
    ImagePopUpDialog,
    CreateActionPopUpDialog,
    ConvertTimePipe,
    SessionTerminateDialogComponent,
    FreeBikePopupComponent,
    TimeZonePipe,
    StringFilterByPipe,
    LiveMapConfirmPopupComponent,
    CarBikeDetailsPopupComponent,
    DeliverWorkshopPopupComponent,
    WorkshopSelectionPopupComponent,
    AlertDialogComponent,
    DashboardGraphComponent,
    StorageSelectionPopupComponent,
    RemoveCommaPipe,
    EventDetailsDialogComponent,
    DockingPointDetailsPopupComponent,
    ConfirmationDpCheckPopupComponent,
    DockingPointErrorReportPopupComponent,
    DockingPointIssueFixComponent,
    ConfirmationDpRepairReportPopupComponent,
    DockingPointRepairHistoryPopupComponent,
    DockingPointRepairHistoryDetailsPopupComponent,
    AllDockingPointRepairHistoryPopupComponent,
    RouteMapComponent,
    BikesSumOperatonalDialogPopupComponent
  ],
  entryComponents: [
    ConfirmDialogComponent,
    ImagePopUpDialog,
    CreateActionPopUpDialog,
    SessionTerminateDialogComponent,
    FreeBikePopupComponent,
    LiveMapConfirmPopupComponent,
    CarBikeDetailsPopupComponent,
    DeliverWorkshopPopupComponent,
    WorkshopSelectionPopupComponent,
    AlertDialogComponent,
    StorageSelectionPopupComponent,
    EventDetailsDialogComponent,
    DockingPointDetailsPopupComponent,
    ConfirmationDpCheckPopupComponent,
    DockingPointErrorReportPopupComponent,
    DockingPointIssueFixComponent,
    ConfirmationDpRepairReportPopupComponent,
    DockingPointRepairHistoryPopupComponent,
    DockingPointRepairHistoryDetailsPopupComponent,
    AllDockingPointRepairHistoryPopupComponent
  ]
})
export class SharedModule { }
