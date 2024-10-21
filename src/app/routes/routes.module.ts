import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared/shared.module';
import { NgxSpinnerModule } from 'ngx-spinner';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { RoutesComponent } from './routes.component';
import { RoutesRoutingModule } from './routes-routing.module';
import { CreateRouteOrderComponent } from './create-route-order/create-route-order.component';
import { RouteOrderDetailsComponent } from './route-order-details/route-order-details.component';
import { RouteStatusPipe } from '../core/pipes/route-status.pipe';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { RouteMapComponent } from './route-map/route-map.component';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { CreateWaypointPopupComponent } from './create-waypoint-popup/create-waypoint-popup.component';
import '@clr/icons';
import '@clr/icons/shapes/all-shapes';
import { WaypointUpdatePopupComponent } from './waypoint-update-popup/waypoint-update-popup.component';

@NgModule({
    imports: [
        CommonModule,
        SharedModule,
        NgxSpinnerModule,
        RoutesRoutingModule,
        MatDatepickerModule,
        MatNativeDateModule,
        NgxMatSelectSearchModule,
        DragDropModule,
    ],
    declarations: [
        RoutesComponent,
        CreateRouteOrderComponent,
        RouteOrderDetailsComponent,
        RouteStatusPipe,
        RouteMapComponent,
        CreateWaypointPopupComponent,
        WaypointUpdatePopupComponent
    ],
    schemas: [
        CUSTOM_ELEMENTS_SCHEMA
    ],
})

export class RoutesModule { }