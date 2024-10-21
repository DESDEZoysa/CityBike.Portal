import { CommonService } from './../../services/common-service';
import { IssueService } from './../../services/issue.service';
import { SessionsService } from './../../services/sessions.service';
import { Component, OnInit, Inject, ViewEncapsulation } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { BikeDisableState } from '../../core/enums/bikeDisableState';
import { BikeStatus } from '../../core/enums/bikeStatus';
import { BikesService, LoggerService } from '../../services';
import { Router } from '@angular/router';
import { TranslateMessageTypes } from '../../core/enums/TranslateMessageTypes';
import { TranslateService } from '@ngx-translate/core';
import { UserRole } from '../../core/enums/userRole';
import { SessionTerminateDialogComponent } from '../../sessions/session-terminate-dialog/session-terminate-dialog.component';
import { ReportErrorComponent } from '../../bikes/bike-support/report-error/report-error.component';
import { LockState } from '../../core/enums/lockState';
import * as moment from "moment";
import { ConvertTimePipe } from '../../core/pipes/convert-time.pipe';
import { UserRoles } from '../../core/constants/user-roles';
import { LocalStorageKeys } from '../../core/constants';
import { RouteService } from '../../services/route.service';
import { WaypointUpdatePopupComponent } from '../../routes/waypoint-update-popup/waypoint-update-popup.component';
export interface FreeBikeData {
  bikeId: any;
  freeBike: any;
  isDocked: boolean;
  isChecking: boolean;
  userId: any;
  userRole: any;
  group1: any[];
  group2: any[];
  group3: any[];
  sessionId: any;
  routeId: any;
  isWaypoint: boolean;
  isRouteStatus: boolean;
  isCompletedOrSkipped: boolean;
}

@Component({
  selector: 'app-free-bike-popup',
  templateUrl: './free-bike-popup.component.html',
  styleUrls: ['./free-bike-popup.component.scss'],
  providers: [ConvertTimePipe],
  encapsulation: ViewEncapsulation.None
})
export class FreeBikePopupComponent implements OnInit {
  bikeId: any;
  freeBike: any;
  isLoading: boolean;
  isDocked: boolean;
  isChecking: boolean;
  carTranportObj: any;
  transportBikes: any;
  userId: any;
  userRole: any;
  comment: any;
  sessionId: any;
  group3: any[];
  group2: any[];
  group1: any[];
  isBikeLocked: boolean;
  isErrorReported: boolean;
  isLockState: boolean;
  bikeIssues: any;
  isBikeIssueLoading: boolean;
  undockCmdHistory: any;
  expandHistory: boolean = true;
  cmdFailurePrecentage: any = null;
  displayPercentage: any;
  resultLength: number;
  isDPHistoryLoading: boolean = false;
  routeId: any;
  isWaypoint: boolean;
  isRouteStatus: boolean;
  isCompletedOrSkipped: boolean;

  constructor(
    private router: Router,
    private bikesService: BikesService,
    private loggerService: LoggerService,
    private translate: TranslateService,
    public dialogRef: MatDialogRef<FreeBikePopupComponent>,
    @Inject(MAT_DIALOG_DATA) public data: FreeBikeData,
    public dialog: MatDialog,
    private sessionService: SessionsService,
    private issueService: IssueService,
    private commonService: CommonService,
    private routeService: RouteService,
    private convertTime: ConvertTimePipe) { }

  ngOnInit() {
    this.transportBikes = [];
    this.group1 = this.data.group1;
    this.group2 = this.data.group2;
    this.group3 = this.data.group3;
    this.sessionId = this.data.sessionId;
    this.bikeId = this.data.bikeId;
    this.setRouteWaypointProperties();
    this.GetBikeServiceByBikeId();
    this.GetRegisteredIssuesPerBikeId(this.bikeId);
    this.freeBike = this.data.freeBike;
    if (this.freeBike.LockState == LockState.LockedArrest)
      this.isLockState = true;
    else if (this.freeBike.LockState == LockState.UnlockedArrest)
      this.isLockState = false;
    this.isDocked = this.data.isDocked;
    this.isChecking = this.data.isChecking;
    this.userId = this.data.userId;
    this.userRole = this.GetUserRole(this.data.userRole);
    this.isBikeLocked = (this.freeBike.LockState == LockState.LockedArrest) ? true : false;
    this.isErrorReported = false;
    this.GetBikesInCar();
    this.getUndockCommmandHistory(this.data.bikeId);
  }

