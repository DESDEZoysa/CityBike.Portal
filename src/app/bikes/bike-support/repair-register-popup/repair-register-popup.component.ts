import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { LoggerService, RepairService, InventoryService, BikesService } from '../../../services';
import { TranslateMessageTypes } from '../../../core/enums/TranslateMessageTypes';
import { TranslateService } from '@ngx-translate/core';
import { CommonService } from '../../../services/common-service';

export interface RepairRegisterDialogData {
  group1: any[];
  group2: any[];
  group3: any[];
  bikeId: any;
  bike: any;
  otherFix: boolean;
  isBikeOkay: boolean;
  checkedCategories: any[];
}

const StreetTeamWorkshopId: number = 100;

@Component({
  selector: 'app-repair-register-popup',
  templateUrl: './repair-register-popup.component.html',
  styleUrls: ['./repair-register-popup.component.scss']
})
export class RepairRegisterPopupComponent implements OnInit {
  group1: any[];
  bikeId: any;
  otherFix: boolean;
  group2: any[];
  group3: any[];
  disableBike: boolean;
  isBikeOkay: boolean;
  repairCategories: any[];
  comments: any;
  selectedCategories: any[];
  allInventories: any;
  checkedCategories: any[];
  bike: any;
  workCategories: any[];

  constructor(private repairService: RepairService,
    private loggerService: LoggerService,
    private inventoryService: InventoryService,
    private bikesService: BikesService,
    private commonService: CommonService,
    public dialogRef: MatDialogRef<RepairRegisterPopupComponent>,
    @Inject(MAT_DIALOG_DATA) public data: RepairRegisterDialogData,
    private translate: TranslateService,
    public dialog: MatDialog) { }

  ngOnInit() {
    this.checkedCategories = this.data.checkedCategories.length == 0 ? [] : this.data.checkedCategories;
    this.resetDialog();
    this.group1 = this.data.group1;
    this.group2 = this.data.group2;
    this.group3 = this.data.group3;
    this.bikeId = this.data.bikeId;
    this.bike = this.data.bike;
    this.otherFix = this.data.otherFix == undefined ? false : this.data.otherFix;
    this.disableBike = true;
    this.isBikeOkay = this.data.isBikeOkay;
    this.GetAllInventories();
    this.workCategories = [];
    this.loadRepairCategories();
  }
  OnChange($event, repairCat) {
    if ($event.checked) {
      this.disableBike = false;
      this.checkedCategories.push({ "CategoryId": repairCat.Id, "Disabled": this.disableBike });
      let inventory = this.allInventories.filter(x => x.PartId == repairCat.PartId && x.Active);
      if (inventory.length == 0 && repairCat.PartId) {
        repairCat.Result = false;
        this.loggerService.showErrorMessage(this.TranslateMessage(TranslateMessageTypes.NoPartsOrVariants));
        this.checkedCategories = this.checkedCategories.filter(x => x.CategoryId != repairCat.Id);
        $event.source.toggle();
        if (this.checkedCategories.length == 0)
          this.disableBike = true;
      }
    }
    else {
      this.disableBike = true;
      this.checkedCategories = this.checkedCategories.filter(x => x.CategoryId != repairCat.Id);
    }
  }

  createRepairReportOrUpdate() {
    this.resetDialog();
    this.repairCategories = this.repairCategories.concat(this.group1);
    this.repairCategories = this.repairCategories.concat(this.group2);
    this.repairCategories = this.repairCategories.concat(this.group3);
    this.selectedCategories = this.repairCategories.filter(x => x.Result == true);
    if (this.otherFix) {
      this.selectedCategories.push({ "Id": null, "Result": true, "Name": "Other Fix", "TranslationName": "OTHER_FIX" });
    }
    if (!this.disableBike && this.selectedCategories.length > 0) {
      // this.CreateRepairReport(repairReportObj);
      this.CreateBulkRepairAction();
    }
    else if (this.disableBike && this.selectedCategories.length == 0) {
      this.dialogRef.close({ "isSuccess": true });
    }
    else
      this.loggerService.showWarningMessage("Invalid inputs.");
  }

  CreateBulkRepairAction() {
    let repairBulkAction = {};
    let repairActions = this.MapBulkRepairAction();
    repairBulkAction["RepairAction"] = repairActions;
    this.repairService.CreateBulkRepairAction(this.bikeId, repairBulkAction)
      .subscribe(data => {
        setTimeout(() => {
          this.loggerService.showSuccessfulMessage(this.TranslateMessage(TranslateMessageTypes.RepairRegisterSuccess));
          //update undock command history for street team
          this.updateUndockCommandHistoryForStreetRepair(this.bikeId, 1); // 1 - true 0 - false

          //bike service details update
          var bikeServiceDTO = { NumberOfChecks: 0, BikeId: this.bikeId };
          this.updateBikeService(bikeServiceDTO);

          // //reset unsuccessful session count when check completed
          // this.resetUndockFailureCountByBike();

          this.dialogRef.close({ "isSuccess": true });
        }, 3000);
      }, error => {
        setTimeout(() => {
          this.loggerService.showErrorMessage(this.TranslateMessage(TranslateMessageTypes.RepairRegisterFail));
        }, 1500);
      });
  }

