import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Commands } from '../../core/constants';
import { BikeCellularConnectionType } from '../../core/enums/bikeCellularConnectionType';
import { LiveConnectRequest, WebSocketSubscriber } from '../../core/models';
import { AppSettings, BikesService, LiveConnectionService, LoggerService } from '../../services';

@Component({
  selector: 'app-bike-signal',
  templateUrl: './bike-signal.component.html',
  styleUrls: ['./bike-signal.component.scss']
})
export class BikeSignalComponent implements OnInit {
  bikeId: any;
  bike: any;
  bikeQuality: any;
  connectionsFilters: any[];
  selectedFilter: number;
  connection: any;
  isGSM: boolean;
  qualitySINRValue: any;
  qualityRSRQValue: any;
  qualityRSRPValue: any;
  qualityRSSIValue: any;
  visualId: any;
  isLoading: boolean = false;
  webSocketSubscriber: WebSocketSubscriber;
  TID: string;
  messageType: any;
  messageId: any;
  messageBody: any;
  observationValue: any;

  constructor(private bikesService: BikesService, protected appSettings: AppSettings, private route: ActivatedRoute, protected liveConnectionService: LiveConnectionService, private loggerService: LoggerService) {
    this.bikeId = route.snapshot.params['id'];
    this.connectionsFilters = [
      { "Id": 1, "Name": "Instant", "Disabled": false, "Translation": "" },
      { "Id": 2, "Name": "Last hour", "Disabled": true, "Translation": "" },
      { "Id": 3, "Name": "Last day", "Disabled": true, "Translation": "" },
      { "Id": 4, "Name": "Last week", "Disabled": true, "Translation": "" }];
    this.selectedFilter = 1;
    this.webSocketSubscriber = new WebSocketSubscriber(this.liveConnectionService);
    this.TID = this.appSettings.mcs_template;
  }

  ngOnInit() {
    // this.getBikeDetails();
    this.getInstantBikeCellularQualityInfo();
  }

  getBikeDetails() {
    this.bikesService.getBikeDetails(this.bikeId).subscribe(data => {
      this.bike = data;
    }, error => {
      if (error.status == 403) {
        this.loggerService.showErrorMessage("Don't have permission to obtain data");
      } else {
        this.loggerService.showErrorMessage("Getting bike details failed!");
      }
    });
  }

  getInstantBikeCellularQualityInfo() {
    this.isLoading = true;
    this.bikesService.getInstantBikeCellularQualityInfo(this.bikeId).subscribe(data => {
      this.bikeQuality = data;
      if (this.bikeQuality) {
        this.visualId = this.bikeQuality["VisualId"];
        this.connection = this.bikeQuality["Connection"];
        if (this.connection)
          this.mapQualityObservation();
        else
          this.loggerService.showErrorMessage("No bike signal quality data found.");
        this.isLoading = false;
      }
    }, error => {
      if (error.status == 403) {
        this.isLoading = false;
        this.loggerService.showErrorMessage("Don't have permission to obtain data");
      } else {
        this.isLoading = false;
        this.loggerService.showErrorMessage("Getting bike signal quality failed!");
      }
    });
  }

  onConnectionFilterChange(event) {
    console.log(event);
    if (this.webSocketSubscriber.isConnected)
      this.webSocketSubscriber.disconnect();
  }

  onRefreshQualityObservation() {
    // this.getInstantBikeCellularQualityInfo();
    if (!this.webSocketSubscriber.isConnected)
      this.loadValuesViaSocket();
    this.sendBikePCBPollAllCommand();
  }

  mapQualityObservation() {
    if (this.bikeQuality["ConnectionId"] == BikeCellularConnectionType.GSM) {
      this.isGSM = true;
      this.qualityRSSIValue = this.bikeQuality["Observations"][0].filter(x => x.Id == 104)[0]["Value"];
    }
    else {
      this.isGSM = false;
      this.qualityRSRPValue = this.bikeQuality["Observations"][0].filter(x => x.Id == 106)[0]["Value"];
      this.qualitySINRValue = this.bikeQuality["Observations"][0].filter(x => x.Id == 107)[0]["Value"];
      this.qualityRSRQValue = this.bikeQuality["Observations"][0].filter(x => x.Id == 108)[0]["Value"];
    }
  }

