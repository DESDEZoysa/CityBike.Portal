import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { RepairComponent } from './repair.component';
import { CreateRepairActionComponent } from './create-repair-action/create-repair-action.component';
import { RepairOrdersComponent } from './repair-orders/repair-orders.component';
import { AdminWorkshopCustomerServiceStreetTeamGuard } from '../core/route-guards/admin-workshop-customer-service-street-team.guard';


const routes: Routes = [
    {
        path: '',
        component: RepairComponent,
        canActivate: [AdminWorkshopCustomerServiceStreetTeamGuard]
    },
    {
        path: 'create',
        component: CreateRepairActionComponent,
        canActivate: [AdminWorkshopCustomerServiceStreetTeamGuard]
    },
    {
        path: 'bike/:bikeId/create',
        component: CreateRepairActionComponent,
        canActivate: [AdminWorkshopCustomerServiceStreetTeamGuard]
    },
    {
        path: 'orders',
        component: RepairOrdersComponent,
        canActivate: [AdminWorkshopCustomerServiceStreetTeamGuard]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class RepairRoutingModule { }