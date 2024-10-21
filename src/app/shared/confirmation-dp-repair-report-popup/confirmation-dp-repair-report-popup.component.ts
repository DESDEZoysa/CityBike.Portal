import { Component, Inject, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface ConfirmRepairReportData {
  isBikeExist: boolean;
}

@Component({
  selector: 'app-confirmation-dp-repair-report-popup',
  templateUrl: './confirmation-dp-repair-report-popup.component.html',
  styleUrls: ['./confirmation-dp-repair-report-popup.component.scss']
})
export class ConfirmationDpRepairReportPopupComponent implements OnInit {
  isBikeExist: boolean;

  constructor(
    public dialogRef: MatDialogRef<ConfirmationDpRepairReportPopupComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmRepairReportData,
    public dialog: MatDialog) {
    this.isBikeExist = this.data.isBikeExist;
  }

  ngOnInit() {
  }

  confirmRepairReport() {
    this.dialogRef.close({ "IsConfirmedRepair": true });
  }

  cancel() {
    this.dialogRef.close();
  }
}
