import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { MapComponent } from '../../shared/map/map.component';
import { DockingStationService, LoggerService } from '../../services';



@Component({
  selector: 'app-stations-map',
  templateUrl: './stations-map.component.html',
  styleUrls: ['./stations-map.component.scss']
})
export class StationsMapComponent implements OnInit {
  @ViewChild('stationMap', { static: true }) stationMap: MapComponent;

  stationId: number;
  stationName: string;

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private stationService: DockingStationService,
    private loggerService: LoggerService
  ) {
    this.stationId = parseInt(this.router.url.split('/')[2]);
  }

  ngOnInit() {
    this.getDockingStation();
  }

  getDockingStation() {
    this.stationService.getDockingStation(this.stationId, false).subscribe(data => {
      this.stationName = data.Name;
      this.stationMap.addDockingStation(data);
    }, error => {
      this.loggerService.showErrorMessage(error);
    })
  }

}
