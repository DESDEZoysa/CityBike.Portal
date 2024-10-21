import { Component, Input } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
    selector: 'overflow-dialog',
    template: `
    <div style="word-wrap: break-word; overflow-x: hidden; height: 100% !important;position: relative;">
    <h4 class="mt-0">{{ details.Name }}</h4>
    <h5 class="mt-0">{{ details.Description }}</h5>

    <img *ngIf="details.Url && !isMobile" src="{{ details.Url}}" class="image-pop-img">
    <img *ngIf="!details.Url && !isMobile" src="/assets/images/no_image_available.svg" class="image-pop-img">

    <img *ngIf="details.Url && isMobile" src="{{ details.Url}}" class="image-pop-img">
    <img *ngIf="!details.Url && isMobile" src="/assets/images/no_image_available.svg" class="image-pop-img">

    <button mat-button type="button" (click)="dialogRef.close()" style="background-color:#efefef">Close</button>
    </div>`
})

export class ImagePopUpDialog {
    @Input() details: ImageDetails;
    isMobile: boolean = false;

    constructor(public dialogRef: MatDialogRef<ImagePopUpDialog>) {
        if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
            this.isMobile = true;
        }
    }
}

export interface ImageDetails {
    Name: string;
    Url: string;
    Description: string
}