import { DashboardGuard } from './core/route-guards/dashboard.guard';
import { PriorityGroupService } from './services/priority-groups.service';
import { SignalRService } from './services/signalr.service';
import { RepairRegisterPopupComponent } from './bikes/bike-support/repair-register-popup/repair-register-popup.component';
import { BrowserModule, Title } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { BrowserAnimationsModule, NoopAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FlexLayoutModule } from '@angular/flex-layout';

import { AppMaterialModule } from './shared/app-material.module';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { AuthLayoutComponent } from './layouts/auth/auth-layout.component';
import { HomeLayoutComponent } from './layouts/home/home-layout.component';
import { ErrorLayoutComponent } from './layouts/error/error-layout.component';
import { AppSettings, AuthService, BikesService, DockingStationService, LoggerService, LiveConnectionService, SettingsService, ReverseGeocodingService, InventoryService } from './services';
import { AnonymousGuard, AuthenticatedGuard } from './core/route-guards';
import { InterceptorModule } from './core/http/interceptors';
import { SignOutDirective } from './core/directives/signout';
import { AdminGuard } from './core/route-guards/admin.guard';

import { UserService } from './services/users.service';
import { WorkshopGuard } from './core/route-guards/workshop.guard';
import { IfRoleDirective } from './core/directives/role-permissions';
import { AdminWorkshopGuard } from './core/route-guards/admin-workshop.guard';
import { ImportExportService } from './services/import-export.service';
import { SystemSettingsService } from './services/system-settings.service';
import { EventService } from './services/events.service';
import { SessionsService } from './services/sessions.service';
import { ObservationOverflowDialog } from './bikes/bike-pcb/observation-dialog.component';

import { RepairService } from './services/repair.service';
import { RepairOrdersService } from './services/repair-orders.service';
import { InventoryModule } from './inventory/inventory.module';
import { CreateVariantComponent } from '././inventory/create-variant/create-variant.component';
import { ReportErrorComponent } from './bikes/bike-support/report-error/report-error.component';
import { BikesModule } from './bikes/bikes.module';
import { IndividualErrorComponent } from './bikes/bike-support/individual-error/individual-error.component';
import { AdminWorkshopCustomerServiceGuard } from './core/route-guards/admin-workshop-customer-service.guard';
import { CustomerServiceGuard } from './core/route-guards/customer-service.guard';
import { AdminWorkshopCustomerServiceStreetTeamGuard } from './core/route-guards/admin-workshop-customer-service-street-team.guard';
import { AdminWorkshopStreetTeamGuard } from './core/route-guards/admin-workshop-street-team.guard';
import { StreetTeamGuard } from './core/route-guards/street-team.guard';
import { ViewRepairActionsComponent } from './bikes/bike-support/view-repair-actions/view-repair-actions.component';
import { AreasService } from './services/areas.service';
import { CommonService } from './services/common-service';
import { AdminCustomerServiceGuard } from './core/route-guards/admin-customer-service.guard';
import { RouteService } from './services/route.service';
import { SessionsModule } from './sessions/sessions.module';
import { CarService } from './services/cars.service';
import { ZonesService } from './services/zones.service';


// AoT requires an exported function for factories
export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http);
}

@NgModule({
  declarations: [
    AppComponent,
    AuthLayoutComponent,
    HomeLayoutComponent,
    ErrorLayoutComponent,
    SignOutDirective,
    IfRoleDirective,
    ObservationOverflowDialog
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    NoopAnimationsModule,
    AppMaterialModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    FlexLayoutModule,
    InterceptorModule,
    InventoryModule,
    BikesModule,
    SessionsModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient]
      }
    }),
  ],
  providers: [
    AppSettings,
    AuthService,
    BikesService,
    RepairService,
    DockingStationService,
    LoggerService,
    LiveConnectionService,
    SettingsService,
    AnonymousGuard,
    AuthenticatedGuard,
    AdminGuard,
    UserService,
    ReverseGeocodingService,
    ImportExportService,
    SystemSettingsService,
    WorkshopGuard,
    AdminWorkshopGuard,
    EventService,
    SessionsService,
    RepairOrdersService,
    InventoryService,
    CustomerServiceGuard,
    AdminWorkshopCustomerServiceGuard,
    StreetTeamGuard,
    AdminWorkshopCustomerServiceStreetTeamGuard,
    AdminWorkshopStreetTeamGuard,
    AreasService,
    SignalRService,
    CommonService,
    RouteService,
    PriorityGroupService,
    Title,
    DashboardGuard,
    AdminCustomerServiceGuard,
    CarService,
    ZonesService
  ],
  entryComponents: [
    ObservationOverflowDialog, CreateVariantComponent, ReportErrorComponent, IndividualErrorComponent, ViewRepairActionsComponent, RepairRegisterPopupComponent
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
