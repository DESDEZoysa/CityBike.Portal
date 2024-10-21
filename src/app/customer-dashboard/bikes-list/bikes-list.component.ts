import { Component, OnInit } from '@angular/core';
import { DockingStationService, LoggerService, BikesService } from '../../services';
import { ActivatedRoute } from '@angular/router';
import { LocalStorageKeys } from '../../core/constants';

@Component({
  selector: 'app-bikes-list',
  templateUrl: './bikes-list.component.html',
  styleUrls: ['./bikes-list.component.scss']
})
export class BikesListComponent implements OnInit {
  dockingStationId = 0;
  endUserId;
  bikes: any;
  isDisabled: boolean = true;

  constructor(
    private dockingStationService: DockingStationService,
    private bikesService: BikesService,
    private route: ActivatedRoute,
    private loggerService: LoggerService) {
    this.dockingStationId = route.snapshot.params['dockingstationid'];
    this.endUserId = JSON.parse(localStorage.getItem(LocalStorageKeys.USER_DETAILS)).UserId;
  }

  ngOnInit() {
    this.getReleasableBikesDetails();
  }

  getReleasableBikesDetails() {
    this.dockingStationService.getReleasableBikesDetails(this.dockingStationId, this.endUserId).subscribe(data => {
      this.bikes = data;
    },
      error => {
        this.loggerService.showErrorMessage("Error occurred while obtaining bike details.");
      }
    );
  }

  onBlinkClicked(bikeId) {
    this.bikesService.sendBlinkCommand(bikeId).subscribe(data => {
      if (data.Status) {
        this.loggerService.showSuccessfulMessage("Command executed Successfully.");
      } else {
        this.loggerService.showErrorMessage("Command not executed.");
      }
    },
      error => {
        this.loggerService.showErrorMessage("Error occurred while executing command.");
      }
    );
  }

  onReleaseClick(bikeId) {
    this.bikesService.releaseBike(bikeId, this.endUserId).subscribe(data => {
      this.loggerService.showSuccessfulMessage("Bike Successfully Released.");
    },
      error => {
        this.loggerService.showErrorMessage("Error occurred while releasing the bike.");
      }
    );
  }
}
