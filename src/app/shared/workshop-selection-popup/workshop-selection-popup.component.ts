import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';


export interface WorkshopSelectionData {
  bikeId: any;
  bike: any;
  isBikeOkay: boolean;
  userName: any;
  allWorkshops: any;
  allNearbyWorkshops: any;
}

@Component({
  selector: 'app-workshop-selection-popup',
  templateUrl: './workshop-selection-popup.component.html',
  styleUrls: ['./workshop-selection-popup.component.scss']
})
export class WorkshopSelectionPopupComponent implements OnInit {

  bikeId: any;
  isBikeOkay: boolean;
  bike: any;
  userName: any;
  isLoading: any;
  allWorkshops: any[];
  allNearbyWorkshops: any;
  selectedWorkshop: any;

  constructor(
    private router: Router,
    private translate: TranslateService,
    public dialogRef: MatDialogRef<WorkshopSelectionPopupComponent>,
    @Inject(MAT_DIALOG_DATA) public data: WorkshopSelectionData,
    public dialog: MatDialog) {
    this.isLoading = false;
  }

  ngOnInit() {
    this.bikeId = this.data.bikeId;
    this.bike = this.data.bike;
    this.isBikeOkay = this.data.isBikeOkay;
    this.userName = this.data.userName;
    this.allWorkshops = this.data.allWorkshops;
    this.allNearbyWorkshops = this.data.allNearbyWorkshops;
    if (this.allNearbyWorkshops && this.allNearbyWorkshops.length == 0) {
      this.allNearbyWorkshops = this.allWorkshops;
    }
    if (this.allNearbyWorkshops.length > 0)
      this.selectedWorkshop = this.allNearbyWorkshops[0].Id;
  }

  SetWorkshop() {
    this.dialogRef.close({ "selectedWorkshopId": this.selectedWorkshop });
  }

}
