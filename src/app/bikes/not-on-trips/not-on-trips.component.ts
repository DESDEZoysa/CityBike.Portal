import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { BikesService, LoggerService, } from '../../services';
import { BikeAddress } from '../../core/models';

@Component({
  selector: 'app-not-on-trips',
  templateUrl: './not-on-trips.component.html',
  styleUrls: ['./not-on-trips.component.scss']
})
export class NotOnTripsComponent implements OnInit {
  @ViewChild('bikeTable', { static: true }) table: any;

  bikes: any[];
  loadingIndicator: boolean = true;
  isMobile: boolean = false;

  constructor(
    private bikesService: BikesService,
    private loggerService: LoggerService,
    private router: Router) {
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      this.isMobile = true;
    }
  }

  onResize() {
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      this.isMobile = true;
    } else {
      this.isMobile = false;
    }
  }

  ngOnInit() {
    this.getBikesNotOnTrips();
  }

  getBikesNotOnTrips() {
    this.bikesService.getBikesOnTrips(false).subscribe(data => {
      this.bikes = data;
      this.loadingIndicator = false;
    }, error => {
      this.loadingIndicator = false;
      if (error.status == 403) {
        this.loggerService.showErrorMessage("Don't have permission to obtain data");
      } else {
        this.loggerService.showErrorMessage('Error while getting bike information');
      }
    });
  }

  updateAddress(data: BikeAddress): void {
    let index = this.bikes.findIndex(i => i.BikeId == data.BikeId);
    if (index >= 0) {
      this.bikes[index].Address = data.Address;
    }
  }

  ridirectUrlAll() {
    this.router.navigateByUrl('/bikes');
  }

  ridirectUrlTrips() {
    this.router.navigateByUrl('/bikes/ontrips');
  }

  toggleExpandRow(row) {
    this.table.rowDetail.toggleExpandRow(row);
  }
}
