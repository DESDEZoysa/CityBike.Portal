import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared/shared.module';
import { NgxSpinnerModule } from 'ngx-spinner';
import { IssuesComponent } from './issues.component';
import { IssuesRoutingModule } from './issues-routing.module';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

@NgModule({
    imports: [
        CommonModule,
        SharedModule,
        NgxSpinnerModule,
        IssuesRoutingModule,
        MatDatepickerModule,
        MatNativeDateModule,
        NgxMatSelectSearchModule
    ],
    declarations: [
        IssuesComponent
    ]
})

export class IssuesModule { }