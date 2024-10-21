import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { DashboardComponent } from './dashboard.component';
import { AdminWorkshopCustomerServiceStreetTeamGuard } from '../core/route-guards/admin-workshop-customer-service-street-team.guard';
import { DashboardFilterMapComponent } from './dashboard-filter-map/dashboard-filter-map.component';

const routes: Routes = [
    {
        path: '',
        component: DashboardComponent
    },
    {
        path: ':id/filter',
        component: DashboardFilterMapComponent,
        canActivate: [AdminWorkshopCustomerServiceStreetTeamGuard]
    },
    {
        path: ':dsModeId/dsfilter',
        component: DashboardFilterMapComponent,
        canActivate: [AdminWorkshopCustomerServiceStreetTeamGuard]
    }
];


@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class DashboardRoutingModule { }