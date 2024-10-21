import { Component, OnInit, Input } from '@angular/core';

import { DockingStation } from '../../core/models';
import { MapExtension } from '../../core/extensions';
import { LiveMap } from '../../core/constants/live-map';

@Component({
  selector: 'app-station-status',
  templateUrl: './station-status.component.html',
  styleUrls: ['./station-status.component.scss']
})
export class StationStatusComponent implements OnInit {

  @Input() station: DockingStation;

  color: string;
  status: string;
  dockingStationLegends: any;

  constructor() { }

  ngOnInit() {
    this.color = MapExtension.getStationFeatureColor(this.station);
    this.status = this.setDockingStationToolTip(this.station);
  }

  setDockingStationToolTip(data): string {
    let status = '';
    if (!data) return status;

    if (data.NumberOfAvailableBikes >= data.MinimumBikesRequired && data.NumberOfAvailableBikes >= data.IdealNumberOfBikes) {
      var dockingStationStatus = LiveMap.legendInfo.filter(e => e.color == "black");
      if (dockingStationStatus.length > 0)
        status = dockingStationStatus[0]['description'];
    }
    else if (data.NumberOfAvailableBikes < data.MinimumBikesRequired) {
      var dockingStationStatus = LiveMap.legendInfo.filter(e => e.color == "Red");
      if (dockingStationStatus.length > 0)
        status = dockingStationStatus[0]['description'];
    }
    else if (data.NumberOfAvailableBikes < data.IdealNumberOfBikes) {
      var dockingStationStatus = LiveMap.legendInfo.filter(e => e.color == "Orange");
      if (dockingStationStatus.length > 0)
        status = dockingStationStatus[0]['description'];
    }
    return status;
  }

}
