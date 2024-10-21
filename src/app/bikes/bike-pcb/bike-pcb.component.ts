import { Component, Input, OnInit, ViewChild, Output, EventEmitter, OnDestroy } from '@angular/core';
import { Bike, WebSocketSubscriber, LiveConnectRequest } from '../../core/models';
import { BikesService, LoggerService, LiveConnectionService } from '../../services';
import { BikeObservation } from '../../core/models/bike/bike-observation';
import { ObservationTypes } from '../../core/constants/observation-types';
import { ObservationOverflowDialog, Details } from './observation-dialog.component';
import { MatDialog, MatDialogRef, MatDialogConfig } from '@angular/material/dialog';

@Component({
  selector: 'app-bike-pcb',
  templateUrl: './bike-pcb.component.html',
  styleUrls: ['./bike-pcb.component.scss']
})
export class BikePcbComponent implements OnInit, OnDestroy {

  @Input() bike: Bike;
  @Output() passBikeValues = new EventEmitter();
  @ViewChild('bikeObservationsTable', { static: true }) table: any;

  isMobile: boolean = false;
  bikeObservations: BikeObservation[];
  loadingIndicator: boolean = false;
  observationTypes: any;
  batStates: any;
  powerStates: any;
  lockStates: any;
  bikeStates: any;
  bikeErrors: any;
  bikeWarnings: any;
  dockingPointStates: any;
  dockingPointDockingState: any;
  isConnected: boolean = false;
  dpUndockResultBit: any;
  obsDetails: Details = null;
  lastCloseResult: string;

  protected webSocketSubscriber: WebSocketSubscriber;

  //popup 
  dialogRef: MatDialogRef<ObservationOverflowDialog>;
  config: MatDialogConfig = {
    disableClose: false,
    width: '80%',
    height: '80%',
    position: { top: '', bottom: '', left: '', right: '' }
  }

