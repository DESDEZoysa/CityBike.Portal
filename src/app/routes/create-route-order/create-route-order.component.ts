import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSelect } from '@angular/material/select';
import { ActivatedRoute, Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { ReplaySubject, Subject } from 'rxjs-compat';
import { forkJoin } from 'rxjs/internal/observable/forkJoin';
import { takeUntil } from 'rxjs/operators';
import { UserRole } from '../../core/enums/userRole';
import { WaypointType } from '../../core/enums/waypointTypes';
import { DockingStation } from '../../core/models/dock/docking-station';
import { BikesService, DockingStationService, LoggerService } from '../../services';
import { RouteService } from '../../services/route.service';
import { StorageService } from '../../services/storage.service';
import { UserService } from '../../services/users.service';
import { WorkshopService } from '../../services/workshop.service';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';
import { CreateWaypointPopupComponent } from '../create-waypoint-popup/create-waypoint-popup.component';
import { BikeDisableState } from '../../core/enums/bikeDisableState';
import { LocalStorageKeys } from '../../core/constants';
import { UserRoles } from '../../core/constants/user-roles';

@Component({
  selector: 'app-create-route-order',
  templateUrl: './create-route-order.component.html',
  styleUrls: ['./create-route-order.component.scss']
})
export class CreateRouteOrderComponent implements OnInit {

  routeId: any;
  waypoints: any[];
  deletedWaypoints: any[];
  isMobile: boolean;
  allStorages: any;
  allDockingStations: DockingStation[];
  allBikes: any;
  allWorkshops: any;
  mappedStorages: any;
  mappedDockingStations: DockingStation[];
  mappedBikes: any;
  mappedWorkshops: any;
  allUsers: any[];

  //users
  public userCtrl: FormControl = new FormControl();
  public userFilterCtrl: FormControl = new FormControl();
  public filteredUsers: ReplaySubject<any[]> = new ReplaySubject<any[]>(1);
  @ViewChild('singleSelect') singleSelect: MatSelect;
  private _onDestroy = new Subject<void>();
  routeData: any;
  auth_token: any;
  isStreetTeam: boolean;
  loggedInUser: any;

  constructor(private dialog: MatDialog,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private dockingStationService: DockingStationService,
    private bikeService: BikesService,
    private workshopService: WorkshopService,
    private storageService: StorageService,
    private userService: UserService,
    private spinner: NgxSpinnerService,
    private routeService: RouteService,
    private loggerService: LoggerService) {
  }

  ngOnInit() {
    this.getLoggedInUserRole();
    if (this.auth_token._claims[0] != UserRoles.STREET_TEAM)
      this.getAllDefaultData();
    else
      this.getAllDefaultDataForStreetTeam();
    this.waypoints = [];
    this.deletedWaypoints = [];
  }

  onResize() {
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) && (document.documentElement.clientWidth < 768)) {
      this.isMobile = true;
    } else {
      this.isMobile = false;
    }
  }

  getAllDefaultData() {
    this.spinner.show();
    this.activatedRoute.params.subscribe(params => {
      this.routeId = params["id"];
    });

    let observables = [
      this.dockingStationService.getDockingStations(false),
      this.bikeService.getBikes(),
      this.workshopService.GetAllWorkshops(),
      this.storageService.getAllStorages(),
      this.userService.getSystemUsers()
    ];
    if (this.routeId)
      observables.push(this.routeService.getRouteDataById(this.routeId));

    forkJoin(observables).subscribe(res => {
      this.allDockingStations = res[0];
      this.allDockingStations.sort((a, b) => (a.Name > b.Name) ? 1 : -1);
      this.mappedDockingStations = this.allDockingStations;
      let freeBikes = res[1].filter(x => !x.DockingStationId && !x.InSession
        && (x.DisabledReason != BikeDisableState.InStorage && x.DisabledReason != BikeDisableState.Missing
          && x.DisabledReason != BikeDisableState.InWorkshop
          && x.DisabledReason != BikeDisableState.ToWorkshop
          && x.DisabledReason != BikeDisableState.RepairFinished
          && x.DisabledReason != BikeDisableState.Moving));
      this.allBikes = freeBikes;
      this.mappedBikes = this.allBikes;
      this.allWorkshops = res[2];
      this.allWorkshops.sort((a, b) => (a.Name > b.Name) ? 1 : -1);
      this.mappedWorkshops = this.allWorkshops;
      this.allStorages = res[3];
      this.allStorages.sort((a, b) => (a.Name > b.Name) ? 1 : -1);
      this.mappedStorages = this.allStorages;
      this.allUsers = res[4];
      this.allUsers = this.allUsers.filter(u => u.Roles.length > 0 &&
        u.Roles.some(r => r.RoleId == UserRole.StreetTeam));
      this.allUsers.map(x => {
        x["Name"] = `${x["FirstName"]} ${x["LastName"]}`;
        return;
      });
      this.filteredUsers.next(this.allUsers.slice());

      // listen for search field value changes
      this.userFilterCtrl.valueChanges
        .pipe(takeUntil(this._onDestroy))
        .subscribe(() => {
          this.filterUsers();
        });

      this.routeData = res[5];
      if (this.routeData)
        this.mapRouteData();

      this.spinner.hide();
    }, err => {
      this.spinner.hide();
    });
  }

  getAllDefaultDataForStreetTeam() {
    this.spinner.show();
    this.activatedRoute.params.subscribe(params => {
      this.routeId = params["id"];
    });

    let observables = [
      this.dockingStationService.getDockingStations(false),
      this.bikeService.getBikes(),
      this.workshopService.GetAllWorkshops(),
      this.storageService.getAllStorages()
    ];
    if (this.routeId)
      observables.push(this.routeService.getRouteDataById(this.routeId));

    forkJoin(observables).subscribe(res => {
      this.allDockingStations = res[0];
      this.allDockingStations.sort((a, b) => (a.Name > b.Name) ? 1 : -1);
      this.mappedDockingStations = this.allDockingStations;
      let freeBikes = res[1].filter(x => !x.DockingStationId && !x.InSession
        && (x.DisabledReason != BikeDisableState.InStorage && x.DisabledReason != BikeDisableState.Missing
          && x.DisabledReason != BikeDisableState.InWorkshop
          && x.DisabledReason != BikeDisableState.ToWorkshop
          && x.DisabledReason != BikeDisableState.RepairFinished
          && x.DisabledReason != BikeDisableState.Moving));
      this.allBikes = freeBikes;
      this.mappedBikes = this.allBikes;
      this.allWorkshops = res[2];
      this.allWorkshops.sort((a, b) => (a.Name > b.Name) ? 1 : -1);
      this.mappedWorkshops = this.allWorkshops;
      this.allStorages = res[3];
      this.allStorages.sort((a, b) => (a.Name > b.Name) ? 1 : -1);
      this.mappedStorages = this.allStorages;
      this.allUsers = [];
      this.filteredUsers.next(this.allUsers.slice());

      // listen for search field value changes
      this.userFilterCtrl.valueChanges
        .pipe(takeUntil(this._onDestroy))
        .subscribe(() => {
          this.filterUsers();
        });

      this.routeData = res[4];
      if (this.routeData)
        this.mapRouteData();

      this.spinner.hide();
    }, err => {
      this.spinner.hide();
    });
  }


  deleteWaypoint(index: any) {
    let waypoint = this.waypoints.splice(index, 1);
    let deletedWaypoint = waypoint[0];
    deletedWaypoint["IsDeleted"] = true;
    this.deletedWaypoints.push(deletedWaypoint);
    this.waypoints.map((x, currentIndex) => {
      x["Order"] = currentIndex;
      return;
    });
    //reassign variable for change detection in child component (ngonchanges not trigger for object changes)
    this.waypoints = [...this.waypoints];
  }

  arrangeWaypoints() {
    if (this.waypoints.length > 0) {
      let dockingStations = this.waypoints.filter(x => x.DockingStationId);
      let bikes = this.waypoints.filter(x => x.BikeId);
      let workshops = this.waypoints.filter(x => x.WorkshopId);
      let storages = this.waypoints.filter(x => x.StorageId);

      let excludeDSIds = new Set(dockingStations.map(d => d.DockingStationId));
      let excludeBikeIds = new Set(bikes.map(b => b.BikeId));
      let excludeWorkshopIds = new Set(workshops.map(w => w.WorkshopId));
      let excludeStorageIds = new Set(storages.map(s => s.StorageId));

      this.mappedDockingStations = this.allDockingStations.filter(d => !excludeDSIds.has(d.DockingStationId));
      this.mappedBikes = this.allBikes.filter(b => !excludeBikeIds.has(b.BikeId));
      this.mappedWorkshops = this.allWorkshops.filter(w => !excludeWorkshopIds.has(w.Id));
      this.mappedStorages = this.allStorages.filter(s => !excludeStorageIds.has(s.Id));
    }
  }

  addNewWaypoint() {
    this.arrangeWaypoints();
    const dialogAddWaypoint = this.dialog.open(CreateWaypointPopupComponent, {
      width: '400px',
      data: {
        allDockingStations: this.mappedDockingStations,
        allBikes: this.mappedBikes,
        allWorkshops: this.mappedWorkshops,
        allStorages: this.mappedStorages
      },
      // disableClose: true
    });

    dialogAddWaypoint.afterClosed().subscribe(result => {
      if (result) {
        let waypoint = {
          "RouteId": this.routeId,
          "DockingStationId": null,
          "Name": "",
          "BikeId": null,
          "VisualId": null,
          "WorkshopId": null,
          "StorageId": null,
          "IsSkipped": false,
          "Comment": null,
          "Order": 0
        }
        let waypointTypeId = result["waypointTypeId"];
        let waypointData = result["selectedWaypoint"];
        if (waypointTypeId == WaypointType.DockingStation) {
          waypoint["DockingStationId"] = waypointData["DockingStationId"];
          waypoint["Name"] = waypointData["Name"];
        }
        else if (waypointTypeId == WaypointType.Bike) {
          waypoint["BikeId"] = waypointData["BikeId"];
          waypoint["Name"] = waypointData["VisualId"];
        }
        else if (waypointTypeId == WaypointType.Workshop) {
          waypoint["WorkshopId"] = waypointData["Id"];
          waypoint["Name"] = waypointData["Name"];
        }
        else if (waypointTypeId == WaypointType.Storage) {
          waypoint["StorageId"] = waypointData["Id"];
          waypoint["Name"] = waypointData["Name"];
        }
        waypoint["Position"] = waypointData["Position"]
        this.waypoints.push(waypoint);
        //reassign variable for change detection in child component (ngonchanges not trigger for object changes)
        this.waypoints = [...this.waypoints];
      }
    });
  }

  submitChanges() {
    this.spinner.show();
    let selectedUserId = (this.userCtrl.value) ? this.userCtrl.value["UserId"] : null;
    if (this.isStreetTeam)
      selectedUserId = this.loggedInUser.UserId;
    let routeObj = {
      "AssignedOn": selectedUserId,
      "Waypoints": this.waypoints
    }
    this.routeService.createRoute(routeObj).subscribe(res => {
      if (res) {

        this.loggerService.showSuccessfulMessage("Route successfully created");
        this.router.navigate(['/routes']);
        this.spinner.hide();
      }
    }, err => {
      this.spinner.hide();
    });
  }

  amendChanges() {
    this.spinner.show();
    let waypoints = this.waypoints.filter(w => !w.CompletedDate);
    waypoints = waypoints.concat(this.deletedWaypoints);
    let selectedUserId = (this.userCtrl.value) ? this.userCtrl.value["UserId"] : null;
    if (this.isStreetTeam)
      selectedUserId = this.loggedInUser.UserId;
    let routeObj = {
      "AssignedOn": selectedUserId,
      "Waypoints": waypoints
    }
    this.routeService.updateRoute(this.routeId, routeObj).subscribe(res => {
      if (res) {
        this.loggerService.showSuccessfulMessage("Route successfully updated");
        this.router.navigate(['/routes']);
        this.spinner.hide();
      }
    }, err => {
      this.spinner.hide();
    });
  }

  showConfirmationPopup() {
    var dialogMsg = !this.routeId ? "Are you sure you want to create street team route?" : "Are you sure you want to update street team route?";
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '415px',
      data: { message: dialogMsg }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.waypoints.map((x, currentIndex) => {
          x["Order"] = currentIndex;
          return;
        });
        if (!this.routeId)
          this.submitChanges();
        else
          this.amendChanges();
      }
    });
  }

  dropWaypoint(event: CdkDragDrop<string[]>) {
    let currentItem = this.waypoints[event.currentIndex]; // item to be dropped after drag
    if (!currentItem.CompletedDate) {
      moveItemInArray(this.waypoints, event.previousIndex, event.currentIndex);
      //reassign variable for change detection in child component (ngonchanges not trigger for object changes)
      this.waypoints = [...this.waypoints];
    }
  }

  private filterUsers() {
    if (!this.allUsers) {
      return;
    }
    // get the search keyword
    let search = this.userFilterCtrl.value;
    if (!search) {
      this.filteredUsers.next(this.allUsers.slice());
      return;
    } else {
      search = search.toLowerCase();
    }
    // filter the users
    this.filteredUsers.next(
      this.allUsers.filter(u => u.Name.toLowerCase().indexOf(search) > -1)
    );
  }

  private mapRouteData() {
    this.waypoints = this.routeData["Waypoints"];
    this.waypoints.map(x => {
      if (x["DockingStationId"]) {
        let dockingStationObj = this.allDockingStations.find(d => d.DockingStationId == x["DockingStationId"]);
        x["Name"] = dockingStationObj["Name"];
      }
      else if (x["BikeId"]) {
        let bikeObj = this.allBikes.find(b => b.BikeId == x["BikeId"]);
        if (bikeObj)
          x["Name"] = (bikeObj["VisualId"]) ? bikeObj["VisualId"] : bikeObj["BikeVisualId"];
      }
      else if (x["WorkshopId"]) {
        let workshopObj = this.allWorkshops.find(w => w.Id == x["WorkshopId"]);
        x["Name"] = workshopObj["Name"];
      }
      else if (x["StorageId"]) {
        let storageObj = this.allStorages.find(s => s.Id == x["StorageId"]);
        x["Name"] = storageObj["Name"];
      }
      return;
    });
    let assignedOn = this.allUsers.find(u => u.UserId == this.routeData["AssignedOn"]["UserId"]);
    this.userCtrl.setValue(assignedOn);
    this.waypoints.sort((a, b) => (a.Order > b.Order) ? 1 : -1);
  }

  getLoggedInUserRole() {
    this.auth_token = JSON.parse(localStorage.getItem(LocalStorageKeys.OAUTH_TOKEN));
    this.loggedInUser = JSON.parse(localStorage.getItem(LocalStorageKeys.USER_DETAILS));
    if (this.auth_token._claims) {
      var userRole = this.auth_token._claims[0];
      if (userRole == UserRoles.STREET_TEAM)
        this.isStreetTeam = true;
      else
        this.isStreetTeam = false;
    }
  }
}
