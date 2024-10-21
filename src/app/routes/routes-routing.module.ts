import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AdminWorkshopCustomerServiceStreetTeamGuard } from '../core/route-guards/admin-workshop-customer-service-street-team.guard';
import { CreateRouteOrderComponent } from './create-route-order/create-route-order.component';
import { RouteOrderDetailsComponent } from './route-order-details/route-order-details.component';
import { RouteMapComponent } from './route-map/route-map.component';
import { RoutesComponent } from './routes.component';

const routes: Routes = [
    {
        path: '',
        component: RoutesComponent,
        canActivate: [AdminWorkshopCustomerServiceStreetTeamGuard]
    },
    {
        path: 'create',
        component: CreateRouteOrderComponent
    },
    {
        path: ':id/edit',
        component: CreateRouteOrderComponent
    },
    {
        path: ':id/details',
        component: RouteOrderDetailsComponent
    },
    {
        path: 'live',
        component: RouteMapComponent,
        data: {
            breadcrumb: 'live'
        },
        canActivate: [AdminWorkshopCustomerServiceStreetTeamGuard]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class RoutesRoutingModule { }