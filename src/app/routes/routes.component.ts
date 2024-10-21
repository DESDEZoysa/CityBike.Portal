import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { Component, OnInit, ViewChild } from '@angular/core';
import { LocalStorageKeys } from '../core/constants';
import { ScreenLayouts } from '../core/constants/screen-layouts';
import { UserRoles } from '../core/constants/user-roles';
import { RouteStatus } from '../core/enums/routeStatus';
import { BikesService, LoggerService } from '../services';
import { RouteService } from '../services/route.service';
import { forkJoin } from 'rxjs/internal/observable/forkJoin';
import { BikeAddress } from '../core/models';
import { MatDialog } from '@angular/material/dialog';
import { AlertDialogComponent } from '../shared/alert-dialog/alert-dialog.component';
import { ConfirmDialogComponent } from '../shared/confirm-dialog/confirm-dialog.component';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-routes',
  templateUrl: './routes.component.html',
  styleUrls: ['./routes.component.scss']
})
export class RoutesComponent implements OnInit {
  @ViewChild('routeOrdersTable') table: any;
  RouteStatus = RouteStatus;

  public readonly LAYOUT = ScreenLayouts;
  public layout: number = this.LAYOUT.MD;
  isMobile: boolean = false;

  loadingIndicator: boolean = true;
  routeOrders: any[];
  completedOrdersView: boolean = false;
  loggedInUser: any;
  isStreetTeam: boolean;
  auth_token: any;
  bikes: any;

