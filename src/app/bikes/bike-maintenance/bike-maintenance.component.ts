
import { interval as observableInterval, Observable } from 'rxjs';

import { takeWhile } from 'rxjs/operators';
import { Component, Input, OnInit, ViewChild } from '@angular/core';



import { Commands, CommandStatus } from '../../core/constants';
import { Bike, LiveConnectRequest, LiveSubscriber, ParameterTypes } from '../../core/models';
import { AppSettings, BikesService, DockingStationService, LoggerService, LiveUpdateService, LiveConnectionService } from '../../services';
import { Location } from '@angular/common';

const COMMANDS = [
  {
    Id: 1,
    CommandId: Commands.Undock,
    Name: 'BIKE_DETAILS.COMMANDS.UNDOCK',
    Category: 'General',
    Status: ''
  },
  {
    Id: 2,
    CommandId: Commands.Lock,
    Name: 'BIKE_DETAILS.COMMANDS.LOCK',
    Category: 'General',
    Status: ''
  },
  {
    Id: 3,
    CommandId: Commands.UnLock,
    Name: 'BIKE_DETAILS.COMMANDS.UNLOCK',
    Category: 'General',
    Status: ''
  },
  {
    Id: 4,
    CommandId: Commands.Blink,
    Name: 'BIKE_DETAILS.COMMANDS.BLINK',
    Category: 'General',
    Status: ''
  },
  {
    Id: 5,
    CommandId: Commands.PeerUndock,
    Name: 'BIKE_DETAILS.COMMANDS.PEERUNDOCK',
    Category: 'General',
    Status: ''
  },
  {
    Id: 6,
    CommandId: Commands.LocateBike,
    Name: 'BIKE_DETAILS.COMMANDS.LOCATE_BIKE',
    Category: 'General',
    Status: ''
  },
  {
    Id: 7,
    CommandId: Commands.StartPassiveSession,
    Name: 'BIKE_DETAILS.COMMANDS.START_PASSIVE_SESSION',
    Category: 'General',
    Status: ''
  },
  {
    Id: 8,
    CommandId: Commands.StopPassiveSession,
    Name: 'BIKE_DETAILS.COMMANDS.STOP_PASSIVE_SESSION',
    Category: 'General',
    Status: ''
  },
  {
    Id: 9,
    CommandId: Commands.EBikeControllerTest,
    Name: 'BIKE_DETAILS.COMMANDS.START_EBIKE_CONTROLLER_TEST',
    Category: 'eBike Controller',
    Status: ''
  },
  {
    Id: 10,
    CommandId: Commands.Restart,
    Name: 'BIKE_DETAILS.COMMANDS.RESTART',
    Category: 'Bike PCB',
    Status: ''
  },
  {
    Id: 11,
    CommandId: Commands.DownloadSettings,
    Name: 'BIKE_DETAILS.COMMANDS.DOWNLOAD_SETTINGS',
    Category: 'Bike PCB',
    Status: ''
  },
  {
    Id: 12,
    CommandId: Commands.UpgradeFirmware,
    Name: 'BIKE_DETAILS.COMMANDS.UPGRADE_FIRMWARE',
    Category: 'Bike PCB',
    Status: ''
  },
  {
    Id: 13,
    CommandId: Commands.PollAll,
    Name: 'BIKE_DETAILS.COMMANDS.POLL_ALL',
    Category: 'Bike PCB',
    Status: ''
  }
];

const DP_COMMANDS = [
  {
    Id: 13,
    CommandId: Commands.StartCharging,
    Name: 'Start Charging',
    Category: 'Docking Point',
    Status: ''
  },
  {
    Id: 14,
    CommandId: Commands.StopCharging,
    Name: 'Stop Charging',
    Category: 'Docking Point',
    Status: ''
  },
  {
    Id: 15,
    CommandId: Commands.StartHeating,
    Name: 'Start Heating',
    Category: 'Docking Point',
    Status: ''
  },
  {
    Id: 16,
    CommandId: Commands.StopHeating,
    Name: 'Stop Heating',
    Category: 'Docking Point',
    Status: ''
  },
  {
    Id: 17,
    CommandId: Commands.DownloadDPLog,
    Name: 'Download DP Log',
    Category: 'Docking Point',
    Status: ''
  }
];

