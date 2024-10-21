
import { forkJoin as observableForkJoin, Observable } from 'rxjs';
import { BreakpointObserver } from '@angular/cdk/layout';
import { Component, Inject, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { LoggerService, RepairService } from '../../services';
import * as moment from 'moment';
import { LocalStorageKeys } from '../../core/constants';
import { DockingPointIssueFixComponent } from '../docking-point-issue-fix/docking-point-issue-fix.component';
import { UserRoles } from '../../core/constants/user-roles';

export interface DockingPointRepairData {
  dockingPointId: any;
  dpVisualId: any;
  dockingStationName: any;
  historyData: any;
  selectedDate: any;
  fromDate: any;
  toDate: any;
  fromDateValue: any;
  toDateValue: any;
  selectedPerson: any;
  isCustomDateShown: any;
}

@Component({
  selector: 'app-docking-point-repair-history-details-popup',
  templateUrl: './docking-point-repair-history-details-popup.component.html',
  styleUrls: ['./docking-point-repair-history-details-popup.component.scss']
})
export class DockingPointRepairHistoryDetailsPopupComponent implements OnInit {

  public readonly LAYOUT = {
    XS: 768,
    SM: 992,
    MD: 1200,
    LG: 1600,
    XL: 1920,
    XXL: 2560,
  };

  public layout: number = this.LAYOUT.MD;
  isMobile: boolean;
  dockingPointId: any;
  dpVisualId: any;
  dockingStationName: any;
  selectedDate: any;
  fromDate: any;
  fromDateValue: any;
  toDate: any;
  toDateValue: any;
  selectedPerson: any;
  loggedInUser: any;
  dateFinished: any;
  dateFinishedShortFormatted: string;
  dateFinishedLongFormatted: string;
  fixedBy: any;
  hoursSpent: any;
  minutesSpent: any;
  fixes: any;
  comments: any;
  isOwner: boolean;
  historyData: any;
  isCustomDateShown: boolean;
  isUpdated: any;
  dpIssueFixData: any;
  allFixCategories: any;
  isLoading: boolean;
  modifiedBy: any;
  modifiedUser: any;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: DockingPointRepairData,
    public dialogRef: MatDialogRef<DockingPointRepairHistoryDetailsPopupComponent>,
    public dialog: MatDialog,
    private loggerService: LoggerService,
    private repairService: RepairService,
    public breakpointObserver: BreakpointObserver) {
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      this.isMobile = true;
    }
    this.isLoading = false;
  }

  onResize() {
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      this.isMobile = true;
    } else {
      this.isMobile = false;
    }
  }

  ngOnInit() {
    let convertType = JSON.parse(localStorage.getItem(LocalStorageKeys.PREFERRED_TIMEZONE));
    this.loggedInUser = JSON.parse(localStorage.getItem(LocalStorageKeys.USER_DETAILS));
    var authToken = JSON.parse(localStorage.getItem(LocalStorageKeys.OAUTH_TOKEN));
    let userRole: any;
    if (authToken._claims)
      userRole = authToken._claims[0];

    this.dockingPointId = this.data.historyData.DockingPointId;
    this.dpVisualId = this.data.historyData.VisualId;
    this.dockingStationName = this.data.historyData.DockingStationName;
    this.selectedDate = this.data.selectedDate;
    this.isCustomDateShown = this.data.isCustomDateShown;
    this.fromDate = this.data.fromDate;
    this.fromDateValue = this.data.fromDateValue;
    this.toDate = this.data.toDate;
    this.toDateValue = this.data.toDateValue;
    this.selectedPerson = this.data.selectedPerson;
    this.historyData = this.data.historyData;
    this.dateFinished = this.historyData.RepairedAt;
    this.dateFinishedShortFormatted = (this.dateFinished) ? moment(this.historyData.RepairedAt).format('DD.MM.YYYY') : null;
    this.dateFinishedLongFormatted = (this.dateFinished) ? moment(this.historyData.RepairedAt).utc().format('DD.MM.YYYY HH:mm') : null;
    if (convertType == "CET")
      this.dateFinishedLongFormatted = (this.dateFinished) ? moment(this.historyData.RepairedAt).tz("Europe/Berlin").format('DD.MM.YYYY HH:mm') : null;
    this.fixedBy = this.historyData.RepairedBy;
    this.hoursSpent = this.historyData.HoursSpent;
    this.minutesSpent = this.historyData.MinutesSpent;
    this.fixes = this.historyData.FixCategories;
    this.comments = this.historyData.Comment;
    this.isOwner = (this.historyData.RepairedBy) ? ((this.loggedInUser.UserId == this.historyData.RepairedBy.UserId) || (userRole == UserRoles.ADMIN)) : false;
    this.isUpdated = this.historyData.IsUpdated;
    this.modifiedBy = this.historyData.ModifiedBy;
    this.modifiedUser = this.historyData.ModifiedUser;
    this.getAllDefaultLoadData();
  }

  closeDialog() {
    this.dialogRef.close({
      "selectedDate": this.selectedDate,
      "fromDate": this.fromDate,
      "toDate": this.toDate,
      "fromDateValue": this.fromDateValue,
      "toDateValue": this.toDateValue,
      "selectedPerson": this.selectedPerson,
      "isCustomDateShown": this.isCustomDateShown
    });
  }

  updateRepairHistoryForm() {
    const dialogRef = this.dialog.open(DockingPointIssueFixComponent, {
      width: '600px',
      maxHeight: '98vh',
      data: {
        'dpFixId': this.historyData["DPFixId"],
        'dpVisualId': this.dpIssueFixData["VisualId"],
        'fixCategories': this.allFixCategories,
        'dockingPointId': this.dpIssueFixData["DockingPointId"],
        'dpDisabled': false,
        'dpDisabledReason': null,
        'isUpdate': true,
        'hoursSpent': this.dpIssueFixData["HoursSpent"],
        'minutesSpent': this.dpIssueFixData["MinutesSpent"],
        'comments': this.dpIssueFixData["Comment"]
      },
      autoFocus: false
    });
    dialogRef.afterClosed().subscribe(result => {
      let toDate = moment().utc().format('YYYY-MM-DDTHH:mm:ss');
      this.dialogRef.close({
        "selectedDate": this.selectedDate,
        "fromDate": this.fromDate,
        "toDate": toDate,
        "fromDateValue": this.fromDateValue,
        "toDateValue": toDate,
        "selectedPerson": this.selectedPerson,
        "isCustomDateShown": this.isCustomDateShown
      });
    });
  }

  mapAllFixCategories(data) {
    data.map(function (fixCategory) {
      return fixCategory.FixType = "LIVE_MAP.DOCKING_POINT_ISSUE_FIX." + fixCategory.FixType.toUpperCase();
    });
    this.allFixCategories = data;
    this.allFixCategories.map(x => {
      x.Result = false;
      if (this.dpIssueFixData["FixCategories"].some(category => category.FixId == x.FixId)) {
        x.Result = true;
      }
      return;
    });
  }

  getAllDefaultLoadData() {
    this.isLoading = true;
    observableForkJoin([
      this.repairService.getDockingPointIssueFixDetails(this.historyData["DPFixId"]),
      this.repairService.getAllFixCategories()]
    ).subscribe(data => {
      this.dpIssueFixData = data[0];
      this.mapAllFixCategories(data[1]);
      this.isLoading = false;
    }, error => {
      this.isLoading = false;
    });
  }
}
