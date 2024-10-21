import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { LoggerService, RepairService, InventoryService } from '../../services';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { NgxSpinnerService } from 'ngx-spinner';
import { WorkshopService } from '../../services/workshop.service';

export interface DialogData {
  type: string;
  variant: any;
}

@Component({
  selector: 'app-create-variant',
  templateUrl: './create-variant.component.html',
  styleUrls: ['./create-variant.component.scss']
})

export class CreateVariantComponent implements OnInit {
  isDisabled = false;
  type: string;
  variant: any;
  parts: any;
  variants: any;
  bikeDetails: any;
  partVariantForm: FormGroup;
  types = {
    Create: "Create",
    Update: "Update"
  };
  partVariant = {
    quantity: null,
    active: false,
    partId: null,
    variantName: null,
    workshopId: null,
    variantId: null
  }
  allWorkshops: any[];
  allPartVariants: any = [];
  filteredWorkshops: any = [];
  constructor(
    private fb: FormBuilder,
    private repairService: RepairService,
    private loggerService: LoggerService,
    private inventoryService: InventoryService,
    public dialogRef: MatDialogRef<CreateVariantComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    public dialog: MatDialog,
    private spinner: NgxSpinnerService,
    private workshopService: WorkshopService
  ) { }

  ngOnInit() {
    if (this.data.type == this.types.Update) {
      this.partVariant.partId = this.data.variant.PartId;
      // this.partVariant.variantName = this.data.variant.VariantName;
      this.partVariant.variantId = this.data.variant.VariantId;
      this.partVariant.quantity = this.data.variant.Quantity;
      this.partVariant.active = this.data.variant.Active;
      this.partVariant.workshopId = this.data.variant.WorkshopId;
    }
    this.createPartVariantForm();
    this.getAllVariants();
    this.getAllParts();
    this.getAllPartVariants();
    this.getAllWorkshopsWithStreetTeam();
  }

  private createPartVariantForm() {
    this.partVariantForm = this.fb.group({
      PartId: [{ value: "", disabled: this.data.type == this.types.Update }, Validators.required],
      // VariantName: ["", Validators.required],
      VariantId: ["", Validators.required],
      Quantity: ["", Validators.required],
      Active: [false, Validators.required],
      WorkshopId: [{ value: "", disabled: this.data.type == this.types.Update }, Validators.required]
    })
  }

  getAllParts() {
    this.inventoryService.getAllBikeParts().subscribe(data => {
      this.parts = data;
    }, error => {
      this.loggerService.showErrorMessage("Getting parts failed.");
    });
  }

  getAllVariants() {
    this.inventoryService.getAllBikeVariants().subscribe(data => {
      this.variants = data;
    }, error => {
      this.loggerService.showErrorMessage("Getting variants failed.");
    });
  }

  getAllWorkshopsWithStreetTeam() {
    this.allWorkshops = [];
    this.workshopService.getAllWorkshopsWithStreetTeam().subscribe(res => {
      if (res) {
        this.allWorkshops = res;
        this.filteredWorkshops = res;
      }
    });
  }

  createUpdatePartVariant(type: string) {

    this.variant = Object.assign({}, this.partVariantForm.getRawValue());
    if (!this.validateVariant()) {
      this.loggerService.showWarningMessage("Invalid inputs.");
    }
    else {
      this.isDisabled = true;
      if (type == this.types.Create) {
        this.createVariant();
      }
      else {
        this.variant['Id'] = this.data.variant.Id;
        this.variant['VariantId'] = this.data.variant.VariantId;
        this.updateVariant();
      }
    }
  }

  onVariantChange(event) {
    if (this.allPartVariants) {
      this.filteredWorkshops = this.allWorkshops;
      let filteredPartvariants = this.allPartVariants.filter(x => x.PartId == this.partVariant.partId && x.VariantId == event.value);
      filteredPartvariants.forEach(partVariant => {
        this.filteredWorkshops = this.filteredWorkshops.filter(x => x.Id != partVariant.WorkshopId);
      });
    }
  }

  validateVariant(): boolean {
    if (this.variant.PartId == null || this.variant.Quantity == null || this.variant.VariantId == null ||
      this.variant.PartId == "" || this.variant.Quantity == "" || this.variant.VariantId == "") {
      return false;
    }
    return true;
  }

  createVariant() {
    this.inventoryService.createPartVariant(this.variant).subscribe(res => {
      this.dialogRef.close();
      this.loggerService.showSuccessfulMessage("Create part variant successfully.");
    }, error => {
      this.loggerService.showErrorMessage("Error in creating part variant.")
    });
  }

  updateVariant() {
    this.spinner.show();
    this.inventoryService.updatePartVariant(this.variant).subscribe(res => {
      this.dialogRef.close();
      if (!res) {
        this.loggerService.showErrorMessage("Update part variant successfully.But cannot change Default status.");
      }
      else {
        this.loggerService.showSuccessfulMessage("Update part variant successfully.");
      }
    }, error => {
      this.loggerService.showErrorMessage("Error in updating part variant.")
    });
    this.spinner.hide();
  }

  getAllPartVariants() {
    this.inventoryService.getAllPartsAndVariants().subscribe(res => {
      this.allPartVariants = res;
    }, err => {

    });
  }
}