@Component({
  selector: 'app-bike-maintenance',
  templateUrl: './bike-maintenance.component.html',
  styleUrls: ['./bike-maintenance.component.scss']
})
export class BikeMaintenanceComponent implements OnInit {
  @ViewChild('commandsTable', { static: true }) table: any;

  @Input() bike: Bike;

  commands = [];
  commandIds: number[] = [
    Commands.Undock,
    Commands.UnLock,
    Commands.Lock,
    Commands.Blink,
    Commands.PeerUndock,
    Commands.EBikeControllerTest,
    Commands.Restart,
    Commands.DownloadSettings,
    Commands.UpgradeFirmware,
    Commands.PollAll,
    Commands.StartCharging,
    Commands.StopCharging,
    Commands.StartHeating,
    Commands.StopHeating,
    Commands.DownloadDPLog,
    Commands.StartSession,
    Commands.StopSession,
    Commands.StartPassiveSession,
    Commands.StopPassiveSession,
    Commands.LocateBike
  ];
  liveService: LiveUpdateService;
  sent_commands: any[];
  server_timestamp: Date;
  disconnected: boolean;
  routeState: any;

  constructor(
    private appSettings: AppSettings,
    private bikesService: BikesService,
    private dockingStationService: DockingStationService,
    private loggerService: LoggerService,
    private liveConnectionService: LiveConnectionService,
    private location: Location
  ) {
    this.routeState = location.getState();
  }

  ngOnInit() {
    this.sent_commands = [];
    this.commands = this.bike.DockingPointId ? COMMANDS.concat(DP_COMMANDS) : [...COMMANDS];
    if (this.routeState != null && this.routeState.clearCommands) {
      this.commands.forEach(x => x.Status = '');
    }
    this.connectLive();
    observableInterval(5000).pipe(
      takeWhile(() => !this.disconnected))
      .subscribe(i => this.setExpiration());
    this.setFirmwareUpgradableStatus();
  }

  toggleExpandGroup(group) {
    this.table.groupHeader.toggleExpandGroup(group);
  }

  onMessage(device: string, type: ParameterTypes, id: number, data: any) {
    let index = this.findCommandIndex(device, id, data.Timestamp);
    if (index >= 0) {
      //let index = this.findCommandIndex(device, id, data.Timestamp);
      this.removeCommand(index);
      let status = data.WasAccepted ? CommandStatus.Executed : CommandStatus.Rejected;
      this.setStatus(id, status);
    }
  }

  ngOnDestroy() {
    this.disconnected = true;
    if (this.liveService && this.liveService.connected) {
      this.liveService.disconnect();
    }
  }

  sendCommand(commandId: number): void {
    switch (commandId) {
      case Commands.Undock:
        this.sendUndockBikeCommand(this.bike.Serial, this.bike.BikeId);
        break;
      case Commands.UnLock:
        this.sendUnLockBikeCommand(this.bike.Serial, this.bike.BikeId);
        break;
      case Commands.Lock:
        this.sendLockBikeCommand(this.bike.Serial, this.bike.BikeId);
        break;
      case Commands.Blink:
        this.sendBlinkBikeCommand(this.bike.Serial, this.bike.BikeId);
        break;
      case Commands.PeerUndock:
        this.sendPeerUndockBikeCommand(this.bike.Serial, this.bike.BikeId);
        break;
      case Commands.StartSession:
        this.sendStartSessionCommand(this.bike.Serial, this.bike.BikeId);
        break;
      case Commands.StopSession:
        this.sendStopSessionCommand(this.bike.Serial, this.bike.BikeId);
        break;
      case Commands.EBikeControllerTest:
        this.sendEBikeControllerTestCommand(this.bike.Serial, this.bike.BikeId);
        break;
      case Commands.Restart:
        this.sendPCBRestartCommand(this.bike.Serial, this.bike.BikeId);
        break;
      case Commands.DownloadSettings:
        this.sendBikePCBDownloadSettingsCommand(this.bike.Serial, this.bike.BikeId);
        break;
      case Commands.UpgradeFirmware:
        this.sendBikePCBUpgradeFirmwareCommand(this.bike.Serial, this.bike.BikeId);
        break;
      case Commands.PollAll:
        this.sendBikePCBPollAllCommand(this.bike.Serial, this.bike.BikeId);
        break;
      case Commands.StartCharging:
        this.sendStartChargingCommand();
        break;
      case Commands.StopCharging:
        this.sendStopChargingCommand();
        break;
      case Commands.StartHeating:
        this.sendStartHeatingCommand();
        break;
      case Commands.StopHeating:
        this.sendStopHeatingCommand();
        break;
      case Commands.ResetSlaveDP:
        this.sendResetSlaveCommand();
        break;
      case Commands.DownloadDPLog:
        this.sendDownloadDPLogCommand();
        break;
      case Commands.StartPassiveSession:
        this.sendStartPassiveSessionCommand(this.bike.Serial, this.bike.BikeId);
        break;
      case Commands.StopPassiveSession:
        this.sendStopPassiveSessionCommand(this.bike.Serial, this.bike.BikeId);
        break;
      case Commands.LocateBike:
        this.sendBikeLocateCommand(this.bike.Serial, this.bike.BikeId);
        break;
    }
    // this.setStatus(commandId, 'Sending...');
  }

