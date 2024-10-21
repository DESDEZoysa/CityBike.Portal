import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { BikesService, LoggerService, ReverseGeocodingService } from '../../services';
import { Bike, BikeAddress, Address } from '../../core/models';

@Component({
  selector: 'app-bike-address',
  templateUrl: './bike-address.component.html',
  styleUrls: ['./bike-address.component.scss']
})
export class BikeAddressComponent implements OnInit {

  @Input() bike: Bike;
  @Input() static: boolean;
  @Output() onAddressReceived = new EventEmitter<BikeAddress>();

  constructor(
    private loggerService: LoggerService,
    private reverseGeocodingService: ReverseGeocodingService,
    private bikeService: BikesService
  ) { }

  ngOnInit() {
  }

  findAddress($event): void {
    let id = this.bike['RepairId'] != null ? this.bike['RepairId'] : this.bike.BikeId;

    if (this.bike.Position != null) {
      if (!this.bike.DockingStationId &&
        (this.bike.DisabledReason == 1 || this.bike.DisabledReason == 2 ||
          this.bike.DisabledReason == 21 || this.bike.DisabledReason == 4)) {
        this.bikeService.getWorkshopOrCarOrStorageLocation(this.bike.BikeId).subscribe(locationInfo => {
          if (locationInfo) {
            this.bike["Address"] = locationInfo["Address"];
            this.bike["Address"]["DisplayText"] = locationInfo["DisplayText"];
            this.bike["LocationName"] = locationInfo["Name"];
          }
          let bikeAddress: BikeAddress = {
            Id: id,
            BikeId: this.bike.BikeId,
            Address: this.bike["Address"]
          };
          // this.bike.Address = data;
          this.onAddressReceived.next(bikeAddress);
        }, err => {

        });
      }
      else {
        this.reverseGeocodingService.getReverseGeocoding(this.bike.Position.Longitude, this.bike.Position.Latitude)
          .subscribe(data => {
            let bikeAddress: BikeAddress = {
              Id: id,
              BikeId: this.bike.BikeId,
              Address: data
            };
            // this.bike.Address = data;
            this.onAddressReceived.next(bikeAddress);
          }, error => {
            this.loggerService.showErrorMessage("Error while getting address");
          });
      }

    } else {
      let address: Address = {
        Country: "",
        City: "",
        District: "",
        Street: "",
        ZipCode: "",
        DisplayText: "Position not available"
      };
      let bikeAddress: BikeAddress = {
        Id: id,
        BikeId: this.bike.BikeId,
        Address: address
      };
      this.onAddressReceived.next(bikeAddress);
    }
    //In create-waypoint-popup, bike address lookup click should prevent dropdown option selection event
    $event.preventDefault();
    $event.stopPropagation();
  }
}
