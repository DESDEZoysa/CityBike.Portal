import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { BikesService, LoggerService, } from '../../services';
import { BikeAddress } from '../../core/models';

@Component({
  selector: 'app-on-trips',
  templateUrl: './on-trips.component.html',
  styleUrls: ['./on-trips.component.scss']
})
export class OnTripsComponent implements OnInit {
  @ViewChild('bikeTable', { static: true }) table: any;

  bikes: any[];
  loadingIndicator: boolean = true;
  isMobile: boolean = false;

  constructor(
    private bikesService: BikesService,
    private loggerService: LoggerService,
    private router: Router
  ) {
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      this.isMobile = true;
    }
  }

  ngOnInit() {
    this.getBikesOnTrips();
  }

  onResize() {
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      this.isMobile = true;
    } else {
      this.isMobile = false;
    }
  }

  getBikesOnTrips() {
    this.bikesService.getBikesOnTrips(true).subscribe(data => {
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

  ridirectUrlNoTrips() {
    this.router.navigateByUrl('/bikes/notontrips');
  }

  ridirectUrlAll() {
    this.router.navigateByUrl('/bikes');
  }

  toggleExpandRow(row) {
    this.table.rowDetail.toggleExpandRow(row);
  }
}
