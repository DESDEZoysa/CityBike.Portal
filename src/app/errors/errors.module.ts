import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ErrorsRoutingModule } from './errors-routing.module';
import { SharedModule } from '../shared/shared.module';
import { NotFoundComponent } from './not-found/not-found.component';
import { UnauthorizedComponent } from './unauthorized/unauthorized.component';
import { ForbiddenComponent } from './forbidden/forbidden.component';


@NgModule({
  imports: [
    CommonModule,
    SharedModule,
    ErrorsRoutingModule
  ],
  declarations: [
    NotFoundComponent,
    UnauthorizedComponent,
    ForbiddenComponent
  ]
})

export class ErrorsModule { }
