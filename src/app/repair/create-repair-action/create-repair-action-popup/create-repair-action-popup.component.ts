import { Component, OnInit, Inject } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { LoggerService, BikesService, AppSettings, InventoryService, IssueService } from '../../../services';
import { RepairService } from '../../../services/repair.service';
import { Router, ActivatedRoute } from '@angular/router';
import { S3BucketFoldersKeys } from '../../../core/enums/S3BucketFoldersKeys';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';

export interface RepairActionDialogData {
  bikeId: any;
  issueId: any;
}

@Component({
  selector: 'app-create-repair-action-popup',
  templateUrl: './create-repair-action-popup.component.html',
  styleUrls: ['./create-repair-action-popup.component.scss']
})
export class CreateRepairActionPopupComponent implements OnInit {
  repairActionPopUpForm: FormGroup;

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
  isMobile: boolean = false;
  bikeId: number;
  isDisabled: boolean = false;
  noVariants: boolean = false;
  issueId: any;

  constructor(private fb: FormBuilder, private repairService: RepairService,
    private bikeService: BikesService,
    private inventoryService: InventoryService, private appSettings: AppSettings,
    private loggerService: LoggerService, private router: Router,
    private activateRouter: ActivatedRoute,
    public dialogRef: MatDialogRef<CreateRepairActionPopupComponent>,
    @Inject(MAT_DIALOG_DATA) public data: RepairActionDialogData,
    public dialog: MatDialog,
    private issueService: IssueService) {
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      this.isMobile = true;
    }
    this.bikeId = this.data.bikeId;
    this.issueId = this.data.issueId;

  }

  onResize() {
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      this.isMobile = true;
    } else {
      this.isMobile = false;
    }
  }

  ngOnInit() {
    this.createRepairActionForm();
    this.getBikes();
    this.getParts();
    //this.getVariants();
    this.getReasons();
  }

  createRepairActionForm() {
    this.defaultVariantId = "";
    var bikeId = this.bikeId ? + this.bikeId : "";
    this.repairActionPopUpForm = this.fb.group({
      BikeId: [bikeId, Validators.required],
      PartId: [""],
      VariantId: [this.defaultVariantId],
      ReasonId: ["", Validators.required],
      Comments: [""]
    })
    this.repairActionPopUpForm.controls['BikeId'].disable();
  }

  getBikes() {
    this.bikeService.getBikes().subscribe(data => {
      this.arrangeBikeDropDownList(data);
    }, error => {
      this.loggerService.showErrorMessage("Getting bikes failed.");
    });
  }

  arrangeBikeDropDownList(bikes) {
    let bikeDropDownArray = [];

    bikes.forEach((bike) => {
      let bikeData = [];
      bikeData['BikeId'] = bike['BikeId'];
      bikeData['VisualId'] = bike['VisualId'];
      bikeData['Serial'] = bike['Serial'];
      bikeDropDownArray.push(bikeData);
    });

    let sortedArray = bikeDropDownArray.sort(function (a, b) {
      return a.VisualId - b.VisualId;
    });
    this.bikeList.push(...sortedArray);
  }

  getParts() {
    this.inventoryService.getAllBikeParts().subscribe(data => {
      this.parts = data;
    }, error => {
      this.loggerService.showErrorMessage("Getting parts failed.");
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
      this.loggerService.showErrorMessage("Getting variants failed.");
    });
  }

  getReasons() {
    this.repairService.getAllBikeRepairReasons().subscribe(data => {
      this.reasons = data;
      this.reasons.sort(function (a, b) {
        if (a.Id < b.Id)
          return -1;
        if (a.Id > b.Id)
          return 1;
        return 0;
      });
    }, error => {
      this.loggerService.showErrorMessage("Getting repair reasons failed.");
    });
  }

  onBikeChange(event) {
    this.selectedBike = this.bikeList.find(x => x.BikeId == event.value);
  }

  onPartChange(event) {
    this.selectedPart = this.parts.find(x => x.PartId == event.value);
    this.getVariants(this.selectedPart);
  }

  onVariantChange(event) {
    this.selectedVariant = this.variants.find(x => x.VariantId == event.value);
  }

  onReasonChange(event) {
    this.selectedReason = this.reasons.find(x => x.Id == event.value);
  }

  resolveIssue() {
    this.issueService.ResolveIssue(this.bikeId, this.issueId).subscribe(result => {
      if (result > 0) {
        this.loggerService.showSuccessfulMessage("Issue resolved sucessfully.");
        this.dialogRef.close({ "reloadNeed": true });
      } else {
        this.loggerService.showErrorMessage("Issue resolving failed");
      }
    });
  }

  logRepairAction() {
    var action = Object.assign({}, this.repairActionPopUpForm.value);
    action.BikeId = this.bikeId;
    action.IssueId = this.issueId;
    if (this.isNullOrEmpty(action.BikeId) || this.isNullOrEmpty(action.ReasonId)) {
      this.loggerService.showErrorMessage("Invalid request.Please select required fields.");
    }
    else if (!this.isNullOrEmpty(action.PartId) || !this.isNullOrEmpty(action.VariantId)) {
      var selectedVariant = this.variants.find(x => x.VariantId == action.VariantId);
      if (selectedVariant.Quantity <= 0) {
        this.loggerService.showErrorMessage("Selected variant quantity is zero.Please select a different variant.");
      } else {
        this.isDisabled = true;
        this.repairService.CreateRepairAction(action)
          .subscribe(data => {
            this.loggerService.showSuccessfulMessage("Repair action successfully saved.");
            this.repairActionPopUpForm.reset();
            this.createRepairActionForm();
            this.isDisabled = false;
          }, error => {
            this.loggerService.showErrorMessage("Repair action saving failed.");
          });
      }
    }
    else {
      this.isDisabled = true;
      this.repairService.CreateRepairAction(action)
        .subscribe(data => {
          this.loggerService.showSuccessfulMessage("Repair action successfully saved.");
          this.repairActionPopUpForm.reset();
          this.createRepairActionForm();
          this.isDisabled = false;
        }, error => {
          this.loggerService.showErrorMessage("Repair action saving failed.");
        });
    }
  }

  isNullOrEmpty(value: any): boolean {
    let isNullOrEmpty = true;
    if (value != null && value != "") isNullOrEmpty = false;
    return isNullOrEmpty;
  }

}