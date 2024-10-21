
import { interval as observableInterval, forkJoin as observableForkJoin, Observable, Subject } from 'rxjs';

import { takeUntil, pairwise, startWith } from 'rxjs/operators';
import { ViewAllOnboardDetailsComponent } from './view-all-onboard-details/view-all-onboard-details.component';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from './../../shared/confirm-dialog/confirm-dialog.component';
import { Bike } from './../../core/models/bike/bike';
import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { WebSocketSubscriber, LiveConnectRequest } from '../../core/models';
import { AppSettings, LiveConnectionService, BikesService, DockingStationService, LoggerService, SettingsService } from '../../services';
import { BikeState } from '../../core/enums/bikeState';
import { LockState } from '../../core/enums/lockState';
import { PowerState } from '../../core/enums/powerState';
import { Router, ActivatedRoute } from '@angular/router';
import { DockingPoint } from '../../core/models/dock/docking-point';
import { DockingPointState } from '../../core/enums/dockingPointState';
import { SystemSettingsService } from '../../services/system-settings.service';
import { PreviousBike } from '../../core/models/bike/previous-bike';
import { Commands, LocalStorageKeys } from '../../core/constants';
import { BikeObservation } from '../../core/models/bike/bike-observation';
import { BikeTireSensorPairing } from '../../core/models/bike/bike-tire-sensor-pairing';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import * as moment from "moment";
import { CommonService } from '../../services/common-service';

@Component({
  selector: 'app-onboard',
  templateUrl: './onboard.component.html',
  styleUrls: ['./onboard.component.scss']
})
export class OnboardComponent implements OnInit, OnDestroy {
  @ViewChild('tirePressureTable', { static: false }) table: any;
  protected webSocketSubscriber: WebSocketSubscriber;
  onboardForm: FormGroup;
  deviceId: number;
  isMobile: boolean = false;
  dockingStationId: number;
  dockingPointId: number;
  dockingStationName: string;
  dockingPointDetails: any;
  dockingStationDetails: any;
  dockingStationPosition: any;
  dockingPointHardwareId: string;
  isIconShow = false;
  isOnBoardSucess = false;
  templateCurrentFirmware: any;
  TID: string;
  bikeCurrentFirmware: any;
  needUpgrade: boolean = false;
  MId: any;
  isFindPressure: boolean = false;
  bikeId: any;
  messageType: any;
  messageId: any;
  messageBody: any;
  preloader: boolean;
  tirePressureTimer: any;
  tirePressureObsList: BikeTireSensorPairing[];
  readyForOnboard: any;
  upgradedBikes: any[];
  nextBike: any;
  isUndockResponse: boolean;
  loggedInUser: any;
  onboardUser: any;
  onboardBikes: any[];
  onboardedDate: string;
  isVisualChanged: boolean;
  refreshIntervalId: NodeJS.Timer;
  tookedBikes: any[];
  isUndockCommandSent: boolean;
  isLoaded: boolean;
  allBikes: any;
  isNonPreparedBike: boolean;
  isInProcess: boolean;
  undockedBikes: any[];
  existingBike: any;

