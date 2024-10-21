import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DockingPointsRoutingModule } from './docking-points-routing.module';
import { SharedModule } from '../shared/shared.module';
import { DockingPointsComponent } from './docking-points.component';
import { DockingPointEditComponent } from './docking-point-edit/docking-point-edit.component';
import { OnboardComponent } from './onboard/onboard.component';
import { ViewAllOnboardDetailsComponent } from './onboard/view-all-onboard-details/view-all-onboard-details.component';

@NgModule({
  imports: [
    CommonModule,
    DockingPointsRoutingModule,
    SharedModule
  ],
  exports: [
    DockingPointsComponent
  ],
  declarations: [
    DockingPointsComponent,
    DockingPointEditComponent,
    OnboardComponent,
    ViewAllOnboardDetailsComponent
  ],
  entryComponents: [
    ViewAllOnboardDetailsComponent
  ]
})
export class DockingPointsModule { }
