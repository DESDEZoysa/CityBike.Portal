import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { MatSelect } from '@angular/material/select';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { ReplaySubject, Subject } from 'rxjs-compat';
import { takeUntil } from 'rxjs/operators';
import { WaypointType } from '../../core/enums/waypointTypes';
import { Bike, BikeAddress, DockingStation } from '../../core/models';

export interface WaypointCreationData {
  allDockingStations: any;
  allBikes: any;
  allWorkshops: any;
  allStorages: any;
}

@Component({
  selector: 'app-create-waypoint-popup',
  templateUrl: './create-waypoint-popup.component.html',
  styleUrls: ['./create-waypoint-popup.component.scss']
})
export class CreateWaypointPopupComponent implements OnInit {
  /**Search related */

  //docking station
  public dsCtrl: FormControl = new FormControl();
  public dsFilterCtrl: FormControl = new FormControl();
  public filteredDockingStations: ReplaySubject<DockingStation[]> = new ReplaySubject<DockingStation[]>(1);

  //bike
  public bikeCtrl: FormControl = new FormControl();
  public bikeFilterCtrl: FormControl = new FormControl();
  public filteredBikes: ReplaySubject<Bike[]> = new ReplaySubject<Bike[]>(1);

  //workshop
  public wsCtrl: FormControl = new FormControl();
  public wsFilterCtrl: FormControl = new FormControl();
  public filteredWorkshops: ReplaySubject<any[]> = new ReplaySubject<any[]>(1);

  //storage
  public storageCtrl: FormControl = new FormControl();
  public storageFilterCtrl: FormControl = new FormControl();
  public filteredStorages: ReplaySubject<any[]> = new ReplaySubject<any[]>(1);

  @ViewChild('singleSelect') singleSelect: MatSelect;
  private _onDestroy = new Subject<void>();

  isLoading: any;
  waypointTypeId: any = 1;
  waypointTypes: any[] = [
    { "id": 1, "name": "ROUTES.DOCKING_STATION" },
    { "id": 2, "name": "ROUTES.BIKE" },
    { "id": 3, "name": "ROUTES.WORKSHOP" },
    { "id": 4, "name": "ROUTES.STORAGE" }
  ];
  selectedWaypoint: any;
  allStorages: any[];
  allDockingStations: any;
  allBikes: any;
  allWorkshops: any;

  constructor(
    private router: Router,
    private translate: TranslateService,
    public dialogRef: MatDialogRef<CreateWaypointPopupComponent>,
    @Inject(MAT_DIALOG_DATA) public data: WaypointCreationData,
    public dialog: MatDialog) {
    this.isLoading = false;
  }

  ngOnInit() {
    this.allDockingStations = this.data.allDockingStations;
    this.allBikes = this.data.allBikes;
    this.allWorkshops = this.data.allWorkshops;
    this.allStorages = this.data.allStorages;
    this.loadInitialData();
  }

  addWaypoint() {
    if (this.dsCtrl.value || this.bikeCtrl.value || this.wsCtrl.value || this.storageCtrl.value) {
      var selectedWaypoint;
      if (this.waypointTypeId == WaypointType.DockingStation)
        selectedWaypoint = this.dsCtrl.value;
      else if (this.waypointTypeId == WaypointType.Bike)
        selectedWaypoint = this.bikeCtrl.value;
      else if (this.waypointTypeId == WaypointType.Workshop)
        selectedWaypoint = this.wsCtrl.value;
      else if (this.waypointTypeId == WaypointType.Storage)
        selectedWaypoint = this.storageCtrl.value;
      this.dialogRef.close({ "waypointTypeId": this.waypointTypeId, "selectedWaypoint": selectedWaypoint });
    }
  }

  loadInitialData() {
    this.filteredDockingStations.next(this.allDockingStations.slice());
    this.filteredBikes.next(this.allBikes.slice());
    this.filteredWorkshops.next(this.allWorkshops.slice());
    this.filteredStorages.next(this.allStorages.slice());

    // listen for search field value changes
    this.dsFilterCtrl.valueChanges
      .pipe(takeUntil(this._onDestroy))
      .subscribe(() => {
        this.filterDockingStations();
      });

    this.bikeFilterCtrl.valueChanges
      .pipe(takeUntil(this._onDestroy))
      .subscribe(() => {
        this.filterBikes();
      });

    this.wsFilterCtrl.valueChanges
      .pipe(takeUntil(this._onDestroy))
      .subscribe(() => {
        this.filterWorkshops();
      });

    this.storageFilterCtrl.valueChanges
      .pipe(takeUntil(this._onDestroy))
      .subscribe(() => {
        this.filterStorages();
      });
  }

  ngOnDestroy() {
    this._onDestroy.next();
    this._onDestroy.complete();
  }

  private filterDockingStations() {
    if (!this.allDockingStations) {
      return;
    }
    // get the search keyword
    let search = this.dsFilterCtrl.value;
    if (!search) {
      this.filteredDockingStations.next(this.allDockingStations.slice());
      return;
    } else {
      search = search.toLowerCase();
    }
    // filter the docking stations
    this.filteredDockingStations.next(
      this.allDockingStations.filter(ds => ds.Name.toLowerCase().indexOf(search) > -1)
    );
  }

  private filterBikes() {
    if (!this.allBikes) {
      return;
    }
    // get the search keyword
    let search = this.bikeFilterCtrl.value;
    if (!search) {
      this.filteredBikes.next(this.allBikes.slice());
      return;
    } else {
      search = search.toLowerCase();
    }
    // filter the bikes
    this.filteredBikes.next(
      this.allBikes.filter(ds => ds.VisualId.toLowerCase().indexOf(search) > -1)
    );
  }

  private filterWorkshops() {
    if (!this.allWorkshops) {
      return;
    }
    // get the search keyword
    let search = this.wsFilterCtrl.value;
    if (!search) {
      this.filteredWorkshops.next(this.allWorkshops.slice());
      return;
    } else {
      search = search.toLowerCase();
    }
    // filter the workshops
    this.filteredWorkshops.next(
      this.allWorkshops.filter(ds => ds.Name.toLowerCase().indexOf(search) > -1)
    );
  }

  private filterStorages() {
    if (!this.allStorages) {
      return;
    }
    // get the search keyword
    let search = this.storageFilterCtrl.value;
    if (!search) {
      this.filteredStorages.next(this.allStorages.slice());
      return;
    } else {
      search = search.toLowerCase();
    }
    // filter the storages
    this.filteredStorages.next(
      this.allStorages.filter(ds => ds.Name.toLowerCase().indexOf(search) > -1)
    );
  }

  updateAddress(data: BikeAddress): void {
    let index = this.allBikes.findIndex(i => i.BikeId == data.BikeId);
    if (index >= 0) {
      this.allBikes[index].Address = data.Address;
    }
  }

}
