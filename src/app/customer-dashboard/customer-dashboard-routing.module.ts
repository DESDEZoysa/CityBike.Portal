import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { CustomerDashboardComponent } from './customer-dashboard.component';
import { DockingStationsListComponent } from './docking-stations-list/docking-stations-list.component';
import { CustomerMapComponent } from './customer-map/customer-map.component';
import { BikesListComponent } from './bikes-list/bikes-list.component';

const routes: Routes = [
    {
        path: 'dashboard',
        component: CustomerDashboardComponent,
    },
    {
        path: 'map',
        component: CustomerMapComponent
    },
    {
        path: 'dockingstations/list',
        component: DockingStationsListComponent
    },
    {
        path: 'dockingstations/:dockingstationid/bikes/list',
        component: BikesListComponent
    }

];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class CustomerDashboardRoutingModule { }
