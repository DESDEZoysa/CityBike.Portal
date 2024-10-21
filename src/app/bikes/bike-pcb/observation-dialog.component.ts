import { Input, Component } from "@angular/core";
import { MatDialogRef } from "@angular/material/dialog";

@Component({
    selector: 'overflow-dialog',
    template: `
    <div style="word-wrap: break-word; overflow-x: hidden; height: 100% !important;position: relative;">   
    <p> {{ details.CurrentValue }} </p>
    <button md-button type="button" (click)="dialogRef.close()" style="position: absolute; bottom: 0px; right: 0px; background-color:#efefef">Close</button>
    </div>`
})

export class ObservationOverflowDialog {
    @Input() details: Details;

    constructor(public dialogRef: MatDialogRef<ObservationOverflowDialog>) {
    }
}

export interface Details {
    MID: string,
    ObservationName: string,
    Timestamp: string,
    CurrentValue: string
}