  CheckBike(bike) {
    this.isLoading = true;
    this.bikesService.sendUnLockCommand(bike.BikeId).subscribe(
      res => {
        this.isLoading = false;
        this.startPassiveSessionBikeCommand(this.freeBike);
        this.dialogRef.close({ bike: this.freeBike, isDocked: this.isDocked, isChecking: this.isChecking });
      },
      error => {
        this.bikesService.sendUndockCommand(bike.BikeId).subscribe(
          res => {
            this.isLoading = false;
            this.startPassiveSessionBikeCommand(this.freeBike);
            this.dialogRef.close({ bike: this.freeBike, isDocked: this.isDocked, isChecking: this.isChecking });
          },
          err => {
            // this.loggerService.showErrorMessage(this.TranslateMessage(TranslateMessageTypes.UndockAndUnlockFail));
            this.startPassiveSessionBikeCommand(this.freeBike);
            this.dialogRef.close({ bike: this.freeBike, isDocked: this.isDocked, isChecking: this.isChecking });
          }
        );
      }
    );
  }

  CheckDockedBike(bike) {
    this.isLoading = true;
    this.bikesService.sendUndockCommand(bike.BikeId).subscribe(
      res => {
        this.isLoading = false;
        this.startPassiveSessionBikeCommand(this.freeBike);
        this.dialogRef.close({ bike: this.freeBike, isDocked: this.isDocked, isChecking: this.isChecking });
      },
      error => {
        this.bikesService.sendUnLockCommand(bike.BikeId).subscribe(
          res => {
            this.isLoading = false;
            this.startPassiveSessionBikeCommand(this.freeBike);
            this.dialogRef.close({ bike: this.freeBike, isDocked: this.isDocked, isChecking: this.isChecking });
          },
          err => {
            // this.loggerService.showErrorMessage(this.TranslateMessage(TranslateMessageTypes.UndockAndUnlockFail));
            this.dialogRef.close({ bike: this.freeBike, isDocked: this.isDocked, isChecking: this.isChecking });
          }
        );
      }
    );
  }

  CheckDockedAndStuckBike(bike) {
    this.isLoading = true;

    let obj = { BikeId: bike.BikeId, DockingStationId: bike.DockingStationId, DockingPointId: bike.DockingPointId, Comments: "" };
    this.issueService.DisableStuckBikeAndDockingPoint(obj).subscribe(result => {
      if (result > 0) {
        this.loggerService.showSuccessfulMessage("Bike and docking point are successfully disabled");
        this.isLoading = false;
        this.dialogRef.close({ bike: this.freeBike, isBothDisabled: true, DockingPointId: bike.DockingPointId });
      }
    }, err => {
      if (err.status == 404) {
        this.loggerService.showErrorMessage(err.error);
      } else {
        this.loggerService.showErrorMessage("Error while disable bike and docking ponint");
      }
      this.isLoading = false;
      this.dialogRef.close();
    }
    );
  }

  FullCheckBike(bike) {
    this.isLoading = false;
    this.dialogRef.close({ bike: this.freeBike, isDocked: this.isDocked, isChecking: this.isChecking });
  }

  FullTransportation(bike) {
    this.isLoading = false;
    this.dialogRef.close({ bike: this.freeBike, isDocked: this.isDocked, isChecking: this.isChecking, isTransportation: true });
  }

  PlaceFreeBike() {
    this.isLoading = false;
    //close passive session
    if (this.freeBike.InSession)
      this.stopPassiveSessionBikeCommand(this.freeBike);

    //resolve issues for bike
    if (this.freeBike.Resolved > 0)
      this.ResolveIssuePerBike(this.freeBike.BikeId);

    this.dialogRef.close({ bike: this.freeBike, isDocked: this.isDocked, isChecking: this.isChecking, isPlaceFree: true });
  }

