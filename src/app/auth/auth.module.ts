import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';

import { AuthRoutingModule } from './auth-routing.module';
import { AppMaterialModule } from '../shared/app-material.module'
import { SignInComponent } from './sign-in/sign-in.component';
import { SignUpComponent } from './sign-up/sign-up.component';
import { ResetForgotPasswordComponent } from './reset-forgot-password/reset-forgot-password.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { TranslateModule } from '@ngx-translate/core';


@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    FlexLayoutModule,
    AuthRoutingModule,
    AppMaterialModule,
    TranslateModule,
  ],
  declarations: [
    SignInComponent,
    SignUpComponent,
    ResetForgotPasswordComponent,
    ForgotPasswordComponent,
  ]
})
export class AuthModule { }
