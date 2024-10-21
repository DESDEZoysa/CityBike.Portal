
import { forkJoin as observableForkJoin, Observable, ReplaySubject, Subject } from 'rxjs';
import { BikeModeFilter } from './../core/enums/bikeModeFilter';
import { CommonHandler } from './../core/handlers/common-handler';
import { Component, OnInit } from '@angular/core';
import { BikesService, LoggerService, DockingStationService, SettingsService } from '../services';
import { BikeModes } from '../core/enums/bikeModes';
import { LocalStorageKeys } from '../core/constants';
import { UserService } from '../services/users.service';
import { UserRoles } from '../core/constants/user-roles';
import { LockState } from '../core/enums/lockState';
import { BikeDisableState } from '../core/enums/bikeDisableState';
import { DockingPointDisabledReason } from '../core/enums/dockingPointDisabledReason';
import { DockingStationMode } from '../core/enums/dockingStationMode';
import { FormControl } from '@angular/forms';
import { Area } from '../core/models/common/area';
import { take, takeUntil } from 'rxjs/operators';
import { AreasService } from '../services/areas.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  isStreetTeam: any;
  bikes: any;
  dpCounts: any;
  userId: any;
  areaIds = [];
  isLoading: boolean = false;
  loggedInUser: any;
  authToken: any;
  bikesByArea: any[];
  hoursText: string;
  errorCategoryIds = [BikeModeFilter.DisabledOffline];
  opened: boolean;
  dockingStationStats: any;
  private intervalId: any;
  protected areas: Area[]; //= AREAS
  selectedAreas;
  checkAll: boolean = false;

  public areaMultiCtrl: FormControl = new FormControl();
  public areaMultiFilterCtrl: FormControl = new FormControl();
  public filteredAreaMulti: ReplaySubject<Area[]> = new ReplaySubject<Area[]>(1);
  protected _onDestroy = new Subject<void>();
  desiredBikeCount: any;

  constructor(
    private bikesService: BikesService,
    private dockingStationService: DockingStationService,
    private loggerService: LoggerService,
    private areaService: AreasService,
    private userService: UserService,
    private settings: SettingsService) {
  }

  ngOnInit() {
    this.authToken = JSON.parse(localStorage.getItem(LocalStorageKeys.OAUTH_TOKEN));
    if (this.authToken._claims) {
      this.loggedInUser = JSON.parse(localStorage.getItem(LocalStorageKeys.USER_DETAILS));
      if (this.loggedInUser != null) {
        this.userId = this.loggedInUser.UserId;
      }
      if (this.userId == null || typeof this.userId === 'undefined') {
        //wait for 500 mili-seconds and try once
        setTimeout(() => {
          var user = JSON.parse(localStorage.getItem(LocalStorageKeys.USER_DETAILS));
          if (user != null) {
            this.userId = user.UserId;
            this.loadInitialData();
          }
          if (this.userId == null || typeof this.userId === 'undefined') {
            return this.loggerService.showErrorMessage("Error while obtaning user details.Please logoff and login again");
          }
        }, 1000);
      }
      if (this.userId != null)
        this.loadInitialData();
    }
    else {
      this.isLoading = true;
      setTimeout(() => {
        this.authToken = JSON.parse(localStorage.getItem(LocalStorageKeys.OAUTH_TOKEN));
        var user = JSON.parse(localStorage.getItem(LocalStorageKeys.USER_DETAILS));
        if (user != null) {
          this.userId = user.UserId;
        }
        if (this.userId == null || typeof this.userId === 'undefined') {
          //wait for 2 seconds and try once
          setTimeout(() => {
            user = JSON.parse(localStorage.getItem(LocalStorageKeys.USER_DETAILS));
            if (user != null) {
              this.userId = user.UserId;
            }
            if (this.userId == null || typeof this.userId === 'undefined') {
              return this.loggerService.showErrorMessage("Cannot find logged in user details.Please logoff and login again");
            }
          }, 2000);
        }
        this.loadInitialData();
      }, 4000);
    }

    //Use to avoid reloading the page if not focused in browser
    document.addEventListener("visibilitychange", this.handleVisibilityChange);
    this.startPageReload();

    //get local storage to check current selected areas
    this.selectedAreas = JSON.parse(localStorage.getItem(LocalStorageKeys.SELECTED_AREAS));

    // listen for search field value changes
    this.areaMultiFilterCtrl.valueChanges.pipe(takeUntil(this._onDestroy)).subscribe(() => { this.filterAreasMulti(); });
  }

  startPageReload() {
    console.log("Page reload started");
    this.intervalId = setInterval(() => { this.loadInitialData(); }, 1000 * 60 * 5);
  }

  stopPageReload() {
    console.log("Page reload stopped");
    if (this.intervalId) {
      clearInterval(this.intervalId); this.intervalId = null;
    }
  }

  //Use to avoid reloading dashboard if not focused
  private handleVisibilityChange = () => {
    if (document.visibilityState === "visible") {
      this.startPageReload();
    } else {
      this.stopPageReload();
    }
  };

  ngOnDestroy() {
    document.removeEventListener("visibilitychange", this.handleVisibilityChange);
    this.stopPageReload();
  }

  private loadInitialData() {
    this.getLoggedInUserAreas();
    var userRole = this.authToken._claims[0];
    if (userRole == UserRoles.CUSTOMER_SERVICE || userRole == UserRoles.STREET_TEAM)
      this.isStreetTeam = true;
    else
      this.isStreetTeam = false;
    this.bikesByArea = [];
  }

  getLoggedInUserAreas() {
    this.userService.getUserAreaByUserId(this.userId)
      .subscribe((data) => {
        if (data.length > 0) {
          data.forEach((area) => {
            this.areaIds.push(area.AreaId);
          });

          // Get user assign areas and populate drop down
          // while triggering its listner t get dashboard data
          data = data.sort(function (a, b) {
            if (a.Name < b.Name) { return -1; }
            if (a.Name > b.Name) { return 1; }
            return 0;
          });
          this.areas = data;
          this.filteredAreaMulti.next(this.areas.slice());
          this.setDefaultSelectedAreas();
          //this.getAllStatisticsByLoggedUserAreas();
        } else {
          //If no arean are assigned to the user, load all the areas
          //And trigger filter drop down listener to populte all daashboard data
          this.getAllAreasList();
        }
      });
  }

  getAllStatisticsByLoggedUserAreas() {
    this.isLoading = true;
    observableForkJoin([
      this.bikesService.getAllBikesAndModesByArea(this.areaIds),
      this.dockingStationService.getDockingStatonsBySelectedAreas(this.areaIds, true),
      this.bikesService.GetBikeDashboardFilter(this.errorCategoryIds),
      this.bikesService.getBikeTransportByUserId(this.userId),
      this.bikesService.getBikes(),
      this.bikesService.getDashboardGraphStatistics()]
    ).subscribe(data => {
      let bikeModes = data[0].BikeModeListDTO;
      let allStations = data[1];
      this.bikesByArea = data[0].BikeListDTO;
      let bikeDashboards = data[2];
      let bikeInTrans = data[3];
      let allBikes = data[4];
      let dashboardStatistics = data[5];
      this.hoursText = "DASHBOARD.HOURS";

      let transportBikes = [];
      if (bikeInTrans)
        transportBikes = (bikeInTrans.Bikes) ? JSON.parse(bikeInTrans.Bikes) : [];

      let filteredCarBikes = [];
      allBikes.forEach(bike => {
        var existBike = transportBikes.find(x => x && x.BikeId == bike.BikeId);
        if (existBike) {
          filteredCarBikes.push(bike);
        }
      });

      this.bikes = {
        All: bikeModes.find(x => x.Id == BikeModes.All).TotalCount,
        AllId: bikeModes.find(x => x.Id == BikeModes.All).Id,
        AllStatistics: dashboardStatistics.find(x => x.Category == BikeModes.All).Statistics,

        AllAvailable: bikeModes.find(x => x.Id == BikeModes.AllAvailable).TotalCount,
        AllAvailableId: bikeModes.find(x => x.Id == BikeModes.AllAvailable).Id,
        AllAvailableStatistics: dashboardStatistics.find(x => x.Category == BikeModes.AllAvailable).Statistics,

        AvailableDocked: bikeModes.find(x => x.Id == BikeModes.AvailableDocked).TotalCount,
        AvailableDockedId: bikeModes.find(x => x.Id == BikeModes.AvailableDocked).Id,
        AvailableDockedStatistics: dashboardStatistics.find(x => x.Category == BikeModes.AvailableDocked).Statistics,

        AvailableFree: bikeModes.find(x => x.Id == BikeModes.AvailableFree).TotalCount,
        AvailableFreeId: bikeModes.find(x => x.Id == BikeModes.AvailableFree).Id,
        AvailableFreeStatistics: dashboardStatistics.find(x => x.Category == BikeModes.AvailableFree).Statistics,

        AllInUse: bikeModes.find(x => x.Id == BikeModes.AllInUse).TotalCount,
        AllInUseId: bikeModes.find(x => x.Id == BikeModes.AllInUse).Id,
        AllOperationalStatistics: dashboardStatistics.find(x => x.Category == BikeModes.AllOperational).Statistics,

        InUseInSession: bikeModes.find(x => x.Id == BikeModes.InUseInSession).TotalCount,
        InUseInSessionId: bikeModes.find(x => x.Id == BikeModes.InUseInSession).Id,
        InUseInSessionStatistics: dashboardStatistics.find(x => x.Category == BikeModes.InUseInSession).Statistics,

        InUsePassiveSession: bikeModes.find(x => x.Id == BikeModes.InUsePassiveSession).TotalCount,
        InUsePassiveSessionId: bikeModes.find(x => x.Id == BikeModes.InUsePassiveSession).Id,
        InUsePassiveSessionStatistics: dashboardStatistics.find(x => x.Category == BikeModes.InUsePassiveSession).Statistics,

        AllDisabled: bikeModes.find(x => x.Id == BikeModes.AllDisabled).TotalCount,
        AllDisabledId: bikeModes.find(x => x.Id == BikeModes.AllDisabled).Id,
        AllDisabledStatistics: dashboardStatistics.find(x => x.Category == BikeModes.AllDisabled).Statistics,

        DisabledInStorage: bikeModes.find(x => x.Id == BikeModes.DisabledInStorage).TotalCount,
        DisabledInStorageId: bikeModes.find(x => x.Id == BikeModes.DisabledInStorage).Id,
        DisabledInStorageStatistics: dashboardStatistics.find(x => x.Category == BikeModes.DisabledInStorage).Statistics,

        DisabledMissing: bikeModes.find(x => x.Id == BikeModes.DisabledMissing).TotalCount,
        DisabledMissingId: bikeModes.find(x => x.Id == BikeModes.DisabledMissing).Id,
        DisabledMissingStatistics: dashboardStatistics.find(x => x.Category == BikeModes.DisabledMissing).Statistics,

        AllDisabledRepair: bikeModes.find(x => x.Id == BikeModes.AllDisabledRepair).TotalCount,
        AllDisabledRepairId: bikeModes.find(x => x.Id == BikeModes.AllDisabledRepair).Id,
        AllDisabledRepairStatistics: dashboardStatistics.find(x => x.Category == BikeModes.AllDisabledRepair).Statistics,

        DisabledToWorkshop: bikeModes.find(x => x.Id == BikeModes.DisabledToWorkshop).TotalCount,
        DisabledToWorkshopId: bikeModes.find(x => x.Id == BikeModes.DisabledToWorkshop).Id,
        DisabledToWorkshopStatistics: dashboardStatistics.find(x => x.Category == BikeModes.DisabledToWorkshop).Statistics,

        DisabledInWorkshop: bikeModes.find(x => x.Id == BikeModes.DisabledInWorkshop).TotalCount,
        DisabledInWorkshopId: bikeModes.find(x => x.Id == BikeModes.DisabledInWorkshop).Id,
        DisabledInWorkshopMean: bikeModes.find(x => x.Id == BikeModes.DisabledInWorkshop).MeanDuration,
        DisabledInWorkshopStatistics: dashboardStatistics.find(x => x.Category == BikeModes.DisabledInWorkshop).Statistics,

        DisabledRepairFinished: bikeModes.find(x => x.Id == BikeModes.DisabledRepairFinished).TotalCount,
        DisabledRepairFinishedId: bikeModes.find(x => x.Id == BikeModes.DisabledRepairFinished).Id,
        DisabledRepairFinishedMean: bikeModes.find(x => x.Id == BikeModes.DisabledRepairFinished).MeanDuration,
        DisabledRepairFinishedStatistics: dashboardStatistics.find(x => x.Category == BikeModes.DisabledRepairFinished).Statistics,

        DisabledCheckRequired: bikeModes.find(x => x.Id == BikeModes.DisabledCheckRequired).TotalCount,
        DisabledCheckRequiredId: bikeModes.find(x => x.Id == BikeModes.DisabledCheckRequired).Id,
        DisabledCheckRequiredMean: bikeModes.find(x => x.Id == BikeModes.DisabledCheckRequired).MeanDuration,
        DisabledCheckRequiredStatistics: dashboardStatistics.find(x => x.Category == BikeModes.DisabledCheckRequired).Statistics,

        DisabledMoving: bikeModes.find(x => x.Id == BikeModes.DisabledMoving).TotalCount,
        DisabledMovingId: bikeModes.find(x => x.Id == BikeModes.DisabledMoving).Id,
        DisabledMovingStatistics: dashboardStatistics.find(x => x.Category == BikeModes.DisabledMoving).Statistics,

        DisabledTesting: bikeModes.find(x => x.Id == BikeModes.DisabledTesting).TotalCount,
        DisabledTestingId: bikeModes.find(x => x.Id == BikeModes.DisabledTesting).Id,
        DisabledTestingStatistics: dashboardStatistics.find(x => x.Category == BikeModes.DisabledTesting).Statistics,

        DisabledOffline: bikeDashboards.find(x => x.ErrorCategoryId == BikeModeFilter.DisabledOffline).TotalCount,
        DisabledOfflineId: BikeModeFilter.DisabledOffline,
        DisabledOfflineStatistics: dashboardStatistics.find(x => x.Category == BikeModes.DisabledOffline).Statistics,

        BikeInCar: (filteredCarBikes.length),
        BikeInCarId: BikeModes.BikeInCar,
        BikeInCarStatistics: this.getInCarStatistics(dashboardStatistics.find(x => x.Category == BikeModes.DisabledMoving).Statistics, dashboardStatistics.find(x => x.Category == BikeModes.DisabledToWorkshop).Statistics),

        ShouldBeChecked: (this.bikesByArea.filter(bike => !bike.Disabled && (bike.Resolved > 0)).length),
        ShouldBeCheckedId: BikeModes.BikeWithMinorIssues,
        ShouldBeCheckedMean: this.CalculateShouldBeCheckedMeanDuration(this.bikesByArea.filter(bike => !bike.Disabled && (bike.Resolved > 0))),
        ShouldBeCheckedStatistics: dashboardStatistics.find(x => x.Category == BikeModes.AllShouldBeChecked).Statistics,
        
        PriorityBikes:
          this.bikesByArea.filter(
            (bike) => !bike.DockingPointId &&
              bike.DisabledReason != BikeDisableState.InWorkshop &&
              bike.DisabledReason != BikeDisableState.ToWorkshop &&
              bike.DisabledReason != BikeDisableState.InStorage &&
              bike.DisabledReason != BikeDisableState.Moving &&
              ((bike.LockState == LockState.UnlockedArrest && !bike.SessionId && !bike.InSession) ||
                bike.Disabled ||
                (!bike.Disabled && bike.Resolved > 0)
              ) ||
              (bike.DockingPointId &&
                bike.DisabledReason != BikeDisableState.InWorkshop &&
                bike.DisabledReason != BikeDisableState.ToWorkshop &&
                bike.DisabledReason != BikeDisableState.InStorage &&
                bike.DisabledReason != BikeDisableState.Moving &&
                (bike.Disabled || (!bike.Disabled && bike.Resolved > 0)))
          ).length,
        PriorityBikesId: BikeModes.PriorityBikes,
        PriorityBikesStatistics: dashboardStatistics.find(x => x.Category == BikeModes.PriorityBikes).Statistics,

        DisabledCheckedNeedRepair: bikeModes.find(x => x.Id == BikeModes.DisabledCheckedNeedsRepair).TotalCount,
        DisabledCheckedNeedRepairId: bikeModes.find(x => x.Id == BikeModes.DisabledCheckedNeedsRepair).Id,
        DisabledCheckedNeedRepairStatistics: dashboardStatistics.find(x => x.Category == BikeModes.DisabledCheckedNeedsRepair).Statistics,

        DisabledWithStreetTeam: bikeModes.find(x => x.Id == BikeModes.DisabledWithStreetTeam).TotalCount,
        DisabledWithStreetTeamId: bikeModes.find(x => x.Id == BikeModes.DisabledWithStreetTeam).Id,
        DisabledWithStreetTeamStatistics: dashboardStatistics.find(x => x.Category == BikeModes.DisabledWithStreetTeam).Statistics,

        DisabledOnLoan: bikeModes.find(x => x.Id == BikeModes.DisabledOnLoan).TotalCount,
        DisabledOnLoanId: BikeModes.DisabledOnLoan,
        DisabledOnLoanStatistics: dashboardStatistics.find(x => x.Category == BikeModes.DisabledOnLoan)?.Statistics,

        // BikeInCar: (bikeModes.find(x => x.Id == BikeModes.DisabledMoving).TotalCount + bikeModes.find(x => x.Id == BikeModes.DisabledToWorkshop).TotalCount),        
      };

      // this.bikes.Suspicious = this.bikes.DisabledLostPosition + this.bikes.DisabledLowBattery;
      this.bikes.WithUs = this.bikes.DisabledInStorage + this.bikes.InUsePassiveSession + this.bikes.DisabledMoving +
        this.bikes.DisabledTesting + this.bikes.DisabledToWorkshop + this.bikes.DisabledInWorkshop + this.bikes.DisabledRepairFinished;
      this.bikes.WithUsStatistics = dashboardStatistics.find(x => x.Category == BikeModes.AllWithUs).Statistics;

      let dps = [];
      allStations.forEach((station) => {
        station.DockingPoints.forEach((point) => {
          if (point != null) {
            dps.push(point);
          }
        });
      });
      if (dps != null) {
        this.dockingStationStats = {
          TotalDockingPoints: dps.filter(x => !x.IsDeleted).length,
          TotalDockingPointsId: DockingStationMode.AllDockingPoints,

          AllDockingStations: allStations.length,
          AllDockingStationsId: DockingStationMode.AllDockingStations,

          AllDisablePoints: dps.filter(x => x.DPDisabledReason == DockingPointDisabledReason.OutOfService).length,
          AllDisablePointsId: DockingStationMode.AllDisabledDockingPoints,

          AllBelowDPCapacity: dps.filter(x => x.State == 1 && !x.IsDeleted).length,
          AllBelowDPCapacityId: DockingStationMode.AllBelowDPCapacity,

          AllAboveDPCapacity: allStations.filter(x => x.TotalNumberOfPoints < (x.NumberOfAvailableBikes + x.NumberOfAvailablePoints)).length,
          AllAboveDPCapacityId: DockingStationMode.AllAboveDPCapacity,

          AllUnderCheckOrRepair: dps.filter(x =>
            (x.DPDisabledReason == DockingPointDisabledReason.ShouldBeChecked || x.DPDisabledReason == DockingPointDisabledReason.CheckRequired) && !x.IsDeleted).length,
          AllUnderCheckOrRepairId: DockingStationMode.AllUnderCheckOrRepair
        }
      }
      this.isLoading = false;
    }, () => {
      this.isLoading = false;
      this.loggerService.showErrorMessage("Error while obtaning dashboard statistics.");
    });
  }

  getInCarStatistics(movingStats, toWorkshopStats) {
    var sum = movingStats.map(function (num, idx) {
      return num + toWorkshopStats[idx];
    });
    return sum;
  }

  CalculateShouldBeCheckedMeanDuration(bikes: any[]) {
    var totalHours = 0;
    let meanDuration = 0;
    if (bikes.length > 0) {
      for (var index in bikes) {
        totalHours += CommonHandler.FindDurationInHoursForDate(bikes[index]["ReportedDate"]);
      }
      meanDuration = Math.round(totalHours / bikes.length);
    }
    else
      meanDuration = 0;
    return meanDuration;
  }

  getAllAreasList() {
    this.areaService.getAllAreas()
      .subscribe(res => {

        if (res.length > 0) {
          res.forEach((area) => {
            this.areaIds.push(area.AreaId);
          });

          res = res.sort(function (a, b) {
            if (a.Name < b.Name) { return -1; }
            if (a.Name > b.Name) { return 1; }
            return 0;
          });

          this.areas = res;
          this.filteredAreaMulti.next(this.areas.slice());
          this.setDefaultSelectedAreas();
        }
        () => {
          this.loggerService.showErrorMessage("Getting areas failed.");
        }
      });
  }

  filterByAreas(opened: boolean) {
    if (!opened) {
      this.areaIds = [];
      this.checkAll = false;

      if (this.areaMultiCtrl.value != null) {
        this.areaMultiCtrl.value.forEach((areas) => {
          if (!this.areaIds.includes(areas.AreaId)) {
            this.areaIds.push(areas.AreaId);
          }
        });
        //update newly selected areas in browser
        this.settings.setSetting(LocalStorageKeys.SELECTED_AREAS, JSON.stringify(this.areaIds));

        
      this.desiredBikeCount = this.areaMultiCtrl.value.reduce((accum, x) => {
        return accum + x["MinimumBikes"];
      }, 0);
      }
      //Top checkbox checked only if user permitted areas and selected areas mapped
      if (this.areaIds.length == this.areas.length) {
        this.checkAll = true;
      }
      if (this.areaIds.length < 1) {
        return this.loggerService.showErrorMessage("Please select one or more area(s) to filter.");
      }

      this.getAllStatisticsByLoggedUserAreas();
    }
  }

  toggleSelectAll(selectAllValue: boolean) {
    this.filteredAreaMulti.pipe(take(1), takeUntil(this._onDestroy))
      .subscribe(val => {
        if (selectAllValue) {
          this.areaMultiCtrl.patchValue(val);
        } else {
          this.areaMultiCtrl.patchValue([]);
        }
      });
  }

  filterAreasMulti() {
    if (!this.areas) { return; }
    // get the search keyword
    let search = this.areaMultiFilterCtrl.value;
    if (!search) {
      this.filteredAreaMulti.next(this.areas.slice());
      return;
    } else {
      search = search.toLowerCase();
    }
    // filter the areas
    this.filteredAreaMulti.next(
      this.areas.filter(area => area.Name.toLowerCase().indexOf(search) > -1)
    );
  }

  setDefaultSelectedAreas() {
    if (this.selectedAreas == null || this.selectedAreas == undefined) {
      if (this.areas.length > 0) {
        let selectedAreaIds = [];

        this.areas.forEach((area, index) => {
          selectedAreaIds.push(this.areas[index]);
          if (!this.areaIds.includes(area.AreaId)) {
            this.areaIds.push(area.AreaId);
          }
        });

        // Initial update of user areas in browser
        this.settings.setSetting(LocalStorageKeys.SELECTED_AREAS, JSON.stringify(this.areaIds));
        if (selectedAreaIds.length > 0) {
          this.areaMultiCtrl.patchValue(selectedAreaIds);
        }
        if (selectedAreaIds.length == this.areas.length) {
          this.checkAll = true;
        }

        this.desiredBikeCount = this.areas.reduce((accum, x) => {
          return accum + x["MinimumBikes"];
        }, 0);
      }
    } else {
      if (this.selectedAreas.length > 0) {
        this.areaIds = [];
        let selectedAreasLoad = [];

        //fetch user selected areas from broswer local storage
        this.selectedAreas.forEach((selectedArea) => {
          var in_array = this.areas.filter(function (item) {
            return item.AreaId == selectedArea
          });
          var index = this.areas.indexOf(in_array[0]);
          if (index != -1) {
            selectedAreasLoad.push(this.areas[index]);
            if (!this.areaIds.includes(selectedArea.AreaId)) {
              this.areaIds.push(selectedArea);
            }
          }
        });

        this.areaMultiCtrl.patchValue(selectedAreasLoad);
        this.checkAll = false;
        if (selectedAreasLoad.length == this.areas.length) {
          this.checkAll = true;
        }

        this.desiredBikeCount = selectedAreasLoad.reduce((accum, x) => {
          return accum + x["MinimumBikes"];
        }, 0);
      }
    }
    this.getAllStatisticsByLoggedUserAreas();
  }
}
