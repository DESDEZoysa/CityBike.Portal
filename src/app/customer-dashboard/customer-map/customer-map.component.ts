import { Component, OnInit, ViewChild } from '@angular/core';

import { MapComponent } from '../../shared/map/map.component';
import { DockingStationService, LoggerService } from '../../services';

@Component({
  selector: 'app-customer-map',
  templateUrl: './customer-map.component.html',
  styleUrls: ['./customer-map.component.scss']
})
export class CustomerMapComponent implements OnInit {
  @ViewChild('userMap', { static: true }) stationMap: MapComponent;

  constructor(
    private stationService: DockingStationService,
    private loggerService: LoggerService
  ) { }

  ngOnInit() {
    this.getDockingStations();
  }

  getDockingStations() {
    this.stationService.getDockingStations(false).subscribe(data => {
      this.stationMap.addDockingStations(data);
    }, error => {
      this.loggerService.showErrorMessage(error);
    })
  }

}
