import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-disable-station-confirmation-popup',
  templateUrl: './disable-station-confirmation-popup.component.html',
  styleUrls: ['./disable-station-confirmation-popup.component.scss']
})
export class DisableStationConfirmationPopupComponent implements OnInit {

  comment = new FormControl('', [Validators.required, this.customValidator]);

  constructor(public dialogRef: MatDialogRef<DisableStationConfirmationPopupComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) { }

  ngOnInit(): void {
  }

  onCancelClick(): void {
    this.dialogRef.close({ isConfirmed: false });
  }

  onOkClick(): void {
    if (this.comment.valid)
      this.dialogRef.close({isConfirmed: true, comment : this.comment.value});
  }

  customValidator(control: FormControl): { [s: string]: boolean } {
    const value = control.value;
    if (!value || value.trim() === '') {
      return { 'required': true };
    }
    return null;
  }

}
