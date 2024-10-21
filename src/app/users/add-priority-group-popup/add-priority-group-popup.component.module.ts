import { SharedModule } from './../../shared/shared.module';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { NgxSpinnerModule } from 'ngx-spinner';
import { AddPriorityGroupPopupComponent } from './add-priority-group-popup.component';

@NgModule({
    imports: [
        CommonModule,
        NgxMatSelectSearchModule,
        NgxSpinnerModule,
        SharedModule
    ],
    declarations: [
        AddPriorityGroupPopupComponent
    ],
    exports: [
        AddPriorityGroupPopupComponent
    ]
})
export class AddPriorityGroupPopupModule { }
