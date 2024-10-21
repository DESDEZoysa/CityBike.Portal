import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";
import { SessionSummaryComponent } from "./session-summary.component";


const routes: Routes = [
    {
        path: '',
        component: SessionSummaryComponent
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class SessionSummaryRoutingModule { }