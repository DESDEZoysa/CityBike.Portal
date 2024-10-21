import { Component, Inject, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

export interface StorageSelectionData {
  bikeId: any;
  bike: any;
  userName: any;
  allStorages: any;
}

@Component({
  selector: 'app-storage-selection-popup',
  templateUrl: './storage-selection-popup.component.html',
  styleUrls: ['./storage-selection-popup.component.scss']
})
export class StorageSelectionPopupComponent implements OnInit {

  bikeId: any;
  bike: any;
  userName: any;
  isLoading: any;
  allStorages: any[];
  selectedStorage: any;

  constructor(
    private router: Router,
    private translate: TranslateService,
    public dialogRef: MatDialogRef<StorageSelectionPopupComponent>,
    @Inject(MAT_DIALOG_DATA) public data: StorageSelectionData,
    public dialog: MatDialog) {
    this.isLoading = false;
  }

  ngOnInit() {
    this.bikeId = this.data.bikeId;
    this.bike = this.data.bike;
    this.userName = this.data.userName;
    this.allStorages = this.data.allStorages;
    if (this.allStorages.length > 0)
      this.selectedStorage = this.allStorages[0].Id;
  }

  SetStorage() {
    this.dialogRef.close({ "selectedStorageId": this.selectedStorage });
  }

}