  constructor(
    public breakpointObserver: BreakpointObserver,
    private loggerService: LoggerService,
    private bikeService: BikesService,
    public routeService: RouteService,
    private dialog: MatDialog,
    private translate: TranslateService
  ) {
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) && (document.documentElement.clientWidth < 768)) {
      this.isMobile = true;
    }
  }

  ngOnInit() {
    this.manageScreenWidth();
    this.isStreetTeam = true;
    this.loggedInUser = JSON.parse(localStorage.getItem(LocalStorageKeys.USER_DETAILS));
    this.auth_token = JSON.parse(localStorage.getItem(LocalStorageKeys.OAUTH_TOKEN));
    this.getOnGoingRoutes();
  }

  manageScreenWidth() {
    const breakpoints = Object.keys(this.LAYOUT).map(k => this.LAYOUT[k]);
    breakpoints.forEach((maxWidth, index) => {
      const minWidth = (index > 0) ? breakpoints[index - 1] : 0;
      this.breakpointObserver
        .observe([`(min-width: ${minWidth}px) and (max-width: ${maxWidth - 1}px)`])
        .subscribe((state: BreakpointState) => {
          if (!state.matches) { return; }
          this.layout = maxWidth;
        });
    });
  }

  onResize() {
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) && (document.documentElement.clientWidth < 768)) {
      this.isMobile = true;
    } else {
      this.isMobile = false;
    }
  }

  toggleExpandRow(row) {
    this.table.rowDetail.toggleExpandRow(row);
  }

  getLoggedInUserRole() {
    if (this.auth_token._claims) {
      var userRole = this.auth_token._claims[0];
      if (userRole == UserRoles.STREET_TEAM)
        this.isStreetTeam = true;
      else
        this.isStreetTeam = false;
    }
  }

  getOnGoingRoutes() {
    this.loadingIndicator = true;
    let observables = [
      this.bikeService.getBikes(),
      this.routeService.getAllRouteOrders(true)
    ];
    forkJoin(observables).subscribe(
      data => {
        this.getLoggedInUserRole();
        this.bikes = data[0];

        //Include bike details in route objects
        data[1].forEach((route, index) => {
          route.Waypoints.forEach((waypoint, i) => {
            if (waypoint.BikeId > 0) {
              waypoint.Details = this.bikes.find(x => x.BikeId == waypoint.BikeId);
              route.Waypoints[i] = waypoint;
            }
          })
          data[1][index] = route;
        });
        let routes = data[1];
        this.routeOrders = routes.map(r => {
          r["IsStartDisabled"] = false;
          let isOngoingRoutes = false;
          let assignedOnRoutes = routes.filter(x => x.AssignedOn.UserId == r.AssignedOn.UserId);
          if (assignedOnRoutes.length > 1)
            isOngoingRoutes = assignedOnRoutes.some(x => x.Status == RouteStatus.Ongoing);
          if (isOngoingRoutes && r.Status == RouteStatus.Assigned)
            r["IsStartDisabled"] = true;
          return r;
        });
        if (this.isStreetTeam)
          this.routeOrders = this.routeOrders.filter(r => r.AssignedOn.UserId == this.loggedInUser.UserId);
        this.completedOrdersView = false;
        this.loadingIndicator = false;
      }, error => {
        this.loadingIndicator = false;
        this.loggerService.showErrorMessage("Error while loading ongoing routes");
      });
  }

  getCompletedRoutes() {
    this.loadingIndicator = true;
    this.routeService.getAllRouteOrders(false).subscribe(
      data => {
        this.getLoggedInUserRole();

        //Include bike details in route objects
        data.forEach((route, index) => {
          route.Waypoints.forEach((waypoint, i) => {
            if (waypoint.BikeId > 0) {
              waypoint.Details = this.bikes.find(x => x.BikeId == waypoint.BikeId);
              route.Waypoints[i] = waypoint;
            }
          })
          data[index] = route;
        });
        this.routeOrders = data;
        this.routeOrders = this.routeOrders.map(r => {
          r["IsStartDisabled"] = false;
          return r;
        });

        if (this.isStreetTeam)
          this.routeOrders = this.routeOrders.filter(r => r.AssignedOn.UserId == this.loggedInUser.UserId);
        this.completedOrdersView = true;
        this.loadingIndicator = false;
      }, error => {
        this.loadingIndicator = false;
        this.loggerService.showErrorMessage("Error while loading completed routes");
      });
  }

  startRoute(routeId: any) {
    let route = this.routeOrders.find(x => x.RouteId == routeId);
    if (route["IsStartDisabled"]) {
      const dialogRefAlert = this.dialog.open(AlertDialogComponent, {
        minWidth: '350px',
        data: { "message": "ROUTES.ONGOING_EXIST_MSG" }
      });

      dialogRefAlert.afterClosed().subscribe(result => {
      });
    }
    else {
      let dialogMsg = this.translate.instant("ROUTES.START_ROUTE_MSG", { routeId: routeId });
      const dialogRefAlert = this.dialog.open(ConfirmDialogComponent, {
        minWidth: '350px',
        data: { "message": dialogMsg }
      });

      dialogRefAlert.afterClosed().subscribe(result => {
        if (result) {
          this.routeService.startRoute(routeId).subscribe(res => {
            this.getOnGoingRoutes();
            this.loggerService.showSuccessfulMessage("Route has been started successfully");
          }, err => {
            this.loggerService.showErrorMessage("Error while starting the route");
          });
        }
      });

    }
  }

  stopRoute(routeId: any) {
    let route = this.routeOrders.find(x => x.RouteId == routeId);
    let isUserExist = (route["AssignedOn"].UserId == this.loggedInUser.UserId);

    let userExistMsg = this.translate.instant("ROUTES.DIALOG.USER_EXIST", { routeId: routeId });
    let userNotExistMsg = this.translate.instant("ROUTES.DIALOG.USER_NOT_EXIST",
      { routeId: routeId, firstName: route["AssignedOn"].FirstName, lastName: route["AssignedOn"].LastName });

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '425px',
      data: { message: isUserExist ? userExistMsg : userNotExistMsg }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.routeService.endRoute(routeId).subscribe(res => {
          this.getOnGoingRoutes();
          this.loggerService.showSuccessfulMessage("Route has been ended successfully");
        }, err => {
          this.loggerService.showErrorMessage("Error while ending the route");
        });
      }
    });
  }

  updateAddress(data: BikeAddress): void {
    let index = this.bikes.findIndex(i => i.BikeId == data.BikeId);
    if (index >= 0) {
      this.bikes[index].Address = data.Address;
    }
  }
}
