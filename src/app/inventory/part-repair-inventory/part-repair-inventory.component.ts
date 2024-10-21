import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NgxSpinnerService } from 'ngx-spinner';
import { InventoryService, LoggerService, RepairService } from '../../services';
import { CreateVariantComponent } from '../create-variant/create-variant.component';


export interface DialogData {
  type: string;
  variant: any;
  allworkshopPartDetails: any;
  allWorkshops: any;
  selectedWorkshop: any;
  isAdminOrMaintenance: any;
}


@Component({
  selector: 'app-part-repair-inventory',
  templateUrl: './part-repair-inventory.component.html',
  styleUrls: ['./part-repair-inventory.component.scss']
})


export class PartRepairInventoryComponent implements OnInit {
  isDisabled = false;
  type: string;
  variant: any;
  parts: any;
  variants: any;
  bikeDetails: any;

  partVariant = {
    quantity: null,
    active: false,
    partId: null,
    variantName: null
  }
  allworkshopPartDetails: any;
  partDetails: any;
  allWorkshops: any;

  types = {
    Create: 'Create',
    Update: 'Update'
  };
  selectedWorkshop: any;
  totalQuantity: any = 0;
  moveQty: any;
  toWorkshop: any;
  fromWorkshop: any;
  fromWorkshops: any = [];
  isLoading: boolean;
  isEditMode: boolean = false;
  title: string;
  isAdminOrMaintenance = false;

  constructor(
    private fb: FormBuilder,
    private repairService: RepairService,
    private loggerService: LoggerService,
    private inventoryService: InventoryService,
    public dialogRef: MatDialogRef<PartRepairInventoryComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    public dialog: MatDialog,
    private spinner: NgxSpinnerService
  ) { }

  ngOnInit() {
    this.allworkshopPartDetails = this.data.allworkshopPartDetails;
    this.variant = this.data.variant;
    if (this.variant.VariantName)
      this.title = this.variant.PartName + " - " + this.variant.VariantName;
    else
      this.title = this.variant.PartName;
    this.partDetails = this.variant.VariantId > 0 ? this.allworkshopPartDetails.filter(x => x.VariantId == this.variant.VariantId) : this.allworkshopPartDetails.filter(x => x.PartId == this.variant.PartId);
    this.partDetails.map(x => {
      return x["isEditMode"] = false;
    });
    this.totalQuantity = this.partDetails.reduce((tot, item) => {
      return tot + item.Quantity;
    }, 0);
    this.allWorkshops = this.data.allWorkshops;
    this.partDetails.forEach(element => {
      let workshopObj = this.allWorkshops.find(x => x.Id == element.WorkshopId);
      if (workshopObj)
        this.fromWorkshops.push(workshopObj)
    });
    this.selectedWorkshop = this.data.selectedWorkshop;
    this.isAdminOrMaintenance = this.data.isAdminOrMaintenance;
  }

  openCreateUpdateVariantDialog(type: string, variant: any): void {
    const dialogRef = this.dialog.open(CreateVariantComponent, {
      width: '450px',
      data: { type: type, variant: variant }
    });

    dialogRef.afterClosed().subscribe(result => {
      //this.ngOnInit();
      this.isLoading = true;
      this.getAllPartVariantsByFilter(this.selectedWorkshop);
    });
  }

  getAllPartVariantsByFilter(workshopId) {
    this.inventoryService.getAllPartVariantsByFilter(workshopId).subscribe(data => {
      this.allworkshopPartDetails = data["AllWorkshopPartVariants"];
      if (this.allworkshopPartDetails) {
        this.partDetails = this.variant.VariantId > 0 ? this.allworkshopPartDetails.filter(x => x.VariantId == this.variant.VariantId) : this.allworkshopPartDetails.filter(x => x.PartId == this.variant.PartId);
        this.partDetails.map(x => {
          return x["isEditMode"] = false;
        });
      }
      this.totalQuantity = this.partDetails.reduce((tot, item) => {
        return tot + item.Quantity;
      }, 0);
      this.allWorkshops = this.data.allWorkshops;
      this.fromWorkshops = [];
      this.partDetails.forEach(element => {
        let workshopObj = this.allWorkshops.find(x => x.Id == element.WorkshopId);
        if (workshopObj)
          this.fromWorkshops.push(workshopObj)
      });
      this.isLoading = false;
    }, error => {
      this.loggerService.showErrorMessage('Getting parts and variants failed');
      this.isLoading = false;
    });
  }

  moveParts() {
    let fromWorkshopPartDet = this.partDetails.find(x => x.WorkshopId == this.fromWorkshop);
    if (fromWorkshopPartDet["Quantity"] >= this.moveQty) {
      if (this.fromWorkshop != this.toWorkshop) {
        let moveObj = {
          "VariantId": this.variant.VariantId,
          "PartId": this.variant.PartId,
          "Quantity": this.moveQty,
          "ToWorkshop": this.toWorkshop,
          "FromWorkshop": this.fromWorkshop
        }
        this.isLoading = true;
        this.inventoryService.moveInventoryStock(moveObj).subscribe(res => {
          this.loggerService.showSuccessfulMessage("Stock has been moved successfully");
          this.resetFields();
          this.getAllPartVariantsByFilter(this.selectedWorkshop);
        }, err => {
          this.isLoading = false;
        });
      }
      else {
        this.loggerService.showErrorMessage("Invalid workshop selection");
        this.toWorkshop = null;
        this.isLoading = false;
      }
    }
    else {
      this.loggerService.showErrorMessage("Insufficient stock");
      this.moveQty = "";
      this.isLoading = false;
    }
  }

  resetFields() {
    this.toWorkshop = null;
    this.fromWorkshop = null;
    this.moveQty = "";
  }

  editPartVariant(partDetail) {
    partDetail["isEditMode"] = true;
  }

  closeEdit(partDetail) {
    partDetail["isEditMode"] = false;
  }

  updateVariantQuantity(partDetail) {
    this.inventoryService.updatePartVariant(partDetail).subscribe(res => {
      if (!res) {
        this.loggerService.showErrorMessage("Update part variant successfully.But cannot change Default status.");
        this.isLoading = false;
      }
      else {
        this.loggerService.showSuccessfulMessage("Update part variant successfully.");
        partDetail["isEditMode"] = false;
        this.isLoading = true;
        this.getAllPartVariantsByFilter(this.selectedWorkshop);
      }
    }, err => {
      this.isLoading = false;
      this.loggerService.showErrorMessage("Error in updating part variant.");
    })
  }
}