  setFirmwareUpgradableStatus() {
    this.commands.forEach(element => {
      element["IsUpgradable"] = true;
      if (element.CommandId == Commands.UpgradeFirmware) {
        if (this.bike.SessionId != null) {
          element["IsUpgradable"] = false;
        }
        else {
          element["IsUpgradable"] = true;
        }
      }
    });
  }

  setExpiration(): void {
    let i = 0;
    let indexes = [];
    for (let command of this.sent_commands) {
      let sentAt = new Date(command.Timestamp);
      let expiresAt = new Date(new Date(sentAt).setSeconds(sentAt.getSeconds() + 20));
      // let expiresAt = new Date(new Date(sentAt).setMinutes(sentAt.getMinutes() + 1));
      if (expiresAt < new Date()) {
        this.setStatus(command.CommandId, CommandStatus.Expired);
        indexes.push(i);
      }
      i++;
    }
    for (let index of indexes) {
      this.removeCommand(index);
    }
  }

  sendPCBRestartCommand(mid: string, bikeId: number): void {
    let command = this.getMCSCommand(mid, Commands.Restart);

    this.bikesService.sendBikePCBRestartCommand(bikeId).subscribe(data => {
      if (data.Status) {
        command.Timestamp = data.TimeStamp;
        this.sent_commands.push(command);
        this.setStatus(command.CommandId, CommandStatus.Sent);
      } else {
        this.setStatus(command.CommandId, CommandStatus.Failed);
      }
    }, error => {
      this.setStatus(command.CommandId, CommandStatus.Failed);
    });
  }

  sendEBikeControllerTestCommand(mid: string, bikeId: number): void {
    let command = this.getMCSCommand(mid, Commands.EBikeControllerTest);

    this.bikesService.sendEBikeControllerTestCommand(bikeId).subscribe(data => {
      if (data.Status) {
        command.Timestamp = data.TimeStamp;
        this.setStatus(command.CommandId, CommandStatus.Sent);
        this.sent_commands.push(command);
      } else {
        this.setStatus(command.CommandId, CommandStatus.Failed);
      }
    }, error => {
      this.setStatus(command.CommandId, CommandStatus.Failed);
    });
  }

  sendBikePCBUpgradeFirmwareCommand(mid, bikeId: number): void {
    let command = this.getMCSCommand(mid, Commands.UpgradeFirmware);

    if (this.bike.SessionId != null) {
      this.loggerService.showErrorMessage("Bikes with ongoing sessions can not be upgraded.");
      return;
    }

    this.bikesService.sendBikePCBUpgradeFirmwareCommand(bikeId).subscribe(data => {
      if (data.Status) {
        command.Timestamp = data.TimeStamp;
        this.setStatus(command.CommandId, CommandStatus.Sent);
        this.sent_commands.push(command);
      } else {
        this.setStatus(command.CommandId, CommandStatus.Failed);
      }
    }, error => {
      this.setStatus(command.CommandId, CommandStatus.Failed);
    });
  }

