import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { RouteStatus } from '../../core/enums/routeStatus';
import { BikesService, LoggerService } from '../../services';
import { RouteService } from '../../services/route.service';
import { forkJoin } from 'rxjs/internal/observable/forkJoin';
import * as moment from 'moment';
import { MatDialog } from '@angular/material/dialog';
import { WaypointUpdatePopupComponent } from '../waypoint-update-popup/waypoint-update-popup.component';
import { BikeAddress } from '../../core/models';

@Component({
  selector: 'app-route-order-details',
  templateUrl: './route-order-details.component.html',
  styleUrls: ['./route-order-details.component.scss']
})
export class RouteOrderDetailsComponent implements OnInit {
  RouteStatus = RouteStatus;
  isMobile: boolean;
  routeId: any;
  routeOrder: any;
  totaltimeMinutes: any;
  bikes: any;

  constructor(
    private activatedRoute: ActivatedRoute,
    private loggerService: LoggerService,
    public routeService: RouteService,
    private bikeService: BikesService,
    public dialog: MatDialog) {
  }

  ngOnInit() {
    this.activatedRoute.params.subscribe(params => {
      this.routeId = params["id"];
    });
    this.getRouteDetailsWithWaypointActions();
  }

  onResize() {
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) && (document.documentElement.clientWidth < 768)) {
      this.isMobile = true;
    } else {
      this.isMobile = false;
    }
  }

  getRouteDetailsWithWaypointActions() {
    let observables = [
      this.bikeService.getBikes(),
      this.routeService.getRouteDetailsWithWaypointActions(this.routeId)
    ];
    forkJoin(observables).subscribe(data => {
      this.bikes = data[0];

      data[1].Waypoints.forEach((value, index) => {
        if (value.BikeId > 0) {
          value.Details = this.bikes.find(x => x.BikeId == value.BikeId);
          data[1].Waypoints[index] = value;
        }
      });
      this.routeOrder = data[1];

      if (this.routeOrder.CompletedDate != null) {
        var createDate = moment(this.routeOrder.StartedDate);
        var completeDate = moment(this.routeOrder.CompletedDate);
        //this.totaltimeMinutes = completeDate.diff(createDate, 'hours')

        var ms = moment(completeDate).diff(moment(createDate));
        var duration = moment.duration(ms);
        var hrs = Math.floor(duration.asHours()) > 0 ? Math.floor(duration.asHours()) + " h " : "";
        this.totaltimeMinutes = hrs + moment.utc(ms).format("mm") + " min";
      }
    }, error => {
      this.loggerService.showErrorMessage(error);
    });
  }

  updateWaypoint(waypoint: any, isSkipped: boolean = false) {
    const dialogAddWaypoint = this.dialog.open(WaypointUpdatePopupComponent, {
      width: '400px',
      // disableClose: true
    });

    dialogAddWaypoint.afterClosed().subscribe(result => {
      if (result) {
        if (waypoint) {
          let waypointObj = {
            "Comment": result["comment"],
            "IsSkipped": isSkipped
          }
          this.routeService.updateWaypoint(waypoint.WaypointId, waypointObj).subscribe(res => {
            this.getRouteDetailsWithWaypointActions();
            this.loggerService.showSuccessfulMessage("Waypoint status updated successfully");
          }, err => {

          });
        }
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
