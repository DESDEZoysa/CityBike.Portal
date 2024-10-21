import { Component, Inject } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UserRoles } from '../../core/constants/user-roles';
import { DockingStationService, IssueService, LoggerService, RepairService } from '../../services';
import { DockingPointIssueFixComponent } from '../docking-point-issue-fix/docking-point-issue-fix.component';
import * as moment from "moment";
import { ConfirmationDpRepairReportPopupComponent } from '../confirmation-dp-repair-report-popup/confirmation-dp-repair-report-popup.component';
import { LocalStorageKeys } from '../../core/constants';
import { ConvertTimePipe } from '../../core/pipes/convert-time.pipe';
import { DockingPointRepairHistoryPopupComponent } from '../docking-point-repair-history-popup/docking-point-repair-history-popup.component';
import { DockingPointRepairHistoryDetailsPopupComponent } from '../docking-point-repair-history-details-popup/docking-point-repair-history-details-popup.component';
import { CommonService } from '../../services/common-service';

export interface DockingPointData {
  dpVisualId: any;
  dockingStationName: any;
  dpDisabled: any;
  dpDisabledReason: any;
  dpErrorCategories: any;
  isBikeExist: boolean;
  isDashboardFilter: boolean;
}

export interface CommandFailurePrecentage {
  TenthPercentage: any;
  FiftiethPercentage: any;
  HundredthPercentage: any;
}

