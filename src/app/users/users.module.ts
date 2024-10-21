import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UsersComponent } from './users.component';
import { UsersRoutingModule } from './users-routing.module';
import { SharedModule } from '../shared/shared.module';
import { UserEditComponent } from './user-edit/user-edit.component';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { AdminProfileComponent } from './admin-profile/admin-profile.component';
import { PriorityGroupsComponent } from './priority-groups/priority-groups.component';
import { NgxSpinnerModule } from 'ngx-spinner';
import { AddPriorityGroupPopupComponent } from './add-priority-group-popup/add-priority-group-popup.component';
import { AddPriorityGroupPopupModule } from './add-priority-group-popup/add-priority-group-popup.component.module';
import { AddUserComponent } from './add-user/add-user.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';
import { AppMaterialModule } from '../shared/app-material.module';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  imports: [
    CommonModule,
    UsersRoutingModule,
    SharedModule,
    NgxMatSelectSearchModule,
    NgxSpinnerModule,
    AddPriorityGroupPopupModule,   
    FormsModule,
    ReactiveFormsModule,
    FlexLayoutModule,
    AppMaterialModule,
    TranslateModule,
  ],
  declarations: [
    UsersComponent,
    UserEditComponent,
    AdminProfileComponent,
    PriorityGroupsComponent,
    AddUserComponent
  ],
  entryComponents: [
    AddPriorityGroupPopupComponent
  ]
})
export class UsersModule { }