  ResolveIssuePerBike(bikeId) {
    this.issueService.ResolveIssuePerBike(bikeId).subscribe(result => {
      if (result > 0) {
        // this.loggerService.showSuccessfulMessage("Issue resolved sucessfully.");
      }
    });
  }
  GetBikeServiceByBikeId() {
    this.bikesService.getBikeServiceByBikeId(this.bikeId).subscribe(res => {
      if (res) {
        this.freeBike.CheckDate = res.CheckDate;
        this.freeBike.NumberOfChecks = res.NumberOfChecks;
        this.freeBike.ServiceId = res.Id;
      }
      else {
        this.freeBike.CheckDate = null;
        this.freeBike.NumberOfChecks = 0;
      }
    }, err => {
      // this.loggerService.showSuccessfulMessage(this.TranslateMessage(TranslateMessageTypes.BikeServiceGetError));
      this.isLoading = false;
    })
  }

  UndockOrUnlockBike(bike) {
    if (bike.DisableState != BikeDisableState.Moving) {
      this.isLoading = false;
      this.bikeId = bike.BikeId;
      this.bikesService.sendUnLockCommand(bike.BikeId).subscribe(
        res => {
          this.CreateTransportOrder(bike);
          bike.Disabled = true;
          bike.DisableState = BikeDisableState.Moving;
          bike["BikeStatus"] = BikeStatus.DisabledWithMoving;
          this.AddBikeToCar(bike);
        },
        error => {
          this.bikesService.sendUndockCommand(bike.BikeId).subscribe(
            res => {
              this.CreateTransportOrder(bike);
              bike.Disabled = true;
              bike.DisableState = BikeDisableState.Moving;
              bike["BikeStatus"] = BikeStatus.DisabledWithMoving;
              this.AddBikeToCar(bike);
            },
            err => {
              // this.loggerService.showErrorMessage(this.TranslateMessage(TranslateMessageTypes.UndockAndUnlockFail));
              this.CreateTransportOrder(bike);
              bike.Disabled = true;
              bike.DisableState = BikeDisableState.Moving;
              bike["BikeStatus"] = BikeStatus.DisabledWithMoving;
              this.AddBikeToCar(bike);
            }
          );
        }
      );
    }
  }

  CreateTransportOrder(bike) {
    var bikeStateChangeDTO = { Disabled: true, DisabledReason: BikeDisableState.Moving };
    this.DisableBike(bikeStateChangeDTO);
  }

  DisableBike(bikeStateChangeDTO) {
    this.bikesService.enableDisableBike(this.bikeId, bikeStateChangeDTO)
      .subscribe(data => {
        // if (bikeStateChangeDTO.Disabled)
        //   this.loggerService.showSuccessfulMessage(this.TranslateMessage(TranslateMessageTypes.Disable) + this.GetDisableReason(bikeStateChangeDTO.DisabledReason));
        // else
        //   this.loggerService.showSuccessfulMessage(this.TranslateMessage(TranslateMessageTypes.Enable));
        this.isLoading = false;
      }, error => {
        this.loggerService.showErrorMessage(error.error.Message);
        this.isLoading = false;
      });
  }

  CancelCheck() {
    if (this.userRole == UserRole.CustomerService && this.isDocked && this.isErrorReported)
      this.dialogRef.close({ bike: this.freeBike, isErrorReported: this.isErrorReported });
    else
      this.dialogRef.close();
  }

  GetDisableReason(disabledReason) {
    var disableReasonText = "";
    switch (disabledReason) {
      case BikeDisableState.Moving:
        disableReasonText = "Moving"
        break;
      case BikeDisableState.Testing:
        disableReasonText = "Testing"
        break;
      case BikeDisableState.ToWorkshop:
        disableReasonText = "Repair required"
        break;
      default:
        break;
    }
    return disableReasonText;
  }

