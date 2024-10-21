import { Component, Inject, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { LoggerService } from '../../services';
import { RouteService } from '../../services/route.service';

export interface WaypointData {
  isWorkshopOrStorage: boolean;
  userId: any;
  workshopId: any;
  storageId: any;
}

@Component({
  selector: 'app-waypoint-update-popup',
  templateUrl: './waypoint-update-popup.component.html',
  styleUrls: ['./waypoint-update-popup.component.scss']
})
export class WaypointUpdatePopupComponent implements OnInit {

  comment: any;
  isWorkshopOrStorage: boolean;
  userId: any;
  workshopId: any;
  storageId: any;

  constructor(
    public dialogRef: MatDialogRef<WaypointUpdatePopupComponent>,
    public dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) public data: WaypointData,
    private routeService: RouteService,
    private loggerService: LoggerService) {
    if (this.data && this.data.isWorkshopOrStorage) {
      this.isWorkshopOrStorage = this.data.isWorkshopOrStorage;
      this.userId = this.data.userId;
      this.workshopId = this.data.workshopId;
      this.storageId = this.data.storageId;
    }
  }

  ngOnInit() {

  }

  submitChanges() {
    this.dialogRef.close({ "comment": this.comment });
  }


  //methods below this comment are only used for workshop and storage waypoints
  skipWaypoint() {
    this.updateWaypoint(true);
  }

  completeWaypoint() {
    this.updateWaypoint();
  }

  updateWaypoint(isSkipped = false) {
    let waypointUpdateObj = {
      "AssignedOn": this.userId,
      "WorkshopId": this.workshopId,
      "StorageId": this.storageId,
      "IsSkipped": isSkipped,
      "Comment": this.comment
    };
    this.routeService.updateWaypointByAssignedOn(waypointUpdateObj).subscribe(res => {
      this.dialogRef.close({"IsSkipped": isSkipped});
    }, err => {
      if (isSkipped)
        this.loggerService.showErrorMessage("Error while skipping waypoint");
      else
        this.loggerService.showErrorMessage("Error while completing waypoint");
    });
  }
}

