import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface DialogData {
  comment: string;
  bikeId: number;
  isFeeIncluded: boolean;
}

@Component({
  selector: 'app-session-terminate-dialog',
  templateUrl: './session-terminate-dialog.component.html',
  styleUrls: ['./session-terminate-dialog.component.scss']
})
export class SessionTerminateDialogComponent {

  _valid: boolean = false;
  _data: any;
  isCommentEmpty: boolean = false;
  commentletters: any = undefined;

  constructor(public dialogRef: MatDialogRef<SessionTerminateDialogComponent>, @Inject(MAT_DIALOG_DATA) public data: DialogData) {
    this._data = data;
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  changeSelection(event) {
    this._data.isFeeIncluded = event.value;
  }

  onConfirm(data) {
    if (data.comment) {
      var regex = /[.,\s]/g;
      this.commentletters = data.comment.replace(regex, '');
      if (this.commentletters.length >= 5) {
        this.isCommentEmpty = false;
        this.dialogRef.close(data);
      }
      else
        this.isCommentEmpty = true;
    }
    else
      this.isCommentEmpty = true;
  }
}
