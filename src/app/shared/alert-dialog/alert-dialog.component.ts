import { Component, OnInit, Inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-alert-dialog',
  templateUrl: './alert-dialog.component.html',
  styleUrls: ['./alert-dialog.component.scss']
})
export class AlertDialogComponent implements OnInit {

  dialogMessage = "ALERT.MESSAGE";

  constructor(public dialogRef: MatDialogRef<AlertDialogComponent>, private translate: TranslateService,
    @Inject(MAT_DIALOG_DATA) public data: any) {


    data.status = true;
    if (data.message) {
      this.dialogMessage = data.message;
      this.translate.get(data.message).subscribe(res => {
        this.dialogMessage = res;
      })
    }

    else {
      this.translate.get(this.dialogMessage).subscribe(res => {
        this.dialogMessage = res;
      })
    }
  }

  onCancelClick(): void {
    this.dialogRef.close();
  }

  ngOnInit() {
  }

}
