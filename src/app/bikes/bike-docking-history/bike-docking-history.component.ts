import { Component, Input, OnInit } from '@angular/core';
import { LocalStorageKeys } from '../../core/constants';
import { UserRoles } from '../../core/constants/user-roles';
import { Bike } from '../../core/models';
import { BikesService, LoggerService } from '../../services';
import * as moment from "moment";
import { ConvertTimePipe } from '../../core/pipes/convert-time.pipe';

@Component({
  selector: 'app-bike-docking-history',
  templateUrl: './bike-docking-history.component.html',
  styleUrls: ['./bike-docking-history.component.scss'],
  providers: [ConvertTimePipe]
})
export class BikeDockingHistoryComponent implements OnInit {
  @Input() bike: Bike;

  undockCmdHistory: any[];
  resultLength: number;
  isDPHistoryLoading: boolean = false;
  expandHistory: boolean = true;

  constructor(private bikesService: BikesService, private loggerService: LoggerService, private convertTime: ConvertTimePipe) { }

  ngOnInit() {
    this.geteBikeDetails();
  }

  geteBikeDetails() {
    if (this.bike) {
      this.isDPHistoryLoading = true;
      this.bikesService.getUndockCommmandHistory(this.bike.BikeId)
        .subscribe(result => {
          if (result != null) {
            this.resultLength = result['UndockCommandHistory'].length;
            this.undockCmdHistory = result['UndockCommandHistory'].sort((a, b) => b.CommandTimestamp - a.CommandTimestamp);
            this.undockCmdHistory.map((x: any) => this.mapDisplayText(x));
          }
          this.isDPHistoryLoading = false;
        }, error => {
          this.loggerService.showErrorMessage("Getting docking history failed!");
          this.isDPHistoryLoading = false;
        });
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

  private mapFailedCommandHistory(undockHistory: any, commandTimestamp: string) {
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
}
