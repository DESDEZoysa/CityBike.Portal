import { RepairService } from './../../../services/repair.service';
import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { BikesService, IssueService, LoggerService } from '../../../services';
import * as moment from 'moment';
import { RepairRegisterFormPopupComponent } from '../../bike-details/repair-register-form-popup/repair-register-form-popup.component';
import { LocalStorageKeys } from '../../../core/constants';
import { BikeDisableState } from '../../../core/enums/bikeDisableState';
import { UserRoles } from '../../../core/constants/user-roles';

export interface WorkshopHistoryDetails {
  historyData: any;
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
}

@Component({
  selector: 'app-workshop-history-details-popup',
  templateUrl: './workshop-history-details-popup.component.html',
  styleUrls: ['./workshop-history-details-popup.component.scss']
})
export class WorkshopHistoryDetailsPopupComponent implements OnInit {

  bikeId: any;
  historyData: any;
  createdAt: string;
  dateStarted: string;
  createdBy: any;
  createdUser: any;
  dateStartedFormatted: string;
  createdAtFormatted: string;
  createdAtShortFormatted: string;
  dateStartedShortFormatted: string;
  workshopName: any;
  createdAtLongFormatted: string;
  dateStartedLongFormatted: string;
  hoursSpent: any;
  minutesSpent: any;
  workOrientedList: any;
  otherWorkOrientedList: any;
  comments: any;
  modifiedBy: any;
  modifiedUser: any;

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
  bike: any;
  isUpdated: any;
  loggedInUser: any;
  isOwner: boolean;
  isStreetTeam: any = false;
  accumulateTotalDistance: any;
  isCompleted: any;
  bikeVisualId: any;



  constructor(
    public dialogRef: MatDialogRef<WorkshopHistoryDetailsPopupComponent>,
    @Inject(MAT_DIALOG_DATA) public data: WorkshopHistoryDetails,
    public dialog: MatDialog,
    private translate: TranslateService,
    private issueService: IssueService,
    private loggerService: LoggerService,
    private repairService: RepairService,
    private bikesService: BikesService
  ) {
  }

  ngOnInit() {
    let convertType = JSON.parse(localStorage.getItem(LocalStorageKeys.PREFERRED_TIMEZONE));
    this.loggedInUser = JSON.parse(localStorage.getItem(LocalStorageKeys.USER_DETAILS));
    var authToken = JSON.parse(localStorage.getItem(LocalStorageKeys.OAUTH_TOKEN));
    let userRole: any;
    if (authToken._claims)
      userRole = authToken._claims[0];

    this.historyData = this.data.historyData;
    this.bikeId = this.historyData.bikeId;
    this.bikeVisualId = this.historyData.visualId;
    this.createdAt = this.historyData.createdAt;
    this.dateStarted = this.historyData.dateStarted;
    this.createdAtShortFormatted = (this.createdAt) ? moment(this.historyData.createdAt).format('DD.MM.YYYY') : null;
    this.dateStartedShortFormatted = (this.dateStarted) ? moment(this.historyData.dateStarted).format('DD.MM.YYYY') : null;
    this.createdAtLongFormatted = (this.createdAt) ? moment(this.historyData.createdAt).utc().format('DD.MM.YYYY HH:mm') : null;
    this.dateStartedLongFormatted = (this.dateStarted) ? moment(this.historyData.dateStarted).utc().format('DD.MM.YYYY HH:mm') : null;
    if (convertType == "CET") {
      this.createdAtLongFormatted = (this.createdAt) ? moment(this.historyData.createdAt).tz("Europe/Berlin").format('DD.MM.YYYY HH:mm') : null;
      this.dateStartedLongFormatted = (this.dateStarted) ? moment(this.historyData.dateStarted).tz("Europe/Berlin").format('DD.MM.YYYY HH:mm') : null;
    }
    this.createdBy = this.historyData.createdBy;
    this.createdUser = this.historyData.createdUser;
    this.workshopName = this.historyData.workshopName;
    this.hoursSpent = this.historyData.hoursSpent;
    this.minutesSpent = this.historyData.minutesSpent;
    this.workOrientedList = this.historyData.workOrientedList;
    this.otherWorkOrientedList = this.historyData.otherWorkOrientedList;
    this.comments = this.historyData.comments;
    this.isUpdated = this.historyData.isUpdated;
    this.modifiedUser = this.historyData.modifiedUser;
    this.modifiedBy = this.historyData.modifiedBy;
    this.isOwner = (this.loggedInUser.UserId == this.createdBy) || (userRole == UserRoles.ADMIN) || (userRole == UserRoles.WORKSHOP);
    this.isStreetTeam = this.historyData.isStreetTeam;
    this.accumulateTotalDistance = this.historyData.accumulateTotalDistance;
    this.isCompleted = this.historyData.isCompleted;

    // set repair categories
    this.driveTrain = this.data.driveTrain;
    this.light = this.data.light;
    this.dockingComponents = this.data.dockingComponents;
    this.pedalArm = this.data.pedalArm;
    this.seat = this.data.seat;
    this.cables = this.data.cables;
    this.mudguards = this.data.mudguards;
    this.handlebarComponents = this.data.handlebarComponents;
    this.pcb = this.data.pcb;
    this.brakeSystem = this.data.brakeSystem;
    this.wheels = this.data.wheels;
    this.otherComponents = this.data.otherComponents;
    this.bikeId = this.data.bikeId;
    this.bike = this.data.bike;
    //this.disableBike = true;

    //map history values with repair categories
    this.arrangeWorkOrientedCategories();
    this.arrangeOtherOrientedCategories();
  }

