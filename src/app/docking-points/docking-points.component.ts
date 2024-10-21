import { PriorityGroupService } from './../services/priority-groups.service';
import { Component, OnInit, ViewChild } from '@angular/core';
import { DockingStation } from '../core/models';
import { DockingStationService, LoggerService, LiveConnectionService, AuthService, IssueService } from '../services';
import { Router } from '@angular/router';
import { SystemSettingsService } from '../services/system-settings.service';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../shared/confirm-dialog/confirm-dialog.component';
import { ScreenLayouts } from '../core/constants/screen-layouts';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { CommonHandler } from '../core/handlers/common-handler';
import * as moment from 'moment';
import { DockingPointDetailsPopupComponent } from '../shared/docking-point-details-popup/docking-point-details-popup.component';
import { ConfirmationDpCheckPopupComponent } from '../shared/confirmation-dp-check-popup/confirmation-dp-check-popup.component';
import { DockingPointErrorReportPopupComponent } from '../shared/docking-point-error-report-popup/docking-point-error-report-popup.component';
import { DockingPointRepairHistoryPopupComponent } from '../shared/docking-point-repair-history-popup/docking-point-repair-history-popup.component';
import { DockingPointRepairHistoryDetailsPopupComponent } from '../shared/docking-point-repair-history-details-popup/docking-point-repair-history-details-popup.component';
import { StationTechnicalDetailsComponent } from '../docking-stations/station-technical-details/station-technical-details.component';
import { BikeDisableState } from '../core/enums/bikeDisableState';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-docking-points',
  templateUrl: './docking-points.component.html',
  styleUrls: ['./docking-points.component.scss']
})
export class DockingPointsComponent implements OnInit {
  @ViewChild('dockingPointTable', { static: true }) table: any;

  public dockingPoints = [];
  loadingIndicator: boolean = true;
  public stationId = 0;
  public dockingStation = new DockingStation();
  isMobile: boolean = false;
  minChargeLevel: number = 0;
  isAdminOrMaintananceOrService = false;
  isAdminOrMaintanceOrServiceOrSupport = false;
  dpErrorCategories: any;

  public readonly LAYOUT = ScreenLayouts;
  public layout: number = this.LAYOUT.MD;
  priorityReservations: any;
  priorityReservationInfo: any;
  isAdminOrManitanance: boolean;
  successfulSessionCount: number = 0;
  unsuccessfulSessionCount: number = 0;
  unsuccessfulSesssionPrecentage: number = 0;
  repairSelectedDate: any;
  repairFromDate: any;
  repairToDate: any;
  repairFromDateVal: any;
  repairToDateVal: any;
  repairSelectedPerson: any;
  repairFiltered: boolean;
  repairIsCustomDateShown: any;
  isDockingStationDisabled: boolean = false;

  constructor(
    private dockingStationService: DockingStationService,
    private loggerService: LoggerService,
    protected liveConnectionService: LiveConnectionService,
    private systemSettingsService: SystemSettingsService,
    private dialog: MatDialog,
    private authService: AuthService,
    private issueService: IssueService,
    private router: Router,
    public breakpointObserver: BreakpointObserver,
    private priorityGroupService: PriorityGroupService,
    private translate: TranslateService) {
    this.stationId = parseInt(this.router.url.split('/')[2]);
    if (/Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      this.isMobile = true;
    }
  }

  ngOnInit() {
    this.manageScreenWidth();
    this.getSystemConfiguration();
    this.getDockingStationDetails();
    this.getUnsuccessfulSessionDetails();
    this.getAllPriorityReservations();
    this.getAllDPErrorCategories();
    this.isAdminOrMaintananceOrService = this.authService.isAdminOrMaintanceOrService();
    this.isAdminOrMaintanceOrServiceOrSupport = this.authService.isAdminOrMaintanceOrServiceOrSupport();
    this.isAdminOrManitanance = this.authService.isAdminOrManitanance();
    this.translate.onLangChange.subscribe((params: LangChangeEvent) => {
      this.setBikeIconText();
    });
  }

  manageScreenWidth() {
    const breakpoints = Object.keys(this.LAYOUT).map(k => this.LAYOUT[k]);
    breakpoints.forEach((maxWidth, index) => {
      const minWidth = (index > 0) ? breakpoints[index - 1] : 0;
      this.breakpointObserver
        .observe([`(min-width: ${minWidth}px) and (max-width: ${maxWidth - 1}px)`])
        .subscribe((state: BreakpointState) => {
          if (!state.matches) { return; }
          this.layout = maxWidth;
        });
    });
  }