  formatTimeDuration(timeStamp, duration) {
    if (timeStamp !== null) {
      var ts = new Date().getTime() - new Date(timeStamp).getTime();
      var diffMinutes = Math.abs(Math.round(ts / (1000 * 60)));
      if (diffMinutes <= duration) return true;
    }
    return false;
  }

  formatServiceTimeDuration(timeStamp) {
    if (timeStamp && timeStamp !== null && timeStamp != "") {
      var ts = new Date().getTime() - new Date(timeStamp).getTime();

      var diffDays = Math.abs(Math.round(ts / (1000 * 3600 * 24)));
      var diffHours = Math.abs(Math.round(ts / (1000 * 3600)));
      var diffMinutes = Math.abs(Math.round(ts / (1000 * 60)));
      var diffSeconds = Math.abs(Math.round(ts / (1000)));

      // if (diffDays > 1) {
      return diffDays + this.TranslateMessage(TranslateMessageTypes.DaysAgo)
      // }
      // else if (diffHours > 1) {
      //   if (diffHours >= 24 && diffDays == 1) {
      //     return diffDays + " day ago";
      //   } else {
      //     return diffHours + " hours ago";
      //   }
      // }
      // else if (diffMinutes > 1) {
      //   if (diffMinutes >= 60 && diffHours == 1) {
      //     return diffHours + " hour ago";
      //   } else {
      //     return diffMinutes + " minutes ago";
      //   }
      // }
      // else {
      //   if (diffSeconds >= 60 && diffMinutes == 1) {
      //     return diffMinutes + " minute ago";
      //   } else {
      //     return diffSeconds + " seconds ago";
      //   }
      // }
    } else {
      return this.TranslateMessage(TranslateMessageTypes.Never);
    }
  }

  formatPulseTimeDuration(timeStamp) {
    if (timeStamp && timeStamp !== null && timeStamp != "") {
      var ts = new Date().getTime() - new Date(timeStamp).getTime();

      var diffDays = Math.abs(Math.round(ts / (1000 * 3600 * 24)));
      var diffHours = Math.abs(Math.round(ts / (1000 * 3600)));
      var diffMinutes = Math.abs(Math.round(ts / (1000 * 60)));
      var diffSeconds = Math.abs(Math.round(ts / (1000)));

      if (diffDays > 1) {
        return diffDays + this.TranslateMessage(TranslateMessageTypes.DaysAgo)
      }
      else if (diffHours > 1) {
        if (diffHours >= 24 && diffDays == 1) {
          return diffDays + " day ago";
        } else {
          return diffHours + " hours ago";
        }
      }
      // else if (diffMinutes > 1) {
      //   if (diffMinutes >= 60 && diffHours == 1) {
      //     return diffHours + " hour ago";
      //   } else {
      //     return diffMinutes + " minutes ago";
      //   }
      // }
      else {
        if (diffSeconds >= 60 && diffMinutes == 1) {
          return diffMinutes + " minute ago";
        } else {
          return diffSeconds + " seconds ago";
        }
      }
    } else {
      return this.TranslateMessage(TranslateMessageTypes.Never);
    }
  }

  NavigateToBikeDetails() {
    this.dialogRef.close();
    this.router.navigate([`/bikes/${this.bikeId}/details`]);
  }

