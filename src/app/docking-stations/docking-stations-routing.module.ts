import { AdminWorkshopStreetTeamGuard } from '../core/route-guards/admin-workshop-street-team.guard';
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthenticatedGuard } from '../core/route-guards';

import { DockingStationsComponent } from './docking-stations.component';
import { StationsMapComponent } from './stations-map/stations-map.component';
import { AllStationsMapComponent } from './all-stations-map/all-stations-map.component';
import { CreateDockingStationsComponent } from './create-docking-stations/create-docking-stations.component';

const routes: Routes = [
    {
        path: '',
        component: DockingStationsComponent,
        data: {
            breadcrumb: ''
        }
    },
    {
        path: ':stationId/map',
        component: StationsMapComponent,
        data: {
            breadcrumb: ':stationId/map'
        }
    },
    {
        path: 'live',
        component: AllStationsMapComponent,
        data: {
            breadcrumb: 'live'
        }
    },

    {
        path: 'create',
        component: CreateDockingStationsComponent,
        canActivate: [AdminWorkshopStreetTeamGuard],

    },
    {
        path: 'update/:id',
        component: CreateDockingStationsComponent,
        canActivate: [AdminWorkshopStreetTeamGuard],

    },
    {
        path: ':stationId/dockingpoints',
        canLoad: [AuthenticatedGuard],
        loadChildren: '../docking-points/docking-points.module#DockingPointsModule'
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class DockingStationsRoutingModule { }