  onResize() {
    if (/Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      this.isMobile = true;
    } else {
      this.isMobile = false;
    }
  }

  protected getDockingStationDetails(): void {
    this.dockingStationService.getAllBikesWithPriority(this.stationId)
      .subscribe(result => {
        var dsDetails = result;

        this.dockingStation.IsOnboardStation = dsDetails.IsOnboardStation;
        this.dockingStation.Name = dsDetails.Name;
        this.dockingStation.AreaName = dsDetails.AreaName;
        if (dsDetails.Address) {
          var street = dsDetails.Address["Street"] != null ? dsDetails.Address["Street"] + ", " : "";
          var zipCode = dsDetails.Address["ZipCode"] != null ? dsDetails.Address["ZipCode"] + " " : "";
          var city = dsDetails.Address["City"] != null ? dsDetails.Address["City"] + ", " : "";
          var district = dsDetails.Address["District"] != null ? dsDetails.Address["District"] + ", " : "";
          var country = dsDetails.Address["Country"] != null ? dsDetails.Address["Country"] + "." : "";
          this.dockingStation.AddressStr = street + zipCode + city + district + country;
          this.dockingStation.DisabledReason = dsDetails.DisabledReason;
          this.isDockingStationDisabled = dsDetails.Disabled;

          if (result["DockingPoints"] != null)
            this.arrangeDockingPointList(result);
        }
        this.loadingIndicator = false;
      }, error => {
        this.loadingIndicator = false;
        if (error.status == 403) {
          this.loggerService.showErrorMessage("Don't have permission to obtain data");
        } else {
          this.loggerService.showErrorMessage("Error obtaning docking station related data");
        }
      });
  }

  arrangeDockingPointList(dockPoints) {
    //sort undocked bikes
    dockPoints.DockingPoints = dockPoints.DockingPoints.sort(function (a, b) {
      if (a.DockingPointId == null) return -1  //move a downwards
      if (b.DockingPointId == null) return 1 //move b downwards
      //return a.DockingPointId - b.DockingPointId;    
    });

    dockPoints.DockingPoints.forEach((dockingPoint) => {
      if (dockingPoint != null) {
        if (dockingPoint['VisualId'] == '') {
          dockingPoint['VisualId'] = 0;
        }

        if (dockingPoint['HardwareId'] == '') {
          if (dockingPoint['DockingPointId'] == 0) {
            dockingPoint['State'] = 0;
            dockingPoint['HardwareId'] = 'Unknown';
          } else {
            dockingPoint['HardwareId'] = 'Undocked';
          }
        }

        dockingPoint['Priority'] = "";

        if (dockingPoint.Bike != null) {
          //since DockingPointId is not nullable in customBike I set -1 number to differentiate free bike state
          if (dockingPoint["DockingPointId"] == -1)
            dockingPoint['State'] = dockingPoint.Bike.LockState;

          //Create grace period timestamp
          dockingPoint["GracePeriodDuration"] = '';
          let gracePeriodDate = dockingPoint.Bike.GracePeriod;
          var gracePeriodt = new Date(dockingPoint.Bike.GracePeriod);

          //Add 30 sec to issue timestamp for screening
          var issueTimestamp: Date
          if (dockingPoint.Bike.IssueTimestamp) {
            issueTimestamp = new Date(dockingPoint.Bike.IssueTimestamp);
            issueTimestamp.setSeconds(issueTimestamp.getSeconds() + 15);
          }

          if (gracePeriodDate)
            dockingPoint["GracePeriodDuration"] = this.convertGracePeriod(gracePeriodDate);

          if (dockingPoint.Bike.Priority) {
            dockingPoint['Priority'] = dockingPoint.Bike.Priority;

          } else {
            if ((!dockingPoint.Bike.Disabled) && (dockingPoint.Bike.CurrentChargeLevel > this.minChargeLevel)) {
              if (dockingPoint.Bike.GracePeriod && gracePeriodt.getTime() >= Date.now()) {
                dockingPoint['Priority'] = 0;
              }
              //if bike is in session or requested by users - it is yet used
              else if (dockingPoint.Bike.SessionId != null || dockingPoint.Bike.InSession || dockingPoint.Bike.RequestedEndUserId != null) {
                dockingPoint['Priority'] = 'In Use';
              }
              //Use this to show grace period when DPHWID arrived and bike unavilable for 30s
              else if (issueTimestamp.getTime() >= Date.now()) {
                dockingPoint["GracePeriodDuration"] = this.convertGracePeriod(issueTimestamp);
                dockingPoint['Priority'] = '0';
              }
            }
          }
          dockingPoint["Bike"]["BikeStatus"] = CommonHandler.getBikeStatus(dockingPoint.Bike, dockingPoint['DockingStationId'], dockingPoint['DockingPointId']);
        }
      }
    });

    this.dockingPoints = dockPoints.DockingPoints;
    if (this.dockingPoints[0] == null) {
      this.dockingPoints = [];
    }
    this.setBikeIconText();
  }

