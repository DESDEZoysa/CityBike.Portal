import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { SessionsComponent } from './sessions.component';
import { RideSessionComponent } from './ride-session/ride-session.component';
import { SessionHistorySupportComponent } from '../sessions/session-history-support/session-history-support.component'

const routes: Routes = [
    {
        path: '',
        component: SessionsComponent,
    },
    {
        path: 'history',
        component: SessionHistorySupportComponent
    },
    {
        path: ':id',
        component: RideSessionComponent
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class SessionsRoutingModule { }