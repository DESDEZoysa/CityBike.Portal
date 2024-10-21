import { Component, OnInit } from '@angular/core';
import { DockingStationService, LoggerService } from '../../services';

@Component({
  selector: 'app-docking-stations-list',
  templateUrl: './docking-stations-list.component.html',
  styleUrls: ['./docking-stations-list.component.scss']
})
export class DockingStationsListComponent implements OnInit {

  public dockingStations = [];
  distanceInMeters = 15000000;
  geolocationPosition;
  isPositionAvilable = false;

  constructor(private dockingStationService: DockingStationService, private loggerService: LoggerService) { }

  ngOnInit() {
    this.getGeoLocation();
  }

  getGeoLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => {
          this.isPositionAvilable = true;
          this.geolocationPosition = position.coords,
            this.getNearestDockingStations();
        },
        error => {
          switch (error.code) {
            case error.PERMISSION_DENIED:
              //this.loggerService.showErrorMessage("User denied the request for Geolocation.");
              this.loadAllDockingStations();
              this.isPositionAvilable = false;
              break;
            case error.POSITION_UNAVAILABLE:
              this.loggerService.showErrorMessage("Location information is unavailable.");
              break;
            case error.TIMEOUT:
              this.loggerService.showErrorMessage("The request to get user location timed out.");
              break;
          }
        }
      );
    }
  }

  getNearestDockingStations() {
    //console.log("long : " + this.geolocationPosition.longitude + " lat : " + this.geolocationPosition.latitude + " distance : " + this.distanceInMeters);
    this.dockingStationService.getNearestDockingStations(this.geolocationPosition.longitude, this.geolocationPosition.latitude, this.distanceInMeters)
      .subscribe(data => {
        this.dockingStations = data;
        if (data.length == 0) {
          this.loggerService.showErrorMessage("Don't have any docking station near the user.");
        }
      },
        error => {
          if (error.status == 403) {
            this.loggerService.showErrorMessage("Don't have permission to obtain data");
          } else {
            this.loggerService.showErrorMessage(error);
          }
        });
  }

  loadAllDockingStations(): void {
    this.dockingStationService.getDockingStations(false)
      .subscribe(data => {
        this.dockingStations = data;
      },
        error => {
          if (error.status == 403) {
            this.loggerService.showErrorMessage("Don't have permission to obtain data");
          } else {
            this.loggerService.showErrorMessage(error);
          }
        });
  }
}