  arrangeWorkOrientedCategories() {
    this.workOrientedList.forEach(workOriented => {
      workOriented["PartOrientedList"].map(part => this.mapResonses(workOriented, part));
    });
  }

  arrangeOtherOrientedCategories() {
    this.otherWorkOrientedList.forEach(workOriented => {
      workOriented["OtherPartList"].map(part => this.mapResonses(workOriented, part));
    });
  }

  mapResonses(workOriented, part) {
    if (workOriented["WorkCategoryType"] == 1) {
      let partObj = this.driveTrain.find(x => x.PartId && x.PartId == part.PartId);
      if (partObj) {
        let index = this.driveTrain.findIndex(x => x.PartId == part.PartId);
        this.driveTrain[index]["RepairId"] = part.RepairId;
        this.driveTrain[index]["Result"] = true;
        this.driveTrain[index]["IsAddedBefore"] = true;
        this.driveTrain[index]["IsNewPart"] = (part["PartDesc"] == "new" || part["PartDesc"] == "new part") ? true : false;
        this.driveTrain[index]["HasWarranty"] = part["HasWarranty"];
        if (this.driveTrain[index]["IsNewPart"])
          this.driveTrain[index]["selectedVariant"] = part["VariantId"];
        this.driveTrain[index]["RepairId"] = part.RepairId;
      }
      else {
        let nonPartObj = this.driveTrain.find(x => x.Id == part.WorkCategorySubType && x.ParentId == workOriented["WorkCategoryType"]);
        if (nonPartObj) {
          let index = this.driveTrain.findIndex(x => x.Id == part.WorkCategorySubType && x.ParentId == workOriented["WorkCategoryType"]);
          this.driveTrain[index]["IsAddedBefore"] = true;
          this.driveTrain[index]["Result"] = true;
          this.driveTrain[index]["IsNewPart"] = false;
          this.driveTrain[index]["RepairId"] = part.RepairId;
        }
      }
    }
    else if (workOriented["WorkCategoryType"] == 2) {
      let partObj = this.light.find(x => x.PartId && x.PartId == part.PartId);
      if (partObj) {
        let index = this.light.findIndex(x => x.PartId == part.PartId);
        this.light[index]["IsAddedBefore"] = true;
        this.light[index]["Result"] = true;
        this.light[index]["IsNewPart"] = (part["PartDesc"] == "new" || part["PartDesc"] == "new part") ? true : false;
        this.light[index]["HasWarranty"] = part["HasWarranty"];
        if (this.light[index]["IsNewPart"])
          this.light[index]["selectedVariant"] = part["VariantId"];
        this.light[index]["RepairId"] = part.RepairId;
      }
      else {
        let nonPartObj = this.light.find(x => x.Id == part.WorkCategorySubType && x.ParentId == workOriented["WorkCategoryType"]);
        if (nonPartObj) {
          let index = this.light.findIndex(x => x.Id == part.WorkCategorySubType && x.ParentId == workOriented["WorkCategoryType"]);
          this.light[index]["IsAddedBefore"] = true;
          this.light[index]["Result"] = true;
          this.light[index]["IsNewPart"] = false;
          this.light[index]["RepairId"] = part.RepairId;
        }
      }
    }
    else if (workOriented["WorkCategoryType"] == 3) {
      let partObj = this.dockingComponents.find(x => x.PartId && x.PartId == part.PartId);
      if (partObj) {
        let index = this.dockingComponents.findIndex(x => x.PartId == part.PartId);
        this.dockingComponents[index]["IsAddedBefore"] = true;
        this.dockingComponents[index]["Result"] = true;
        this.dockingComponents[index]["IsNewPart"] = (part["PartDesc"] == "new" || part["PartDesc"] == "new part") ? true : false;
        this.dockingComponents[index]["HasWarranty"] = part["HasWarranty"];
        if (this.dockingComponents[index]["IsNewPart"])
          this.dockingComponents[index]["selectedVariant"] = part["VariantId"];
        this.dockingComponents[index]["RepairId"] = part.RepairId;
      }
      else {
        let nonPartObj = this.dockingComponents.find(x => x.Id == part.WorkCategorySubType && x.ParentId == workOriented["WorkCategoryType"]);
        if (nonPartObj) {
          let index = this.dockingComponents.findIndex(x => x.Id == part.WorkCategorySubType && x.ParentId == workOriented["WorkCategoryType"]);
          this.dockingComponents[index]["IsAddedBefore"] = true;
          this.dockingComponents[index]["Result"] = true;
          this.dockingComponents[index]["IsNewPart"] = false;
          this.dockingComponents[index]["RepairId"] = part.RepairId;
        }
      }
    }
    else if (workOriented["WorkCategoryType"] == 4) {
      let partObj = this.pedalArm.find(x => x.PartId && x.PartId == part.PartId);
      if (partObj) {
        let index = this.pedalArm.findIndex(x => x.PartId == part.PartId);
        this.pedalArm[index]["IsAddedBefore"] = true;
        this.pedalArm[index]["Result"] = true;
        this.pedalArm[index]["IsNewPart"] = (part["PartDesc"] == "new" || part["PartDesc"] == "new part") ? true : false;
        this.pedalArm[index]["HasWarranty"] = part["HasWarranty"];
        if (this.pedalArm[index]["IsNewPart"])
          this.pedalArm[index]["selectedVariant"] = part["VariantId"];
        this.pedalArm[index]["RepairId"] = part.RepairId;
      }
      else {
        let nonPartObj = this.pedalArm.find(x => x.Id == part.WorkCategorySubType && x.ParentId == workOriented["WorkCategoryType"]);
        if (nonPartObj) {
          let index = this.pedalArm.findIndex(x => x.Id == part.WorkCategorySubType && x.ParentId == workOriented["WorkCategoryType"]);
          this.pedalArm[index]["IsAddedBefore"] = true;
          this.pedalArm[index]["Result"] = true;
          this.pedalArm[index]["IsNewPart"] = false;
          this.pedalArm[index]["RepairId"] = part.RepairId;
        }
      }
    }
    else if (workOriented["WorkCategoryType"] == 5) {
      let partObj = this.seat.find(x => x.PartId && x.PartId == part.PartId);
      if (partObj) {
        let index = this.seat.findIndex(x => x.PartId == part.PartId);
        this.seat[index]["IsAddedBefore"] = true;
        this.seat[index]["Result"] = true;
        this.seat[index]["IsNewPart"] = (part["PartDesc"] == "new" || part["PartDesc"] == "new part") ? true : false;
        this.seat[index]["HasWarranty"] = part["HasWarranty"];
        if (this.seat[index]["IsNewPart"])
          this.seat[index]["selectedVariant"] = part["VariantId"];
        this.seat[index]["RepairId"] = part.RepairId;
      }
      else {
        let nonPartObj = this.seat.find(x => x.Id == part.WorkCategorySubType && x.ParentId == workOriented["WorkCategoryType"]);
        if (nonPartObj) {
          let index = this.seat.findIndex(x => x.Id == part.WorkCategorySubType && x.ParentId == workOriented["WorkCategoryType"]);
          this.seat[index]["IsAddedBefore"] = true;
          this.seat[index]["Result"] = true;
          this.seat[index]["IsNewPart"] = false;
          this.seat[index]["RepairId"] = part.RepairId;
        }
      }
    }
    else if (workOriented["WorkCategoryType"] == 6) {
      let partObj = this.cables.find(x => x.PartId && x.PartId == part.PartId);
      if (partObj) {
        let index = this.cables.findIndex(x => x.PartId == part.PartId);
        this.cables[index]["IsAddedBefore"] = true;
        this.cables[index]["Result"] = true;
        this.cables[index]["IsNewPart"] = (part["PartDesc"] == "new" || part["PartDesc"] == "new part") ? true : false;
        this.cables[index]["HasWarranty"] = part["HasWarranty"];
        if (this.cables[index]["IsNewPart"])
          this.cables[index]["selectedVariant"] = part["VariantId"];
        this.cables[index]["RepairId"] = part.RepairId;
      }
      else {
        let nonPartObj = this.cables.find(x => x.Id == part.WorkCategorySubType && x.ParentId == workOriented["WorkCategoryType"]);
        if (nonPartObj) {
          let index = this.cables.findIndex(x => x.Id == part.WorkCategorySubType && x.ParentId == workOriented["WorkCategoryType"]);
          this.cables[index]["IsAddedBefore"] = true;
          this.cables[index]["Result"] = true;
          this.cables[index]["IsNewPart"] = false;
          this.cables[index]["RepairId"] = part.RepairId;
        }
      }
    }
    else if (workOriented["WorkCategoryType"] == 7) {
      let partObj = this.mudguards.find(x => x.PartId && x.PartId == part.PartId);
      if (partObj) {
        let index = this.mudguards.findIndex(x => x.PartId == part.PartId);
        this.mudguards[index]["IsAddedBefore"] = true;
        this.mudguards[index]["Result"] = true;
        this.mudguards[index]["IsNewPart"] = (part["PartDesc"] == "new" || part["PartDesc"] == "new part") ? true : false;
        this.mudguards[index]["HasWarranty"] = part["HasWarranty"];
        if (this.mudguards[index]["IsNewPart"])
          this.mudguards[index]["selectedVariant"] = part["VariantId"];
        this.mudguards[index]["RepairId"] = part.RepairId;
      }
      else {
        let nonPartObj = this.mudguards.find(x => x.Id == part.WorkCategorySubType && x.ParentId == workOriented["WorkCategoryType"]);
        if (nonPartObj) {
          let index = this.mudguards.findIndex(x => x.Id == part.WorkCategorySubType && x.ParentId == workOriented["WorkCategoryType"]);
          this.mudguards[index]["IsAddedBefore"] = true;
          this.mudguards[index]["Result"] = true;
          this.mudguards[index]["IsNewPart"] = false;
          this.mudguards[index]["RepairId"] = part.RepairId;
        }
      }
    }
    else if (workOriented["WorkCategoryType"] == 8) {
      let partObj = this.handlebarComponents.find(x => x.PartId && x.PartId == part.PartId);
      if (partObj) {
        let index = this.handlebarComponents.findIndex(x => x.PartId == part.PartId);
        this.handlebarComponents[index]["IsAddedBefore"] = true;
        this.handlebarComponents[index]["Result"] = true;
        this.handlebarComponents[index]["IsNewPart"] = (part["PartDesc"] == "new" || part["PartDesc"] == "new part") ? true : false;
        this.handlebarComponents[index]["HasWarranty"] = part["HasWarranty"];
        if (this.handlebarComponents[index]["IsNewPart"])
          this.handlebarComponents[index]["selectedVariant"] = part["VariantId"];
        this.handlebarComponents[index]["RepairId"] = part.RepairId;
      }
      else {
        let nonPartObj = this.handlebarComponents.find(x => x.Id == part.WorkCategorySubType && x.ParentId == workOriented["WorkCategoryType"]);
        if (nonPartObj) {
          let index = this.handlebarComponents.findIndex(x => x.Id == part.WorkCategorySubType && x.ParentId == workOriented["WorkCategoryType"]);
          this.handlebarComponents[index]["IsAddedBefore"] = true;
          this.handlebarComponents[index]["Result"] = true;
          this.handlebarComponents[index]["IsNewPart"] = false;
          this.handlebarComponents[index]["RepairId"] = part.RepairId;
        }
      }
    }
    else if (workOriented["WorkCategoryType"] == 9) {
      let partObj = this.pcb.find(x => x.PartId && x.PartId == part.PartId);
      if (partObj) {
        let index = this.pcb.findIndex(x => x.PartId == part.PartId);
        this.pcb[index]["IsAddedBefore"] = true;
        this.pcb[index]["Result"] = true;
        this.pcb[index]["IsNewPart"] = (part["PartDesc"] == "new" || part["PartDesc"] == "new part") ? true : false;
        this.pcb[index]["HasWarranty"] = part["HasWarranty"];
        if (this.pcb[index]["IsNewPart"])
          this.pcb[index]["selectedVariant"] = part["VariantId"];
        this.pcb[index]["RepairId"] = part.RepairId;
      }
      else {
        let nonPartObj = this.pcb.find(x => x.Id == part.WorkCategorySubType && x.ParentId == workOriented["WorkCategoryType"]);
        if (nonPartObj) {
          let index = this.pcb.findIndex(x => x.Id == part.WorkCategorySubType && x.ParentId == workOriented["WorkCategoryType"]);
          this.pcb[index]["IsAddedBefore"] = true;
          this.pcb[index]["Result"] = true;
          this.pcb[index]["IsNewPart"] = false;
          this.pcb[index]["RepairId"] = part.RepairId;
        }
      }
    }
    else if (workOriented["WorkCategoryType"] == 10) {
      let partObj = this.brakeSystem.find(x => x.PartId && x.PartId == part.PartId);
      if (partObj) {
        let index = this.brakeSystem.findIndex(x => x.PartId == part.PartId);
        this.brakeSystem[index]["IsAddedBefore"] = true;
        this.brakeSystem[index]["Result"] = true;
        this.brakeSystem[index]["IsNewPart"] = (part["PartDesc"] == "new" || part["PartDesc"] == "new part") ? true : false;
        this.brakeSystem[index]["HasWarranty"] = part["HasWarranty"];
        if (this.brakeSystem[index]["IsNewPart"])
          this.brakeSystem[index]["selectedVariant"] = part["VariantId"];
        this.brakeSystem[index]["RepairId"] = part.RepairId;
      }
      else {
        let nonPartObj = this.brakeSystem.find(x => x.Id == part.WorkCategorySubType && x.ParentId == workOriented["WorkCategoryType"]);
        if (nonPartObj) {
          let index = this.brakeSystem.findIndex(x => x.Id == part.WorkCategorySubType && x.ParentId == workOriented["WorkCategoryType"]);
          this.brakeSystem[index]["IsAddedBefore"] = true;
          this.brakeSystem[index]["Result"] = true;
          this.brakeSystem[index]["IsNewPart"] = false;
          this.brakeSystem[index]["RepairId"] = part.RepairId;
        }
      }
    }
    else if (workOriented["WorkCategoryType"] == 11) {
      let partObj = this.wheels.find(x => x.PartId && x.PartId == part.PartId);
      if (partObj) {
        let index = this.wheels.findIndex(x => x.PartId == part.PartId);
        this.wheels[index]["IsAddedBefore"] = true;
        this.wheels[index]["Result"] = true;
        this.wheels[index]["IsNewPart"] = (part["PartDesc"] == "new" || part["PartDesc"] == "new part") ? true : false;
        this.wheels[index]["HasWarranty"] = part["HasWarranty"];
        if (this.wheels[index]["IsNewPart"])
          this.wheels[index]["selectedVariant"] = part["VariantId"];
        this.wheels[index]["RepairId"] = part.RepairId;
      }
      else {
        let nonPartObj = this.wheels.find(x => x.Id == part.WorkCategorySubType && x.ParentId == workOriented["WorkCategoryType"]);
        if (nonPartObj) {
          let index = this.wheels.findIndex(x => x.Id == part.WorkCategorySubType && x.ParentId == workOriented["WorkCategoryType"]);
          this.wheels[index]["IsAddedBefore"] = true;
          this.wheels[index]["Result"] = true;
          this.wheels[index]["IsNewPart"] = false;
          this.wheels[index]["RepairId"] = part.RepairId;
        }
      }
    }
    else if (workOriented["WorkCategoryType"] == 12) {
      let partObj = this.otherComponents.find(x => x.PartId && x.PartId == part.PartId);
      if (partObj) {
        let index = this.otherComponents.findIndex(x => x.PartId == part.PartId);
        this.otherComponents[index]["IsAddedBefore"] = true;
        this.otherComponents[index]["Result"] = true;
        this.otherComponents[index]["IsNewPart"] = (part["PartDesc"] == "new" || part["PartDesc"] == "new part") ? true : false;
        this.otherComponents[index]["HasWarranty"] = part["HasWarranty"];
        if (this.otherComponents[index]["IsNewPart"])
          this.otherComponents[index]["selectedVariant"] = part["VariantId"];
        this.otherComponents[index]["RepairId"] = part.RepairId;
      }
      else {
        let nonPartObj = this.otherComponents.find(x => x.Id == part.WorkCategorySubType && x.ParentId == workOriented["WorkCategoryType"]);
        if (nonPartObj) {
          let index = this.otherComponents.findIndex(x => x.Id == part.WorkCategorySubType && x.ParentId == workOriented["WorkCategoryType"]);
          this.otherComponents[index]["IsAddedBefore"] = true;
          this.otherComponents[index]["Result"] = true;
          this.otherComponents[index]["IsNewPart"] = false;
          this.otherComponents[index]["RepairId"] = part.RepairId;
        }
      }
    }
  }