  TranslateMessage(type) {
    var msg = "";
    switch (type) {
      case TranslateMessageTypes.BikeServiceGetError:
        this.translate.get("LIVE_MAP.MESSAGES.BIKE_GET_SERVICE_ERROR").subscribe(name => {
          msg = name;
        });
        break;
      case TranslateMessageTypes.BikeServiceAddSuccess:
        this.translate.get("LIVE_MAP.MESSAGES.BIKE_SERVICE_ADD_SUCCESS").subscribe(name => {
          msg = name;
        });
        break;
      case TranslateMessageTypes.BikeServiceAddFail:
        this.translate.get("LIVE_MAP.MESSAGES.BIKE_SERVICE_ADD_FAIL").subscribe(name => {
          msg = name;
        });
        break;
      case TranslateMessageTypes.Disable:
        this.translate.get("LIVE_MAP.MESSAGES.BIKE_DISABLED_STATE_CHANGE_TO").subscribe(name => {
          msg = name;
        });
        break;
      case TranslateMessageTypes.Enable:
        this.translate.get("LIVE_MAP.MESSAGES.BIKE_ENABLED").subscribe(name => {
          msg = name;
        });
        break;
      case TranslateMessageTypes.TransportationSuccessCreatedPickedUp:
        this.translate.get("LIVE_MAP.MESSAGES.TRANSPORT_ORDER_CREATED_PICKEDUP").subscribe(name => {
          msg = name;
        });
        break;
      case TranslateMessageTypes.TransportationSuccessCreatedPickedUpError:
        this.translate.get("LIVE_MAP.MESSAGES.TRANSPORT_ORDER_CREATE_PICKED_ERROR").subscribe(name => {
          msg = name;
        });
        break;
      case TranslateMessageTypes.TransportationSuccessPickedUp:
        this.translate.get("LIVE_MAP.MESSAGES.TRANSPORT_ORDER_PICKED_UP").subscribe(name => {
          msg = name;
        });
        break;
      case TranslateMessageTypes.TransportationSuccessPickedUpError:
        this.translate.get("LIVE_MAP.MESSAGES.TRANSPORT_ORDER_PICKED_ERROR").subscribe(name => {
          msg = name;
        });
        break;
      case TranslateMessageTypes.TransportationExist:
        this.translate.get("LIVE_MAP.MESSAGES.TRANSPORT_ORDER_EXISTS").subscribe(name => {
          msg = name;
        });
        break;
      case TranslateMessageTypes.DaysAgo:
        this.translate.get("LIVE_MAP.DAYS_AGO").subscribe(name => {
          msg = name;
        });
        break;
      case TranslateMessageTypes.LockSuccess:
        this.translate.get("LIVE_MAP.MESSAGES.LOCK_SUCCESS").subscribe(name => {
          msg = name;
        });
        break;
      case TranslateMessageTypes.LockFail:
        this.translate.get("LIVE_MAP.MESSAGES.LOCK_FAIL").subscribe(name => {
          msg = name;
        });
        break;
      case TranslateMessageTypes.UnlockSuccess:
        this.translate.get("LIVE_MAP.MESSAGES.UNLOCK_SUCCESS").subscribe(name => {
          msg = name;
        });
        break;
      case TranslateMessageTypes.UnlockFail:
        this.translate.get("LIVE_MAP.MESSAGES.UNLOCK_FAIL").subscribe(name => {
          msg = name;
        });
        break;
      case TranslateMessageTypes.Never:
        this.translate.get("LIVE_MAP.NEVER").subscribe(name => {
          msg = name;
        });
        break;
      case TranslateMessageTypes.UndockAndUnlockFail:
        this.translate.get("LIVE_MAP.MESSAGES.UNDOCK_UNLOCK_FAIL").subscribe(name => {
          msg = name;
        });
        break;
      default:
        break;
    }
    return msg;
  }

  AddBikeToCar(bike) {
    this.transportBikes.push(bike);
    let carDTO = {
      UserId: this.userId,
      Bikes: JSON.stringify(this.transportBikes)
    }
    this.bikesService.AddBikeToCar(this.userId, carDTO).subscribe(res => {
      this.GetBikesInCar();
    });
  }

  GetBikesInCar() {
    this.bikesService.getBikeTransportByUserId(this.userId).subscribe(res => {
      if (res) {
        this.carTranportObj = res;
        this.transportBikes = JSON.parse(res.Bikes);
      }
    });
  }

  GetUserRole(userRole) {
    let role;
    switch (userRole) {
      case "Admin":
        role = UserRole.Admin;
        break;
      case "Workshop":
        role = UserRole.Workshop;
        break;
      case "TicketIntegrator":
        role = UserRole.TicketIntegretor;
        break;
      case "Customer Service":
        role = UserRole.CustomerService;
        break;
      case "Street Team":
        role = UserRole.StreetTeam;
        break;
      case "Customer":
        role = UserRole.Customer;
        break;
      default:
        break;
    }
    return role;
  }

