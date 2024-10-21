import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared/shared.module';
import { WorkshopRepairRoutingModule } from './workshop-repair-routing.module';
import { WorkshopRepairComponent } from './workshop-repair.component';
import { MatDatepickerModule } from '@angular/material/datepicker';

@NgModule({
    imports: [
        CommonModule,
        SharedModule,
        WorkshopRepairRoutingModule,
        MatDatepickerModule
    ],
    declarations: [
        WorkshopRepairComponent
    ],
    entryComponents: [
    ]
})
export class WorkshopRepairModule { }
