import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared/shared.module';
import { RepairRoutingModule } from './repair-routing.module';
import { RepairComponent } from './repair.component';
import { CreateRepairActionComponent } from './create-repair-action/create-repair-action.component';
import { RepairOrdersComponent } from './repair-orders/repair-orders.component';
import { CreateRepairActionPopupComponent } from './create-repair-action/create-repair-action-popup/create-repair-action-popup.component';

@NgModule({
  imports: [
    CommonModule,
    SharedModule,
    RepairRoutingModule
  ],
  declarations: [
    RepairComponent,
    CreateRepairActionComponent,
    RepairOrdersComponent,
    CreateRepairActionPopupComponent
  ],
  entryComponents: [
    CreateRepairActionPopupComponent
  ]
})
export class RepairModule { }