  sendUndockBikeCommand(mid: string, bikeId: number): void {
    let command = this.getMCSCommand(mid, Commands.Undock);

    this.bikesService.sendUndockCommand(bikeId).subscribe(data => {
      if (data.Status) {
        command.Timestamp = data.TimeStamp;
        this.setStatus(command.CommandId, CommandStatus.Sent);
        this.sent_commands.push(command);

        //Reset by removing docking point related commands
        this.commands = [...COMMANDS];
      } else {
        this.setStatus(command.CommandId, CommandStatus.Failed);
      }
    }, error => {
      this.setStatus(command.CommandId, CommandStatus.Failed);
    });
  }

  sendBlinkBikeCommand(mid: string, bikeId: number): void {
    let command = this.getMCSCommand(mid, Commands.Blink);

    this.bikesService.sendBlinkCommand(bikeId).subscribe(data => {
      if (data.Status) {
        command.Timestamp = data.TimeStamp;
        this.setStatus(command.CommandId, CommandStatus.Sent);
        this.sent_commands.push(command);
      } else {
        this.setStatus(command.CommandId, CommandStatus.Failed);
      }
    }, error => {
      this.setStatus(command.CommandId, CommandStatus.Failed);
    });
  }

  sendUnLockBikeCommand(mid: string, bikeId: number): void {
    let command = this.getMCSCommand(mid, Commands.UnLock);

    this.bikesService.sendUnLockCommand(bikeId).subscribe(data => {
      if (data.Status) {
        command.Timestamp = data.TimeStamp;
        this.setStatus(command.CommandId, CommandStatus.Sent);
        this.sent_commands.push(command);
      } else {
        this.setStatus(command.CommandId, CommandStatus.Failed);
      }
    }, error => {
      this.setStatus(command.CommandId, CommandStatus.Failed);
    });
  }

  sendLockBikeCommand(mid: string, bikeId: number): void {
    let command = this.getMCSCommand(mid, Commands.Lock);

    this.bikesService.sendLockCommand(bikeId).subscribe(data => {
      if (data.Status) {
        command.Timestamp = data.TimeStamp;
        this.setStatus(command.CommandId, CommandStatus.Sent);
        this.sent_commands.push(command);
      } else {
        this.setStatus(command.CommandId, CommandStatus.Failed);
      }
    }, error => {
      this.setStatus(command.CommandId, CommandStatus.Failed);
    });
  }

  sendPeerUndockBikeCommand(mid: string, bikeId: number): void {
    let command = this.getMCSCommand(mid, Commands.PeerUndock);

    this.bikesService.sendPeerUndockCommand(bikeId).subscribe(data => {
      if (data.Status) {
        command.Timestamp = data.TimeStamp;
        this.setStatus(command.CommandId, CommandStatus.Sent);
        this.sent_commands.push(command);
      } else {
        this.setStatus(command.CommandId, CommandStatus.Failed);
      }
    }, error => {
      this.setStatus(command.CommandId, CommandStatus.Failed);
    });
  }

  sendStartSessionCommand(mid: string, bikeId: number): void {
    let command = this.getMCSCommand(mid, Commands.StartSession);

    this.bikesService.sendStartSessionCommand(bikeId).subscribe(data => {
      if (data.Status) {
        command.Timestamp = data.TimeStamp;
        this.setStatus(command.CommandId, CommandStatus.Sent);
        this.sent_commands.push(command);
      } else {
        this.setStatus(command.CommandId, CommandStatus.Failed);
      }
    }, error => {
      this.setStatus(command.CommandId, CommandStatus.Failed);
    });
  }

  sendStopSessionCommand(mid: string, bikeId: number): void {
    let command = this.getMCSCommand(mid, Commands.StopSession);

    this.bikesService.sendStopSessionCommand(bikeId).subscribe(data => {
      if (data.Status) {
        command.Timestamp = data.TimeStamp;
        this.setStatus(command.CommandId, CommandStatus.Sent);
        this.sent_commands.push(command);
      } else {
        this.setStatus(command.CommandId, CommandStatus.Failed);
      }
    }, error => {
      this.setStatus(command.CommandId, CommandStatus.Failed);
    });
  }


