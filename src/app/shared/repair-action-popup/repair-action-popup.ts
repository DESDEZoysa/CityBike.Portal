import { Component, Input, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormGroup, Validators, FormBuilder } from '@angular/forms';
import { RepairService, LoggerService, AppSettings, InventoryService } from '../../services';
import { S3BucketFoldersKeys } from '../../core/enums/S3BucketFoldersKeys';

@Component({
    selector: 'overflow-dialog',
    template: `
    <div style="word-wrap: break-word; overflow-x: hidden; height: 100% !important;position: relative;" fxLayout="column" fxLayoutAlign="space-between none">
        <div fxLayout="column">
            <h3 class="mt-0" style="margin-bottom: 25px; margin-top: 0; position:relative;"> {{ 'REPAIR_ACTION.CREATE_ACTION' | translate }}</h3>
            <div fxLayout="row wrap" fxLayout.xs="column" class="repair-action-form-wrapper">
                <div fxFlex="60%">
                    <form class="example-form" [formGroup]="repairActionForm" style="font-size: 15px;">
                        <mat-form-field class="repair-action-form-field-full-width">
                        <mat-select placeholder="{{ 'REPAIR_ACTION.PART' | translate }} *"
                            [formControl]="repairActionForm.controls['PartId']">
                            <mat-option *ngFor="let part of parts" [value]="part.PartId">{{ part.Name }}</mat-option>
                        </mat-select>
                        <mat-error
                            *ngIf="repairActionForm.controls['PartId'].hasError('required') && repairActionForm.controls['PartId'].touched"
                            class="md-text-warn">{{ 'REPAIR_ACTION.PART_REQ_ERROR' | translate }}</mat-error>
                        </mat-form-field>

                        <mat-form-field class="repair-action-form-field-full-width">
                        <mat-select placeholder="{{ 'REPAIR_ACTION.VARIANT' | translate }} *"
                            [formControl]="repairActionForm.controls['VariantId']" (selectionChange)="onVariantChange($event)"
                            [(ngModel)]="defaultVariantId">
                            <mat-option *ngFor="let variant of variants" [value]="variant.VariantId">{{ variant.Name }} - ({{ variant.Quantity }})</mat-option>
                        </mat-select>
                        <!-- <mat-error
                            *ngIf="repairActionForm.controls['VariantId'].hasError('required') && repairActionForm.controls['VariantId'].touched"
                            class="md-text-warn">{{ 'REPAIR_ACTION.VARIANT_REQ_ERROR' | translate }}</mat-error> -->
                        </mat-form-field>

                        <mat-form-field class="repair-action-form-field-full-width">
                        <mat-select placeholder="{{ 'REPAIR_ACTION.REASON' | translate }} *"
                            [formControl]="repairActionForm.controls['ReasonId']" (selectionChange)="onReasonChange($event)">
                            <mat-option *ngFor="let reason of reasons" [value]="reason.Id">{{reason.Description}}</mat-option>
                        </mat-select>
                        <mat-error
                            *ngIf="repairActionForm.controls['ReasonId'].hasError('required') && repairActionForm.controls['ReasonId'].touched"
                            class="md-text-warn">{{ 'REPAIR_ACTION.REASON_REQ_ERROR' | translate }}</mat-error>
                        </mat-form-field>

                        <mat-form-field class="repair-action-form-field-full-width" style="padding">
                        <input matInput placeholder="{{'REPAIR_ACTION.COMMENT' | translate }} " type="text"
                            [formControl]="repairActionForm.controls['Comments']">
                        </mat-form-field>                   

                        <mat-error *ngIf="noVariants" class="md-text-warn" style="font-size:12px;padding-bottom:5px; margin-top:-10px;"> {{'REPAIR_ACTION.NO_VARIANTS_FOUND' | translate }}</mat-error>
                    </form>
                </div>
                <div fxFlex="40%">
                    <img *ngIf="variantImageUrl" src="{{variantImageUrl}}" class="image-container">
                </div>
            </div>
        </div>
        <div class="modal-buttons-wrapper" fxLayout="row" fxLayoutAlign="space-between start">
            <button mat-raised-button type="button" [disabled]="!repairActionForm.valid" (click)="logRepairAction()" mat-dialog-close>Save</button>
            <button mat-button type="button" (click)="dialogRef.close()" style="background-color:#efefef;">Close</button>
        </div>
    </div>`,
    styleUrls: ['./repair-action-popup.scss'],
})

