import { StorageService } from './../../services/storage.service';
import { CommonService } from './../../services/common-service';
import { IssueService } from './../../services/issue.service';
import { Component, OnInit, Inject } from '@angular/core';
import { Router } from '@angular/router';
import { BikesService, LoggerService } from '../../services';
import { TranslateService } from '@ngx-translate/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { TranslateMessageTypes } from '../../core/enums/TranslateMessageTypes';
import { BikeDisableState } from '../../core/enums/bikeDisableState';
import { BikeStatus } from '../../core/enums/bikeStatus';
import { LockState } from '../../core/enums/lockState';
import * as moment from "moment";
import { StorageSelectionPopupComponent } from '../storage-selection-popup/storage-selection-popup.component';
import { ConvertTimePipe } from '../../core/pipes/convert-time.pipe';

export interface CarBikeData {
  bikeId: any;
  carBike: any;
  userId: any;
}

@Component({
  selector: 'app-car-bike-details-popup',
  templateUrl: './car-bike-details-popup.component.html',
  styleUrls: ['./car-bike-details-popup.component.scss'],
  providers: [ConvertTimePipe]
})
export class CarBikeDetailsPopupComponent implements OnInit {
  bikeId: any;
  carBike: any;
  isLoading: boolean;
  transportBikes: any;
  carTranportObj: any;
  isToWorkshop: boolean;
  isLockState: boolean;
  bikeIssues: any[];
  isBikeIssueLoading: boolean;
  allStorages: any[];

  constructor(
    private router: Router,
    private bikesService: BikesService,
    private loggerService: LoggerService,
    private translate: TranslateService,
    public dialogRef: MatDialogRef<CarBikeDetailsPopupComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CarBikeData,
    public dialog: MatDialog,
    private issueService: IssueService,
    private commonService: CommonService,
    private storageService: StorageService,
    private convertTime: ConvertTimePipe) { }

  ngOnInit() {
    this.bikeId = this.data.bikeId;
    this.GetBikeServiceByBikeId();
    this.GetRegisteredIssuesPerBikeId(this.bikeId);
    this.carBike = this.data.carBike;
    if (this.carBike.CurrentChargeLevel)
      this.carBike["ChargeLevel"] = this.carBike.CurrentChargeLevel;
    if (this.carBike.LockState == LockState.LockedArrest)
      this.isLockState = true;
    else if (this.carBike.LockState == LockState.UnlockedArrest)
      this.isLockState = false;
    this.userId = this.data.userId;
    this.GetBikesInCar();
    this.getAllStorages();
  }

  CheckDockedBike(bike) {
    this.isLoading = true;
    this.bikesService.sendUndockCommand(bike.BikeId).subscribe(
      res => {
        this.isLoading = false;
        this.dialogRef.close({ bike: this.carBike, isChecking: true });
      },
      error => {
        this.bikesService.sendUnLockCommand(bike.BikeId).subscribe(
          res => {
            this.isLoading = false;
            this.dialogRef.close({ bike: this.carBike, isChecking: true });
          },
          err => {
            this.loggerService.showErrorMessage(this.TranslateMessage(TranslateMessageTypes.UndockAndUnlockFail));
            this.dialogRef.close({ bike: this.carBike, isChecking: true });
          }
        );
      }
    );
  }

  FullCheckBike() {
    this.isLoading = false;
    this.dialogRef.close({ bike: this.carBike, isChecking: true });
  }

  FullTransportation(bike) {
    this.isLoading = false;
    this.dialogRef.close({ bike: this.carBike, isTransportation: true });
  }

  PlaceFreeBike() {
    this.isLoading = false;
    this.dialogRef.close({ bike: this.carBike, isPlaceFree: true });
  }

  HandToWorkshop() {
    this.isLoading = false;
    this.dialogRef.close({ bike: this.carBike, isToWorkshop: true });
  }

  HandToStorage() {
    this.isLoading = false;
    const dialogStorage = this.dialog.open(StorageSelectionPopupComponent, {
      width: '400px',
      height: '250px',
      data: {
        allStorages: this.allStorages,
        bikeId: this.bikeId,
        bike: this.carBike,
        userName: ""
      },
      disableClose: true
    });
    dialogStorage.afterClosed().subscribe(wsre => {
      if (wsre) {
        this.dialogRef.close({
          bike: this.carBike, isStorage: true, "selectedStorageId": wsre.selectedStorageId
        });
      }
    });
  }

  GetBikeServiceByBikeId() {
    this.bikesService.getBikeServiceByBikeId(this.bikeId).subscribe(res => {
      if (res) {
        this.carBike.CheckDate = res.CheckDate;
        this.carBike.NumberOfChecks = res.NumberOfChecks;
        this.carBike.ServiceId = res.Id;
      }
      else {
        this.carBike.CheckDate = null;
        this.carBike.NumberOfChecks = 0;
      }
    }, err => {
      this.loggerService.showSuccessfulMessage(this.TranslateMessage(TranslateMessageTypes.BikeServiceGetError));
      this.isLoading = false;
    })
  }

  UndockOrUnlockBike(bike) {
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
            this.loggerService.showErrorMessage(this.TranslateMessage(TranslateMessageTypes.UndockAndUnlockFail));
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

  CreateTransportOrder(bike) {
    var bikeStateChangeDTO = { Disabled: true, DisabledReason: BikeDisableState.Moving };
    this.DisableBike(bikeStateChangeDTO);
  }

  DisableBike(bikeStateChangeDTO) {
    this.bikesService.enableDisableBike(this.bikeId, bikeStateChangeDTO)
      .subscribe(data => {
        if (bikeStateChangeDTO.Disabled)
          this.loggerService.showSuccessfulMessage(this.TranslateMessage(TranslateMessageTypes.Disable) + this.GetDisableReason(bikeStateChangeDTO.DisabledReason));
        else
          this.loggerService.showSuccessfulMessage(this.TranslateMessage(TranslateMessageTypes.Enable));
        this.isLoading = false;
      }, error => {
        this.loggerService.showErrorMessage(error.error.Message);
        this.isLoading = false;
      });
  }

  CancelCheck() {
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
  userId(userId: any, carDTO: { UserId: any; Bikes: string; }) {
    throw new Error("Method not implemented.");
  }

  GetBikesInCar() {
    this.bikesService.getBikeTransportByUserId(this.userId).subscribe(res => {
      if (res) {
        this.carTranportObj = res;
        this.transportBikes = JSON.parse(res.Bikes);
      }
    });
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

  getAllStorages() {
    this.allStorages = [];
    this.storageService.getAllStorages().subscribe(res => {
      if (res) {
        this.allStorages = res;
      }
    });
  }
}
