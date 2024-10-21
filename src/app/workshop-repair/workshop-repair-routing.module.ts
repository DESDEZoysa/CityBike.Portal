import { WorkshopRepairComponent } from './workshop-repair.component';
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AdminWorkshopCustomerServiceStreetTeamGuard } from '../core/route-guards/admin-workshop-customer-service-street-team.guard';


const routes: Routes = [
    {
        path: '',
        component: WorkshopRepairComponent,
        canActivate: [AdminWorkshopCustomerServiceStreetTeamGuard]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class WorkshopRepairRoutingModule { }