  updateRepairHistoryForm() {
    const dialogRef = this.dialog.open(RepairRegisterFormPopupComponent, {
      width: '1000px',
      height: '2000px',
      data: {
        'driveTrain': this.driveTrain,
        'light': this.light,
        'dockingComponents': this.dockingComponents,
        'pedalArm': this.pedalArm,
        'seat': this.seat,
        'cables': this.cables,
        'mudguards': this.mudguards,
        'handlebarComponents': this.handlebarComponents,
        'pcb': this.pcb,
        'brakeSystem': this.brakeSystem,
        'wheels': this.wheels,
        'otherComponents': this.otherComponents,
        'bike': this.bike,
        'bikeId': this.bikeId,
        'hoursSpent': this.hoursSpent,
        'minutesSpent': this.minutesSpent,
        'comments': this.comments,
        'isUpdate': (this.isCompleted) ? true : false,
        'createdAt': this.historyData.createdAt
      },
      autoFocus: false
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result["isSuccess"] && !result["isSaved"]) {
        var bikeStateChangeDTO = { Disabled: true, DisabledReason: BikeDisableState.RepairFinished };
        this.updateBikeDisableState(bikeStateChangeDTO);
        this.resolveIssuePerBike(this.bikeId);
        this.closeAllActiveRepairsForBike(this.bikeId);
      }
      if (result)
        this.dialogRef.close(result);
    });
  }

  updateBikeDisableState(bikeStateChangeDTO) {
    this.bikesService.enableDisableBike(this.bikeId, bikeStateChangeDTO)
      .subscribe(data => {
      });
  }

  resolveIssuePerBike(bikeId) {
    this.issueService.ResolveIssuePerBike(bikeId).subscribe(result => {
      if (result > 0) {
      }
    });
  }

  closeAllActiveRepairsForBike(bikeId) {
    this.repairService.closeAllActiveRepairsForBike(bikeId).subscribe(result => {

    });
  }

}
