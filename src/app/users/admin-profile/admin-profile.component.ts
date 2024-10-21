import { SystemSettingsService } from './../../services/system-settings.service';
import { Component, OnInit, ViewChild } from '@angular/core';
import { Commands, CommandStatus } from '../../core/constants';
import { BikesService, LoggerService } from '../../services';
import { FormControl } from '@angular/forms';
import { ReplaySubject, Subject } from 'rxjs';
import { Area } from '../../core/models/common/area';
import { takeUntil } from 'rxjs/operators';
import { AreasService } from '../../services/areas.service';



const DPHWID = 450;
const COMMANDS = [
  {
    Id: 1,
    CommandId: Commands.PollSingle,
    Name: 'Poll Single',
    Category: 'General',
    Parameter: DPHWID,
    Status: ''
  },
  {
    Id: 2,
    CommandId: Commands.PollAll,
    Name: 'Poll All',
    Category: 'General',
    Parameter: '',
    Status: ''
  },
  {
    Id: 3,
    CommandId: Commands.Restart,
    Name: 'Restart',
    Category: 'General',
    Parameter: '',
    Status: ''
  },
  {
    Id: 4,
    CommandId: Commands.DownloadSettings,
    Name: 'Download Settings',
    Category: 'General',
    Parameter: '',
    Status: ''
  },
  {
    Id: 5,
    CommandId: Commands.UpgradeFirmware,
    Name: 'Upgrade Firmware',
    Category: 'General',
    Parameter: '',
    Status: ''
  }
];

@Component({
  selector: 'app-admin-profile',
  templateUrl: './admin-profile.component.html',
  styleUrls: ['./admin-profile.component.scss']
})

export class AdminProfileComponent implements OnInit {

  @ViewChild('commandsTable', { static: true }) table: any;

  param: number;
  commands = [];
  commandIds: number[] = [
    Commands.PollSingle,
    Commands.PollAll
  ];
  sent_commands: any[];
  minimumChargeLevel: any;
  systemConfigs: any;

  public areaCtrl: FormControl = new FormControl();
  public areaFilterCtrl: FormControl = new FormControl();
  public filteredArea: ReplaySubject<Area[]> = new ReplaySubject<Area[]>(1);
  minimumBikes: number;
  areas: Area[] = [];
  isSubmit: boolean = false;
  isAreaSelected: boolean = false;

  protected _onDestroy = new Subject<void>();

  constructor(
    private bikesService: BikesService,
    private loggerService: LoggerService,
    private systemSettingService: SystemSettingsService,
    private areasService: AreasService
  ) { }

  ngOnInit() {
    this.sent_commands = [];
    this.commands = [...COMMANDS];
    this.getSystemSettings();
    this.getAreaDetails();
    this.areaFilterCtrl.valueChanges
      .pipe(takeUntil(this._onDestroy))
      .subscribe(() => {
        this.filterAreas();
      });
  }

  toggleExpandGroup(group) {
    this.table.groupHeader.toggleExpandGroup(group);
  }

  getParameters(value) {
    if (value)
      this.param = value;
  }

  sendCommand(commandId: number): void {
    switch (commandId) {
      case Commands.PollSingle:
        this.SendPollSingleCommand();
        break;
      case Commands.PollAll:
        this.sendPollAllCommand();
        break;
      case Commands.Restart:
        this.sendRestartCommand();
        break;
      case Commands.DownloadSettings:
        this.sendDownloadSettingsCommand();
        break;
      case Commands.UpgradeFirmware:
        this.sendUpgradeFirmwareCommand();
        break;
    }
  }

  SendPollSingleCommand(): void {
    let command = this.getMCSCommand(Commands.PollSingle);
    if (command.Parameter) {
      this.setStatus(command.CommandId, CommandStatus.Sent);

      this.bikesService.SendPollSingleCommandToBikes(command.Parameter).subscribe(data => {
        if (data.Status) {
          command.Timestamp = data.TimeStamp;
          this.setStatus(command.CommandId, CommandStatus.Executed);
          this.sent_commands.push(command);
        } else {
          if (data === 'Incorrect parameter provided') {
            this.loggerService.showErrorMessage(data);
            this.setStatus(command.CommandId, CommandStatus.Failed);
          } else {
            this.setStatus(command.CommandId, CommandStatus.Rejected);
          }
        }
      }, error => {
        this.setStatus(command.CommandId, CommandStatus.Failed);
        //this.loggerService.showErrorMessage(error);
      });
    } else {
      this.loggerService.showErrorMessage("Command parameter not specified.");
    }
  }

  sendPollAllCommand(): void {
    let command = this.getMCSCommand(Commands.PollAll);
    this.setStatus(command.CommandId, CommandStatus.Sent);

    this.bikesService.sendPollAllCommandToBikes().subscribe(data => {
      if (data.Status) {
        command.Timestamp = data.TimeStamp;
        this.setStatus(command.CommandId, CommandStatus.Executed);
        this.sent_commands.push(command);
      } else {
        this.setStatus(command.CommandId, CommandStatus.Rejected);
      }
    }, error => {
      this.setStatus(command.CommandId, CommandStatus.Failed);
    });
  }

