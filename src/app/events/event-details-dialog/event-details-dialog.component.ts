import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface DialogData {
  details: string;
  title: string;
}

@Component({
  selector: 'app-event-details-dialog',
  templateUrl: './event-details-dialog.component.html',
  styleUrls: ['./event-details-dialog.component.scss']
})
export class EventDetailsDialogComponent implements OnInit {
  details: string;
  title: string;
  subTitle: string;
  detailsArray: string[];

  constructor(@Inject(MAT_DIALOG_DATA) public data: DialogData) {
    this.title = this.data.title;
    this.details = this.data.details;
  }

  ngOnInit() {
  }

}