  getRSSIStyle() {
    let color = '';
    if (this.qualityRSSIValue >= -65)
      color = 'green';
    else if (this.qualityRSSIValue >= -75 && this.qualityRSSIValue < -65)
      color = 'l-green';
    else if (this.qualityRSSIValue >= -85 && this.qualityRSSIValue < -75)
      color = 'yellow';
    else if (this.qualityRSSIValue < -85)
      color = 'red';
    return color;
  }

  getRSRPStyle() {
    let color = '';
    if (this.qualityRSRPValue >= -84)
      color = 'green';
    else if (this.qualityRSRPValue >= -102 && this.qualityRSRPValue < -84)
      color = 'l-green';
    else if (this.qualityRSRPValue >= -111 && this.qualityRSRPValue < -102)
      color = 'yellow';
    else if (this.qualityRSRPValue < -111)
      color = 'red';
    return color;
  }

  getSINRStyle() {
    let color = '';
    if (this.qualitySINRValue >= 12.5)
      color = 'green';
    else if (this.qualitySINRValue >= 10 && this.qualitySINRValue < 12.5)
      color = 'l-green';
    else if (this.qualitySINRValue >= 7 && this.qualitySINRValue < 10)
      color = 'yellow';
    else if (this.qualitySINRValue < 7)
      color = 'red';
    return color;
  }

  getRSRQStyle() {
    let color = '';
    if (this.qualityRSRQValue >= -5)
      color = 'green';
    else if (this.qualityRSRQValue >= -9 && this.qualityRSRQValue < -5)
      color = 'l-green';
    else if (this.qualityRSRQValue >= -12 && this.qualityRSRQValue < -9)
      color = 'yellow';
    else if (this.qualityRSRQValue < -12)
      color = 'red';
    return color;
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
        104,
        105,
        106,
        107,
        108
      ],
      CommandIds: [
        Commands.PollAll
      ]
    })];
  }

  protected onDataReceivedSuccess(message) {
    let header = message.headers.destination;
    let headerValues = header.split("/");
    let midValues = headerValues[headerValues.length - 1]
    let midVals = midValues.split(".");
    let mid = midVals[0];
    this.messageType = midVals[1];
    this.messageId = midVals[2];
    this.messageBody = message.body;
    this.observationValue = message.body.Value;
    if (this.messageType == "O" && this.messageId == 104 && this.bikeQuality["Serial"] == mid) {
      this.qualityRSSIValue = this.observationValue;
    }
    if (this.messageType == "O" && this.messageId == 105 && this.bikeQuality["Serial"] == mid) {
      this.connection = this.observationValue;
    }
    if (this.messageType == "O" && this.messageId == 106 && this.bikeQuality["Serial"] == mid) {
      this.qualityRSRPValue = this.observationValue;
    }
    if (this.messageType == "O" && this.messageId == 107 && this.bikeQuality["Serial"] == mid) {
      this.qualitySINRValue = this.observationValue;
    }
    if (this.messageType == "O" && this.messageId == 108 && this.bikeQuality["Serial"] == mid) {
      this.qualityRSRQValue = this.observationValue;
    }
  }

  onDataReceivedError(error) {
    this.loggerService.showErrorMessage("Error, Receving live data");
  }

  sendBikePCBPollAllCommand() {
    this.bikesService.sendBikePCBPollAllCommand(this.bikeId).subscribe(data => {
      if (data.Status) {
        this.loggerService.showSuccessfulMessage("Send Poll All command successful");
      } else {
        this.loggerService.showErrorMessage("Error,send Poll All command failed");
      }
    }, error => {
      this.loggerService.showErrorMessage("Error,send Poll All command failed");
    });
  }

  public ngOnDestroy() {
    if (this.webSocketSubscriber.isConnected)
      this.webSocketSubscriber.disconnect();
  }
}
