
import { forkJoin as observableForkJoin, Observable } from 'rxjs';
import { StorageSelectionPopupComponent } from './../../shared/storage-selection-popup/storage-selection-popup.component';
import { StorageService } from './../../services/storage.service';
import { BikeIssuesComponent } from './../bike-issues/bike-issues.component';
import { BikeWorkHistoryComponent } from './../bike-work-history/bike-work-history.component';
import { RepairRegisterFormPopupComponent } from './repair-register-form-popup/repair-register-form-popup.component';
import { BikeLockPipe } from './../../core/pipes/lock-state-pipe';
import { BikeModePipe } from './../../core/pipes/bike-modes.pipe';
import { BikeModes } from './../../core/enums/bikeModes';
import { AlertDialogComponent } from './../../shared/alert-dialog/alert-dialog.component';
import { BikeDisableState } from './../../core/enums/bikeDisableState';
import { Component, OnInit, ChangeDetectorRef, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { BikesService, LoggerService, IssueService, RepairService } from '../../services';
import { Bike, BikeAddress } from '../../core/models';
import { NgxSpinnerService } from 'ngx-spinner';
import { ReportErrorComponent } from '../bike-support/report-error/report-error.component';
import { MatDialog } from '@angular/material/dialog';
import { TranslateService, LangChangeEvent } from '@ngx-translate/core';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';
import { WorkshopService } from '../../services/workshop.service';
import { WorkshopSelectionPopupComponent } from '../../shared/workshop-selection-popup/workshop-selection-popup.component';
import { DeliverWorkshopPopupComponent } from '../../shared/deliver-workshop-popup/deliver-workshop-popup.component';
import 'moment-timezone';
import { RepairOrdersService } from '../../services/repair-orders.service';
import * as moment from 'moment';
import { ConvertTimePipe } from '../../core/pipes/convert-time.pipe';
import { UserService } from '../../services/users.service';
import { LocalStorageKeys } from '../../core/constants';
import { UserRoles } from '../../core/constants/user-roles';

@Component({
  selector: 'app-bike-details',
  templateUrl: './bike-details.component.html',
  styleUrls: ['./bike-details.component.scss'],
  providers: [ConvertTimePipe]
})
export class BikeDetailsComponent implements OnInit {
  // @ViewChild(BikeRepairHistoryComponent) private _bikeRepairHistory: BikeRepairHistoryComponent;
  @ViewChild(BikeWorkHistoryComponent, { static: false }) private _bikeWorkshopHistory: BikeWorkHistoryComponent;
  @ViewChild(BikeIssuesComponent, { static: false }) private _bikeIssues: BikeIssuesComponent;
  bikeId = 0;
  bike: Bike;
  isEditable = false;
  isDisabled = false;
  selected = "-1";
  bikeCurrentDisabledState: any;
  bikeSession: any;
  errorCategories: any[];
  group1: any[];
  group2: any[];
  group3: any[];
  IsTransportOrderOrRepairExist: boolean = false;

  allWorkshops: any;
  allNearbyWorkshops: any[];
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
  allStorages: any[];
  isBikeInCarOrWorkshopOrStorage: boolean;
  subtractDurationInSec: number = 0;
  onGoingSessions: any[];
  isLoaded: boolean;
  userWorkshopId: any;
  repairHistory: any;
  workOrientedList: any[];
  otherWorkOrientedList: any[];
  partOrientedList: any[];
  otherPartList: any[];
  repairHistoryData: any;
  comments: any;
  hoursSpent: any;
  minutesSpent: any;
  dateFinished: any;
  isActiveRepairExist: boolean;
  isAdmin: boolean;
  isStreetTeam: boolean;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private bikesService: BikesService,
    private loggerService: LoggerService,
    private spinner: NgxSpinnerService,
    private dialog: MatDialog,
    private translate: TranslateService,
    private issueService: IssueService,
    private workshopService: WorkshopService,
    private repairOrderService: RepairOrdersService,
    private cdr: ChangeDetectorRef,
    private bikeModePipe: BikeModePipe,
    private bikeLockPipe: BikeLockPipe,
    private repairService: RepairService,
    private storageService: StorageService,
    private convertTime: ConvertTimePipe,
    private userService: UserService) {

    this.bikeId = route.snapshot.params['id'];
    this.group1 = [];
    this.group2 = [];
    this.group3 = [];
    this.IsTransportOrderOrRepairExist = false;
    this.allWorkshops = [];
    this.allStorages = [];
    this.driveTrain = [];
    this.light = [];
    this.dockingComponents = [];
    this.pedalArm = [];
    this.seat = [];
    this.cables = [];
    this.mudguards = [];
    this.handlebarComponents = [];
    this.pcb = [];
    this.brakeSystem = [];
    this.wheels = [];
    this.otherComponents = [];
    this.isActiveRepairExist = true;
    this.isAdmin = false;
  }

  ngOnInit() {
    this.workOrientedList = [];
    this.otherWorkOrientedList = [];
    this.repairHistory = [];
    this.getLoggedInUserDetails();
    this.getBikeDetails();
    this.loadErrorCategories();
    //this.getBikeWorkshopHistory();
    this.translate.onLangChange.subscribe((params: LangChangeEvent) => {
      this.translateAllCategories();
      this.ReloadLangChanges();
    });

    /**Workshop popup related */
    this.GetAllWorkshops();

    this.getAllStorages();
    this.loadRepairCategories();
  }

  getLoggedInUserDetails() {
    var authToken = JSON.parse(localStorage.getItem(LocalStorageKeys.OAUTH_TOKEN));
    if (authToken._claims) {
      var loggedInUser = JSON.parse(localStorage.getItem(LocalStorageKeys.USER_DETAILS));
      if (loggedInUser != null) {
        var userId = loggedInUser.UserId;
        var userRole = authToken._claims[0];
        this.isAdmin = userRole == UserRoles.ADMIN;
        this.isStreetTeam = userRole == UserRoles.STREET_TEAM;
        if (userRole == UserRoles.STREET_TEAM) {
          this.getUserPrivilegeDetails(userId);
        }
      }
    }
  }

  getUserPrivilegeDetails(userId) {
    this.userService.getUserPrivilegeByUser(userId).subscribe(res => {
      this.userWorkshopId = res["WorkshopId"];
    }, err => {

    });
  }

  //Reload full page with its underlying components
  reloadComponent() {
    let currentUrl = this.router.url;
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;
    this.router.onSameUrlNavigation = 'reload';
    this.router.navigate([currentUrl], { state: { clearCommands: true } });
  }

  private ReloadLangChanges() {
    // this logic has been done to make the translation change affect to the view
    let bike = this.bike;
    this.bike = null;
    setTimeout(() => {
      this.bike = bike;
      if (this.bike)
        this.setBikeModeText();
    });
  }

  ngAfterViewChecked() {
    // used to manually apply changes to view
    this.cdr.detectChanges();
  }

  /**Start - Workshop related section */

  GetAllWorkshops() {
    this.allWorkshops = [];
    this.workshopService.GetAllWorkshops().subscribe(res => {
      if (res) {
        this.allWorkshops = res;
      }
    });
  }
  /**End - Workshop related section */

  CreateRepairOrder(bikeId) {
    this.repairOrderService.createRepairOrder(bikeId).subscribe(result => {
      this.reloadComponent();
      this.loggerService.showSuccessfulMessage("Bike disable state successfully changed.");
    });
  }

  UpdateBikeWorkshop(bikeId, workshopId) {
    let workshopDet = { "BikeId": bikeId, "WorkshopId": workshopId };
    this.bikesService.UpdateBikeWorkshop(workshopDet).subscribe(res => {
      this.reloadComponent();
    });
  }
  /**End - Workshop related section */

  getBikeDetails() {
    this.isLoaded = false;
    this.spinner.show();
    this.isBikeInCarOrWorkshopOrStorage = false;
    this.bikesService.getBikeDetails(this.bikeId).subscribe(data => {
      setTimeout(() => this.loadMainBikeDetails(data), 1500);
    }, error => {
      if (error.status == 403) {
        this.loggerService.showErrorMessage("Don't have permission to obtain data");
      } else {
        this.loggerService.showErrorMessage("Getting bike details failed!");
      }
    });
    this.spinner.hide();
  }

  updateAddress(data: BikeAddress): void {
    let index = this.bike.Address = data.Address;
  }

  loadMainBikeDetails(data) {
    this.bike = data;
    let observables = null;
    if (this.bike["Disabled"] &&
      (this.bike['DisabledReason'] == BikeDisableState.InWorkshop ||
        this.bike['DisabledReason'] == BikeDisableState.ToWorkshop ||
        this.bike['DisabledReason'] == BikeDisableState.Moving ||
        this.bike['DisabledReason'] == BikeDisableState.InStorage)) {
      this.isBikeInCarOrWorkshopOrStorage = true;
      observables = observableForkJoin([
        this.bikesService.getBikeSessionByBikeId(this.bikeId, true),
        this.bikesService.getWorkshopOrCarOrStorageLocation(this.bikeId),
        this.issueService.GetActiveCriticalIssueCountPerBike(this.bikeId),
        this.issueService.GetAllActiveIssueCountPerBike(this.bikeId),
        this.repairService.getBikeWorkshopHistory(this.bikeId)
      ]);
    }
    else {
      this.isBikeInCarOrWorkshopOrStorage = false;
      observables = observableForkJoin([
        this.bikesService.getBikeSessionByBikeId(this.bikeId, true),
        this.issueService.GetActiveCriticalIssueCountPerBike(this.bikeId),
        this.issueService.GetAllActiveIssueCountPerBike(this.bikeId),
        this.repairService.getBikeWorkshopHistory(this.bikeId)
      ]);
    }
    observables.subscribe(res => {
      let locationInfo = (this.isBikeInCarOrWorkshopOrStorage) ? res[1] : undefined;
      if (locationInfo) {
        this.bike["Address"] = locationInfo["Address"];
        this.bike["Address"]["DisplayText"] = locationInfo["DisplayText"];
        this.bike["LocationName"] = locationInfo["Name"];
      }
      this.bike["AllActiveIssueCount"] = (this.isBikeInCarOrWorkshopOrStorage) ? res[3] : res[2];
      if (parseInt(this.bike["BikeModeId"]) == BikeModes.AvailableDocked ||
        parseInt(this.bike["BikeModeId"]) == BikeModes.AvailableFree ||
        parseInt(this.bike["BikeModeId"]) == BikeModes.InUseInSession ||
        parseInt(this.bike["BikeModeId"]) == BikeModes.InUsePassiveSession) {
        if (this.bike["AllActiveIssueCount"] && this.bike["AllActiveIssueCount"] > 0)
          this.bike["BikeModeId"] = "30";
        else
          this.bike["BikeModeId"] = "31";
      }

      this.setBikeModeText();

      this.bike["CriticalIssueCount"] = (this.isBikeInCarOrWorkshopOrStorage) ? res[2] : res[1];
      this.bikeSession = res[0];
      this.onGoingSessions = res[0]; //send details to child component
      this.bikeCurrentDisabledState = this.bike['DisabledReason'];
      this.bike.SessionStartTime = res[0] != null ? res[0]["StartTime"] : '';
      this.isDisabled = (this.bike['Disabled'] == false) ? true : false;
      this.selected = (this.bike['DisabledReason'] != null) ? this.bike['DisabledReason'].toString() : "-1";

      let now = moment(this.convertTime.transform(moment().utc().format()));
      let gracePeriodEnd = moment(this.convertTime.transform(this.bike["GracePeriod"]));
      let isGracePeriodExpired = now.isBefore(gracePeriodEnd);
      this.bike["isGracePeriodExpired"] = isGracePeriodExpired;
      if (isGracePeriodExpired) {
        // this.bike["GracePeriodStart"] = this.mapGracePeriodStartDate(this.bike["GracePeriodStartDate"]);
        // this.bike["GracePeriodEnd"] = this.mapGracePeriodEndDate(this.bike["GracePeriod"]);
        this.bike["GracePeriodStart"] = this.bike["GracePeriodStartDate"];
        this.bike["GracePeriodEnd"] = this.bike["GracePeriod"];
        if (this.bike["UndockFailureCount"] == 1)
          this.subtractDurationInSec = 30;
      }

      let repairHistory = (this.isBikeInCarOrWorkshopOrStorage) ? res[4] : res[3];
      if (repairHistory.some(x => !x.IsCompleted && x.WorkshopId == this.bike.WorkshopId))
        this.isActiveRepairExist = true;
      else
        this.isActiveRepairExist = false;

      this.isLoaded = true;
    }, error => {
      this.isLoaded = true;
      if (error.status == 403) {
        this.loggerService.showErrorMessage("Don't have permission to obtain data");
      } else {
        this.loggerService.showErrorMessage("Getting bike active session failed!");
      }
    });
  }

  navigateToBikeSupportPage(visualId) {
    this.router.navigateByUrl('bikes/support?visualId=' + visualId);
  }

  formatTimeDuration(timeStamp) {
    if (timeStamp !== null) {
      var ts = new Date().getTime() - new Date(timeStamp).getTime();

      var diffDays = Math.abs(Math.round(ts / (1000 * 3600 * 24)));
      var diffHours = Math.abs(Math.round(ts / (1000 * 3600)));
      var diffMinutes = Math.abs(Math.round(ts / (1000 * 60)));
      var diffSeconds = Math.abs(Math.round(ts / (1000)));

      if (diffDays > 1) {
        return diffDays + this.translate.instant("BIKE.DAYS_AGO")
      }
      else if (diffHours > 1) {
        if (diffHours >= 24 && diffDays == 1) {
          return diffDays + this.translate.instant("BIKE.DAY_AGO");
        } else {
          return diffHours + this.translate.instant("BIKE.HOURS_AGO");
        }
      }
      else if (diffMinutes > 1) {
        if (diffMinutes >= 60 && diffHours == 1) {
          return diffHours + this.translate.instant("BIKE.HOUR_AGO");
        } else {
          return diffMinutes + this.translate.instant("BIKE.MINUTES_AGO");
        }
      }
      else {
        if (diffSeconds >= 60 && diffMinutes == 1) {
          return diffMinutes + this.translate.instant("BIKE.MINUTE_AGO");
        } else {
          return diffSeconds + this.translate.instant("BIKE.SECONDS_AGO");
        }
      }
    } else {
      return "Never";
    }
  }

  getBikeValues(bike) {
    if (bike && bike.state) {
      this.bike.BikeState = bike.state;
    }
    else if (bike && bike.battery) {
      this.bike.ChargeLevel = bike.battery
    }
    else if (bike && bike.position) {
      this.bike.Position = bike.position
    }
  }
  onActiveStateChange(event) {
    if (!this.isDisabled) {
      if (this.bike["CriticalIssueCount"] > 0) {
        const dialogRefAlert = this.dialog.open(AlertDialogComponent, {
          minWidth: '350px',
          data: { "message": "BIKE_DETAILS.DATA.ALERT_OK_MSG" }
        });

        dialogRefAlert.afterClosed().subscribe(result => {
          event.source.checked = false;
        });
      }
      else {
        const dialogRef = this.dialog.open(ConfirmDialogComponent, {
          minWidth: '350px',
          data: { "message": "BIKE_DETAILS.DATA.CONFIRM_ENABLE" }
        });

        dialogRef.afterClosed().subscribe(result => {
          if (result) {
            this.isDisabled = !this.isDisabled;
            if (this.isDisabled) {
              this.selected = "-1";
              //active bike and set state to null
              var bikeStateChangeDTO = { Disabled: false, DisabledReason: null };
              this.bikesService.enableDisableBike(this.bikeId, bikeStateChangeDTO)
                .subscribe(data => {
                  this.reloadComponent();
                  this.loggerService.showSuccessfulMessage("Bike disable state successfully changed.");
                }, error => {
                  this.loggerService.showErrorMessage(error.error);
                });
            }
          } else {
            event.source.checked = false;
          }

        });
      }
    }
    else {
      this.isDisabled = !this.isDisabled;
      if (this.isDisabled) {
        this.selected = "-1";
        //active bike and set state to null
        var bikeStateChangeDTO = { Disabled: false, DisabledReason: null };
        this.bikesService.enableDisableBike(this.bikeId, bikeStateChangeDTO)
          .subscribe(data => {
            this.reloadComponent();
            this.loggerService.showSuccessfulMessage("Bike disable state successfully changed.");
          }, error => {
            this.loggerService.showErrorMessage(error.error);
          });
      }
    }
  }

  onDisableStateChange(event) {
    if (this.selected != "-1") {
      if (!this.bike.SessionId) {
        this.bikesService.getBikeDisabledStateAndReason(this.bike.BikeId).subscribe(data => {
          var currentState = data.DisabledReason;
          if (currentState >= this.selected && !this.IsSamePriority(parseInt(this.selected))) {
            this.loggerService.showErrorMessage("Cannot select a previous bike state.");
          } else {
            if (this.selected == "22" || this.selected == "25") {
              this.createReportError(event);
            } else if (this.selected == "2") {
              this.handleWorkshopSelected(event);
            }
            else if (this.selected == "4") {
              this.handleStorageSelected(event);
            }
            else {
              //save disble and state change in DB
              var bikeStateChangeDTO = { Disabled: true, DisabledReason: this.selected };
              this.bikesService.enableDisableBike(this.bikeId, bikeStateChangeDTO)
                .subscribe(data => {
                  this.reloadComponent();
                  if (this.selected == "3") {
                    this.resolveIssuePerBike(this.bikeId);
                  }
                  this.loggerService.showSuccessfulMessage("Bike disable state successfully changed.");
                }, error => {
                  this.loggerService.showErrorMessage(error.error.Message);
                });
            }
          }
        });
      }
    }
  }

  handleWorkshopSelected(event) {
    const dialogWorkshop = this.dialog.open(WorkshopSelectionPopupComponent, {
      width: '400px',
      height: '250px',
      data: {
        allWorkshops: this.allWorkshops,
        allNearbyWorkshops: this.allWorkshops,
        bikeId: this.bike.BikeId,
        bike: this.bike,
        userName: ""
      },
      disableClose: true
    });
    dialogWorkshop.afterClosed().subscribe(wsre => {
      if (wsre) {
        const dialogRe = this.dialog.open(DeliverWorkshopPopupComponent, {
          width: '400px',
          height: '250px',
          data: { bikeId: this.bike.BikeId, bike: this.bike, userName: "" }
        });

        dialogRe.afterClosed().subscribe(re => {
          var bikeStateChangeDTO = { Disabled: true, DisabledReason: this.selected };
          this.bikesService.enableDisableBike(this.bikeId, bikeStateChangeDTO)
            .subscribe(data => {
              //this.CreateRepairOrder(this.bikeId);
              //update undock command history with workshop Id and bike disabled state
              this.updateUndockCommandHistory(this.bikeId, this.selected, wsre.selectedWorkshopId, true);
              this.UpdateBikeWorkshop(this.bikeId, wsre.selectedWorkshopId);
              this.loggerService.showSuccessfulMessage("Bike disable state successfully changed.");
            });
        });
      }
      else {
        event.source.checked = true;
        this.isDisabled = !this.isDisabled;
        this.selected = "-1";
      }
    });
  }

  loadErrorCategories() {
    this.issueService.GetErrorCategories().subscribe(data => {
      this.group1 = data.group1;
      this.group2 = data.group2;
      this.group3 = data.group3;
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
    this.translate.get(parentLabel).subscribe(parentName => {
      parent.DisplayName = (parentName != parentLabel) ? parentName : parent.Name;
      let subCategory = parent.SubCategory;
      for (let i = 0; i < subCategory.length; i++) {
        let childName = "REPORT_ERROR." + subCategory[i].Name.toUpperCase();
        this.translate.get(childName).subscribe(subName => {
          subCategory[i].DisplayName = (subName != childName) ? subName : subCategory[i].Name;
        });
      }
    });
  }

  clearSelectedErrorCategories() {
    this.group1.map(x => this.resetSubCategories(x));
    this.group2.map(x => this.resetSubCategories(x));
    this.group3.map(x => this.resetSubCategories(x));
  }

  translateAllCategories() {
    this.group1.map(x => this.translateCategories(x));
    this.group2.map(x => this.translateCategories(x));
    this.group3.map(x => this.translateCategories(x));
  }

  createReportError(event) {
    const dialogRef = this.dialog.open(ReportErrorComponent, {
      width: '1100px',
      height: '780px',
      data: { 'group1': this.group1, 'group2': this.group2, 'group3': this.group3, 'bikeId': this.bikeId, 'sessionId': this.bike.SessionId, 'bikeLocked': false }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        //save disble and state change in DB
        var bikeStateChangeDTO = { Disabled: true, DisabledReason: this.selected };
        this.bikesService.enableDisableBike(this.bikeId, bikeStateChangeDTO)
          .subscribe(data => {
            this.reloadComponent();
            this.loggerService.showSuccessfulMessage("Bike disable state successfully changed.");
            let selectedErrorCategories = result["selectedErrorCategories"];
            if (this.selected == "25" && this.bike["DockingPointId"]
              && selectedErrorCategories.some(x => x.Id == 215)) {
              this.disableDockingPoint();
            }
          }, error => {
            this.loggerService.showErrorMessage(error.error.Message);
          });
      }
      else {
        event.source.checked = true;
        this.isDisabled = !this.isDisabled;
        this.selected = "-1";
      }
    });
    this.clearSelectedErrorCategories();
  }

  IsSamePriority(bikeState) {
    let isAllowed = false;
    if ((bikeState == BikeDisableState.InWorkshop) || (bikeState == BikeDisableState.RepairFinished)
      || (bikeState == BikeDisableState.ToWorkshop) || (bikeState == BikeDisableState.Missing)
      || (bikeState == BikeDisableState.InStorage) || (bikeState == BikeDisableState.Testing)
      || (bikeState == BikeDisableState.Moving) || (bikeState == BikeDisableState.CheckRequired))
      isAllowed = true;
    return isAllowed;
  }

  setBikeModeText() {
    this.bike["BikeModeExtended"] = this.bikeModePipe.transform(parseInt(this.bike["BikeModeId"]))
      + " - " + this.bikeLockPipe.transform(this.bike["LockState"]);
  }

  openRepairRegisterForm() {
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
        'isUpdate': false,
        'dateFinished': this.dateFinished,
        'isStreetTeam': this.isStreetTeam,
        'userWorkshopId': this.userWorkshopId,
        'isBikeDetailsPage': true
      },
      autoFocus: false
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // this._bikeRepairHistory.getBikeHistory();
        this._bikeWorkshopHistory.getBikeWorkshopHistory();
        if (result["isSuccess"] && !result["isSaved"]) {
          this.isActiveRepairExist = false;
          var bikeStateChangeDTO = { Disabled: true, DisabledReason: BikeDisableState.RepairFinished };
          this.updateBikeDisableState(bikeStateChangeDTO);
          this.resolveIssuePerBike(this.bike.BikeId);
          this.closeAllActiveRepairsForBike(this.bike.BikeId);
        }
        else if (result["isSaved"]) {
          this.isActiveRepairExist = true;
        }
        // //load bike workshop history after save or submit
        // this.getBikeWorkshopHistory();

        //bike service details update
        var bikeServiceDTO = { NumberOfChecks: 0, BikeId: this.bike.BikeId };
        this.updateBikeService(bikeServiceDTO);

        // //reset unsuccessful session count when repair is done
        // this.resetUndockFailureCountByBike();

        this.clearWorkshopRepairCategories();
      }
      else {
        this.clearWorkshopRepairCategories();
      }
    });
  }

  loadRepairCategories() {
    this.repairService.GetAllWorkshopCategories().subscribe(data => {
      this.driveTrain = data.driveTrain;
      this.light = data.light;
      this.dockingComponents = data.dockingComponents;
      this.pedalArm = data.pedalArm;
      this.seat = data.seat;
      this.cables = data.cables;
      this.mudguards = data.mudguards;
      this.handlebarComponents = data.handlebarComponents;
      this.pcb = data.pcb;
      this.brakeSystem = data.brakeSystem;
      this.wheels = data.wheels;
      this.otherComponents = data.otherComponents;
    }, error => {
      this.loggerService.showErrorMessage(error);
    });
  }

  clearWorkshopRepairCategories() {
    this.driveTrain.map(x => this.resetWorkshopRepairCategories(x));
    this.light.map(x => this.resetWorkshopRepairCategories(x));
    this.dockingComponents.map(x => this.resetWorkshopRepairCategories(x));
    this.pedalArm.map(x => this.resetWorkshopRepairCategories(x));
    this.seat.map(x => this.resetWorkshopRepairCategories(x));
    this.cables.map(x => this.resetWorkshopRepairCategories(x));
    this.mudguards.map(x => this.resetWorkshopRepairCategories(x));
    this.handlebarComponents.map(x => this.resetWorkshopRepairCategories(x));
    this.pcb.map(x => this.resetWorkshopRepairCategories(x));
    this.brakeSystem.map(x => this.resetWorkshopRepairCategories(x));
    this.wheels.map(x => this.resetWorkshopRepairCategories(x));
    this.otherComponents.map(x => this.resetWorkshopRepairCategories(x));
  }

  resetWorkshopRepairCategories(data) {
    data.Result = false;
    data.selectedVariant = null
    return;
  }

  updateBikeDisableState(bikeStateChangeDTO) {
    this.bikesService.enableDisableBike(this.bikeId, bikeStateChangeDTO)
      .subscribe(data => {
        this.getBikeDetails();
      });
  }

  resolveIssuePerBike(bikeId) {
    this.issueService.ResolveIssuePerBike(bikeId).subscribe(result => {
      if (result > 0) {
        this._bikeIssues.ngOnInit();
      }
    });
  }

  closeAllActiveRepairsForBike(bikeId) {
    this.repairService.closeAllActiveRepairsForBike(bikeId).subscribe(result => {
      if (result) {
        this._bikeWorkshopHistory.getBikeWorkshopHistory();
      }
    });
  }

  getBikeWorkshopHistory(): void {
    this.repairHistoryData = null;
    this.repairService.getBikeWorkshopHistory(this.bikeId).subscribe(
      data => {
        this.repairHistory = data;
        this.arrangePartDetails();
      }, error => {
        this.loggerService.showErrorMessage(error);
      });
  }

  arrangePartDetails() {
    this.repairHistory = this.repairHistory.filter(x => !x.IsCompleted && x.WorkshopId == this.bike.WorkshopId);
    this.repairHistory.forEach((repairHis) => {
      this.workOrientedList = [];
      this.otherWorkOrientedList = [];
      repairHis.WorkEventDetailsDTOs.forEach(workEvent => {
        this.partOrientedList = [];
        this.otherPartList = [];
        if (workEvent.Part.PartId > 0) {
          let partOrientedObj = {
            'PartId': workEvent.Part.PartId,
            'PartName': workEvent.Part.PartName,
            'IsNewPart': workEvent.IsNewPart,
            'VariantName': workEvent.Variant.VariantName,
            'VariantId': workEvent.Variant.VariantId,
            'HasWarranty': workEvent.HasWarranty
          }
          this.partOrientedList.push(partOrientedObj);

          let isWorkExist = (workEvent.WorkCategory) ? this.workOrientedList.find(x => x.WorkCategoryType == workEvent.WorkCategory.WorkCategoryType) : null;
          if (isWorkExist) {
            isWorkExist["PartOrientedList"] = isWorkExist["PartOrientedList"].concat(this.partOrientedList);
          }
          else {
            let workTypeObj = {
              'WorkCategoryType': (workEvent.WorkCategory) ? workEvent.WorkCategory.WorkCategoryType : null,
              'PartOrientedList': this.partOrientedList,
              'WorkCategoryImageURL': (workEvent.WorkCategory) ? workEvent.WorkCategory.WorkCategoryImageURL : null,
              'WorkCategorySubType': (workEvent.WorkCategory) ? workEvent.WorkCategory.WorkCategorySubType : null,
              'WorkCategorySubTypeName': (workEvent.WorkCategory) ? workEvent.WorkCategory.WorkCategorySubTypeName : null,
              'SubTranslationName': (workEvent.WorkCategory) ? workEvent.WorkCategory.SubTranslationName : null,
            }
            this.workOrientedList.push(workTypeObj);
          }
        }
        else if (workEvent.Part.PartId == 0 && (repairHis.IsStreetTeam || (!repairHis.IsStreetTeam && workEvent.Reason.ReasonId != 18))) {
          let otherPartObj = {
            'WorkCategorySubType': (!repairHis.IsStreetTeam && workEvent.WorkCategory) ?
              workEvent.WorkCategory.WorkCategorySubType : (repairHis.IsStreetTeam && workEvent.Reason) ?
                workEvent.Reason.Description : null,
            'WorkCategorySubTypeName': (!repairHis.IsStreetTeam && workEvent.WorkCategory) ?
              workEvent.WorkCategory.WorkCategorySubTypeName : (repairHis.IsStreetTeam && workEvent.Reason) ?
                workEvent.Reason.Description : null,
            'SubTranslationName': (!repairHis.IsStreetTeam && workEvent.WorkCategory) ?
              workEvent.WorkCategory.SubTranslationName : (repairHis.IsStreetTeam && workEvent.Reason) ?
                workEvent.Reason.Description : null
          }
          this.otherPartList.push(otherPartObj);

          let isWorkExist = (workEvent.WorkCategory) ? this.otherWorkOrientedList.find(x => x.WorkCategoryType == workEvent.WorkCategory.WorkCategoryType) : null;
          if (isWorkExist) {
            isWorkExist["OtherPartList"] = isWorkExist["OtherPartList"].concat(this.otherPartList);
          }
          else {
            let workTypeObj = {
              'WorkCategoryType': (workEvent.WorkCategory) ? workEvent.WorkCategory.WorkCategoryType : null,
              'OtherPartList': this.otherPartList,
              'WorkCategoryImageURL': (workEvent.WorkCategory) ? workEvent.WorkCategory.WorkCategoryImageURL : null
            }
            this.otherWorkOrientedList.push(workTypeObj);
          }
        }
      });

      let bike = {
        "WorkshopId": repairHis.WorkshopId,
        "AccumulateTotalDistance": repairHis.AccumulateTotalDistance
      };

      this.repairHistoryData = {
        'workOrientedList': this.workOrientedList,
        'otherWorkOrientedList': this.otherWorkOrientedList,
        'dateStarted': repairHis.RepairStartedAt,
        'dateFinished': repairHis.DateFinished,
        'bikeId': repairHis.BikeId,
        'comments': repairHis.Comments,
        'fixedBy': repairHis.FixedBy,
        'hoursSpent': repairHis.HoursSpent,
        'minutesSpent': repairHis.MinutesSpent,
        'visualId': repairHis.VisualId,
        'workshopId': repairHis.WorkshopId,
        'workshopName': (!repairHis.IsStreetTeam) ? repairHis.WorkshopName : "Street Team",
        'isStreetTeam': repairHis.IsStreetTeam,
        'isUpdated': repairHis.IsUpdated,
        'accumulateTotalDistance': repairHis.AccumulateTotalDistance,
        'bike': bike
      }
    });
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
        this.driveTrain[index]["Result"] = true;
        this.driveTrain[index]["IsNewPart"] = part["IsNewPart"];
        this.driveTrain[index]["HasWarranty"] = part["HasWarranty"];
        if (this.driveTrain[index]["IsNewPart"])
          this.driveTrain[index]["selectedVariant"] = part["VariantId"];
      }
      else {
        let nonPartObj = this.driveTrain.find(x => x.Id == part.WorkCategorySubType && x.ParentId == workOriented["WorkCategoryType"]);
        if (nonPartObj) {
          let index = this.driveTrain.findIndex(x => x.Id == part.WorkCategorySubType && x.ParentId == workOriented["WorkCategoryType"]);
          this.driveTrain[index]["Result"] = true;
          this.driveTrain[index]["IsNewPart"] = false;
        }
      }
    }
    else if (workOriented["WorkCategoryType"] == 2) {
      let partObj = this.light.find(x => x.PartId && x.PartId == part.PartId);
      if (partObj) {
        let index = this.light.findIndex(x => x.PartId == part.PartId);
        this.light[index]["Result"] = true;
        this.light[index]["IsNewPart"] = part["IsNewPart"];
        this.light[index]["HasWarranty"] = part["HasWarranty"];
        if (this.light[index]["IsNewPart"])
          this.light[index]["selectedVariant"] = part["VariantId"];
      }
      else {
        let nonPartObj = this.light.find(x => x.Id == part.WorkCategorySubType && x.ParentId == workOriented["WorkCategoryType"]);
        if (nonPartObj) {
          let index = this.light.findIndex(x => x.Id == part.WorkCategorySubType && x.ParentId == workOriented["WorkCategoryType"]);
          this.light[index]["Result"] = true;
          this.light[index]["IsNewPart"] = false;
        }
      }
    }
    else if (workOriented["WorkCategoryType"] == 3) {
      let partObj = this.dockingComponents.find(x => x.PartId && x.PartId == part.PartId);
      if (partObj) {
        let index = this.dockingComponents.findIndex(x => x.PartId == part.PartId);
        this.dockingComponents[index]["Result"] = true;
        this.dockingComponents[index]["IsNewPart"] = part["IsNewPart"];
        this.dockingComponents[index]["HasWarranty"] = part["HasWarranty"];
        if (this.dockingComponents[index]["IsNewPart"])
          this.dockingComponents[index]["selectedVariant"] = part["VariantId"];
      }
      else {
        let nonPartObj = this.dockingComponents.find(x => x.Id == part.WorkCategorySubType && x.ParentId == workOriented["WorkCategoryType"]);
        if (nonPartObj) {
          let index = this.dockingComponents.findIndex(x => x.Id == part.WorkCategorySubType && x.ParentId == workOriented["WorkCategoryType"]);
          this.dockingComponents[index]["Result"] = true;
          this.dockingComponents[index]["IsNewPart"] = false;
        }
      }
    }
    else if (workOriented["WorkCategoryType"] == 4) {
      let partObj = this.pedalArm.find(x => x.PartId && x.PartId == part.PartId);
      if (partObj) {
        let index = this.pedalArm.findIndex(x => x.PartId == part.PartId);
        this.pedalArm[index]["Result"] = true;
        this.pedalArm[index]["IsNewPart"] = part["IsNewPart"];
        this.pedalArm[index]["HasWarranty"] = part["HasWarranty"];
        if (this.pedalArm[index]["IsNewPart"])
          this.pedalArm[index]["selectedVariant"] = part["VariantId"];
      }
      else {
        let nonPartObj = this.pedalArm.find(x => x.Id == part.WorkCategorySubType && x.ParentId == workOriented["WorkCategoryType"]);
        if (nonPartObj) {
          let index = this.pedalArm.findIndex(x => x.Id == part.WorkCategorySubType && x.ParentId == workOriented["WorkCategoryType"]);
          this.pedalArm[index]["Result"] = true;
          this.pedalArm[index]["IsNewPart"] = false;
        }
      }
    }
    else if (workOriented["WorkCategoryType"] == 5) {
      let partObj = this.seat.find(x => x.PartId && x.PartId == part.PartId);
      if (partObj) {
        let index = this.seat.findIndex(x => x.PartId == part.PartId);
        this.seat[index]["Result"] = true;
        this.seat[index]["IsNewPart"] = part["IsNewPart"];
        this.seat[index]["HasWarranty"] = part["HasWarranty"];
        if (this.seat[index]["IsNewPart"])
          this.seat[index]["selectedVariant"] = part["VariantId"];
      }
      else {
        let nonPartObj = this.seat.find(x => x.Id == part.WorkCategorySubType && x.ParentId == workOriented["WorkCategoryType"]);
        if (nonPartObj) {
          let index = this.seat.findIndex(x => x.Id == part.WorkCategorySubType && x.ParentId == workOriented["WorkCategoryType"]);
          this.seat[index]["Result"] = true;
          this.seat[index]["IsNewPart"] = false;
        }
      }
    }
    else if (workOriented["WorkCategoryType"] == 6) {
      let partObj = this.cables.find(x => x.PartId && x.PartId == part.PartId);
      if (partObj) {
        let index = this.cables.findIndex(x => x.PartId == part.PartId);
        this.cables[index]["Result"] = true;
        this.cables[index]["IsNewPart"] = part["IsNewPart"];
        this.cables[index]["HasWarranty"] = part["HasWarranty"];
        if (this.cables[index]["IsNewPart"])
          this.cables[index]["selectedVariant"] = part["VariantId"];
      }
      else {
        let nonPartObj = this.cables.find(x => x.Id == part.WorkCategorySubType && x.ParentId == workOriented["WorkCategoryType"]);
        if (nonPartObj) {
          let index = this.cables.findIndex(x => x.Id == part.WorkCategorySubType && x.ParentId == workOriented["WorkCategoryType"]);
          this.cables[index]["Result"] = true;
          this.cables[index]["IsNewPart"] = false;
        }
      }
    }
    else if (workOriented["WorkCategoryType"] == 7) {
      let partObj = this.mudguards.find(x => x.PartId && x.PartId == part.PartId);
      if (partObj) {
        let index = this.mudguards.findIndex(x => x.PartId == part.PartId);
        this.mudguards[index]["Result"] = true;
        this.mudguards[index]["IsNewPart"] = part["IsNewPart"];
        this.mudguards[index]["HasWarranty"] = part["HasWarranty"];
        if (this.mudguards[index]["IsNewPart"])
          this.mudguards[index]["selectedVariant"] = part["VariantId"];
      }
      else {
        let nonPartObj = this.mudguards.find(x => x.Id == part.WorkCategorySubType && x.ParentId == workOriented["WorkCategoryType"]);
        if (nonPartObj) {
          let index = this.mudguards.findIndex(x => x.Id == part.WorkCategorySubType && x.ParentId == workOriented["WorkCategoryType"]);
          this.mudguards[index]["Result"] = true;
          this.mudguards[index]["IsNewPart"] = false;
        }
      }
    }
    else if (workOriented["WorkCategoryType"] == 8) {
      let partObj = this.handlebarComponents.find(x => x.PartId && x.PartId == part.PartId);
      if (partObj) {
        let index = this.handlebarComponents.findIndex(x => x.PartId == part.PartId);
        this.handlebarComponents[index]["Result"] = true;
        this.handlebarComponents[index]["IsNewPart"] = part["IsNewPart"];
        this.handlebarComponents[index]["HasWarranty"] = part["HasWarranty"];
        if (this.handlebarComponents[index]["IsNewPart"])
          this.handlebarComponents[index]["selectedVariant"] = part["VariantId"];
      }
      else {
        let nonPartObj = this.handlebarComponents.find(x => x.Id == part.WorkCategorySubType && x.ParentId == workOriented["WorkCategoryType"]);
        if (nonPartObj) {
          let index = this.handlebarComponents.findIndex(x => x.Id == part.WorkCategorySubType && x.ParentId == workOriented["WorkCategoryType"]);
          this.handlebarComponents[index]["Result"] = true;
          this.handlebarComponents[index]["IsNewPart"] = false;
        }
      }
    }
    else if (workOriented["WorkCategoryType"] == 9) {
      let partObj = this.pcb.find(x => x.PartId && x.PartId == part.PartId);
      if (partObj) {
        let index = this.pcb.findIndex(x => x.PartId == part.PartId);
        this.pcb[index]["Result"] = true;
        this.pcb[index]["IsNewPart"] = part["IsNewPart"];
        this.pcb[index]["HasWarranty"] = part["HasWarranty"];
        if (this.pcb[index]["IsNewPart"])
          this.pcb[index]["selectedVariant"] = part["VariantId"];
      }
      else {
        let nonPartObj = this.pcb.find(x => x.Id == part.WorkCategorySubType && x.ParentId == workOriented["WorkCategoryType"]);
        if (nonPartObj) {
          let index = this.pcb.findIndex(x => x.Id == part.WorkCategorySubType && x.ParentId == workOriented["WorkCategoryType"]);
          this.pcb[index]["Result"] = true;
          this.pcb[index]["IsNewPart"] = false;
        }
      }
    }
    else if (workOriented["WorkCategoryType"] == 10) {
      let partObj = this.brakeSystem.find(x => x.PartId && x.PartId == part.PartId);
      if (partObj) {
        let index = this.brakeSystem.findIndex(x => x.PartId == part.PartId);
        this.brakeSystem[index]["Result"] = true;
        this.brakeSystem[index]["IsNewPart"] = part["IsNewPart"];
        this.brakeSystem[index]["HasWarranty"] = part["HasWarranty"];
        if (this.brakeSystem[index]["IsNewPart"])
          this.brakeSystem[index]["selectedVariant"] = part["VariantId"];
      }
      else {
        let nonPartObj = this.brakeSystem.find(x => x.Id == part.WorkCategorySubType && x.ParentId == workOriented["WorkCategoryType"]);
        if (nonPartObj) {
          let index = this.brakeSystem.findIndex(x => x.Id == part.WorkCategorySubType && x.ParentId == workOriented["WorkCategoryType"]);
          this.brakeSystem[index]["Result"] = true;
          this.brakeSystem[index]["IsNewPart"] = false;
        }
      }
    }
    else if (workOriented["WorkCategoryType"] == 11) {
      let partObj = this.wheels.find(x => x.PartId && x.PartId == part.PartId);
      if (partObj) {
        let index = this.wheels.findIndex(x => x.PartId == part.PartId);
        this.wheels[index]["Result"] = true;
        this.wheels[index]["IsNewPart"] = part["IsNewPart"];
        this.wheels[index]["HasWarranty"] = part["HasWarranty"];
        if (this.wheels[index]["IsNewPart"])
          this.wheels[index]["selectedVariant"] = part["VariantId"];
      }
      else {
        let nonPartObj = this.wheels.find(x => x.Id == part.WorkCategorySubType && x.ParentId == workOriented["WorkCategoryType"]);
        if (nonPartObj) {
          let index = this.wheels.findIndex(x => x.Id == part.WorkCategorySubType && x.ParentId == workOriented["WorkCategoryType"]);
          this.wheels[index]["Result"] = true;
          this.wheels[index]["IsNewPart"] = false;
        }
      }
    }
    else if (workOriented["WorkCategoryType"] == 12) {
      let partObj = this.otherComponents.find(x => x.PartId && x.PartId == part.PartId);
      if (partObj) {
        let index = this.otherComponents.findIndex(x => x.PartId == part.PartId);
        this.otherComponents[index]["Result"] = true;
        this.otherComponents[index]["IsNewPart"] = part["IsNewPart"];
        this.otherComponents[index]["HasWarranty"] = part["HasWarranty"];
        if (this.otherComponents[index]["IsNewPart"])
          this.otherComponents[index]["selectedVariant"] = part["VariantId"];
      }
      else {
        let nonPartObj = this.otherComponents.find(x => x.Id == part.WorkCategorySubType && x.ParentId == workOriented["WorkCategoryType"]);
        if (nonPartObj) {
          let index = this.otherComponents.findIndex(x => x.Id == part.WorkCategorySubType && x.ParentId == workOriented["WorkCategoryType"]);
          this.otherComponents[index]["Result"] = true;
          this.otherComponents[index]["IsNewPart"] = false;
        }
      }
    }
  }

  /**Start - Storage related section */

  handleStorageSelected(event) {
    const dialogStorage = this.dialog.open(StorageSelectionPopupComponent, {
      width: '400px',
      height: '250px',
      data: {
        allStorages: this.allStorages,
        bikeId: this.bike.BikeId,
        bike: this.bike,
        userName: ""
      },
      disableClose: true
    });
    dialogStorage.afterClosed().subscribe(wsre => {
      if (wsre) {
        var bikeStateChangeDTO = { Disabled: true, DisabledReason: this.selected };
        this.bikesService.enableDisableBike(this.bikeId, bikeStateChangeDTO)
          .subscribe(data => {
            this.updateBikeStorage(this.bikeId, wsre.selectedStorageId);
            //update undock command history with storage Id and bike disabled state
            this.updateUndockCommandHistory(this.bikeId, this.selected, wsre.selectedStorageId);
            this.loggerService.showSuccessfulMessage("Bike disable state successfully changed.");
          });
      }
      else {
        event.source.checked = true;
        this.isDisabled = !this.isDisabled;
        this.selected = "-1";
      }
    });
  }

  getAllStorages() {
    this.allStorages = [];
    this.storageService.getAllStorages().subscribe(res => {
      if (res) {
        this.allStorages = res;
      }
    });
  }

  updateBikeStorage(bikeId, storageId) {
    let storageDet = { "BikeId": bikeId, "StorageId": storageId };
    this.bikesService.updateBikeStorage(storageDet).subscribe(res => {
      this.reloadComponent();
    });
  }

  /**End - Storage related section */

  private mapGracePeriodStartDate(startGracePeriod) {
    let gracePeriodStart;
    if (this.bike["UndockFailureCount"] == 1)
      gracePeriodStart = moment(this.convertTime.transform(startGracePeriod)).subtract(30, 'seconds').format("HH:mm DD.MM");
    else
      gracePeriodStart = moment(this.convertTime.transform(startGracePeriod)).format("HH:mm DD/MM");
    return gracePeriodStart;
  }

  private mapGracePeriodEndDate(endGracePeriod) {
    let gracePeriodEnd = moment(this.convertTime.transform(endGracePeriod)).format("HH:mm DD/MM");
    return gracePeriodEnd;
  }

  updateUndockCommandHistory(bikeId, disabledState, bikeStoreId, isWorkshop = false) {
    let cmdHistoryDet: any;
    if (!isWorkshop)
      cmdHistoryDet = { BikeId: bikeId, DisabledState: disabledState, StorageId: bikeStoreId };
    else
      cmdHistoryDet = { BikeId: bikeId, DisabledState: disabledState, WorkshopId: bikeStoreId };
    this.bikesService.updateUndockCommandHistory(cmdHistoryDet).subscribe(res => {
    }, err => {

    });
  }

  ReloadBikeDetails(data: any): void {
    if (data && data.state) {
      this.getBikeDetails();
    }
  }

  updateBikeService(serviceDTO) {
    this.bikesService.CreateOrUpdateBikeService(this.bike.BikeId, serviceDTO)
      .subscribe(data => {
      }, error => {
      });
  }

  resetUndockFailureCountByBike() {
    this.bikesService.resetUndockFailureCountByBike(this.bike.BikeId)
      .subscribe(data => {
      }, error => {
      });
  }

  disableDockingPoint() {
    let dpErrorReportDto = {
      "ErrorCategoryIds": [2],
      "Comments": this.comments
    };
    dpErrorReportDto["DockingStationId"] = this.bike["DockingStationId"];
    dpErrorReportDto["DockingPointId"] = this.bike["DockingPointId"];
    this.createDPIssue(dpErrorReportDto);
  }

  createDPIssue(dpErrorReportDto: any) {
    this.issueService.createDPIssue(dpErrorReportDto).subscribe(res => {

    }, err => {
    });
  }
}
