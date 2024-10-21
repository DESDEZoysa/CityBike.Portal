import { Component, Inject } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface ConfirmationDPCheckData {
  dpVisualId: any;
}

@Component({
  selector: 'app-confirmation-dp-check-popup',
  templateUrl: './confirmation-dp-check-popup.component.html',
  styleUrls: ['./confirmation-dp-check-popup.component.scss']
})
export class ConfirmationDpCheckPopupComponent {
  dpVisualId: any;

  constructor(
    public dialogRef: MatDialogRef<ConfirmationDpCheckPopupComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmationDPCheckData,
    public dialog: MatDialog) {
    this.dpVisualId = this.data.dpVisualId;
  }

  cancelConfirmation() {
    this.dialogRef.close();
  }

  acceptConfirmation() {
    this.dialogRef.close(true);
  }

}
