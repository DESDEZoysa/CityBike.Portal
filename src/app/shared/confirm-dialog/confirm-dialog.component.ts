import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-confirm-dialog',
  template: `   
    <div mat-dialog-content> 
        <p style="margin: 0 0 30px 0; white-space: pre-wrap;">{{dialogMessage}}</p>
    </div>  
    <input matInput [(ngModel)]="data.status" hidden="true"> 
    <div fxLayout="row" fxLayoutAlign="space-between center">
        <button mat-raised-button (click)='onCancelClick()'>{{cancelText}}</button>
        <button mat-raised-button color="primary" class="btn-block" [mat-dialog-close]="data.status" cdkFocusInitial>{{okayText}}</button>
    </div>`,
})
export class ConfirmDialogComponent {

  dialogMessage = "CONFIRM_DIALOG.DELETE";
  cancelText = "Cancel";
  okayText = "Ok";

  constructor(public dialogRef: MatDialogRef<ConfirmDialogComponent>, private translate: TranslateService,
    @Inject(MAT_DIALOG_DATA) public data: any) {

    this.translate.get("CONFIRM_DIALOG.CANCEL").subscribe(res => {
      this.cancelText = res;
    });

    this.translate.get("CONFIRM_DIALOG.OKAY").subscribe(res => {
      this.okayText = res;
    });

    if (data.okayText) {
      this.translate.get("CONFIRM_DIALOG.YES").subscribe(res => {
        this.okayText = res;
      });
    }

    if (data.cancelText) {
      this.translate.get("CONFIRM_DIALOG.NO").subscribe(res => {
        this.cancelText = res;
      });
    }

    data.status = true;
    if (data.message) {
      this.dialogMessage = data.message;
      this.translate.get(data.message).subscribe(res => {
        this.dialogMessage = res;
      });
    }

    else {
      this.translate.get(this.dialogMessage).subscribe(res => {
        this.dialogMessage = res;
      });
    }
  }

  onCancelClick(): void {
    this.dialogRef.close();
  }

}