  FreeLock() {
    this.bikesService.sendUnLockCommand(this.bikeId, true).subscribe(() => {
      this.loggerService.showSuccessfulMessage(this.TranslateMessage(TranslateMessageTypes.UnlockSuccess));
      this.isBikeLocked = false;
    }, () => {
      this.loggerService.showErrorMessage(this.TranslateMessage(TranslateMessageTypes.UnlockFail));
    })
  }

  AddLock() {
    this.bikesService.sendLockCommand(this.bikeId, true).subscribe(() => {
      this.loggerService.showSuccessfulMessage(this.TranslateMessage(TranslateMessageTypes.LockSuccess));
      this.isBikeLocked = true;
    }, () => {
      this.loggerService.showErrorMessage(this.TranslateMessage(TranslateMessageTypes.LockFail));
    })
  }

  TerminateSession(): void {
    let feeResult = false;
    const dialogRef = this.dialog.open(SessionTerminateDialogComponent, {
      width: '300px',
      data: { bikeId: this.bikeId, comment: this.comment, rideSessionId: this.sessionId, isFeeIncluded: feeResult }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result != null) {
        this.terminateSession(result);
      }
      this.comment = "";
    });
  }

  terminateSession(result) {
    let comment = { Comment: result.comment, RideSessionId: result.rideSessionId, IsTerminatedWithFee: result.isFeeIncluded };
    this.sessionService.terminateSession(result.bikeId, comment)
      .subscribe(data => {
        if (data.Status == true) {
          this.loggerService.showSuccessfulMessage('Successfully terminate the session.');
        }
      }, (error: any) => {
        this.loggerService.showErrorMessage('Error occured while terminating the session.');
      });
  }

  createReportError() {

    const dialogRef = this.dialog.open(ReportErrorComponent, {
      width: '1100px',
      height: '780px',
      data: { 'group1': this.group1, 'group2': this.group2, 'group3': this.group3, 'bikeId': this.bikeId, 'sessionId': this.sessionId, 'bikeLocked': this.isBikeLocked }
    });

    dialogRef.afterClosed().subscribe(result => {
      this.isErrorReported = true;
      if (result != undefined && result.IsBikeDisabled && !this.sessionId) {
        var bikeStateChangeDTO = { Disabled: true, DisabledReason: BikeDisableState.CheckRequired };
        this.freeBike.Disabled = true;
        this.freeBike.DisableState = BikeDisableState.CheckRequired;
        this.bikesService.enableDisableBike(this.bikeId, bikeStateChangeDTO)
          .subscribe(data => {
            this.loggerService.showSuccessfulMessage("Bike mode changed to Check-Required");
          }, error => {
            this.loggerService.showErrorMessage(error.error.Message);
          });
      }
    });
    this.clearSelectedErrorCategories();
  }

  clearSelectedErrorCategories() {
    this.group1.map(x => this.resetSubCategories(x));
    this.group2.map(x => this.resetSubCategories(x));
    this.group3.map(x => this.resetSubCategories(x));
  }

  resetSubCategories(parent) {
    let subCategory = parent.SubCategory;
    for (let i = 0; i < subCategory.length; i++) {
      if (subCategory[i].hasOwnProperty("Result"))
        subCategory[i].Result = false;
    }
  }

  LockBike() {
    this.bikesService.sendLockCommand(this.bikeId).subscribe(res => {
      // this.loggerService.showSuccessfulMessage(this.TranslateMessage(TranslateMessageTypes.LockSuccess));
      this.isLockState = true;
    }, err => {
      this.loggerService.showErrorMessage(this.TranslateMessage(TranslateMessageTypes.LockFail));
    })
  }

  UnLockBike() {
    this.bikesService.sendUnLockCommand(this.bikeId).subscribe(res => {
      // this.loggerService.showSuccessfulMessage(this.TranslateMessage(TranslateMessageTypes.UnlockSuccess));
      this.isLockState = false;
    }, err => {
      this.loggerService.showErrorMessage(this.TranslateMessage(TranslateMessageTypes.UnlockFail));
    })
  }

  GetRegisteredIssuesPerBikeId(bikeId) {
    this.bikeIssues = [];
    this.isBikeIssueLoading = true;
    this.issueService.GetAllErrorReportsPerBike(bikeId).subscribe(result => {
      this.bikeIssues = result.errorReportGroupedDTOs;
      this.bikeIssues = this.bikeIssues.filter(i => i.IsCompleted == false);
      // this.errorReports = result.errorReportResponseDTOs;
      this.formatErrorCategories();
      this.isBikeIssueLoading = false;
    },
      () => {
        this.isBikeIssueLoading = false;
      }
    );
  }

  formatErrorCategories() {
    this.bikeIssues.forEach(x => {
      let errorText = "";
      x.ErrorCategories.forEach(errorCat => {
        let errorcategory = "REPORT_ERROR." + errorCat.Name.toUpperCase();
        this.translate.get(errorcategory).subscribe(name => {
          errorCat.DisplayText = name;
        });
        errorText += errorCat.DisplayText + ",";
      });
      x.ErrorCategoriesText = errorText.substr(0, errorText.length - 1);
      // x.ReportedDateFormatted = moment(x.ReportedDate).format("DD.MM.YYYY");
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
      x.ReportedUser = this.commonService.mapReportedUser(x);
    });
  }

  startPassiveSessionBikeCommand(bike): void {
    this.bikesService.startPassiveSessionBikeCommand(bike.Serial).subscribe(data => {
      if (data.Status) {
        //this.loggerService.showSuccessfulMessage("Start passive session command successful");
      } else {
        //this.loggerService.showErrorMessage("Error,start passive session command failed");
      }
    }, error => {
      //this.loggerService.showErrorMessage("Error,start passive session command failed");
    });
  }

  stopPassiveSessionBikeCommand(bike): void {
    this.bikesService.stopPassiveSessionBikeCommand(bike.Serial).subscribe(data => {
      if (data.Status) {
        // this.loggerService.showSuccessfulMessage("Stop passive session command successful");
      } else {
        // this.loggerService.showErrorMessage("Error,stop passive session command failed");
      }
    }, error => {
      // this.loggerService.showErrorMessage("Error,stop passive session command failed");
    });
  }

  getUndockCommmandHistory(bikeId) {
    this.isDPHistoryLoading = true;
    this.bikesService.getUndockCommmandHistory(bikeId)
      .subscribe(result => {
        if (result != null) {
          this.resultLength = result['UndockCommandHistory'].length;
          this.undockCmdHistory = result['UndockCommandHistory'].sort((a, b) => b.CommandTimestamp - a.CommandTimestamp);
          this.undockCmdHistory.map(x => this.mapDisplayText(x));
          this.cmdFailurePrecentage = result['CommandFailurePrecentage'];
          this.displayPercentage = this.cmdFailurePrecentage.TenthPercentage;
        }
        this.isDPHistoryLoading = false;
      }, error => {
        this.loggerService.showErrorMessage("Getting bike undock command history details failed!");
        this.isDPHistoryLoading = false;
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
        `Docking point: ${undockHistory.DPVisualId} \n`;
    }
    else if (undockHistory.InitiatorRole == UserRoles.STREET_TEAM && !undockHistory.IsStreetTeamRepair) {
      undockHistory["DisplayText"] = `Successful undock ${commandTimestamp} \n` +
        `Checked by ${undockHistory.UserFirstName} \n ` +
        `Docking point: ${undockHistory.DPVisualId} \n`;
    }
    else if (undockHistory.InitiatorRole == UserRoles.WORKSHOP &&
      undockHistory.BikeDisabledState && undockHistory.WorkshopId) {
      undockHistory["DisplayText"] = `Successful undock ${commandTimestamp} \n` +
        `Disable state ${undockHistory.BikeDisableState} \n ` +
        `${undockHistory.WorkshopName} \n ` +
        `Docking point: ${undockHistory.DPVisualId} \n`;
    }
    else {
      undockHistory["DisplayText"] = `Successful undock ${commandTimestamp} \n` +
        `${undockHistory.DockingStationName} \n` +
        `Docking point: ${undockHistory.DPVisualId}`;
    }
  }

  private mapFailedCommandHistory(undockHistory: any, commandTimestamp: any) {
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

    if (undockHistory.DockingStationName) {
      if (undockHistory.InitiatorRole == UserRoles.STREET_TEAM && undockHistory.IsStreetTeamRepair) {
        undockHistory["DisplayText"] = `${displayIntro} ${commandTimestamp} \n` +
          `Fixed by ${undockHistory.UserFirstName} \n ` +
          `Docking point: ${undockHistory.DPVisualId} \n` +
          `Error type: ${errorTypeText}`;
      }
      else if (undockHistory.InitiatorRole == UserRoles.STREET_TEAM && !undockHistory.IsStreetTeamRepair) {
        undockHistory["DisplayText"] = `${displayIntro} ${commandTimestamp} \n` +
          `Checked by ${undockHistory.UserFirstName} \n ` +
          `Docking point: ${undockHistory.DPVisualId} \n` +
          `Error type: ${errorTypeText}`;
      }
      else if (undockHistory.InitiatorRole == UserRoles.WORKSHOP &&
        undockHistory.BikeDisabledState && undockHistory.WorkshopId) {
        undockHistory["DisplayText"] = `${displayIntro} ${commandTimestamp} \n` +
          `Disable state ${undockHistory.BikeDisableState} \n ` +
          `${undockHistory.WorkshopName} \n ` +
          `Docking point: ${undockHistory.DPVisualId} \n` +
          `Error type: ${errorTypeText}`;
      }
      else {
        undockHistory["DisplayText"] = `${displayIntro} ${commandTimestamp} \n` +
          `${undockHistory.DockingStationName} \n ` +
          `Docking point: ${undockHistory.DPVisualId} \n` +
          `Error type: ${errorTypeText}`;
      }
    }
    else {
      undockHistory["DisplayText"] = `${displayIntro} ${commandTimestamp} \n` +
        `Released outside docking station \n ` +
        `Error type: ${errorTypeText}`;
    }
  }

  getUndockIconCSS(cmdHistory) {
    if (cmdHistory.CommandStatus != 2) {
      if (cmdHistory.InitiatorRole == UserRoles.WORKSHOP) {
        return 'indecator-item red key';
      } else if (cmdHistory.InitiatorRole == UserRoles.STREET_TEAM) {
        if (cmdHistory.IsStreetTeamRepair)
          return 'indecator-item red key';
        else
          return 'indecator-item red eye';
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

  setRouteWaypointProperties() {
    this.routeId = this.data.routeId;
    this.isWaypoint = this.data.isWaypoint;
    this.isRouteStatus = this.data.isRouteStatus;
    this.isCompletedOrSkipped = this.data.isCompletedOrSkipped;
  }

  updateWaypoint(isSkipped) {
    const dialogAddWaypoint = this.dialog.open(WaypointUpdatePopupComponent, {
      width: '400px',
      // disableClose: true
    });

    dialogAddWaypoint.afterClosed().subscribe(result => {
      if (result) {
        let waypointUpdateObj = {
          "AssignedOn": this.userId,
          "DockingStationId": null,
          "BikeId": this.bikeId,
          "IsSkipped": isSkipped,
          "Comment": result["comment"]
        };
        this.routeService.updateWaypointByAssignedOn(waypointUpdateObj).subscribe(res => {
          this.dialogRef.close();
        }, err => {
          if (isSkipped)
            this.loggerService.showErrorMessage("Error while skipping waypoint");
          else
            this.loggerService.showErrorMessage("Error while completing waypoint");
        });
      }
    });

  }

  addWaypoint() {

    let waypointDto = {
      "RouteId": this.routeId,
      "DockingStationId": null,
      "BikeId": this.bikeId
    };
    this.routeService.addWaypoint(this.routeId, waypointDto).subscribe(res => {
      this.dialogRef.close();
    }, err => {
      this.loggerService.showErrorMessage("Error while adding waypoint to the ongoing route");
    });
  }
}