  private setBikeIconText() {
    if (this.dockingPoints) {
      this.dockingPoints.forEach((dockingPoint) => {
        if (dockingPoint.Bike != null) {
          if (dockingPoint["Bike"]["Disabled"] && dockingPoint["Bike"]["DisableState"] == BikeDisableState.WithStreetTeam) {
            this.translate.get("DOCKING_POINTS.BIKE.WITH_STREET_TEAM").subscribe(name => {
              dockingPoint["Bike"]["DisabledStatus"] = name;
            });
          }
          else if (dockingPoint["Bike"]["Disabled"]) {
            this.translate.get("DOCKING_POINTS.BIKE.DISABLED").subscribe(name => {
              dockingPoint["Bike"]["DisabledStatus"] = name;
            });
          }
          else
            dockingPoint["Bike"]["DisabledStatus"] = "";
        }
      });
    }
  }

  navigateToBikeDetails(bike) {
    this.router.navigateByUrl('bikes/' + bike.BikeId + '/details');
  }

  toggleExpandRow(row) {
    this.table.rowDetail.toggleExpandRow(row);
  }

  deleteDockingPoint(dockingPointId) {
    var selectedDP = this.dockingPoints.find(a => a.DockingPointId == dockingPointId);

    if (selectedDP['State'] == 2 && selectedDP['Bike'] != null) {
      this.loggerService.showErrorMessage("Docking point already have a bike associated with it");
      return;
    }

    var deleteIndex = this.dockingPoints.findIndex(a => a.DockingPointId == dockingPointId);
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '250px',
      data: { "message": "Are you sure want to delete this docking point?" }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.dockingStationService.deleteDockingPoint(this.stationId, dockingPointId)
          .subscribe(res => {
            this.dockingPoints.splice(deleteIndex, 1);
            this.dockingPoints = [...this.dockingPoints];
            this.loggerService.showSuccessfulMessage("Docking point deleted successfully")
          }, error => {
            this.loggerService.showErrorMessage("Docking point deletion error")
          })
      }
    });
  }

  private getSystemConfiguration(): void {
    this.systemSettingsService.getSETTING().subscribe(data => {
      this.minChargeLevel = data.MinChargeLevel;
    },
      error => {
        this.loadingIndicator = false;
        if (error.status == 403) {
          this.loggerService.showErrorMessage("Don't have permission to obtain data");
        } else {
          this.loggerService.showErrorMessage("Error obtaining system configuration");
        }
      }
    );
  }

  getAllPriorityReservations() {
    this.priorityReservations = [];
    this.priorityGroupService.getAllPriorityReservationsByDockingStation(
      this.stationId
    ).subscribe(res => {
      if (res) {
        this.priorityReservationInfo = res;
        this.priorityReservations = res["PriorityGroups"];
        this.priorityReservations.sort((a, b) => (a.Id > b.Id) ? 1 : -1);
      }
    }, err => { });
  }

  convertGracePeriod(value) {
    let graceDurationText = '';
    let now = moment().utc();
    let gracePeriod = moment(value);
    let diff = gracePeriod.diff(now);
    let duration = moment.duration(diff);
    graceDurationText = this.mapDurationText(duration, graceDurationText, diff);
    return graceDurationText;
  }

  private mapDurationText(duration: any, graceDurationText: string, diff: any) {
    let diffHours = moment.utc(diff).format("h");
    let diffMins = moment.utc(diff).format("mm");
    let durationInSec = duration.asSeconds();
    let durationInMin = duration.asMinutes();
    if (durationInSec > 0) {
      if (durationInSec < 60)
        graceDurationText = `${Math.round(durationInSec)} sec`;
      else if (durationInMin < 60)
        graceDurationText = `${Math.round(durationInMin)} min`;
      else
        graceDurationText = `${diffHours} hrs ${diffMins} min`;
    }
    return graceDurationText;
  }

  openDockingPointDetailsPopup(dsDetails: any) {
    const dialogOpenDPRef = this.dialog.open(DockingPointDetailsPopupComponent, {
      width: '500px',
      height: '700px',
      data: {
        "dockingStationName": this.dockingStation.Name,
        "dpVisualId": dsDetails["VisualId"],
        "dpId": dsDetails["DockingPointId"],
        "dpDisabled": dsDetails["DPDisabled"],
        "dpDisabledReason": dsDetails["DPDisabledReason"],
        "dpErrorCategories": this.dpErrorCategories,
        "isBikeExist": (dsDetails["Bike"]) ? true : false
      }
    });

    dialogOpenDPRef.afterClosed().subscribe(result => {
      if (result && result["IsDPOkay"]) {
        const dialogConfirmRef = this.dialog.open(ConfirmationDpCheckPopupComponent, {
          disableClose: true,
          width: '500px',
          height: '300px',
          data: {
            "dpVisualId": dsDetails["VisualId"]
          }
        });
      }
      else if (result && result["IsDPRepairRequired"]) {
        const dialogDPErrorReportRef = this.dialog.open(DockingPointErrorReportPopupComponent, {
          disableClose: true,
          width: '500px',
          maxHeight: '90vh',
          data: {
            "dpVisualId": dsDetails["VisualId"],
            "dpErrorCategories": this.dpErrorCategories
          }
        });
        dialogDPErrorReportRef.afterClosed().subscribe(result => {
          if (result) {
            let dpErrorReportDto = result["dpErrorReportDto"];
            dpErrorReportDto["DockingStationId"] = dsDetails["DockingStationId"];
            dpErrorReportDto["DockingPointId"] = dsDetails["DockingPointId"];
            this.createDPIssue(dpErrorReportDto, dsDetails["VisualId"]);
          }
        });
      }
      else if (result && result["IsDPRepaired"]) {
        this.enableDockingPoint(dsDetails["VisualId"]);
      }
    });
  }

  getAllDPErrorCategories() {
    this.issueService.getAllDockingPointErrorCategories().subscribe(res => {
      this.mapDPErrorCategories(res);
    });
  }

  mapDPErrorCategories(data) {
    data.map(function (dpErrorCategory) {
      return dpErrorCategory.Name = "LIVE_MAP.ACTIVE_DOCKING_POINT_ISSUE_REPORT." + dpErrorCategory.Name.toUpperCase();
    });
    this.dpErrorCategories = data;
  }

  createDPIssue(dpErrorReportDto: any, dpVisualId: any) {
    this.issueService.createDPIssue(dpErrorReportDto).subscribe(res => {
      if (res) {
        this.getDockingStationDetails();
      }
    }, err => { });
  }

  enableDockingPoint(dpVisualId: any) {
    this.getDockingStationDetails();
  }

  getUnsuccessfulSessionDetails(): void {
    this.dockingStationService.getUnsuccessfulSessionDetails(this.stationId)
      .subscribe(result => {
        this.successfulSessionCount = result["SuccessfulCount"];
        this.unsuccessfulSessionCount = result["UnsuccessfulCount"];
        this.unsuccessfulSesssionPrecentage = result["UnsuccessfulPercentage"];

        this.loadingIndicator = false;
      }, error => {
        this.loadingIndicator = false;
        this.loggerService.showErrorMessage("Error obtaning unsuccessful session data");
      });
  }

  openRepairHistory(dockingPointId: any) {
    let dockingPoint = this.dockingPoints.find(x => x.DockingPointId == dockingPointId);
    const dialogOpenDPRef = this.dialog.open(DockingPointRepairHistoryPopupComponent, {
      width: '1100px',
      data: {
        "dockingPointId": dockingPointId,
        "dpVisualId": dockingPoint["VisualId"],
        "dockingStationName": this.dockingStation.Name,
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
          this.openRepairHistory(dockingPointId);
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

  openDetailsDialog(stationId) {
    const dialogRef = this.dialog.open(StationTechnicalDetailsComponent, {
      width: '650px',
      height: '410px',
      data: { stationId }
    });
    dialogRef.afterClosed().subscribe(result => {
    });
  }
}