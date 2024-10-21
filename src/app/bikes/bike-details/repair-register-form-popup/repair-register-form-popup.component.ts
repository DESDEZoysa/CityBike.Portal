import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import { NgxSpinnerService } from 'ngx-spinner';
import { TranslateMessageTypes } from '../../../core/enums/TranslateMessageTypes';
import { BikesService, InventoryService, IssueService, LoggerService, RepairService } from '../../../services';
import { ReportErrorComponent } from '../../bike-support/report-error/report-error.component';
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog/confirm-dialog.component';
import { take, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
export interface RepairRegisterFormData {
  //errorCategories: any[];
  driveTrain: any[];
  light: any[];
  dockingComponents: any[];
  pedalArm: any[];
  seat: any[];
  cables: any[];
  mudguards: any[];
  handlebarComponents: any[];
  pcb: any[];
  brakeSystem: any[];
  wheels: any[];
  otherComponents: any[];
  bikeId: any;
  bike: any;
  otherFix: boolean;
  isUpdate: boolean;
  hoursSpent: any;
  minutesSpent: any;
  comments: any;
  createdAt: any;
  isStreetTeam: boolean;
  userWorkshopId: any;
  isStreetTeamMap: boolean;
  isBikeDetailsPage: boolean;
}

@Component({
  selector: 'app-repair-register-form-popup',
  templateUrl: './repair-register-form-popup.component.html',
  styleUrls: ['./repair-register-form-popup.component.scss']
})
export class RepairRegisterFormPopupComponent implements OnInit, OnDestroy {

  bikeId: any;
  otherFix: boolean;
  disableBike: boolean;
  repairCategories: any[];
  comments: any;
  selectedCategories: any[];
  allInventories: any;
  checkedCategories: any[];
  bike: any;
  driveTrainNonPart: any[];
  lightPart: any[];
  dockingComponentsPart: any[];
  pedalArm: any[];
  seat: any[];
  cables: any[];
  mudguardsPart: any[];
  handlebarComponentsPart: any[];
  pcb: any[];
  brakeSystemPart: any[];
  wheelsPart: any[];
  otherComponentsPart: any[];
  hoursSpent: any;
  minutesSpent: any;
  isTimeSpentEmpty: boolean;
  //isMinutesSpentEmpty: boolean;
  isCommentsEmpty: boolean;
  driveTrainPart: any[];
  lightNonPart: any[];
  dockingComponentsNonPart: any[];
  mudguardsNonPart: any[];
  handlebarComponentsNonPart: any[];
  brakeSystemNonPart: any[];
  wheelsNonPart: any[];
  otherComponentsNonPart: any[];
  isValidationSuccess: boolean;
  isUpdate: boolean;
  createdAt: any;
  isSaveOrUpdateInProgress: boolean = false;
  workshopId: any;
  isStreetTeam: boolean;
  userWorkshopId: any;
  minutesInput: any;
  isStreetTeamMap: boolean;
  deleteRepairIds: any[];
  selectedAllCategories: any[];
  errorgroup1: any[];
  errorgroup2: any[];
  errorgroup3: any[];
  isBikeDetailsPage: boolean;

  protected _onDestroy = new Subject<void>();

  constructor(private spinner: NgxSpinnerService,
    private repairService: RepairService,
    private bikesService: BikesService,
    private loggerService: LoggerService,
    private inventoryService: InventoryService,
    private issueService: IssueService,
    public dialogRef: MatDialogRef<RepairRegisterFormPopupComponent>,
    @Inject(MAT_DIALOG_DATA) public data: RepairRegisterFormData,
    private translate: TranslateService,
    public dialog: MatDialog) { }

  ngOnInit() {
    this.minutesInput = new FormControl("", [Validators.max(59), Validators.min(0)]);
    this.isValidationSuccess = true;
    this.checkedCategories = [];
    this.deleteRepairIds = [];
    this.resetDialog();
    this.driveTrainPart = this.data.driveTrain.filter(x => x.PartId != null);
    this.driveTrainNonPart = this.data.driveTrain.filter(x => x.PartId == null);
    this.lightPart = this.data.light.filter(x => x.PartId != null);
    this.lightNonPart = this.data.light.filter(x => x.PartId == null);
    this.dockingComponentsPart = this.data.dockingComponents.filter(x => x.PartId != null);
    this.dockingComponentsNonPart = this.data.dockingComponents.filter(x => x.PartId == null);
    this.pedalArm = this.data.pedalArm;
    this.seat = this.data.seat;
    this.cables = this.data.cables;
    this.mudguardsPart = this.data.mudguards.filter(x => x.PartId != null);
    this.mudguardsNonPart = this.data.mudguards.filter(x => x.PartId == null);
    this.handlebarComponentsPart = this.data.handlebarComponents.filter(x => x.PartId != null);
    this.handlebarComponentsNonPart = this.data.handlebarComponents.filter(x => x.PartId == null);
    this.pcb = this.data.pcb;
    this.brakeSystemPart = this.data.brakeSystem.filter(x => x.PartId != null);
    this.brakeSystemNonPart = this.data.brakeSystem.filter(x => x.PartId == null);
    this.wheelsPart = this.data.wheels.filter(x => x.PartId != null);
    this.wheelsNonPart = this.data.wheels.filter(x => x.PartId == null);
    this.otherComponentsPart = this.data.otherComponents.filter(x => x.PartId != null);
    this.otherComponentsNonPart = this.data.otherComponents.filter(x => x.PartId == null);
    this.bikeId = this.data.bikeId;
    this.bike = this.data.bike;
    this.workshopId = this.bike["WorkshopId"];
    this.otherFix = this.data.otherFix == undefined ? false : this.data.otherFix;
    this.disableBike = true;
    this.isUpdate = (this.data.isUpdate) ? true : false;
    this.isStreetTeam = (this.data.isStreetTeam) ? true : false;
    this.isStreetTeamMap = (this.data.isStreetTeamMap) ? true : false;
    this.isBikeDetailsPage = (this.data.isBikeDetailsPage) ? true : false;
    this.translateAllWorkshopRepairCategories();
    this.translate.onLangChange.pipe(take(1), takeUntil(this._onDestroy)).subscribe((params: LangChangeEvent) => {
      this.translateAllWorkshopRepairCategories();
    });
    this.GetAllInventories();
    this.loadErrorCategories();
    this.setDefaultNonPartProperties();
    if (!this.isUpdate)
      this.setIsNewPartDefaultForAllParts();
    this.comments = this.data.comments;
    this.hoursSpent = this.data.hoursSpent;
    this.minutesSpent = this.data.minutesSpent;
    this.createdAt = this.data.createdAt;
    this.userWorkshopId = this.data.userWorkshopId;

    this.errorgroup1 = [];
    this.errorgroup2 = [];
    this.errorgroup3 = [];
  }

  ngOnDestroy() {
    this._onDestroy.next();
    this._onDestroy.complete();
  }

  translateAllWorkshopRepairCategories() {
    this.driveTrainPart.map(x => this.translateWorkshopRepairCategories(x));
    this.driveTrainNonPart.map(x => this.translateWorkshopRepairCategories(x));
    this.lightPart.map(x => this.translateWorkshopRepairCategories(x));
    this.lightNonPart.map(x => this.translateWorkshopRepairCategories(x));
    this.dockingComponentsPart.map(x => this.translateWorkshopRepairCategories(x));
    this.dockingComponentsNonPart.map(x => this.translateWorkshopRepairCategories(x));
    this.pedalArm.map(x => this.translateWorkshopRepairCategories(x));
    this.seat.map(x => this.translateWorkshopRepairCategories(x));
    this.cables.map(x => this.translateWorkshopRepairCategories(x));
    this.mudguardsPart.map(x => this.translateWorkshopRepairCategories(x));
    this.mudguardsNonPart.map(x => this.translateWorkshopRepairCategories(x));
    this.handlebarComponentsPart.map(x => this.translateWorkshopRepairCategories(x));
    this.handlebarComponentsNonPart.map(x => this.translateWorkshopRepairCategories(x));
    this.pcb.map(x => this.translateWorkshopRepairCategories(x));
    this.brakeSystemPart.map(x => this.translateWorkshopRepairCategories(x));
    this.brakeSystemNonPart.map(x => this.translateWorkshopRepairCategories(x));
    this.wheelsPart.map(x => this.translateWorkshopRepairCategories(x));
    this.wheelsNonPart.map(x => this.translateWorkshopRepairCategories(x));
    this.otherComponentsPart.map(x => this.translateWorkshopRepairCategories(x));
    this.otherComponentsNonPart.map(x => this.translateWorkshopRepairCategories(x));
  }

  translateWorkshopRepairCategories(repairCat) {
    let tranlationLabel = "WORKSHOP_FORM." + repairCat.TranslationName;
    let name = this.translate.instant(tranlationLabel);
    repairCat.DisplayName = (name != tranlationLabel) ? name : repairCat.Name;
  }

  OnChange($event, repairCat) {
    if ($event.checked) {
      this.disableBike = false;
      this.checkedCategories.push({ "CategoryId": repairCat.Id, "Disabled": this.disableBike });
      if (repairCat.PartId) {
        let inventory = this.allInventories.filter(x => x.PartId == repairCat.PartId && x.Active);
        if (inventory.length == 0 && repairCat.PartId == 0) {
          repairCat.Result = false;
          //this.loggerService.showErrorMessage(this.TranslateMessage(TranslateMessageTypes.NoPartsOrVariants));
          this.checkedCategories = this.checkedCategories.filter(x => x.CategoryId != repairCat.Id);
          $event.source.toggle();
          if (this.checkedCategories.length == 0)
            this.disableBike = true;
          this.deleteRepairIds = this.deleteRepairIds.filter(repairId => repairId != repairCat.RepairId);
        }
      }
    }
    else {
      this.disableBike = true;
      this.checkedCategories = this.checkedCategories.filter(x => x.CategoryId != repairCat.Id);
      if (repairCat.RepairId > 0)
        this.deleteRepairIds.push(repairCat.RepairId);
    }
  }

  onRepairFix() {
    let repairCategories = [];
    repairCategories = repairCategories.concat(this.driveTrainPart);
    repairCategories = repairCategories.concat(this.lightPart);
    repairCategories = repairCategories.concat(this.driveTrainNonPart);
    repairCategories = repairCategories.concat(this.lightNonPart);
    repairCategories = repairCategories.concat(this.dockingComponentsPart);
    repairCategories = repairCategories.concat(this.dockingComponentsNonPart);
    repairCategories = repairCategories.concat(this.pedalArm);
    repairCategories = repairCategories.concat(this.seat);
    repairCategories = repairCategories.concat(this.cables);
    repairCategories = repairCategories.concat(this.mudguardsPart);
    repairCategories = repairCategories.concat(this.mudguardsNonPart);
    repairCategories = repairCategories.concat(this.handlebarComponentsPart);
    repairCategories = repairCategories.concat(this.handlebarComponentsNonPart);
    repairCategories = repairCategories.concat(this.pcb);
    repairCategories = repairCategories.concat(this.brakeSystemPart);
    repairCategories = repairCategories.concat(this.wheelsPart);
    repairCategories = repairCategories.concat(this.otherComponentsPart);
    repairCategories = repairCategories.concat(this.brakeSystemNonPart);
    repairCategories = repairCategories.concat(this.wheelsNonPart);
    repairCategories = repairCategories.concat(this.otherComponentsNonPart);
    if (this.otherFix)
      this.disableBike = false;
    else if (!this.otherFix && repairCategories.filter(x => x.Result == true).length == 0 && !this.comments)
      this.disableBike = true;
  }

  showConfirmationPopup() {
    if (this.isBikeDetailsPage) {
      var dialogMsg = "WORKSHOP_FORM.MESSAGES.BIKE_FULLY_FIXED_OR_NOT";
      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        width: '415px',
        data: { message: dialogMsg }
      });
      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.createRepairReportOrUpdate();
        }
      });
    }
    else
      this.createRepairReportOrUpdate();
  }

  createRepairReportOrUpdate() {
    this.resetDialog();
    this.repairCategories = this.repairCategories.concat(this.driveTrainPart);
    this.repairCategories = this.repairCategories.concat(this.lightPart);
    this.repairCategories = this.repairCategories.concat(this.driveTrainNonPart);
    this.repairCategories = this.repairCategories.concat(this.lightNonPart);
    this.repairCategories = this.repairCategories.concat(this.dockingComponentsPart);
    this.repairCategories = this.repairCategories.concat(this.dockingComponentsNonPart);
    this.repairCategories = this.repairCategories.concat(this.pedalArm);
    this.repairCategories = this.repairCategories.concat(this.seat);
    this.repairCategories = this.repairCategories.concat(this.cables);
    this.repairCategories = this.repairCategories.concat(this.mudguardsPart);
    this.repairCategories = this.repairCategories.concat(this.handlebarComponentsPart);
    this.repairCategories = this.repairCategories.concat(this.mudguardsNonPart);
    this.repairCategories = this.repairCategories.concat(this.handlebarComponentsNonPart);
    this.repairCategories = this.repairCategories.concat(this.pcb);
    this.repairCategories = this.repairCategories.concat(this.brakeSystemPart);
    this.repairCategories = this.repairCategories.concat(this.wheelsPart);
    this.repairCategories = this.repairCategories.concat(this.otherComponentsPart);
    this.repairCategories = this.repairCategories.concat(this.brakeSystemNonPart);
    this.repairCategories = this.repairCategories.concat(this.wheelsNonPart);
    this.repairCategories = this.repairCategories.concat(this.otherComponentsNonPart);
    //selectedAllCategories is used to check whether there are previously added categories exist
    this.selectedAllCategories = this.repairCategories.filter(x => x.Result);
    this.selectedCategories = this.repairCategories.filter(x => x.Result == true && !x.IsAddedBefore);
    // if (this.otherFix) {
    //   this.selectedCategories.push({ "Id": null, "Result": true, "Name": "General check", "TranslationName": "GENERAL_CHECK" });
    // }
    if (!this.disableBike) {
      if ((this.hoursSpent && this.hoursSpent > 0) || (this.minutesSpent && this.minutesSpent > 0)) {
        this.isTimeSpentEmpty = false;
        if (this.selectedAllCategories.length != 0 || (this.selectedAllCategories.length == 0 && (this.comments || this.deleteRepairIds.length != 0))) {
          this.isCommentsEmpty = false;
          this.CreateBulkRepairAction();
        }
        else
          this.isCommentsEmpty = true;
      }
      else
        this.isTimeSpentEmpty = true;
    }
    else {
      if ((this.hoursSpent && this.hoursSpent > 0) || (this.minutesSpent && this.minutesSpent > 0)) {
        this.isTimeSpentEmpty = false;
        if (this.selectedAllCategories.length != 0 || (this.selectedAllCategories.length == 0 && (this.comments || this.deleteRepairIds.length != 0))) {
          this.isCommentsEmpty = false;
          this.CreateBulkRepairAction();
        }
        else
          this.isCommentsEmpty = true;
      }
      else
        this.isTimeSpentEmpty = true;
    }
  }


  CreateBulkRepairAction() {
    let repairBulkAction = {};
    let repairActions = this.MapBulkRepairAction();
    repairBulkAction["RepairAction"] = repairActions;
    repairBulkAction["RepairIds"] = this.deleteRepairIds;
    repairBulkAction["HoursSpent"] = this.hoursSpent;
    repairBulkAction["MinutesSpent"] = this.minutesSpent;
    repairBulkAction["Comments"] = this.comments;
    repairBulkAction["WorkshopId"] = this.workshopId;
    if (this.isValidationSuccess) {
      this.isSaveOrUpdateInProgress = true;
      this.repairService.CreateBulkRepairAction(this.bikeId, repairBulkAction)
        .subscribe(data => {
          setTimeout(() => {
            this.loggerService.showSuccessfulMessage(this.TranslateMessage(TranslateMessageTypes.RepairRegisterSuccess));
            this.dialogRef.close({ "isSuccess": true });
            this.isSaveOrUpdateInProgress = false;
          }, 3000);
        }, error => {
          setTimeout(() => {
            this.loggerService.showErrorMessage(this.TranslateMessage(TranslateMessageTypes.RepairRegisterFail));
            this.isSaveOrUpdateInProgress = false;
          }, 2000);
        });
    }
  }

  MapBulkRepairAction() {
    let repairActions = [];
    this.isValidationSuccess = true;
    this.selectedCategories.forEach(category => {
      if (category.IsNewPart) {
        if (category.selectedVariant) {
          let repairAction = {};
          repairAction["BikeId"] = this.bikeId;
          repairAction["PartId"] = category.PartId;
          repairAction["VariantId"] = category.selectedVariant;
          repairAction["WorkshopId"] = this.workshopId;
          repairAction["ReasonId"] = 1;//category.ReasonId;
          repairAction["IsNewPart"] = category.IsNewPart;
          repairAction["HasWarranty"] = category.HasWarranty;
          repairAction["HoursSpent"] = this.hoursSpent;
          repairAction["MinutesSpent"] = this.minutesSpent;
          repairAction["WorkCategoryType"] = category.ParentId;
          repairAction["WorkCategorySubType"] = category.Id;
          repairAction["Comments"] = this.comments;
          repairAction["AccumulateTotalDistance"] = this.bike["AccumulateTotalDistance"];
          //only if repair done by street team
          if (this.isStreetTeam) {
            if (this.userWorkshopId)
              repairAction["WorkshopId"] = this.userWorkshopId; //street team
            repairAction["IsStreetTeam"] = true;
          }

          repairActions.push(repairAction);
          let isCategoryExist = this.checkedCategories.find(x => x.CategoryId == category.Id);
          if (isCategoryExist) {
            let inventory = category.PartVariants.find(x => x.VariantId == category.selectedVariant);
            if (inventory.Quantity <= 0)
              this.loggerService.showWarningMessage(this.TranslateMessage(TranslateMessageTypes.InsufficientQuantity));
          }
        }
        else if (category.PartId && category.PartVariants.length == 1) {
          let repairAction = {};
          repairAction["BikeId"] = this.bikeId;
          repairAction["PartId"] = category.PartId;
          repairAction["VariantId"] = category.PartVariants[0].VariantId;
          repairAction["WorkshopId"] = this.workshopId;
          repairAction["ReasonId"] = 1;//category.ReasonId;
          repairAction["IsNewPart"] = category.IsNewPart;
          repairAction["HasWarranty"] = category.HasWarranty;
          repairAction["HoursSpent"] = this.hoursSpent;
          repairAction["MinutesSpent"] = this.minutesSpent;
          repairAction["WorkCategoryType"] = category.ParentId;
          repairAction["WorkCategorySubType"] = category.Id;
          repairAction["Comments"] = this.comments;
          repairAction["AccumulateTotalDistance"] = this.bike["AccumulateTotalDistance"];
          //only if repair done by street team
          if (this.isStreetTeam) {
            if (this.userWorkshopId)
              repairAction["WorkshopId"] = this.userWorkshopId; //street team
            repairAction["IsStreetTeam"] = true;
          }

          repairActions.push(repairAction);
          let isCategoryExist = this.checkedCategories.find(x => x.CategoryId == category.Id);
          if (isCategoryExist) {
            if (category.PartVariants[0].Quantity <= 0)
              this.loggerService.showWarningMessage(this.TranslateMessage(TranslateMessageTypes.InsufficientQuantity));
          }
        }
        else {
          if (!category.selectedVariant && category.PartVariants.length > 0) {
            this.loggerService.showErrorMessage(this.TranslateMessage(TranslateMessageTypes.NoPartsOrVariants));
            this.isValidationSuccess = false;
            return;
          }
        }
      }
      else {
        if (category.Id) {
          let repairAction = {};
          repairAction["BikeId"] = this.bikeId;
          repairAction["ReasonId"] = 1;//category.ReasonId;
          repairAction["IsNewPart"] = category.IsNewPart;
          repairAction["HasWarranty"] = category.HasWarranty;
          repairAction["HoursSpent"] = this.hoursSpent;
          repairAction["MinutesSpent"] = this.minutesSpent;
          repairAction["WorkCategoryType"] = category.ParentId;
          repairAction["WorkCategorySubType"] = category.Id;
          repairAction["PartId"] = category.PartId;
          repairAction["WorkshopId"] = this.workshopId;
          //only if repair done by street team
          if (this.isStreetTeam) {
            if (this.userWorkshopId)
              repairAction["WorkshopId"] = this.userWorkshopId; //street team
            repairAction["IsStreetTeam"] = true;
          }
          repairAction["Comments"] = this.comments;
          repairAction["AccumulateTotalDistance"] = this.bike["AccumulateTotalDistance"];
          repairActions.push(repairAction);
        }
      }
    });
    if (this.selectedCategories.length == 0 && this.deleteRepairIds.length == 0) {
      if (this.comments) {
        let repairAction = {};
        repairAction["BikeId"] = this.bikeId;
        repairAction["HoursSpent"] = this.hoursSpent;
        repairAction["MinutesSpent"] = this.minutesSpent;
        repairAction["Comments"] = this.comments;
        repairAction["WorkshopId"] = this.workshopId;
        //only if repair done by street team
        if (this.isStreetTeam) {
          if (this.userWorkshopId)
            repairAction["WorkshopId"] = this.userWorkshopId; //street team
          repairAction["IsStreetTeam"] = true;
        }
        repairAction["ReasonId"] = 18;//category.ReasonId;
        repairAction["AccumulateTotalDistance"] = this.bike["AccumulateTotalDistance"];
        repairActions.push(repairAction);
      }
    }
    return repairActions;
  }

  updateBulkRepairAction() {
    let repairBulkAction = {};
    let repairActions = this.MapBulkRepairAction();
    repairBulkAction["RepairAction"] = repairActions;
    repairBulkAction["CreatedAt"] = this.createdAt;
    repairBulkAction["RepairIds"] = this.deleteRepairIds;
    repairBulkAction["HoursSpent"] = this.hoursSpent;
    repairBulkAction["MinutesSpent"] = this.minutesSpent;
    repairBulkAction["Comments"] = this.comments;
    if (this.isValidationSuccess) {
      this.repairService.UpdateBulkRepairAction(repairBulkAction)
        .subscribe(data => {
          setTimeout(() => {
            this.isSaveOrUpdateInProgress = false;
            this.loggerService.showSuccessfulMessage(this.TranslateMessage(TranslateMessageTypes.RepairUpdateSuccess));
            this.dialogRef.close({ "isSuccess": true });
          }, 3000);
        }, error => {
          setTimeout(() => {
            this.loggerService.showErrorMessage(this.TranslateMessage(TranslateMessageTypes.RepairRegisterFail));
            this.isSaveOrUpdateInProgress = false;
          }, 2000);
        });
    }
    else
      this.isSaveOrUpdateInProgress = false;
  }

  GetAllInventories() {
    this.inventoryService.getAllPartsAndVariants().subscribe(data => {
      this.allInventories = data;
      this.handleInventory();
    }, error => {
      this.loggerService.showErrorMessage(this.TranslateMessage(TranslateMessageTypes.GetAllInventoriesFail));
    });
  }

  handleInventory() {
    this.driveTrainPart.map(x => this.mapParts(x));
    this.lightPart.map(x => this.mapParts(x));
    this.dockingComponentsPart.map(x => this.mapParts(x));
    this.pedalArm.map(x => this.mapParts(x));
    this.seat.map(x => this.mapParts(x));
    this.cables.map(x => this.mapParts(x));
    this.mudguardsPart.map(x => this.mapParts(x));
    this.handlebarComponentsPart.map(x => this.mapParts(x));
    this.pcb.map(x => this.mapParts(x));
    this.brakeSystemPart.map(x => this.mapParts(x));
    this.wheelsPart.map(x => this.mapParts(x));
    this.otherComponentsPart.map(x => this.mapParts(x));
  }

  resetDialog() {
    this.repairCategories = [];
    this.selectedCategories = [];
    this.selectedAllCategories = [];
  }

  isNullOrEmpty(value: any): boolean {
    let isNullOrEmpty = true;
    if (value != null && value != "") isNullOrEmpty = false;
    return isNullOrEmpty;
  }

  TranslateMessage(type) {
    var msg = "";
    switch (type) {
      case TranslateMessageTypes.RepairRegisterSaved:
        msg = this.translate.instant("WORKSHOP_FORM.MESSAGES.REPAIR_REGISTER_SAVED");
        break;
      case TranslateMessageTypes.RepairRegisterSuccess:
        msg = this.translate.instant("WORKSHOP_FORM.MESSAGES.REPAIR_REGISTER_SUCCESS");
        break;
      case TranslateMessageTypes.RepairRegisterFail:
        msg = this.translate.instant("WORKSHOP_FORM.MESSAGES.REPAIR_REGISTER_FAIL")
        break;
      case TranslateMessageTypes.GetAllInventoriesFail:
        msg = this.translate.instant("WORKSHOP_FORM.MESSAGES.GET_ALL_INVENTORIES_FAIL")
        break;
      case TranslateMessageTypes.NoPartsOrVariants:
        msg = this.translate.instant("WORKSHOP_FORM.MESSAGES.NO_VARIANT_SELECTED");
        break;
      case TranslateMessageTypes.RepairUpdateSuccess:
        msg = this.translate.instant("WORKSHOP_FORM.MESSAGES.REPAIR_UPDATE_SUCCESS");
        break;
      case TranslateMessageTypes.InsufficientQuantity:
        msg = this.translate.instant("WORKSHOP_FORM.MESSAGES.INSUFFICIENT_QUANTITY")
        break;
      default:
        break;
    }
    return msg;
  }

  GoBack() {
    this.dialogRef.close();
  }

  mapParts(data) {
    let inventories = [];
    if (!this.isStreetTeam)
      inventories = this.allInventories.filter(x => x.PartId == data.PartId && x.WorkshopId == this.workshopId);
    else if (this.isStreetTeam)
      inventories = this.allInventories.filter(x => x.PartId == data.PartId && x.WorkshopId == this.userWorkshopId);
    return data["PartVariants"] = inventories;
  }

  setDefaultNonPartProperties() {
    this.driveTrainNonPart.map(x => this.mapNonPart(x));
    this.lightNonPart.map(x => this.mapNonPart(x));
    this.dockingComponentsNonPart.map(x => this.mapNonPart(x));
    this.mudguardsNonPart.map(x => this.mapNonPart(x));
    this.handlebarComponentsNonPart.map(x => this.mapNonPart(x));
    this.brakeSystemNonPart.map(x => this.mapNonPart(x));
    this.wheelsNonPart.map(x => this.mapNonPart(x));
    this.otherComponentsNonPart.map(x => this.mapNonPart(x));
  }

  mapNonPart(data) {
    data.IsNewPart = false;
    return;
  }

  updateRepairReport() {
    this.resetDialog();
    this.isSaveOrUpdateInProgress = true;
    this.repairCategories = this.repairCategories.concat(this.driveTrainPart);
    this.repairCategories = this.repairCategories.concat(this.lightPart);
    this.repairCategories = this.repairCategories.concat(this.driveTrainNonPart);
    this.repairCategories = this.repairCategories.concat(this.lightNonPart);
    this.repairCategories = this.repairCategories.concat(this.dockingComponentsPart);
    this.repairCategories = this.repairCategories.concat(this.dockingComponentsNonPart);
    this.repairCategories = this.repairCategories.concat(this.pedalArm);
    this.repairCategories = this.repairCategories.concat(this.seat);
    this.repairCategories = this.repairCategories.concat(this.cables);
    this.repairCategories = this.repairCategories.concat(this.mudguardsPart);
    this.repairCategories = this.repairCategories.concat(this.handlebarComponentsPart);
    this.repairCategories = this.repairCategories.concat(this.mudguardsNonPart);
    this.repairCategories = this.repairCategories.concat(this.handlebarComponentsNonPart);
    this.repairCategories = this.repairCategories.concat(this.pcb);
    this.repairCategories = this.repairCategories.concat(this.brakeSystemPart);
    this.repairCategories = this.repairCategories.concat(this.wheelsPart);
    this.repairCategories = this.repairCategories.concat(this.otherComponentsPart);
    this.repairCategories = this.repairCategories.concat(this.brakeSystemNonPart);
    this.repairCategories = this.repairCategories.concat(this.wheelsNonPart);
    this.repairCategories = this.repairCategories.concat(this.otherComponentsNonPart);

    //selectedAllCategories is used to check whether there are previously added categories exist
    this.selectedAllCategories = this.repairCategories.filter(x => x.Result);
    this.selectedCategories = this.repairCategories.filter(x => x.Result == true && !x.IsAddedBefore);
    let updateList = this.repairCategories.filter(x => x.Result == true && x.IsUpdate == true);
    if (!this.disableBike) {
      if ((this.hoursSpent && this.hoursSpent > 0) || (this.minutesSpent && this.minutesSpent > 0)) {
        this.isTimeSpentEmpty = false;
        if (this.selectedAllCategories.length != 0 || (this.selectedAllCategories.length == 0 && this.comments)) {
          this.isCommentsEmpty = false;
          this.updateBulkRepairAction();
        }
        else
          this.isCommentsEmpty = true;
      }
      else
        this.isTimeSpentEmpty = true;
    }
    else {
      if ((this.hoursSpent && this.hoursSpent > 0) || (this.minutesSpent && this.minutesSpent > 0)) {
        this.isTimeSpentEmpty = false;
        if (this.selectedAllCategories.length != 0 || (this.selectedAllCategories.length == 0 && (this.comments || this.deleteRepairIds.length != 0))) {
          this.isCommentsEmpty = false;
          this.updateBulkRepairAction();
        }
        else
          this.isCommentsEmpty = true;
      }
      else
        this.isTimeSpentEmpty = true;
    }
  }

  setIsNewPartDefaultForAllParts() {
    this.driveTrainPart.map(x => x.IsNewPart = true);
    this.lightPart.map(x => x.IsNewPart = true);
    this.dockingComponentsPart.map(x => x.IsNewPart = true);
    this.pedalArm.map(x => x.IsNewPart = true);
    this.seat.map(x => x.IsNewPart = true);
    this.cables.map(x => x.IsNewPart = true);
    this.mudguardsPart.map(x => x.IsNewPart = true);
    this.handlebarComponentsPart.map(x => x.IsNewPart = true);
    this.pcb.map(x => x.IsNewPart = true);
    this.brakeSystemPart.map(x => x.IsNewPart = true);
    this.wheelsPart.map(x => x.IsNewPart = true);
    this.otherComponentsPart.map(x => x.IsNewPart = true);
  }

  amendOrCreateRepairReport() {
    const dialogRef = this.dialog.open(ReportErrorComponent, {
      width: '1100px',
      height: '780px',
      data: { 'group1': this.errorgroup1, 'group2': this.errorgroup2, 'group3': this.errorgroup3, 'bikeId': this.bikeId, 'sessionId': this.bike.SessionId, 'bikeLocked': false }
    });

    dialogRef.afterClosed().subscribe(result => {
      this.resetDialog();
      this.repairCategories = this.repairCategories.concat(this.driveTrainPart);
      this.repairCategories = this.repairCategories.concat(this.lightPart);
      this.repairCategories = this.repairCategories.concat(this.driveTrainNonPart);
      this.repairCategories = this.repairCategories.concat(this.lightNonPart);
      this.repairCategories = this.repairCategories.concat(this.dockingComponentsPart);
      this.repairCategories = this.repairCategories.concat(this.dockingComponentsNonPart);
      this.repairCategories = this.repairCategories.concat(this.pedalArm);
      this.repairCategories = this.repairCategories.concat(this.seat);
      this.repairCategories = this.repairCategories.concat(this.cables);
      this.repairCategories = this.repairCategories.concat(this.mudguardsPart);
      this.repairCategories = this.repairCategories.concat(this.handlebarComponentsPart);
      this.repairCategories = this.repairCategories.concat(this.mudguardsNonPart);
      this.repairCategories = this.repairCategories.concat(this.handlebarComponentsNonPart);
      this.repairCategories = this.repairCategories.concat(this.pcb);
      this.repairCategories = this.repairCategories.concat(this.brakeSystemPart);
      this.repairCategories = this.repairCategories.concat(this.wheelsPart);
      this.repairCategories = this.repairCategories.concat(this.otherComponentsPart);
      this.repairCategories = this.repairCategories.concat(this.brakeSystemNonPart);
      this.repairCategories = this.repairCategories.concat(this.wheelsNonPart);
      this.repairCategories = this.repairCategories.concat(this.otherComponentsNonPart);

      //selectedAllCategories is used to check whether there are previously added categories exist
      this.selectedAllCategories = this.repairCategories.filter(x => x.Result);
      this.selectedCategories = this.repairCategories.filter(x => x.Result == true && !x.IsAddedBefore);
      if (!this.disableBike) {
        if ((this.hoursSpent && this.hoursSpent > 0) || (this.minutesSpent && this.minutesSpent > 0)) {
          this.isTimeSpentEmpty = false;
          if (this.selectedAllCategories.length != 0 || (this.selectedAllCategories.length == 0 && (this.comments || this.deleteRepairIds.length != 0))) {
            this.isCommentsEmpty = false;
            this.amendBulkRepairAction();
          }
          else
            this.isCommentsEmpty = true;
        }
        else
          this.isTimeSpentEmpty = true;
      }
      else {
        if ((this.hoursSpent && this.hoursSpent > 0) || (this.minutesSpent && this.minutesSpent > 0)) {
          this.isTimeSpentEmpty = false;
          if (this.selectedAllCategories.length != 0 || (this.selectedAllCategories.length == 0 && (this.comments || this.deleteRepairIds.length != 0))) {
            this.isCommentsEmpty = false;
            this.amendBulkRepairAction();
          }
          else
            this.isCommentsEmpty = true;
        }
        else
          this.isTimeSpentEmpty = true;
      }
    });
    this.clearSelectedErrorCategories();
  }

  amendBulkRepairAction() {
    let repairBulkAction = {};
    let repairActions = this.MapBulkRepairAction();
    repairBulkAction["RepairAction"] = repairActions;
    repairBulkAction["RepairIds"] = this.deleteRepairIds;
    repairBulkAction["HoursSpent"] = this.hoursSpent;
    repairBulkAction["MinutesSpent"] = this.minutesSpent;
    repairBulkAction["Comments"] = this.comments;
    if (this.isValidationSuccess) {
      this.isSaveOrUpdateInProgress = true;
      this.repairService.amendBulkRepairAction(this.bikeId, repairBulkAction)
        .subscribe(data => {
          setTimeout(() => {
            this.loggerService.showSuccessfulMessage(this.TranslateMessage(TranslateMessageTypes.RepairRegisterSaved));
            this.dialogRef.close({ "isSuccess": true, "isSaved": true });
            this.isSaveOrUpdateInProgress = false;
          }, 3000);
        }, error => {
          setTimeout(() => {
            this.loggerService.showErrorMessage(this.TranslateMessage(TranslateMessageTypes.RepairRegisterFail));
            this.isSaveOrUpdateInProgress = false;
          }, 2000);
        });
    }
  }

  loadErrorCategories() {
    this.issueService.GetErrorCategories().subscribe(data => {
      this.errorgroup1 = data.group1;
      this.errorgroup2 = data.group2;
      this.errorgroup3 = data.group3;
      this.translateAllCategories();
    }, error => {
      this.loggerService.showErrorMessage(error);
    });
  }

  resetSubCategories(parent) {
    let subCategory = parent.SubCategory;
    for (let i = 0; i < subCategory.length; i++) {
      if (subCategory[i].hasOwnProperty("Result"))
        subCategory[i].Result = false;
    }
  }

  translateCategories(parent) {
    let parentLabel = "REPORT_ERROR." + parent.Name.toUpperCase();
    let parentName = this.translate.instant(parentLabel);
    parent.DisplayName = (parentName != parentLabel) ? parentName : parent.Name;
    let subCategory = parent.SubCategory;
    for (let i = 0; i < subCategory.length; i++) {
      let childName = "REPORT_ERROR." + subCategory[i].Name.toUpperCase();
      let subName = this.translate.instant(childName);
      subCategory[i].DisplayName = (subName != childName) ? subName : subCategory[i].Name;
    }
  }

  clearSelectedErrorCategories() {
    this.errorgroup1.map(x => this.resetSubCategories(x));
    this.errorgroup2.map(x => this.resetSubCategories(x));
    this.errorgroup3.map(x => this.resetSubCategories(x));
  }

  translateAllCategories() {
    this.errorgroup1.map(x => this.translateCategories(x));
    this.errorgroup2.map(x => this.translateCategories(x));
    this.errorgroup3.map(x => this.translateCategories(x));
  }
}
