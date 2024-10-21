import { Component, OnInit, Inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';


export interface LiveMapConfirmData {
  bikeId: any;
  bike: any;
  isBikeOkay: boolean;
  userName: any;
  isShouldBeChecked: boolean;
  isBikeDisabled: boolean;
  isBikeNeedsRepair: boolean;
}

@Component({
  selector: 'app-live-map-confirm-popup',
  templateUrl: './live-map-confirm-popup.component.html',
  styleUrls: ['./live-map-confirm-popup.component.scss']
})
export class LiveMapConfirmPopupComponent implements OnInit {
  bikeId: any;
  isBikeOkay: boolean;
  bike: any;
  userName: any;
  isLoading: any;
  isShouldBeChecked: boolean;
  isBikeDisabled: boolean = false;
  isBikeNeedsRepair: boolean;

  constructor(
    private router: Router,
    private translate: TranslateService,
    public dialogRef: MatDialogRef<LiveMapConfirmPopupComponent>,
    @Inject(MAT_DIALOG_DATA) public data: LiveMapConfirmData,
    public dialog: MatDialog) {
    this.isLoading = false;
  }

  ngOnInit() {
    this.bikeId = this.data.bikeId;
    this.bike = this.data.bike;
    this.isBikeOkay = this.data.isBikeOkay;
    this.userName = this.data.userName;
    this.isShouldBeChecked = this.data.isShouldBeChecked;
    this.isBikeNeedsRepair = this.data.isBikeNeedsRepair;
    if (this.data.isBikeDisabled)
      this.isBikeDisabled = this.data.isBikeDisabled;
  }

  takeToWorkshop() {
    this.dialogRef.close({ isPlaceInCar: true });
  }

  placeAtSamePlace() {
    this.dialogRef.close({ isPlaceInCar: false });
  }

  placeBikeShouldBeChecked() {
    this.dialogRef.close({ isKeepInUse: true });
  }

}