  sendBikePCBDownloadSettingsCommand(mid: string, bikeId: number): void {
    let command = this.getMCSCommand(mid, Commands.DownloadSettings);

    this.bikesService.sendBikePCBDownloadSettingsCommand(bikeId).subscribe(data => {
      if (data.Status) {
        command.Timestamp = data.TimeStamp;
        this.setStatus(command.CommandId, CommandStatus.Sent);
        this.sent_commands.push(command);
      } else {
        this.setStatus(command.CommandId, CommandStatus.Failed);
      }
    }, error => {
      this.setStatus(command.CommandId, CommandStatus.Failed);
    });
  }

  sendBikePCBPollAllCommand(mid: string, bikeId: number): void {
    let command = this.getMCSCommand(mid, Commands.PollAll);

    this.bikesService.sendBikePCBPollAllCommand(bikeId).subscribe(data => {
      if (data.Status) {
        command.Timestamp = data.TimeStamp;
        this.setStatus(command.CommandId, CommandStatus.Sent);
        this.sent_commands.push(command);
      } else {
        this.setStatus(command.CommandId, CommandStatus.Failed);
      }
    }, error => {
      this.setStatus(command.CommandId, CommandStatus.Failed);
    });
  }

  sendStartChargingCommand(): void {
    let command = this.getMCSCommand(this.bike.Serial, Commands.StartCharging);

    this.dockingStationService.startChargingForDockingPoint(this.bike.DockingStationId, this.bike.DockingPointId).subscribe(data => {
      if (data.Status) {
        command.Timestamp = data.TimeStamp;
        this.setStatus(command.CommandId, CommandStatus.Sent);
        this.sent_commands.push(command);
      } else {
        this.setStatus(command.CommandId, CommandStatus.Failed);
      }
    }, error => {
      this.setStatus(command.CommandId, CommandStatus.Failed);
    });
  }

  sendStopChargingCommand(): void {
    let command = this.getMCSCommand(this.bike.Serial, Commands.StopCharging);

    this.dockingStationService.stopChargingForDockingPoint(this.bike.DockingStationId, this.bike.DockingPointId).subscribe(data => {
      if (data.Status) {
        command.Timestamp = data.TimeStamp;
        this.setStatus(command.CommandId, CommandStatus.Sent);
        this.sent_commands.push(command);
      } else {
        this.setStatus(command.CommandId, CommandStatus.Failed);
      }
    }, error => {
      this.setStatus(command.CommandId, CommandStatus.Failed);
    });
  }

  sendStartHeatingCommand(): void {
    let command = this.getMCSCommand(this.bike.Serial, Commands.StartHeating);

    this.dockingStationService.startHeatingForDockingPoint(this.bike.DockingStationId, this.bike.DockingPointId).subscribe(data => {
      if (data.Status) {
        command.Timestamp = data.TimeStamp;
        this.setStatus(command.CommandId, CommandStatus.Sent);
        this.sent_commands.push(command);
      } else {
        this.setStatus(command.CommandId, CommandStatus.Failed);
      }
    }, error => {
      this.setStatus(command.CommandId, CommandStatus.Failed);
    });
  }

  sendStopHeatingCommand(): void {
    let command = this.getMCSCommand(this.bike.Serial, Commands.StopHeating);

    this.dockingStationService.stopHeatingForDockingPoint(this.bike.DockingStationId, this.bike.DockingPointId).subscribe(data => {
      if (data.Status) {
        command.Timestamp = data.TimeStamp;
        this.setStatus(command.CommandId, CommandStatus.Sent);
        this.sent_commands.push(command);
      } else {
        this.setStatus(command.CommandId, CommandStatus.Failed);
      }
    }, error => {
      this.setStatus(command.CommandId, CommandStatus.Failed);
    });
  }

  sendResetSlaveCommand(): void {
    let command = this.getMCSCommand(this.bike.Serial, Commands.ResetSlaveDP);

    this.dockingStationService.resetSlaveForDockingPoint(this.bike.DockingStationId, this.bike.DockingPointId).subscribe(data => {
      if (data.Status) {
        command.Timestamp = data.TimeStamp;
        this.setStatus(command.CommandId, CommandStatus.Sent);
        this.sent_commands.push(command);
      } else {
        this.setStatus(command.CommandId, CommandStatus.Failed);
      }
    }, error => {
      this.setStatus(command.CommandId, CommandStatus.Failed);
    });
  }