  sendRestartCommand(): void {
    let command = this.getMCSCommand(Commands.Restart);
    this.setStatus(command.CommandId, CommandStatus.Sent);

    this.bikesService.sendRestartCommandToBikes().subscribe(data => {
      if (data.Status) {
        command.Timestamp = data.TimeStamp;
        this.setStatus(command.CommandId, CommandStatus.Executed);
        this.sent_commands.push(command);
      } else {
        this.setStatus(command.CommandId, CommandStatus.Rejected);
      }
    }, error => {
      this.setStatus(command.CommandId, CommandStatus.Failed);
    });
  }

  sendDownloadSettingsCommand(): void {
    let command = this.getMCSCommand(Commands.DownloadSettings);
    this.setStatus(command.CommandId, CommandStatus.Sent);

    this.bikesService.sendDownloadSettingsCommandToBikes().subscribe(data => {
      if (data.Status) {
        command.Timestamp = data.TimeStamp;
        this.setStatus(command.CommandId, CommandStatus.Executed);
        this.sent_commands.push(command);
      } else {
        this.setStatus(command.CommandId, CommandStatus.Rejected);
      }
    }, error => {
      this.setStatus(command.CommandId, CommandStatus.Failed);
    });
  }

  sendUpgradeFirmwareCommand(): void {
    let command = this.getMCSCommand(Commands.UpgradeFirmware);
    this.setStatus(command.CommandId, CommandStatus.Sent);

    this.bikesService.sendUpgradeFirmwareCommandToBikes().subscribe(data => {
      if (data.Status) {
        command.Timestamp = data.TimeStamp;
        this.setStatus(command.CommandId, CommandStatus.Executed);
        this.sent_commands.push(command);
      } else {
        this.setStatus(command.CommandId, CommandStatus.Rejected);
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

  getMCSCommand(commandId: number): any {
    let now = new Date();
    let expire = new Date(now).setMinutes(now.getMinutes() + 1);
    return {
      CommandId: commandId,
      Timestamp: now.toISOString(),
      ExpiresAt: new Date(expire).toISOString(),
      Parameter: this.param
    }
  }

  private getCommandIndex(commandId: number): any {
    return this.commands.findIndex(c => c.CommandId == commandId);
  }

  findCommandIndex(commandId: number): any {
    let index = this.sent_commands.findIndex(c => c.CommandId == commandId);
    return index;
  }

  removeCommand(index: number) {
    if (index >= 0) {
      this.sent_commands.splice(index, 1);
    }
  }

  getSystemSettings() {
    this.systemSettingService.getSETTING().subscribe(data => {
      this.systemConfigs = data;
      this.minimumChargeLevel = data.MinChargeLevel;
    }, err => {

    });
  }

  updateSystemSettings() {
    this.minimumChargeLevel = Math.round(this.minimumChargeLevel);
    if (this.minimumChargeLevel > 100 || this.minimumChargeLevel < 0) {
      this.loggerService.showErrorMessage("Invalid value for minimum chargel level.");
      this.minimumChargeLevel = this.systemConfigs["MinChargeLevel"];
    }
    else if (this.minimumChargeLevel == this.systemConfigs["MinChargeLevel"]) {
      this.loggerService.showSuccessfulMessage("Minimum chargel level is already up to date.");
    }
    else {
      this.systemConfigs["MinChargeLevel"] = this.minimumChargeLevel;
      this.systemSettingService.updateSETTING(this.systemConfigs).subscribe(res => {
        this.loggerService.showSuccessfulMessage("Minimum chargel level has been updated successfully.");
      }, err => {
        this.loggerService.showErrorMessage("Error while updating minimum chargel level.");
      });
    }
  }

  getAreaDetails() {
    this.areasService.getAssignOrDefaultAreasForUser().subscribe(
      res => {
        this.areas = res;
        this.filteredArea.next(this.areas.slice());
      },
      error => {
        if (error.status == 403) {
          this.loggerService.showErrorMessage("Don't have permission to obtain data");
        } else {
          this.loggerService.showErrorMessage(error);
        }
      }
    );
  }

  filterAreas() {
    if (!this.areas) { return; }

    // get the search keyword
    let search = this.areaFilterCtrl.value;
    if (!search) {
      this.filteredArea.next(this.areas.slice());
      return;
    } else {
      search = search.toLowerCase();
    }

    // filter the areas
    this.filteredArea.next(
      this.areas.filter(area => area.Name.toLowerCase().indexOf(search) > -1)
    );
  }

  updateMinimumBikes() {
    if (!this.areaCtrl.value?.AreaId) {
      this.loggerService.showErrorMessage("Please select an area.");
      return;
    }

    this.isSubmit = true;
    this.areasService.updateMinimumBikes(this.areaCtrl.value?.AreaId, this.minimumBikes)
      .subscribe(_ => {
        this.loggerService.showSuccessfulMessage(
          "Minimum bikes successfully updated."
        );
        this.isSubmit = false;
        this.isAreaSelected = false;
        this.minimumBikes = 0;
        this.getAreaDetails();
      }, error => {
        if (error.status == 400) {
          this.loggerService.showErrorMessage("Error occurred while updating minimum bikes of the area.");
        } else if (error.status == 404) {
          this.loggerService.showErrorMessage("Minimum bikes of the area not found.");
        } else {
          this.loggerService.showErrorMessage("Updating minimum bikes of the area failed.");
        }
      });
  }

  setMinimumBikesOfArea(isOpened: boolean) {
    if (!isOpened && this.areaCtrl.value?.AreaId > 0) {
      this.minimumBikes = this.areaCtrl.value?.MinimumBikes;
      this.isAreaSelected = true;
    } else {
      this.isAreaSelected = false;
    }
  }

}