  constructor(
    private bikesService: BikesService,
    private loggerService: LoggerService,
    public dialog: MatDialog,
    protected liveConnectionService: LiveConnectionService
  ) {
    /**Mobile UI trigger - Filter viewport/UIKit Size 768 points displays for ipads*/
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      && (document.documentElement.clientWidth < 768)) {
      this.isMobile = true;
    }
  }

  ngOnInit() {
    //load values and states from ObservationTypes class
    this.observationTypes = ObservationTypes.observations;
    this.batStates = ObservationTypes.batStatus;
    this.bikeStates = ObservationTypes.BikeStates;
    this.lockStates = ObservationTypes.LockStates;
    this.powerStates = ObservationTypes.PowerStates;
    this.bikeErrors = ObservationTypes.BikeErrors;
    this.bikeWarnings = ObservationTypes.BikeWarnings;
    this.dockingPointStates = ObservationTypes.DockingPointState;
    this.dockingPointDockingState = ObservationTypes.DockingPointDockingState;
    this.dpUndockResultBit = ObservationTypes.dpUndockResult;

    this.getBikePCB();
  }

  open(observation: any) {
    this.dialogRef = this.dialog.open(ObservationOverflowDialog, this.config);
    this.obsDetails = {
      MID: "125",
      CurrentValue: observation.Value,
      ObservationName: observation.Name,
      Timestamp: observation.Timestamp
    };
    this.dialogRef.componentInstance.details = this.obsDetails;

    this.dialogRef.afterClosed().subscribe(result => {
      this.lastCloseResult = result;
      this.dialogRef = null;
      this.obsDetails = null;
    });
  }

  getBikePCB() {
    this.loadingIndicator = true;
    if (this.bike.Serial != "") {
      this.bikesService.getBikePCB(this.bike.BikeId)
        .subscribe(data => {
          data = this.renameObservation(data);
          data.sort((a, b) => {
            if (a.Name < b.Name) return -1;
            else if (a.Name > b.Name) return 1;
            else return 0;
          });
          this.formatValues(data);
        }, error => {
          this.loadingIndicator = false;
          if (error.status == 404) {
            this.loggerService.showErrorMessage(error.error);
          } else {
            this.loggerService.showErrorMessage(error);
          }
        });
    }
    else
      this.loadingIndicator = false;
  }

  formatValues(observations) {
    observations.forEach((observation) => {
      if (observation['Value'] != null) {
        let currentType = this.observationTypes.filter(e => e.id == observation['Id']);
        let currentValue = this.arrangeValueBasedOnType(observation['Id'], observation['Value']);
        if (currentType.length > 0) {
          let formattedValue = this.setValuesBasedOnDataType(currentType[0]['type'], currentValue);
          let suffix = currentType[0]['unit'];
          if (suffix != "") {
            observation['Value'] = formattedValue + suffix;
          }
          else {
            observation['Value'] = formattedValue;
          }
        }
        observation['Value'] = observation['Value'];
        //this.renameObservations(observation);
      }
      return observation;
    });
    this.bikeObservations = observations;
    this.loadingIndicator = false;
  }

  // renameObservations(observation) {
  //   switch (observation['Name']) {
  //     case "Bat Current":
  //       return observation['Name'] = "Bat Capacity";
  //     default:
  //       return observation;
  //   }  
  // }

  renameObservation(observations) {
    var objIndex = observations.findIndex((obj => obj.Name == "Bat Current"));

    if (objIndex <= 0) return observations;
    observations[objIndex].Name = "Bat Capacity";
    return observations;
  }

  setValuesBasedOnDataType(type, value) {
    switch (type) {
      case "int":
        return parseInt(value);
      case "double":
        return parseFloat(value).toFixed(2);
      case "float":
        return parseFloat(value).toFixed(2);
      case "onedecimal":
        return this.roundValue(value, 1).toFixed(1);
      case "threedecimal":
        return this.roundValue(value, 3).toFixed(3);
      default:
        return value;
    }
  }

  arrangeValueBasedOnType(id, value) {
    switch (id) {
      // case 200:
      //   return this.getBatVolt(value);
      case 205:
        return this.getBatStatus(value);
      case 206:
        return this.getBatCurrent(value);
      //case 300:
      // return this.generatePositionDisplayValue(value);
      case 302:
        return this.convertSpeed(value);
      case 303:
        return this.convertSpeed(value);
      case 400:
        return this.getBikeStateName(value);
      case 401:
        return this.getBikeLockStateName(value);
      case 402:
        return this.getBikePowerStateName(value);
      case 410:
        return this.getBikeErrorName(value);
      case 411:
        return this.getBikeWarningName(value);
      case 451:
        return this.getDockingPointStateName(value);
      case 468:
        return this.getUndockDPResultName(value);
      case 452:
        return value == 0 ? "Yes" : "No";
      case 456:
        return value == 0 ? "On" : "Off";
      case 459:
        return this.getDockingPointDockingStateName(value);
      case 500:
        return this.convertPressure(value);
      case 501:
        return this.convertPressure(value);
      default:
        return value;
    }
  }

  // private getBatVolt(value) {
  //   return this.roundValue(value, 1);
  // }

  getLiveData() {
    this.webSocketSubscriber = new WebSocketSubscriber(this.liveConnectionService);
    if (!this.webSocketSubscriber.isConnected)
      this.loadingIndicator = true;
    this.loadValuesViaSocket();
  }

  protected loadValuesViaSocket() {
    this.webSocketSubscriber.connect(this.getLiveConnectionRequestOptions())
      .then(() => this.webSocketSubscriber.messageStream
        .subscribe(message => this.onDataReceivedSuccess(message)),
        (error: any) => this.onDataReceivedError(error));
  }

  protected getLiveConnectionRequestOptions(): LiveConnectRequest[] {
    return [Object.assign(new LiveConnectRequest(), {
      MID: this.bike.Serial,
      InitObservationValues: true,
      ConnectAllObservations: true
    })];
  }

  protected onDataReceivedSuccess(message) {

    var mappedObservations = [...this.bikeObservations];
    let destination = message.headers.destination;
    let destinationSplitData = destination.split("/");
    let observationIdData = destinationSplitData[destinationSplitData.length - 1].split(".")
    let observationId = Number(observationIdData[observationIdData.length - 1])

    let existObservationValue = mappedObservations.find(a => a.Id == observationId);
    let index = mappedObservations.indexOf(existObservationValue)

    let displayValue = message.body.Value.toString();

    let currentType = this.observationTypes.filter(e => e.id == observationId);
    var timestamp = this.calculateTimeDuration(message.body.Timestamp);
    mappedObservations[index].Timestamp = timestamp;

    if (observationId == 400) {
      this.passBikeValues.emit({ "state": +displayValue })
    }
    else if (observationId == 201) {
      this.passBikeValues.emit({ "battery": displayValue })
    }
    else if (observationId == 300) {
      this.passBikeValues.emit({ "position": message.body.Value })
    }
    if (currentType.length > 0) {
      if (currentType[0].id == 300) {
        displayValue = this.generatePositionDisplayValue(message.body.Value);
      }
    }

    let currentValue = this.arrangeValueBasedOnType(observationId, displayValue);
    if (currentType.length > 0) {
      let formattedValue = this.setValuesBasedOnDataType(currentType[0]['type'], currentValue);
      let suffix = currentType[0]['unit'];
      if (suffix != "") {
        mappedObservations[index].Value = formattedValue + suffix;
      }
      else {
        mappedObservations[index].Value = formattedValue;
      }
    }
    this.bikeObservations = mappedObservations
    this.loadingIndicator = false;
  }

  onDataReceivedError(error) {
    this.loadingIndicator = false;
    this.loggerService.showErrorMessage("Already connected to live server");
  }

  private convertPressure(value) {
    return value = value;
  }

  private getUndockDPResultName(value) {
    //value = 22;
    let dpResultString = "";
    if (value == 0) {
      let zeroDpResult = this.dpUndockResultBit.filter(e => e.id == 0);
      if (zeroDpResult.length > 0)
        return zeroDpResult[0]['name'];
    }
    var bits = this.convertToBit(value).split("");
    bits = bits.reverse();
    bits.forEach((bit, index) => {
      if (bit == "1") {
        let dpResult = this.dpUndockResultBit.filter(e => e.id == index);
        if (dpResult.length > 0)
          dpResultString = dpResultString + "," + dpResult[0]['name'];
      }
    });
    dpResultString = dpResultString.replace(/(^,)|(,$)/g, "");
    return dpResultString;
  }

  private convertToBit(value) {
    return (value >>> 0).toString(2);
  }

  private getDockingPointDockingStateName(value) {
    let dockingPointDockingState = this.dockingPointDockingState.filter(e => e.id == value);
    if (dockingPointDockingState.length > 0)
      return dockingPointDockingState[0]['name'];
  }

  private getDockingPointStateName(value) {
    let dockingPointState = this.dockingPointStates.filter(e => e.id == value);
    if (dockingPointState.length > 0)
      return dockingPointState[0]['name'];
  }

  private getBikeWarningName(value) {
    let bikeWarning = this.bikeWarnings.filter(e => e.id == value);
    if (bikeWarning.length > 0)
      return bikeWarning[0]['name'];
  }

  private getBikeErrorName(value) {
    let bikeError = this.bikeErrors.filter(e => e.id == value);
    if (bikeError.length > 0)
      return bikeError[0]['name'];
  }

  private getBikePowerStateName(value) {
    let powerState = this.powerStates.filter(e => e.id == value);
    if (powerState.length > 0)
      return powerState[0]['name'];
  }

  private getBikeLockStateName(value) {
    let lockState = this.lockStates.filter(e => e.id == value);
    if (lockState.length > 0)
      return lockState[0]['name'];
  }

  private getBikeStateName(value) {
    let bikeState = this.bikeStates.filter(e => e.id == value);
    if (bikeState.length > 0)
      return bikeState[0]['name'];
  }

  private getBatStatus(value) {
    let batStatus = this.batStates.filter(e => e.id == value);
    if (batStatus.length > 0)
      return batStatus[0]['name'];
  }

  private getBatCurrent(value) {
    return (value / 1000);
  }

  // private getBatCurrent(value) {
  //   if (value == 0) {
  //     return value = "Inactive";
  //   } else if (value < 0) {
  //     return value = `Discharging with ${value} Amperes`;
  //   } else {
  //     return value = `Charging with ${value} Amperes`
  //   }
  // }

  private convertSpeed(value) {
    return value = value * 3.6;
  }

  private generatePositionDisplayValue(posRawValue) {
    let posDisplayValue = "";

    if (posRawValue.Latitude && posRawValue.Latitude < 0) {
      posDisplayValue = `${Math.abs(Number(posRawValue.Latitude)).toFixed(5)}S`
    }
    else {
      posDisplayValue = `${Number(posRawValue.Latitude).toFixed(5)}N`
    }

    if (posRawValue.Longitude && posRawValue.Longitude < 0) {
      posDisplayValue = `${posDisplayValue} ${Math.abs(Number(posRawValue.Longitude)).toFixed(5)}W`
    }
    else {
      posDisplayValue = `${posDisplayValue} ${Number(posRawValue.Longitude).toFixed(5)}E`
    }

    if (posRawValue.Altitude) {
      posDisplayValue = `${posDisplayValue} ${Number(posRawValue.Altitude).toFixed(1)}m`
    }
    return posDisplayValue;
  }

  private calculateTimeDuration(originalTimestamp) {
    let timestamp;

    if (originalTimestamp) {
      let diff = new Date().getTime() - new Date(originalTimestamp).getTime()
      let diffMins = Math.round(diff / (1000 * 60))
      let diffHours = Math.round(diff / (1000 * 3600))
      let diffDays = Math.round(diff / (1000 * 3600 * 24))

      if (diffDays >= 1) {
        timestamp = diffDays == 1 ? "1 day ago" : `${diffDays} days ago`
      }
      else if (diffHours >= 1) {
        timestamp = diffHours == 1 ? "1 hour ago" : `${diffHours} hours ago`
      }
      else {
        timestamp = diffMins == 1 ? "1 minute ago" : `${diffMins} minutes ago`
      }
    }
    return timestamp;
  }

  //round function that takes precision
  private roundValue(value, precision) {
    var multiplier = Math.pow(10, precision || 0);
    return Math.round(value * multiplier) / multiplier;
  }

  toggleExpandRow(row) {
    this.table.rowDetail.toggleExpandRow(row);
  }

  ngOnDestroy() {
    if (this.webSocketSubscriber)
      this.webSocketSubscriber.disconnect();
  }

  onResize() {
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) && (document.documentElement.clientWidth < 768)) {
      this.isMobile = true;
    } else {
      this.isMobile = false;
    }
  }
}