@Component({
  selector: 'app-docking-point-details-popup',
  templateUrl: './docking-point-details-popup.component.html',
  styleUrls: ['./docking-point-details-popup.component.scss'],
  providers: [ConvertTimePipe]
})
export class DockingPointDetailsPopupComponent {
  dpDisabledReason: any;
  dpDisabled: boolean;
  stationName: any;
  dockingPointData: any;
  undockCmdHistory: any;
  expandHistory: boolean = true;
  cmdFailurePrecentage: CommandFailurePrecentage;
  displayPercentage: any;
  resultLength: number;
  allFixCategories: any;
  isRepairRegistrationButtonDisabled: boolean = true;
  dpErrorCategories: any
  selectedDPErrorCategories: any;
  isSelectedDpHasErrorCategories: boolean = false;
  activeDockingPointErrorComments: any;
  isBikeExist: boolean;
  isDPHistoryLoading: boolean;
  isDPIssuesLoading: boolean;
  isDPRepairFixed: boolean;
  isDashboardFilter: boolean = false;
  repairSelectedDate: any;
  repairIsCustomDateShown: any;
  repairFromDate: any;
  repairToDate: any;
  repairFromDateVal: any;
  repairToDateVal: any;
  repairSelectedPerson: any;
  repairFiltered: any;
  dpIssues: any[] = [];
  formattedDPIssueReport: any;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: DockingPointData,
    public dialogRef: MatDialogRef<DockingPointDetailsPopupComponent>,
    private dockingStationService: DockingStationService,
    private loggerService: LoggerService,
    private issueService: IssueService,
    private commonService: CommonService,
    private repairService: RepairService,
    private dialog: MatDialog,
    private convertTime: ConvertTimePipe) {
    this.dockingPointData = this.data;
    this.dpDisabled = this.data.dpDisabled;
    this.dpDisabledReason = this.data.dpDisabledReason;
    this.dpErrorCategories = this.data.dpErrorCategories;
    this.isBikeExist = this.data.isBikeExist;
    this.isDashboardFilter = (this.data.isDashboardFilter) ? true : false;
  }

  ngOnInit() {
    this.getUndockCommmandHistory(this.dockingPointData.dpId);
    this.getAllFixCategories();
    this.getActiveDockingPointErrorReports();
  }

  getUndockCommmandHistory(dockingPointId) {
    this.isDPHistoryLoading = true;
    if (this.dockingPointData) {
      this.dockingStationService.getUndockCommmandHistory(dockingPointId)
        .subscribe(result => {
          if (result != null) {
            this.isDPHistoryLoading = false;
            this.undockCmdHistory = result['UndockCommandHistory'].sort((a, b) => b.CommandTimestamp - a.CommandTimestamp);
            this.undockCmdHistory.map(x => this.mapDisplayText(x));
            this.resultLength = result['UndockCommandHistory'].length;
            this.cmdFailurePrecentage = result['CommandFailurePrecentage'];
            this.displayPercentage = this.cmdFailurePrecentage.TenthPercentage;
          }
        }, error => {
          this.isDPHistoryLoading = false;
          this.loggerService.showErrorMessage("Getting docking point undock command history details failed!");
        });
    }
  }

  setDockingPointAsOkay() {
    this.dialogRef.close({ "IsDPOkay": true });
  }

  reportIssueForDP() {
    const dialogConfirmRef = this.dialog.open(ConfirmationDpRepairReportPopupComponent, {
      disableClose: true,
      width: '470px',
      data: {
        "isBikeExist": this.isBikeExist
      }
    });
    dialogConfirmRef.afterClosed().subscribe(result => {
      if (result) {
        this.dialogRef.close({ "IsDPRepairRequired": true });
      }
    });
  }

  getUndockIconCSS(cmdHistory) {
    if (cmdHistory.CommandStatus == 1) {
      if (cmdHistory.InitiatorRole == UserRoles.WORKSHOP) {
        return 'indecator-item yellow key';
      } else if (cmdHistory.InitiatorRole == UserRoles.STREET_TEAM) {
        if (cmdHistory.IsStreetTeamRepair)
          return 'indecator-item red key';
        else
          return 'indecator-item red eye';
      } else {
        return 'indecator-item yellow';
      }
    } else if (cmdHistory.CommandStatus != 2) {
      if (cmdHistory.InitiatorRole == UserRoles.WORKSHOP) {
        return 'indecator-item red key';
      } else if (cmdHistory.InitiatorRole == UserRoles.STREET_TEAM) {
        if (cmdHistory.IsStreetTeamRepair)
          return 'indecator-item red key';
        else
          return 'indecator-item red eye';
      } else if (cmdHistory.IsShortSession && cmdHistory.EndDockingPointId != null && (cmdHistory.DockingPointId != cmdHistory.EndDockingPointId)) {
        return 'indecator-item';
      } else {
        return 'indecator-item red';
      }
    } else {
      if (cmdHistory.InitiatorRole == UserRoles.WORKSHOP) {
        return 'indecator-item key';
      } else if (cmdHistory.InitiatorRole == UserRoles.STREET_TEAM) {
        if (cmdHistory.IsStreetTeamRepair)
          return 'indecator-item key';
        else
          return 'indecator-item eye';
      } else {
        return 'indecator-item';
      }
    }
  }

  expandHistoryDetail() {
    if (!this.expandHistory) {
      this.expandHistory = true;
      this.displayPercentage = this.cmdFailurePrecentage.FiftiethPercentage;
      return 'indecators-container expand';
    }
    else {
      this.expandHistory = false;
      this.displayPercentage = this.cmdFailurePrecentage.TenthPercentage;
      return 'indecators-container';
    }
  }

  reduceHistoryDetail() {
    if (!this.expandHistory)
      !this.expandHistoryDetail();
  }

  openDockingPointIssueFixPopup() {
    this.isDPRepairFixed = false;
    const dialogIssueFixRef = this.dialog.open(DockingPointIssueFixComponent, {
      disableClose: true,
      width: '600px',
      maxHeight: '90vh',
      data: {
        "dpVisualId": this.dockingPointData['dpVisualId'],
        "dockingPointId": this.dockingPointData['dpId'],
        "dpDisabled": this.dpDisabled,
        "dpDisabledReason": this.dpDisabledReason,
        "fixCategories": this.allFixCategories
      }
    });
    dialogIssueFixRef.afterClosed().subscribe(result => {
      if (result) {
        this.isSelectedDpHasErrorCategories = false;
        this.dpDisabled = false;
        this.dpDisabledReason = null;
        this.isDPRepairFixed = true;
      }
    });
  }

  getAllFixCategories() {
    this.repairService.getAllFixCategories().subscribe(
      data => {
        this.mapAllFixCategories(data);
        this.isRepairRegistrationButtonDisabled = false;
      },
      error => {
        this.loggerService.showErrorMessage(error);
        this.isRepairRegistrationButtonDisabled = true;
      });
  }

  mapAllFixCategories(data) {
    data.map(function (fixCategory) {
      return fixCategory.FixType = "LIVE_MAP.DOCKING_POINT_ISSUE_FIX." + fixCategory.FixType.toUpperCase();
    });
    this.allFixCategories = data;
  }

  getActiveDockingPointErrorReports() {
    this.isDPIssuesLoading = true;
    this.issueService.getActiveDockingPointErrorReportsByDPId(this.dockingPointData['dpId']).subscribe(
      data => {
        if (data.length > 0) {
          this.dpIssues = data;
          this.isSelectedDpHasErrorCategories = true;
          this.activeDockingPointErrorComments = data[0].Comments;
          if (data[0]['ErrorCategoryIds'].length > 0) {
            this.selectedDPErrorCategories = this.dpErrorCategories.filter(function (errorCategory) {
              return data[0]['ErrorCategoryIds'].includes(errorCategory.Id);
            });
          }
          this.formatDPErrorReport();
        }
        this.isDPIssuesLoading = false;
      },
      error => {
        this.loggerService.showErrorMessage(error);
        this.isSelectedDpHasErrorCategories = false;
        this.isDPIssuesLoading = false;
      });
  }

  mapDisplayText(undockHistory) {
    let convertType = JSON.parse(localStorage.getItem(LocalStorageKeys.PREFERRED_TIMEZONE));
    let commandTimestamp = moment(undockHistory.CommandTimestamp).utc().format("DD.MM.HH:mm");
    if (convertType == "CET")
      commandTimestamp = moment(this.convertTime.transform(undockHistory.CommandTimestamp)).format("DD.MM.HH:mm");
    if (undockHistory.CommandStatus != 2) {
      this.mapFailedCommandHistory(undockHistory, commandTimestamp);
    }
    else if (undockHistory.CommandStatus == 2) {
      this.mapSuccessfulCommandHistory(undockHistory, commandTimestamp);
    }
  }

  private mapSuccessfulCommandHistory(undockHistory: any, commandTimestamp: string) {
    if (undockHistory.InitiatorRole == UserRoles.STREET_TEAM && undockHistory.IsStreetTeamRepair) {
      undockHistory["DisplayText"] = `Successful undock ${commandTimestamp} \n` +
        `Fixed by ${undockHistory.UserFirstName} \n ` +
        `Bike: ${undockHistory.BikeVisualId}`;
    }
    else if (undockHistory.InitiatorRole == UserRoles.STREET_TEAM && !undockHistory.IsStreetTeamRepair) {
      undockHistory["DisplayText"] = `Successful undock ${commandTimestamp} \n` +
        `Checked by ${undockHistory.UserFirstName} \n ` +
        `Bike: ${undockHistory.BikeVisualId}`;
    }
    else if (undockHistory.InitiatorRole == UserRoles.WORKSHOP &&
      undockHistory.BikeDisabledState && undockHistory.WorkshopId) {
      undockHistory["DisplayText"] = `Successful undock ${commandTimestamp} \n` +
        `${undockHistory.WorkshopName} \n ` +
        `Bike: ${undockHistory.BikeVisualId}`;
    }
    else {
      undockHistory["DisplayText"] = `Successful undock ${commandTimestamp} \n` +
        `Bike: ${undockHistory.BikeVisualId}`;
    }
  }

  private mapFailedCommandHistory(undockHistory: any, commandTimestamp: string) {
    let errorTypeText = "";
    if (undockHistory.IsUnlockCommand) {
      if (undockHistory.CommandStatus == 1)
        errorTypeText = "Unlock command expired";
      else if (undockHistory.CommandStatus == 3 && undockHistory.IsShortSession)
        errorTypeText = "Short session";
      else if (undockHistory.CommandStatus == 3)
        errorTypeText = "Unlock command rejected";
      else if (undockHistory.CommandStatus == 0)
        errorTypeText = "Unlock command sent";
    }
    else {
      if (undockHistory.CommandStatus == 1)
        errorTypeText = "Undock command expired";
      else if (undockHistory.CommandStatus == 3 && undockHistory.IsUndockCancelled)
        errorTypeText = "Undock cancelled";
      else if (undockHistory.CommandStatus == 3 && undockHistory.IsShortSession)
        errorTypeText = "Short session";
      else if (undockHistory.CommandStatus == 3)
        errorTypeText = "Undock command rejected";
      else if (undockHistory.CommandStatus == 0)
        errorTypeText = "Undock command sent";
    }

    let displayIntro = (undockHistory.InitiatorRole == UserRoles.STREET_TEAM ||
      undockHistory.InitiatorRole == UserRoles.WORKSHOP) ?
      (undockHistory.IsUnlockCommand) ? "Failed unlock" : "Failed undock" : "Failed session";

    if (undockHistory.InitiatorRole == UserRoles.STREET_TEAM && undockHistory.IsStreetTeamRepair) {
      undockHistory["DisplayText"] = `${displayIntro} ${commandTimestamp} \n` +
        `Fixed by ${undockHistory.UserFirstName} \n ` +
        `Bike: ${undockHistory.BikeVisualId} \n` +
        `Error type: ${errorTypeText}`;
    }
    else if (undockHistory.InitiatorRole == UserRoles.STREET_TEAM && !undockHistory.IsStreetTeamRepair) {
      undockHistory["DisplayText"] = `${displayIntro} ${commandTimestamp} \n` +
        `Checked by ${undockHistory.UserFirstName} \n ` +
        `Bike: ${undockHistory.BikeVisualId} \n` +
        `Error type: ${errorTypeText}`;
    }
    else if (undockHistory.InitiatorRole == UserRoles.WORKSHOP &&
      undockHistory.BikeDisabledState && undockHistory.WorkshopId) {
      undockHistory["DisplayText"] = `${displayIntro} ${commandTimestamp} \n` +
        `Bike: ${undockHistory.BikeVisualId} \n` +
        `${undockHistory.WorkshopName} \n ` +
        `Error type: ${errorTypeText}`;
    }
    else {
      undockHistory["DisplayText"] = `${displayIntro} ${commandTimestamp} \n` +
        `Bike: ${undockHistory.BikeVisualId} \n` +
        `Error type: ${errorTypeText}`;
    }
  }

  closeDialog() {
    if (this.isDPRepairFixed)
      this.dialogRef.close({ "IsDPRepaired": true });
    else
      this.dialogRef.close();
  }

  openRepairHistory() {
    const dialogOpenDPRef = this.dialog.open(DockingPointRepairHistoryPopupComponent, {
      width: '1100px',
      data: {
        "dockingStationName": this.stationName,
        "dpVisualId": this.dockingPointData['dpVisualId'],
        "dockingPointId": this.dockingPointData['dpId'],
        "selectedDate": this.repairSelectedDate,
        "isCustomDateShown": this.repairIsCustomDateShown,
        "fromDate": this.repairFromDate,
        "toDate": this.repairToDate,
        "fromDateValue": this.repairFromDateVal,
        "toDateValue": this.repairToDateVal,
        "selectedPerson": this.repairSelectedPerson,
        "isFiltered": this.repairFiltered
      },
      disableClose: true
    });

    dialogOpenDPRef.afterClosed().subscribe(result => {
      if (result) {
        const dialogOpenDPRef = this.dialog.open(DockingPointRepairHistoryDetailsPopupComponent, {
          width: '580px',
          data: {
            "dockingPointId": result["dockingPointId"],
            "dpVisualId": result["dpVisualId"],
            "dockingStationName": result["dockingStationName"],
            "selectedDate": result["selectedDate"],
            "isCustomDateShown": result["isCustomDateShown"],
            "fromDate": result["fromDate"],
            "toDate": result["toDate"],
            "fromDateValue": result["fromDateValue"],
            "toDateValue": result["toDateValue"],
            "selectedPerson": result["selectedPerson"],
            "historyData": result["historyData"]
          },
          disableClose: true
        });

        dialogOpenDPRef.afterClosed().subscribe(result => {
          this.setDPRepairHistorySelectFilters(result);
          this.openRepairHistory();
        });
      }
      else
        this.repairFiltered = false;
    });
  }

  private setDPRepairHistorySelectFilters(result: any) {
    this.repairSelectedDate = result["selectedDate"];
    this.repairFromDate = result["fromDate"];
    this.repairToDate = result["toDate"];
    this.repairFromDateVal = result["fromDateValue"];
    this.repairToDateVal = result["toDateValue"];
    this.repairSelectedPerson = result["selectedPerson"]["id"];
    this.repairFiltered = true;
    this.repairIsCustomDateShown = result["isCustomDateShown"];
  }

  formatDPErrorReport() {
    this.dpIssues.forEach(x => {
      x.ReportedDate = this.convertTime.transform(x.ReportedDate);
      let reportedDate = moment(x.ReportedDate);
      let now = moment(this.convertTime.transform(moment().utc().format()));
      let diff = now.diff(reportedDate);

      let startOfToday = moment().utc().startOf('day');
      let startOfYesterday = moment().utc().subtract(1, 'day').startOf('day');
      let durationInDays = moment.duration(diff).asDays();
      
      if (durationInDays < 8) {
        if (reportedDate.isSameOrAfter(startOfToday,'day')) {
          x.ReportedDateFormatted = `Today ${moment(x.ReportedDate).format("HH:mm")}`;
        } else if (reportedDate.isSameOrAfter(startOfYesterday,'day') && reportedDate.isBefore(startOfToday)) {
          x.ReportedDateFormatted = `Yesterday ${moment(x.ReportedDate).format("HH:mm")}`;
        } else 
          x.ReportedDateFormatted = `Last ${moment(x.ReportedDate).format("dddd HH:mm")}`;
      }
      else
        x.ReportedDateFormatted = moment(x.ReportedDate).format("MMM Do HH:mm");

      x["EndUserId"] = x["ReportedBy"];
      x.ReportedUser = this.commonService.mapReportedUser(x);
    });

    this.formattedDPIssueReport = this.dpIssues[0];
  }

}
