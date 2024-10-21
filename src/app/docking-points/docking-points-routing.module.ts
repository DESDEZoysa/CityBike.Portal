import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { DockingPointsComponent } from './docking-points.component';
import { DockingPointEditComponent } from './docking-point-edit/docking-point-edit.component';
import { OnboardComponent } from './onboard/onboard.component';

const routes: Routes = [
    {
        path: '',
        component: DockingPointsComponent
    },
    {
        path: ':id/edit',
        component: DockingPointEditComponent
    },
    {
        path: 'create',
        component: DockingPointEditComponent
    },
    {
        path: ':id/onboard',
        component: OnboardComponent
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class DockingPointsRoutingModule { }