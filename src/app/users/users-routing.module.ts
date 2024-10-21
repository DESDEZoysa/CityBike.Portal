import { PriorityGroupsComponent } from './priority-groups/priority-groups.component';
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { UsersComponent } from './users.component';
import { UserEditComponent } from './user-edit/user-edit.component';
import { AdminProfileComponent } from './admin-profile/admin-profile.component';
import { AddUserComponent } from './add-user/add-user.component';

const routes: Routes = [
    {
        path: '',
        component: UsersComponent
    },
    {
        path: 'prioritygroup',
        component: PriorityGroupsComponent,
    },
    {
        path: 'admin',
        component: AdminProfileComponent,
    },
    {
        path: ':userId/edit',
        component: UserEditComponent,
        data: {
            breadcrumb: ':userId/edit'
        }
    },
    {
        path: 'create',
        component: AddUserComponent,
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class UsersRoutingModule { }