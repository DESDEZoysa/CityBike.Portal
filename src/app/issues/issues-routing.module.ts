import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { IssuesComponent } from './issues.component';
import { AdminWorkshopCustomerServiceStreetTeamGuard } from '../core/route-guards/admin-workshop-customer-service-street-team.guard';

const routes: Routes = [
    {
        path: '',
        component: IssuesComponent,
        canActivate: [AdminWorkshopCustomerServiceStreetTeamGuard]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class IssuesRoutingModule { }