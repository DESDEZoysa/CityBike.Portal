import { Component, OnInit } from '@angular/core';
import { DockingStationService } from '../../services';

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.css']
})
export class AboutComponent implements OnInit {

  public dockingPoints: any[];

  constructor(protected dockingStationService: DockingStationService) {
    this.dockingPoints = [];

  }

  ngOnInit() {
    this.dockingStationService
      .getDockingPointsInDockingStation(1)
      .subscribe((data) => this.dockingPoints = data);
  }
}
