
import { forkJoin as observableForkJoin, Observable } from 'rxjs';
import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { LoggerService, DockingStationService } from '../../services';
import { Router } from '@angular/router';

let DockingStationId = new FormControl({ value: '', disabled: true }, Validators.required);
//let DockingStationId = new FormControl('', Validators.required);
let HardwareId = new FormControl('', Validators.maxLength(16));
let VisualId = new FormControl('', Validators.required);
let ApplicationVersion = new FormControl({ value: '', disabled: true });

@Component({
  selector: 'app-docking-point-edit',
  templateUrl: './docking-point-edit.component.html',
  styleUrls: ['./docking-point-edit.component.scss']
})
export class DockingPointEditComponent implements OnInit {

  public form: FormGroup;
  selected;
  dockingStationId;
  dockingPointId;
  dockingStationName = "";
  dockingStationDetails;
  dropdownDisable: boolean = false;

  dockingPointDetails = {
    DockingStationId: "",
    HardwareId: "",
    VisualId: "",
    ApplicationVersion: "",
    State: ""
  };

  dockingPointState = [
    { value: '1', viewValue: 'Available' },
    { value: '2', viewValue: 'Occupied' },
    { value: '3', viewValue: 'Disabled' }
  ];

  constructor(private router: Router, private dockingStationService: DockingStationService, private fb: FormBuilder, private loggerService: LoggerService) {
    this.dockingStationId = parseInt(this.router.url.split('/')[2]);
    this.dockingPointId = this.router.url.split('/')[4];

    if (this.dockingPointId == "create") {
      this.dropdownDisable = true;
    }
  }

  ngOnInit() {
    this.form = this.fb.group({
      DockingStationId: DockingStationId,
      HardwareId: HardwareId,
      VisualId: VisualId,
      ApplicationVersion: ApplicationVersion,
    });

    this.getDockingPointDetails();
  }

  getDockingPointDetails() {
    if (this.dockingPointId == "create") {
      this.dockingStationService.getDockingStation(this.dockingStationId, false)
        .subscribe((data) => {
          this.dockingStationName = data.Name;
          this.selected = this.dockingPointState.find(x => x.value == "1").value; //Available
        }, (error: any) => {
          this.loggerService.showErrorMessage('Error occured while obtaning station details.');
        });

    } else {
      observableForkJoin(this.dockingStationService.getDockingPointDetails(this.dockingStationId, this.dockingPointId),
        this.dockingStationService.getDockingStation(this.dockingStationId, false))
        .subscribe(data => {
          this.dockingPointDetails = data[0];
          this.dockingStationDetails = data[1];
          this.dockingStationName = this.dockingStationDetails.Name;
          this.selected = this.dockingPointState.find(x => x.value == this.dockingPointDetails.State).value;
        }, (error: any) => {
          this.loggerService.showErrorMessage('Error occured while obtaning docking point details.');
        });
    }
  }

  onStateChange(event) {
    this.dockingPointDetails.State = event.value;
  }

  onSubmit() {
    if (this.dockingPointId == "create") {
      this.dockingPointDetails.DockingStationId = this.dockingStationId;
      this.dockingPointDetails.State = this.dockingPointState.find(x => x.value == "1").value;

      this.dockingStationService.createDockingPoint(this.dockingStationId, this.dockingPointDetails)
        .subscribe((data) => {
          if (data != null) {
            this.loggerService.showErrorMessage('Successfully created the docking point.');
            this.router.navigateByUrl('/dockingStations/' + this.dockingStationId + '/dockingpoints');
          }
        }, (error: any) => {
          this.loggerService.showErrorMessage('Error occured while creating point.');
        });

    } else {
      this.dockingStationService.updateDockingPointDetails(this.dockingStationId, this.dockingPointId, this.dockingPointDetails)
        .subscribe((response: Response) => {
          if (response) {
            this.loggerService.showErrorMessage('Successfully updated docking point details.');
            this.router.navigateByUrl('/dockingStations/' + this.dockingStationId + '/dockingpoints');
          }
        }, (error: any) => {
          this.loggerService.showErrorMessage('Error occured while updating docking point details.');
        });
    }
  }
}