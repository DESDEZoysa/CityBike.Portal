import { Component, OnInit, Inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';

export interface DeliverWorkshopData {
  bikeId: any;
  bike: any;
  isBikeOkay: boolean;
  userName: any;
}


@Component({
  selector: 'app-deliver-workshop-popup',
  templateUrl: './deliver-workshop-popup.component.html',
  styleUrls: ['./deliver-workshop-popup.component.scss']
})
export class DeliverWorkshopPopupComponent implements OnInit {

  bikeId: any;
  isBikeOkay: boolean;
  bike: any;
  userName: any;
  isLoading: any;

  constructor(
    private router: Router,
    private translate: TranslateService,
    public dialogRef: MatDialogRef<DeliverWorkshopPopupComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DeliverWorkshopData,
    public dialog: MatDialog) {
    this.isLoading = false;
  }

  ngOnInit() {
    this.bikeId = this.data.bikeId;
    this.bike = this.data.bike;
    this.isBikeOkay = this.data.isBikeOkay;
    this.userName = this.data.userName;
  }

}