  constructor(private fb: FormBuilder, protected appSettings: AppSettings, private bikeService: BikesService, private router: Router,
    private dockingStationService: DockingStationService, private activatedRoute: ActivatedRoute, private loggerService: LoggerService,
    protected liveConnectionService: LiveConnectionService, private dialog: MatDialog, private systemSettings: SystemSettingsService,
    private translate: TranslateService,
    private commonService: CommonService) {
    this.webSocketSubscriber = new WebSocketSubscriber(this.liveConnectionService);

    this.dockingStationId = parseInt(this.router.url.split('/')[2]);
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      this.isMobile = true;
    }
    this.TID = this.appSettings.mcs_template;
    this.isUndockCommandSent = false;
  }

  private onDestroy$ = new Subject<void>();

  ngOnInit() {
    this.isInProcess = false;
    this.isLoaded = false;
    this.isNonPreparedBike = false;
    this.tookedBikes = [];
    this.undockedBikes = [];
    this.refreshIntervalId = setInterval(
      () => {
        this.getNotOnboardFirmwareUpgradedBikes();
        this.getAllBikes();
      },
      60000
    );

    this.isUndockResponse = false;
    this.loggedInUser = JSON.parse(localStorage.getItem(LocalStorageKeys.USER_DETAILS));
    this.onboardUser = this.loggedInUser;
    this.getTemplateCurrentFirmware();
    this.createOnboardForm();
    this.loadValuesViaSocket();
    this.mapPressureObservations();

    this.activatedRoute.params.subscribe(params => {
      this.dockingPointId = params['id'];
      this.getDockingStation();
    });
    this.translate.onLangChange.subscribe((params: LangChangeEvent) => {
      if (this.upgradedBikes)
        this.SetReadyForOnboardingText();
    });

    this.onboardForm.get('VisualId')
      .valueChanges
      .pipe(startWith(null), pairwise())
      .subscribe(([prev, next]: [any, any]) => {
        if (prev)
          this.isVisualChanged = prev != next;
        else
          this.isVisualChanged = false;
      });
  }

  private SetReadyForOnboardingText() {
    this.translate.get("COMMON.READY_FOR_ONBOARDING").subscribe(text => {
      this.readyForOnboard = this.upgradedBikes.length + " " + text;
    });
  }

  getTemplateCurrentFirmware() {
    this.systemSettings.getTemplateCurrentFirmware(this.TID).subscribe(res => {
      this.templateCurrentFirmware = res;
    });
  }

  getNotOnboardFirmwareUpgradedBikes(isExist = false) {
    if (!this.isInProcess) {
      this.bikeService.getNotOnboardFirmwareUpgradedBikes().subscribe(res => {
        if (res) {
          if (this.tookedBikes.length > 0) {
            this.tookedBikes.forEach(x => {
              if (res.findIndex(ub => ub.Serial == x.Serial) != -1) {
                let item = res.find(ub => ub.Serial == x.Serial);
                res.push(res.splice(res.indexOf(item), 1)[0]);
                // this.upgradedBikes = res.filter(bike => bike.Serial != x.Serial);
              }
            });
            //set undocked bikes to last
            this.undockedBikes.forEach(x => {
              if (res.findIndex(ub => ub.Serial == x.Serial) != -1) {
                let item = res.find(ub => ub.Serial == x.Serial);
                res.push(res.splice(res.indexOf(item), 1)[0]);
              }
            });

            this.upgradedBikes = res.filter(x => x.IsBikeOnline && !x.IsOnboarded &&
              moment(x["PulseTimestamp"]).isSameOrAfter(moment().utc().subtract(20, 'minutes'))
              && x.NearByDockingStationId == this.dockingStationId && x.IsFirmwareUpgraded &&
              moment(x["LastPositionTimestamp"]).isSameOrAfter(moment().utc().subtract(1, 'hours')));
          }
          else
            this.upgradedBikes = res.filter(x => x.IsBikeOnline && !x.IsOnboarded &&
              moment(x["PulseTimestamp"]).isSameOrAfter(moment().utc().subtract(20, 'minutes'))
              && x.NearByDockingStationId == this.dockingStationId && x.IsFirmwareUpgraded &&
              moment(x["LastPositionTimestamp"]).isSameOrAfter(moment().utc().subtract(1, 'hours')));

          this.onboardBikes = res;
          this.isLoaded = true;
        }
        if (isExist) {

          if (this.MId && (this.upgradedBikes.find(x => x.Serial == this.MId) || this.allBikes.find(x => x.Serial == this.MId)))
            this.isNonPreparedBike = false;
          else if (this.MId)
            this.isNonPreparedBike = true;
          if (!this.isNonPreparedBike)
            this.MapOnboardUserDetails(false);
        }
        if (this.upgradedBikes)
          this.SetReadyForOnboardingText();
      });
    }
  }

  onResize() {
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      this.isMobile = true;
    } else {
      this.isMobile = false;
    }
  }

  private createOnboardForm() {
    var reg = /\d{4}/
    this.onboardForm = this.fb.group({
      Serial: [{ value: "", disabled: true }, [Validators.required]],
      VisualId: ["", [Validators.required, Validators.pattern(reg)]],

    });
  }

  saveBike() {
    this.isInProcess = true;
    var bike = new Bike();
    bike.BikeState = BikeState.Docked;
    bike.LockState = LockState.UnlockedArrest;
    bike.PowerState = PowerState.ChargingNormal;

    bike = Object.assign({}, bike, this.onboardForm.getRawValue());

    this.bikeService.getBikeByVisualId(bike.VisualId)
      .subscribe(res => {
        if (!res) {
          bike.BikeId = +bike.VisualId;
          bike.Position = bike.Position;
          bike.DockingPointId = this.dockingPointId;
          bike.DockingStationId = this.dockingStationId;

          this.bikeService.createBike(bike).subscribe(res => {
            this.handleBikePreparation(bike);
            //remove from main array
            this.upgradedBikes = this.upgradedBikes.filter(x => x.Serial != bike.Serial);
            //remove from internal array
            this.tookedBikes = this.tookedBikes.filter(x => x.Serial != bike.Serial);

            //update count of prepared bike
            this.SetReadyForOnboardingText();

            this.showIcons(true, true);
            this.sendUndockCommand(res.BikeId);
            this.CallPeerUndock(bike.Serial);
            this.bikeId = res.BikeId;
            this.loggerService.showSuccessfulMessage("New Bike saved successfully");
            this.isInProcess = false;

          }, error => {
            this.isInProcess = false;
            if (error && error.error.Code == 1062) {
              //this.showIcons(true, false)
              //this.loggerService.showErrorMessage("Error,Bike PCB already exists");

              //confirm user action
              this.bikeService.getBikeByMid(bike.Serial).subscribe(details => {
                if (details) {
                  let previousBike = new PreviousBike();
                  previousBike.BikeId = details.BikeId;
                  previousBike.BikeState = details.BikeState;
                  previousBike.ChargeLevel = details.ChargeLevel;
                  previousBike.Serial = details.Serial;
                  bike.PreviousBike = previousBike;
                  this.confirmVisualIdChange(bike);
                }
                else {
                  this.loggerService.showErrorMessage("Error,Bike saving failed");
                }
              }, err => {
                this.loggerService.showErrorMessage("Error,Bike saving failed");
              });
            }
            else {
              this.loggerService.showErrorMessage("Error,Bike saving failed");
            }
          })
        }
        else {
          this.isInProcess = false;
          bike.BikeId = res.BikeId;
          this.bikeId = res.BikeId;
          bike.Position = this.dockingStationPosition;
          bike.DockingPointId = this.dockingPointId;
          bike.DockingStationId = this.dockingStationId;
          bike.ChargeLevel = res.ChargeLevel;
          let previousBike = new PreviousBike();
          previousBike.BikeId = res.BikeId;
          previousBike.BikeState = res.BikeState;
          previousBike.ChargeLevel = res.ChargeLevel;
          previousBike.Serial = res.Serial;
          previousBike.VisualId = res.VisualId;
          bike.PreviousBike = previousBike;
          this.confirmMIDChange(bike);
        }
      })
  }

  private handleBikePreparation(bike: any) {
    if (this.nextBike) {
      let bikeOnboard = this.nextBike;
      bikeOnboard["OnboardUser"] = this.loggedInUser;
      bikeOnboard["IsOnboarded"] = true;
      bikeOnboard["BikeId"] = bike.BikeId;
      let onboardedDate = moment.utc();
      let isExistBike = this.allBikes.find(x => x.Serial == this.nextBike.Serial);
      if (!isExistBike)
        bikeOnboard["OnboardedTimestamp"] = onboardedDate;
      this.onboardedDate = onboardedDate.format("DD.MM.YYYY");
      var onboardExist = this.onboardBikes.find(x => x.Serial == bike.Serial);
      if (onboardExist) {
        var index = this.onboardBikes.findIndex(x => x.Serial == bike.Serial);
        onboardExist["OnboardUser"] = this.loggedInUser;
        onboardExist["IsOnboarded"] = bikeOnboard["IsOnboarded"];
        onboardExist["BikeId"] = bikeOnboard["BikeId"];
        onboardExist["OnboardedTimestamp"] = bikeOnboard["OnboardedTimestamp"];
        this.onboardBikes[index] = onboardExist;
      }
      if (!isExistBike)
        this.updateBikeOnboardDetails(bikeOnboard);
    }
  }

  private CallPeerUndock(serial) {
    setTimeout(() => {
      if (!this.isUndockResponse)
        this.sendPeerUndockBikeCommand(serial);
    }, 60000);
  }

  protected loadValuesViaSocket() {
    this.webSocketSubscriber.connect(this.getLiveConnectionRequestOptions()).then(
      () => this.webSocketSubscriber.messageStream.subscribe(message => this.onDataReceivedSuccess(message)),
      (error: any) => this.onDataReceivedError(error));
  }

  protected getLiveConnectionRequestOptions(): LiveConnectRequest[] {
    return [Object.assign(new LiveConnectRequest(), {
      TID: this.TID,
      ObservationIds: [
        450,
        510,
        511,
        500,
        501,
        520,
        521,
        530,
        531
      ],
      CommandIds: [
        Commands.DetectTirePressure,
        Commands.Undock
      ]
    })];
  }

  protected onDataReceivedSuccess(message) {
    this.existingBike = undefined;
    let header = message.headers.destination;
    let headerValues = header.split("/");
    let midValues = headerValues[headerValues.length - 1]
    let midVals = midValues.split(".");
    let mid = midVals[0];
    this.messageType = midVals[1];
    this.messageId = midVals[2];
    this.messageBody = message.body;
    if ((!message || message.body.Value != this.dockingPointHardwareId) && this.messageType == "O" && this.messageId == 450) {
      if (this.MId == mid) {
        this.stopPassiveSessionBikeCommand(mid);
        this.updateSerial("");
        this.updateVisualId("");
        // this.isNonPreparedBike = false;
        this.nextBike = null;
        this.onboardUser = null;
        let bikeIndex = this.upgradedBikes.findIndex(x => x.Serial == this.MId);
        if (bikeIndex != -1) {
          let spliceBike = this.upgradedBikes.splice(bikeIndex, 1)[0];
          this.undockedBikes.push(spliceBike);
          this.upgradedBikes.push(spliceBike);
        }
        this.MId = "";
        this.isNonPreparedBike = false;
      }
      return;
    }
    else if ((!message || message.body.Value == this.dockingPointHardwareId) && this.messageType == "O" && this.messageId == 450) {
      this.MId = mid;
      this.existingBike = this.allBikes.find(x => x.Serial == this.MId);
      let existPrepared = this.onboardBikes.find(x => x.Serial == this.MId);
      if (this.existingBike)
        this.isNonPreparedBike = false;
      else if (!this.existingBike) {
        if (existPrepared)
          this.isNonPreparedBike = false;
        else
          this.isNonPreparedBike = true;
      }
    }

    if (this.MId == mid) {
      this.loadFirmwareForBike();

      if (this.messageId == Commands.Undock && this.messageType == "CR")
        this.isUndockResponse = true;

    }
  }

  enableLoader() {
    let messageBody = this.messageBody;
    if (messageBody.WasAccepted) {
      this.preloader = true;
      // this.isFindPressure = true;
    }
  }


  private loadFirmwareForBike() {
    this.getBikeByMid(this.MId);
    this.getBikeCurrentFirmware(this.MId);
  }

  private loadTirePressureData() {
    let messageBody = this.messageBody;
    this.tirePressureObsList = this.tirePressureObsList.map(x => {
      if (x.Front.Id == this.messageId)
        x.Front.Value = messageBody.Value;
      if (x.Rear.Id == this.messageId)
        x.Rear.Value = messageBody.Value;
      return x;
    });
    this.onDestroy$.next();

    this.preloader = false;
  }

  onDataReceivedError(error) {
    this.loggerService.showErrorMessage("Error, Receving data from docking point !!");
    this.showIcons(false, false);
  }

  getBikeByMid(mid) {
    this.onboardForm.reset();
    this.updateSerial(mid);
    this.bikeService.getBikeByMid(mid).subscribe(bike => {
      let isBikeExist = false;
      if (bike && bike.VisualId) {
        this.updateVisualId(bike.VisualId);
        isBikeExist = true;
      }
      else {
        this.updateVisualId("");
        isBikeExist = false;
      }
      if (!this.isNonPreparedBike)
        this.MapOnboardUserDetails(isBikeExist);
    })
  }

  getBikeCurrentFirmware(mid) {
    this.bikeService.getBikeCurrentFirmware(mid).subscribe(obs => {
      if (obs != null) {
        this.bikeCurrentFirmware = obs.Value;
      }
      this.bikeCurrentFirmware = 0;
      if (this.templateCurrentFirmware > this.bikeCurrentFirmware) {
        this.needUpgrade = true;
      }
    });
  }

  upgradeFirmware() {
    this.bikeService.sendBikePCBUpgradeFirmwareCommandByMID(this.MId).subscribe(res => {
      this.loggerService.showSuccessfulMessage("Bike firmware upgraded successfully");
    }, error => {
      this.loggerService.showErrorMessage("Error,Bike firmware upgrade failed");
    });
  }

  getDockingStation() {
    observableForkJoin(
      this.dockingStationService.getDockingPointDetails(this.dockingStationId, this.dockingPointId),
      this.dockingStationService.getDockingStation(this.dockingStationId, false),
      this.dockingStationService.getBikeOnboardStatus(this.TID, this.dockingPointId),
      this.bikeService.getBikes())
      .subscribe(data => {
        this.dockingPointDetails = data[0];
        this.dockingStationDetails = data[1];
        this.dockingStationName = this.dockingStationDetails.Name;
        this.dockingStationPosition = this.dockingStationDetails.Position;
        this.dockingPointHardwareId = this.dockingPointDetails.HardwareId;
        let bikeOnboardStatus = data[2];
        this.allBikes = data[3];
        if (bikeOnboardStatus) {
          if (bikeOnboardStatus["IsExist"]) {
            this.MId = bikeOnboardStatus["Serial"];
            this.updateSerial(this.MId);
            let visualId = bikeOnboardStatus["VisualId"];
            if (visualId)
              this.updateVisualId(visualId);
          }
        }
        this.getNotOnboardFirmwareUpgradedBikes(bikeOnboardStatus["IsExist"]);
      }, (error: any) => {
        // this.loggerService.showErrorMessage('Error occured while obtaning docking point details.');
      });
  }

  confirmMIDChange(bike) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '350px',
      data: { "message": "Bike Visual Id already exist.Do you want to change it's PCB to new one?" }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.bikeService.updateBikeDetails(bike).subscribe(res => {
          this.loggerService.showSuccessfulMessage("Bike updated successfully");
          this.showIcons(true, true)
          this.sendUndockCommand(bike.BikeId);
          this.handleBikePreparation(bike);
        }, error => {
          this.loggerService.showErrorMessage("Error,Bike updation failed");
          this.showIcons(true, false)
        })
      }
    });
  }

  confirmVisualIdChange(bike) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '350px',
      data: { "message": "Bike PCB already exists, Do you want to change it's visual Id to new one?." }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.bikeService.recreateBike(bike).subscribe(res => {
          this.showIcons(true, true)
          this.sendUndockCommand(res.BikeId);
          this.handleBikePreparation(bike);
          this.loggerService.showSuccessfulMessage("Bike visual id changes successfully.");

        }, error => {
          if (error) {
            this.showIcons(true, false)
            this.loggerService.showErrorMessage(error.error.Message);
          }
          else {
            this.loggerService.showErrorMessage("Error, Bike saving failed");
          }
        })
      }
    });
  }

  updateDockingPoint() {
    let dockingPoint = new DockingPoint();
    dockingPoint.DockingPointId = this.dockingPointId;
    dockingPoint.DockingStationId = this.dockingStationId;
    dockingPoint.VisualId = this.dockingPointDetails.VisualId;
    dockingPoint.HardwareId = this.dockingPointHardwareId;
    dockingPoint.State = DockingPointState.Occupied;

    this.dockingStationService.updateDockingPointDetails(this.dockingStationId, this.dockingPointId, dockingPoint)
      .subscribe(res => {
      }, error => {
        this.loggerService.showErrorMessage("Error,Docking point updation failed");
      })
  }

  private sendUndockCommand(bikeId) {
    this.bikeService.sendUndockCommand(bikeId)
      .subscribe(res => {
      }, error => {
        this.loggerService.showErrorMessage("Error,Sending undock command");
      })
  }

  private updateVisualId(visualId) {
    this.onboardForm.patchValue({
      VisualId: visualId
    });
  }

  private updateSerial(mid) {
    this.onboardForm.patchValue({
      Serial: mid
    })
  }

  private MapOnboardUserDetails(isBikeExist = false) {
    let onboardBike = this.onboardBikes.find(x => x.Serial == this.MId);
    if (onboardBike) {
      if (onboardBike["OnboardUser"]) {

        this.onboardUser = {
          "FirstName": onboardBike["OnboardUser"]["FirstName"],
          "LastName": onboardBike["OnboardUser"]["LastName"]
        };
      }
      else
        this.onboardUser = null;
      this.onboardedDate = (onboardBike["OnboardedTimestamp"]) ? moment(onboardBike["OnboardedTimestamp"]).format("DD.MM.YYYY") : null;
      this.nextBike = onboardBike;
      this.nextBike["formatedPreparedTimestamp"] = moment(this.nextBike["PulseTimestamp"]).format("DD.MM.YYYY");
    }
    if (isBikeExist || this.allBikes.find(x => x.Serial == this.MId))
      this.isOnBoardSucess = true;
  }

  private showIcons(iconShow, onboardSucess) {
    this.isIconShow = iconShow;
    this.isOnBoardSucess = onboardSucess;
  }

  public ngOnDestroy(): void {
    this.webSocketSubscriber.disconnect();
    clearInterval(this.refreshIntervalId);
  }

  findTirePressure() {
    this.mapPressureObservations();
    this.onDestroy$.next();

    this.tirePressureTimer = observableInterval(5000 * 60).pipe(takeUntil(this.onDestroy$)).subscribe(x => {
      this.onDestroy$.next();
      this.preloader = false;
    });
    this.detectTirePressure();
  }

  detectTirePressure() {
    this.bikeService.detectTirePressure(this.MId).subscribe(res => {
      this.isFindPressure = true;
    }, error => {
      this.isFindPressure = false;
    });
  }

  mapPressureObservations() {

    let frontPressure = new BikeObservation();
    frontPressure.Name = "FrontPressure";
    frontPressure.Id = 500;
    frontPressure.Value = "-";
    let rearPressure = new BikeObservation();
    rearPressure.Name = "RearPressure";
    rearPressure.Id = 501;
    rearPressure.Value = "-";
    let frontSensor = new BikeObservation();
    frontSensor.Name = "FrontSensorId";
    frontSensor.Id = 510;
    frontSensor.Value = "-";
    let rearSensor = new BikeObservation();
    rearSensor.Name = "RearSensorId";
    rearSensor.Id = 511;
    rearSensor.Value = "-";
    let frontBatterylevel = new BikeObservation();
    frontBatterylevel.Name = "FrontBatteryLevel";
    frontBatterylevel.Id = 520;
    frontBatterylevel.Value = "-";
    let rearBatterylevel = new BikeObservation();
    rearBatterylevel.Name = "RearBatteryLevel";
    rearBatterylevel.Id = 521;
    rearBatterylevel.Value = "-";
    let frontTemperature = new BikeObservation();
    frontTemperature.Name = "FrontTemperature";
    frontTemperature.Id = 530;
    frontTemperature.Value = "-";
    let rearTemperature = new BikeObservation();
    rearTemperature.Name = "RearTemperature";
    rearTemperature.Id = 531;
    rearTemperature.Value = "-";
    this.tirePressureObsList = [
      new BikeTireSensorPairing("Pressure", Object.assign({}, new BikeObservation(), frontPressure), Object.assign({}, new BikeObservation(), rearPressure), "PSI"),
      new BikeTireSensorPairing("Sensor ID", Object.assign({}, new BikeObservation(), frontSensor), Object.assign({}, new BikeObservation(), rearSensor), ""),
      new BikeTireSensorPairing("Battery level", Object.assign({}, new BikeObservation(), frontBatterylevel), Object.assign({}, new BikeObservation(), rearBatterylevel), "%"),
      new BikeTireSensorPairing("Temperature", Object.assign({}, new BikeObservation(), frontTemperature), Object.assign({}, new BikeObservation(), rearTemperature), '\xB0C')
    ];
  }

  toggleExpandRow(row) {
    this.table.rowDetail.toggleExpandRow(row);
  }

  getNextBike() {
    this.isInProcess = true;
    this.nextBike = this.upgradedBikes[0];
    if (this.nextBike) {
      this.tookedBikes = this.upgradedBikes.filter(x => x.Serial == this.nextBike.Serial);

      //remove the bike from undocked bike list when suggested
      this.undockedBikes = this.undockedBikes.filter(x => x.Serial != this.nextBike.Serial);

      this.nextBike["formatedPreparedTimestamp"] = moment(this.nextBike["PulseTimestamp"]).format("DD.MM.YYYY");
      if (!this.nextBike["InSession"])
        this.startPassiveSessionBikeCommand(this.nextBike.Serial);
      this.nextBike["InSession"] = true;
      // let item = this.upgradedBikes.find(x => x.Serial == this.nextBike.Serial);
      // this.upgradedBikes.splice(this.upgradedBikes.indexOf(item), 1)[0];
      this.upgradedBikes.shift();
      this.upgradedBikes.push(this.nextBike);
      this.SetReadyForOnboardingText();
      this.isInProcess = false;
    }
  }

  getMCSCommand(mid: string, commandId: number): any {
    let now = new Date();
    let expire = new Date(now).setMinutes(now.getMinutes() + 1);
    return {
      MID: mid,
      CommandId: commandId,
      Timestamp: now.toISOString(),
      ExpiresAt: new Date(expire).toISOString()
    }
  }

  sendBlinkBikeCommand(mid: string): void {
    this.bikeService.sendBlinkCommandBViaSerial(mid).subscribe(data => {
      if (data.Status) {
        this.loggerService.showSuccessfulMessage("Send blink command successful");
      } else {
        this.loggerService.showErrorMessage("Error,send blink command failed");
      }
    }, error => {
      this.loggerService.showErrorMessage("Error,send blink command failed");
    });
  }

  startPassiveSessionBikeCommand(mid: string): void {
    this.bikeService.startPassiveSessionBikeCommand(mid).subscribe(data => {
      if (data.Status) {
        this.loggerService.showSuccessfulMessage("Start passive session command successful");
      } else {
        this.loggerService.showErrorMessage("Error,start passive session command failed");
      }
    }, error => {
      this.loggerService.showErrorMessage("Error,start passive session command failed");
    });
  }

  stopPassiveSessionBikeCommand(mid: string): void {
    this.bikeService.stopPassiveSessionBikeCommand(mid).subscribe(data => {
      if (data.Status) {
        this.loggerService.showSuccessfulMessage("Stop passive session command successful");
      } else {
        this.loggerService.showErrorMessage("Error,stop passive session command failed");
      }
    }, error => {
      this.loggerService.showErrorMessage("Error,stop passive session command failed");
    });
  }

  sendPeerUndockBikeCommand(mid: string): void {
    this.bikeService.SendPeerUndock(mid).subscribe(data => {
      if (data.Status) {
        this.loggerService.showSuccessfulMessage("Send peer undock command successful");
      } else {
        this.loggerService.showErrorMessage("Error,send peer undock command failed");
      }
    }, error => {
      this.loggerService.showErrorMessage("Error,send peer undock command failed");
    });
  }

  private sendUndockCommandBySerial(mid) {
    this.bikeService.sendUndockCommandBySerial(mid)
      .subscribe(res => {
        this.isUndockCommandSent = false;
      }, error => {
        this.loggerService.showErrorMessage("Error,Sending undock command");
        this.isUndockCommandSent = false;
      })
  }

  updateBikeOnboardDetails(bikeOnboard): void {
    this.bikeService.updateBikeOnboardDetails(bikeOnboard).subscribe(data => {
      if (data) {
        // this.loggerService.showSuccessfulMessage(" successful");
      } else {
        this.loggerService.showErrorMessage("Error,while updating onboard details failed");
      }
    }, error => {
      this.loggerService.showErrorMessage("Error,while updating onboard details failed");
    });
  }

  cancelBike() {
    if (!this.isUndockCommandSent) {
      this.sendUndockCommandBySerial(this.MId);
      this.isUndockCommandSent = true;
      this.CallPeerUndock(this.MId);
      // if (!this.isNonPreparedBike)
      //   this.upgradedBikes.push(this.nextBike);
      // if (this.upgradedBikes)
      //   this.SetReadyForOnboardingText();
      if (this.isNonPreparedBike)
        this.isNonPreparedBike = false;
      this.updateVisualId("");
      this.updateSerial("");
    }
    // this.MId = "";
  }

  cancelExistingBike() {
    this.sendUndockCommandBySerial(this.MId);
    this.CallPeerUndock(this.MId);
    this.updateVisualId("");
    this.updateSerial("");
  }

  formatBikeOnboardTimeDuration(timestamp) {
    return this.commonService.formatBikeOnboardTimeDuration(timestamp);
  }

  OpenOnboardPopup() {
    const dialogRef = this.dialog.open(ViewAllOnboardDetailsComponent, {
      width: '2100px',
      height: 'auto',
      data: {
        'onboardBikes': this.onboardBikes,
        'dockingStationId': this.dockingStationId
      },
      panelClass: 'full-width-dialog'
    });

    dialogRef.afterClosed().subscribe(result => {

    });
  }

  getAllBikes() {
    this.bikeService.getBikes().subscribe(res => {
      if (res) {
        this.allBikes = res;
      }
    }, err => {

    });
  }

  resetDockingPoint() {
    let bikeDPHWIDResetObj = {
      "DPHWID": this.dockingPointHardwareId
    };
    this.bikeService.removeDPWHIDForPCB(this.MId, bikeDPHWIDResetObj).subscribe({
      next: (res) => {
        if (res)
          this.loggerService.showSuccessfulMessage("Successfully cleared old bike PCB information");
      },
      error: (err) => {
        if (err.status == 400 || err.status == 500)
          this.loggerService.showErrorMessage("Error while clearing old PCB information");
      }
    });
  }
}
