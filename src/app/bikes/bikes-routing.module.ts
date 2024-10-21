import { BikeSignalComponent } from './bike-signal/bike-signal.component';
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { BikesComponent } from './bikes.component';
import { NotOnTripsComponent } from '../bikes/not-on-trips/not-on-trips.component';
import { OnTripsComponent } from '../bikes/on-trips/on-trips.component';
import { BikeDetailsComponent } from './bike-details/bike-details.component';
import { BikeMapTrackComponent } from './bike-map-track/bike-map-track.component';
import { BikeLiveMapComponent } from './bike-live-map/bike-live-map.component';
import { BikeSupportComponent } from './bike-support/bike-support.component';
import { AdminWorkshopCustomerServiceStreetTeamGuard } from '../core/route-guards/admin-workshop-customer-service-street-team.guard';
import { BikeWarrantyReportComponent } from './bike-warranty-report/bike-warranty-report.component';

const routes: Routes = [
    {
        path: '',
        component: BikesComponent
    },
    {
        path: 'notontrips',
        component: NotOnTripsComponent
    },
    {
        path: 'ontrips',
        component: OnTripsComponent
    },
    {
        path: ':id/details',
        component: BikeDetailsComponent,
        canActivate: [AdminWorkshopCustomerServiceStreetTeamGuard]
    },
    {
        path: ':id/track',
        component: BikeMapTrackComponent
    },
    {
        path: 'live',
        component: BikeLiveMapComponent
    },
    {
        path: 'support',
        component: BikeSupportComponent
    },
    {
        path: ':id',
        component: BikesComponent
    },
    {
        path: ':id/signal',
        component: BikeSignalComponent
    },
    {
        path: 'report/warranty',
        component: BikeWarrantyReportComponent
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class BikesRoutingModule { }