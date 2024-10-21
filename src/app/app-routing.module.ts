import { NgModule } from '@angular/core';
import { Routes, RouterModule, Router, PreloadAllModules } from '@angular/router';
import { AnonymousGuard, AuthenticatedGuard } from './core/route-guards';
import { AuthLayoutComponent } from './layouts/auth/auth-layout.component';
import { HomeLayoutComponent } from './layouts/home/home-layout.component';
import { ErrorLayoutComponent } from './layouts/error/error-layout.component';
import { AdminGuard } from './core/route-guards/admin.guard';
import { AdminWorkshopGuard } from './core/route-guards/admin-workshop.guard';
import { DefaultRouteGuard } from './core/route-guards/default-route.guard';
import { AdminWorkshopCustomerServiceStreetTeamGuard } from './core/route-guards/admin-workshop-customer-service-street-team.guard';
import { DashboardGuard } from './core/route-guards/dashboard.guard';
import { AdminCustomerServiceGuard } from './core/route-guards/admin-customer-service.guard';
import { AdminWorkshopStreetTeamGuard } from './core/route-guards/admin-workshop-street-team.guard';

const routes: Routes = [
    {
        path: '',
        redirectTo: 'bikes',
        canActivate: [DefaultRouteGuard],
        pathMatch: 'full',
    },
    {
        path: '',
        component: HomeLayoutComponent,
        children: [
            {
                path: 'dashboard',
                canLoad: [DashboardGuard],
                // canActivate: [AdminMaintenanceSupportServiceGuard],
                loadChildren: './dashboard/dashboard.module#DashBoardModule'
            },
            {
                path: 'dockingStations',
                canLoad: [AuthenticatedGuard],
                canActivate: [AdminWorkshopCustomerServiceStreetTeamGuard],
                loadChildren: './docking-stations/docking-stations.module#DockingStationsModule'
            },
            {
                path: 'bikes',
                canLoad: [AuthenticatedGuard],
                canActivate: [AdminWorkshopCustomerServiceStreetTeamGuard],
                loadChildren: './bikes/bikes.module#BikesModule'
            },
            {
                path: 'customer',
                canLoad: [AuthenticatedGuard],
                loadChildren: './customer-dashboard/customer-dashboard.module#CustomerDashboardModule'
            },
            {
                path: 'users',
                canLoad: [AuthenticatedGuard],
                canActivate: [AdminGuard],
                loadChildren: './users/users.module#UsersModule'
            },
            {
                path: 'events',
                canLoad: [AuthenticatedGuard],
                canActivate: [AdminWorkshopGuard],
                loadChildren: './events/events.module#EventsModule'
            },
            {
                path: 'sessions',
                canLoad: [AuthenticatedGuard],
                canActivate: [AdminCustomerServiceGuard],
                loadChildren: './sessions/sessions.module#SessionsModule'
            },
            {
                path: 'repair',
                canLoad: [AuthenticatedGuard],
                canActivate: [AdminWorkshopCustomerServiceStreetTeamGuard],
                loadChildren: './repair/repair.module#RepairModule'
            },
            {
                path: 'inventory',
                canLoad: [AuthenticatedGuard],
                canActivate: [AdminWorkshopStreetTeamGuard],
                loadChildren: './inventory/inventory.module#InventoryModule'
            },
            {
                path: 'issues',
                canLoad: [AuthenticatedGuard],
                canActivate: [AdminWorkshopCustomerServiceStreetTeamGuard],
                loadChildren: './issues/issues.module#IssuesModule'
            },
            {
                path: 'workshop/history',
                canLoad: [AuthenticatedGuard],
                canActivate: [AdminWorkshopCustomerServiceStreetTeamGuard],
                loadChildren: './workshop-repair/workshop-repair.module#WorkshopRepairModule'
            },
            {
                path: 'session/summary',
                canLoad: [DashboardGuard],
                loadChildren: './session-summary/session-summary.module#SessionSummaryModule'
            },
            {
                path: 'routes',
                canLoad: [AuthenticatedGuard],
                loadChildren: './routes/routes.module#RoutesModule'
            },
        ]
    },
    {
        path: '',
        component: AuthLayoutComponent,
        children: [
            {
                path: 'auth',
                canLoad: [AnonymousGuard],
                loadChildren: './auth/auth.module#AuthModule'
            },
            {
                path: 'info',
                canLoad: [AnonymousGuard],
                loadChildren: './info/info.module#InfoModule'
            }
        ]
    },
    {
        path: '',
        component: ErrorLayoutComponent,
        children: [
            {
                path: 'errors',
                loadChildren: './errors/errors.module#ErrorsModule'
            }
        ]
    },
    {
        path: '**',
        redirectTo: 'errors/notfound'
    }
];


@NgModule({
    imports: [RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })],
    exports: [RouterModule]
})
export class AppRoutingModule {
    constructor(private router: Router) {
        // this.router.errorHandler = (error: any) => {
        //     console.log(error);
        // }
    }
}