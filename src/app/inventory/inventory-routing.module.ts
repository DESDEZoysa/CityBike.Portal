import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { InventoryComponent } from './inventory.component';
import { AdminWorkshopStreetTeamGuard } from '../core/route-guards/admin-workshop-street-team.guard';

const routes: Routes = [
    {
        path: '',
        component: InventoryComponent,
        canActivate: [AdminWorkshopStreetTeamGuard]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class InventoryRoutingModule { }