  MapBulkRepairAction() {
    let repairActions = [];
    this.selectedCategories.forEach(category => {
      let repairCategory = this.workCategories.find(x => x.PartId == category.PartId);
      if (category.PartId) {
        let repairAction = {};
        let inventory = this.allInventories.filter(x => x.PartId == category.PartId && x.Active);
        repairAction["BikeId"] = this.bikeId;
        repairAction["PartId"] = category.PartId;
        repairAction["VariantId"] = inventory[0].VariantId;
        repairAction["WorkshopId"] = StreetTeamWorkshopId; //street team
        repairAction["ReasonId"] = category.ReasonId;
        repairAction["Comments"] = this.comments;
        repairAction["IsNewPart"] = true;
        repairAction["WorkCategoryType"] = (repairCategory) ? repairCategory["ParentId"] : null;
        repairAction["WorkCategorySubType"] = (repairCategory) ? repairCategory["Id"] : null;
        repairAction["IsStreetTeam"] = true;
        repairAction["AccumulateTotalDistance"] = this.bike["AccumulateTotalDistance"];
        repairActions.push(repairAction);
        if (inventory[0].Quantity <= 0)
          this.loggerService.showWarningMessage(this.TranslateMessage(TranslateMessageTypes.InsufficientQuantity));
      }
      else {
        if (category.Id) {
          let repairAction = {};
          repairAction["BikeId"] = this.bikeId;
          repairAction["ReasonId"] = category.ReasonId;
          repairAction["WorkCategoryType"] = 12; //12 is for other components
          repairAction["WorkshopId"] = StreetTeamWorkshopId; //street team
          repairAction["Comments"] = this.comments;
          repairAction["IsStreetTeam"] = true;
          repairAction["AccumulateTotalDistance"] = this.bike["AccumulateTotalDistance"];
          repairActions.push(repairAction);
        }
        else {
          let repairAction = {};
          repairAction["BikeId"] = this.bikeId;
          repairAction["ReasonId"] = 18;
          repairAction["Comments"] = this.comments;
          repairAction["WorkshopId"] = StreetTeamWorkshopId; //street team
          repairAction["IsStreetTeam"] = true;
          repairAction["AccumulateTotalDistance"] = this.bike["AccumulateTotalDistance"];
          repairActions.push(repairAction);
        }
      }
    });
    return repairActions;
  }

  GetAllInventories() {
    this.inventoryService.getAllPartsAndVariants().subscribe(data => {
      this.allInventories = data;
    }, error => {
      this.loggerService.showErrorMessage(this.TranslateMessage(TranslateMessageTypes.GetAllInventoriesFail));
    });
  }

  resetDialog() {
    this.repairCategories = [];
    this.selectedCategories = [];
  }

  isNullOrEmpty(value: any): boolean {
    let isNullOrEmpty = true;
    if (value != null && value != "") isNullOrEmpty = false;
    return isNullOrEmpty;
  }

  TranslateMessage(type) {
    var msg = "";
    switch (type) {
      case TranslateMessageTypes.RepairRegisterSuccess:
        this.translate.get("LIVE_MAP.MESSAGES.REPAIR_REGISTER_SUCCESS").subscribe(name => {
          msg = name;
        });
        break;
      case TranslateMessageTypes.RepairRegisterFail:
        this.translate.get("LIVE_MAP.MESSAGES.REPAIR_REGISTER_FAIL").subscribe(name => {
          msg = name;
        });
        break;
      case TranslateMessageTypes.GetAllInventoriesFail:
        this.translate.get("LIVE_MAP.MESSAGES.GET_ALL_INVENTORIES_FAIL").subscribe(name => {
          msg = name;
        });
        break;
      case TranslateMessageTypes.NoPartsOrVariants:
        this.translate.get("LIVE_MAP.MESSAGES.NO_PARTS_OR_VARIANTS").subscribe(name => {
          msg = name;
        });
        break;
      case TranslateMessageTypes.InsufficientQuantity:
        this.translate.get("LIVE_MAP.MESSAGES.INSUFFICIENT_QUANTITY").subscribe(name => {
          msg = name;
        });
        break;
      default:
        break;
    }
    return msg;
  }

  GoBack() {
    if (!this.isBikeOkay) {
      this.dialogRef.close({
        "repairGroup1": this.group1, "repairGroup2": this.group2, "repairGroup3": this.group3, "isGoBack": true, "isBikeOkay": this.isBikeOkay
      });
    }
    else {
      this.dialogRef.close();
    }
  }

  loadRepairCategories() {
    this.repairService.GetAllWorkshopCategories().subscribe(data => {
      if (data) {
        this.workCategories = data.driveTrain;
        this.workCategories = this.workCategories.concat(data.light);
        this.workCategories = this.workCategories.concat(data.dockingComponents);
        this.workCategories = this.workCategories.concat(data.pedalArm);
        this.workCategories = this.workCategories.concat(data.seat);
        this.workCategories = this.workCategories.concat(data.cables);
        this.workCategories = this.workCategories.concat(data.mudguards);
        this.workCategories = this.workCategories.concat(data.handlebarComponents);
        this.workCategories = this.workCategories.concat(data.pcb);
        this.workCategories = this.workCategories.concat(data.brakeSystem);
        this.workCategories = this.workCategories.concat(data.wheels);
        this.workCategories = this.workCategories.concat(data.otherComponents);
      }
    }, error => {
      this.loggerService.showErrorMessage(error);
    });
  }

  updateUndockCommandHistoryForStreetRepair(bikeId, isStreetRepair) {
    let cmdHistoryDet = { BikeId: bikeId, isStreetRepair: isStreetRepair };
    this.bikesService.updateUndockCommandHistoryForStreetRepair(cmdHistoryDet).subscribe(res => {
    }, err => {

    });
  }

  updateBikeService(serviceDTO) {
    this.bikesService.CreateOrUpdateBikeService(this.bikeId, serviceDTO)
      .subscribe(data => {
      }, error => {
      });
  }

  resetUndockFailureCountByBike() {
    this.bikesService.resetUndockFailureCountByBike(this.bikeId)
      .subscribe(data => {
      }, error => {
      });
  }

}