export class CreateActionPopUpDialog implements OnInit {
    @Input() details: RepairActionDetails;

    // isMobile: boolean = false;
    repairActionForm: FormGroup;
    parts;
    variants;
    reasons;
    bikeList = [];
    selectedBike;
    selectedPart;
    selectedVariant;
    selectedReason;
    defaultVariant;
    defaultVariantId;
    variantImageUrl;
    bikeId: number;
    noVariants: boolean = false;

    constructor(private fb: FormBuilder, public dialogRef: MatDialogRef<CreateActionPopUpDialog>,
        private inventoryService: InventoryService,
        private repairService: RepairService, private loggerService: LoggerService,
        private appSettings: AppSettings, @Inject(MAT_DIALOG_DATA) public data: any) {
        this.bikeId = this.data.bikeId;
    }

    ngOnInit(): void {
        this.createRepairActionForm();
        this.getParts();
        this.getReasons();
    }

    createRepairActionForm() {
        this.repairActionForm = this.fb.group({
            PartId: [this.details.PartId, Validators.required],
            VariantId: ["", Validators.required],
            ReasonId: ["", Validators.required],
            Comments: [""]
        })
        this.repairActionForm.controls['PartId'].disable();
    }

    getParts() {
        this.inventoryService.getAllBikeParts().subscribe(data => {
            this.parts = data;
            this.selectedPart = this.parts.find(x => x.PartId == this.details.PartId);
            this.getVariants(this.selectedPart);
        }, error => {
            this.loggerService.showErrorMessage("Getting parts failed!");
        });
    }

    getVariants(selectedPart) {
        this.variantImageUrl = null;

        this.inventoryService.getAllVariantsforPart(selectedPart.PartId).subscribe(data => {
            this.variants = data;

            if (data.length > 0) {
                this.selectedVariant = data.find(x => x.Active == true);
                this.defaultVariant = (typeof this.selectedVariant != "undefined") ? this.selectedVariant : data[0];
                this.defaultVariantId = this.defaultVariant.VariantId;
                if (this.defaultVariant.ImageUrl != null) {
                    this.variantImageUrl = this.appSettings.s3_Image_URL + S3BucketFoldersKeys.Variants + '/' + this.defaultVariant.ImageUrl;
                } else {
                    this.variantImageUrl = "/assets/images/no_image_available.svg";
                }
                this.noVariants = false;
            } else {
                this.variantImageUrl = null;
                this.noVariants = true;
                this.loggerService.showErrorMessage("No variants found for given part.");
            }
        }, error => {
            this.loggerService.showErrorMessage("Getting variants failed!");
        });
    }

    getReasons() {
        this.repairService.getAllBikeRepairReasons().subscribe(data => {
            this.reasons = data;
        }, error => {
            this.loggerService.showErrorMessage("Getting repair reasons failed!");
        });
    }

    onVariantChange(event) {
        this.selectedVariant = this.variants.find(x => x.VariantId == event.value);
    }

    onReasonChange(event) {
        this.selectedReason = this.reasons.find(x => x.Id == event.value);
    }

    logRepairAction() {
        var action = Object.assign({}, this.repairActionForm.value);
        action.BikeId = this.bikeId;
        action.PartId = this.details.PartId;

        var selectedVariant = this.variants.find(x => x.VariantId == action.VariantId);
        if (selectedVariant.Quantity <= 0) {
            this.loggerService.showErrorMessage("Selected variant quantity is zero.Please select a different variant.");
        } else {
            this.repairService.CreateRepairAction(action).subscribe(data => {
                this.loggerService.showSuccessfulMessage("Repair action successfully saved!");
                //this.router.navigate(['/repair/orders']);                
            }, error => {
                this.loggerService.showErrorMessage("Repair action saving failed!");
            });
        }
    }
}

export interface RepairActionDetails {
    BikeId: number,
    PartId: number,
    VariantId: number,
    ReasonId: number,
    Comments: string
}