  sendDownloadDPLogCommand(): void {
    let command = this.getMCSCommand(this.bike.Serial, Commands.DownloadDPLog);

    this.dockingStationService.downloadDPLogForDockingPoint(this.bike.DockingStationId, this.bike.DockingPointId).subscribe(data => {
      if (data.Status) {
        command.Timestamp = data.TimeStamp;
        this.setStatus(command.CommandId, CommandStatus.Sent);
        this.sent_commands.push(command);
      } else {
        this.setStatus(command.CommandId, CommandStatus.Failed);
      }
    }, error => {
      this.setStatus(command.CommandId, CommandStatus.Failed);
    });
  }

  sendStartPassiveSessionCommand(mid: string, bikeId: number): void {
    let command = this.getMCSCommand(mid, Commands.StartPassiveSession);

    this.bikesService.sendStartPassiveSessionCommand(bikeId).subscribe(data => {
      if (data.Status) {
        command.Timestamp = data.TimeStamp;
        this.setStatus(command.CommandId, CommandStatus.Sent);
        this.sent_commands.push(command);

        //Reset by removing docking point related commands
        this.commands = [...COMMANDS];
      } else {
        this.setStatus(command.CommandId, CommandStatus.Failed);
      }
    }, error => {
      this.setStatus(command.CommandId, CommandStatus.Failed);
    });
  }

  sendStopPassiveSessionCommand(mid: string, bikeId: number): void {
    let command = this.getMCSCommand(mid, Commands.StopPassiveSession);

    this.bikesService.sendStopPassiveSessionCommand(bikeId).subscribe(data => {
      if (data.Status) {
        command.Timestamp = data.TimeStamp;
        this.setStatus(command.CommandId, CommandStatus.Sent);
        this.sent_commands.push(command);

        //Reset by removing docking point related commands
        this.commands = [...COMMANDS];
      } else {
        this.setStatus(command.CommandId, CommandStatus.Failed);
      }
    }, error => {
      this.setStatus(command.CommandId, CommandStatus.Failed);
    });
  }

  sendBikeLocateCommand(mid: string, bikeId: number): void {
    let command = this.getMCSCommand(mid, Commands.LocateBike);

    this.bikesService.sendLocateBikeCommand(bikeId).subscribe(data => {
      if (data.Status) {
        command.Timestamp = data.TimeStamp;
        this.setStatus(command.CommandId, CommandStatus.Sent);
        this.sent_commands.push(command);

        //Reset by removing docking point related commands
        this.commands = [...COMMANDS];
      } else {
        this.setStatus(command.CommandId, CommandStatus.Failed);
      }
    }, error => {
      this.setStatus(command.CommandId, CommandStatus.Failed);
    });
  }

  private setStatus(commandId, status: string): void {
    const index = this.getCommandIndex(commandId);
    const commands = this.commands;
    if (index >= 0) {
      commands[index].Status = status;
      this.commands = [...commands];
    }
  }

  private getCommandIndex(commandId: number): any {
    return this.commands.findIndex(c => c.CommandId == commandId);
  }

  private connectLive() {
    this.liveService = new LiveUpdateService(this.appSettings, this.loggerService, this.liveConnectionService);
    this.liveService.liveConnectionRequestBody = this.getRequestBody();
    let subscriber = new LiveSubscriber(this.bike.Serial, [], this.commandIds, 0);
    subscriber.updateCallback = (device, type, id, data) => this.onMessage(device, type, id, data);
    this.liveService.addSubscriber(subscriber);
    this.liveService.connect();
  }

  private getRequestBody(): LiveConnectRequest[] {
    let requestBody: LiveConnectRequest[] = [
      {
        MID: this.bike.Serial,
        ObservationIds: null,
        CommandIds: this.commandIds,
        ConnectAllCommands: false,
        ConnectAllObservations: false,
        InitObservationValues: false,
        ReceiveDevicePulse: false,
        PulseId: null
      }
    ];
    return requestBody;
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

  findCommandIndex(mid: string, commandId: number, timestamp: Date): any {
    let index = this.sent_commands.findIndex(c => c.MID == mid && c.CommandId == commandId && c.Timestamp == timestamp);
    return index;
  }

  removeCommand(index: number) {
    if (index >= 0) {
      this.sent_commands.splice(index, 1);
    }
  }

}
