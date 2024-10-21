import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatSelectModule } from "@angular/material/select";
import { NgxSpinnerModule } from "ngx-spinner";
import { SharedModule } from "../shared/shared.module";
import { SessionSummaryRoutingModule } from "./session-summary-routing.module";
import { SessionSummaryComponent } from "./session-summary.component";

@NgModule({
  imports: [
    CommonModule,
    SharedModule,
    SessionSummaryRoutingModule,
    NgxSpinnerModule,
    MatSelectModule,
    MatDatepickerModule
  ],
  exports: [
    SessionSummaryComponent

  ],
  declarations: [
    SessionSummaryComponent
  ]
})
export class SessionSummaryModule { }