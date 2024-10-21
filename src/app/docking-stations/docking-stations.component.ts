import { Component, OnInit, OnDestroy, ViewChild } from "@angular/core";
import { DockingStationService, LoggerService, AppSettings, AuthService, SettingsService } from "../services";
import { DockingStation } from "../core/models";
import { BreakpointObserver, BreakpointState } from "@angular/cdk/layout";
import { ScreenLayouts } from "../core/constants/screen-layouts";
import { Router } from "@angular/router";
import { AreasService } from "../services/areas.service";
import { Area } from "../core/models/common/area";
import { FormControl } from "@angular/forms";
import { ReplaySubject, Subject } from "rxjs-compat";
import { take, takeUntil } from "rxjs/operators";
import { LocalStorageKeys } from "../core/constants";
import { MatDialog } from "@angular/material/dialog";
import { DockingPointRepairHistoryDetailsPopupComponent } from "../shared/docking-point-repair-history-details-popup/docking-point-repair-history-details-popup.component";
import { AllDockingPointRepairHistoryPopupComponent } from "../shared/all-docking-point-repair-history-popup/all-docking-point-repair-history-popup.component";
import { ConfirmDialogComponent } from "../shared/confirm-dialog/confirm-dialog.component";
import { DockingStationState } from "../core/enums/dockingStationState";

@Component({
  selector: "app-docking-stations",
  templateUrl: "./docking-stations.component.html",
  styleUrls: ["./docking-stations.component.scss"]
})
export class DockingStationsComponent implements OnInit, OnDestroy {
  @ViewChild("dockingStationTable", { static: true }) table: any;

  public dockingStations: any[] = [];
  loadingIndicator: boolean = false;
  reorderable: boolean = true;
  isMobile: boolean = false;
  showReservation: any;
  isAdminOrMaintananceOrService = false;
  isAdminOnly = false;
  searchItem: string = "";
  allDockingStations: any[];
  filteredDockingStations: any[];
  protected areas: Area[];
  areaIds = [];
  selectedAreas;
  checkAll: boolean = false;

  public readonly LAYOUT = ScreenLayouts;
  public layout: number = this.LAYOUT.MD;
  repairSelectedDate: any;
  repairIsCustomDateShown: any;
  repairFromDate: any;
  repairToDate: any;
  repairFromDateVal: any;
  repairToDateVal: any;
  repairSelectedPerson: any;
  repairFiltered: any;
  selectedDockingStationState: number = DockingStationState.All;
  dockingStationTypes = [
    { id: DockingStationState.All, name: 'DOCKING_STATION.All' },
    { id: DockingStationState.Available, name: 'DOCKING_STATION.Available' },
    { id: DockingStationState.Disabled, name: 'DOCKING_STATION.Disabled' }
  ];

  public areaMultiCtrl: FormControl = new FormControl();
  public areaMultiFilterCtrl: FormControl = new FormControl();
  public filteredAreaMulti: ReplaySubject<Area[]> = new ReplaySubject<Area[]>(1);
  protected _onDestroy = new Subject<void>();

  constructor(
    private dockingStationService: DockingStationService,
    private loggerService: LoggerService,
    private authService: AuthService,
    private appSettings: AppSettings,
    private settings: SettingsService,
    private dialog: MatDialog,
    private router: Router,
    private areaService: AreasService,
    public breakpointObserver: BreakpointObserver
  ) {
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) && document.documentElement.clientWidth < 768) {
      this.isMobile = true;
    }
    //check whether reservation can be shown
    this.showReservation = appSettings.show_reservations;
  }

  ngOnInit() {
    this.areas = [];
    this.selectedAreas = JSON.parse(localStorage.getItem(LocalStorageKeys.SELECTED_AREAS));

    this.manageScreenWidth();
    this.getVisibleAreas();
    //this.loadDockingStations();
    this.isAdminOrMaintananceOrService = this.authService.isAdminOrMaintanceOrService();
    this.isAdminOnly = this.authService.isAdmin();

    // detect value changes in municipalities filter search box and filter municipalities
    this.areaMultiFilterCtrl.valueChanges
      .pipe(takeUntil(this._onDestroy))
      .subscribe(() => {
        this.filterAreasMulti();
      });
  }

  manageScreenWidth() {
    const breakpoints = Object.keys(this.LAYOUT).map(k => this.LAYOUT[k]);
    breakpoints.forEach((maxWidth, index) => {
      const minWidth = (index > 0) ? breakpoints[index - 1] : 0;
      this.breakpointObserver
        .observe([`(min-width: ${minWidth}px) and (max-width: ${maxWidth - 1}px)`])
        .subscribe((state: BreakpointState) => {
          if (!state.matches) { return; }
          this.layout = maxWidth;
          //console.log('Layout', this.layout);
        });
    });
  }

  onResize() {
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) && document.documentElement.clientWidth < 768) {
      this.isMobile = true;
    } else {
      this.isMobile = false;
    }
  }

  getVisibleAreas() {
    this.areaService.getAssignOrDefaultAreasForUser().subscribe(
      res => {
        res = res.sort(function (a, b) {
          if (a.Name < b.Name) { return -1; }
          if (a.Name > b.Name) { return 1; }
          return 0;
        });
        this.areas = res;

        this.filteredAreaMulti.next(this.areas.slice());
        this.setDefaultSelectedAreas();
      },
      error => {
        this.loggerService.showErrorMessage("Getting areas failed.");
      }
    );
  }

  getDSforSelectedAreas() {
    this.loadingIndicator = true;
    this.dockingStationService.getDockingStatonsBySelectedAreas(this.areaIds, true).subscribe(
      data => {
        this.arrangeDockingPointHWIds(data);
        this.loadingIndicator = false;
        this.onDockingStationStateChange();
      },
      error => {
        this.loadingIndicator = false;
        if (error.status == 403) {
          this.loggerService.showErrorMessage("Don't have permission to obtain data");
        } else {
          this.loggerService.showErrorMessage(error);
        }
      }
    );
  }

  // protected loadDockingStations(): void {
  //   this.loadingIndicator = true;
  //   this.dockingStationService.getDockingStationsByArea(true).subscribe(
  //     data => {
  //       this.arrangeDockingPointHWIds(data);
  //       this.loadingIndicator = false;
  //     },
  //     error => {
  //       this.loadingIndicator = false;
  //       if (error.status == 403) {
  //         this.loggerService.showErrorMessage("Don't have permission to obtain data");
  //       } else {
  //         this.loggerService.showErrorMessage(error);
  //       }
  //     }
  //   );
  // }

  arrangeDockingPointHWIds(stations) {
    stations.forEach((station) => {
      let hwIds = "";
      if (station.DockingPoints.length > 0) {
        station.DockingPoints.forEach((dockingPoint) => {
          if (dockingPoint != null) {
            hwIds = hwIds + dockingPoint.HardwareId + ',';
          }
        });
      }
      station['DockingPointsHwIds'] = hwIds;
      return station;
    });
    this.arrangeAddressColumn(stations);
  }

  arrangeAddressColumn(stations) {
    stations.forEach((station) => {
      var area = this.areas.filter(a => a.AreaId == station.AreaId);
      if (area.length > 0) {
        let areaName = area[0]['Name'];
        station['Address'] = areaName + ', ' + station['Address']['Street'];
        return station;
      }
      station['Address'] = station['Address']['Street'];
      return station;
    });
    this.handleMinimumIdealBikesColor(stations);
  }

  handleMinimumIdealBikesColor(dockingStations) {
    dockingStations.forEach(dockingStation => {
      if (
        dockingStation["NumberOfAvailableBikes"] <
        dockingStation["IdealNumberOfBikes"]
      ) {
        dockingStation["IdealNumberOfBikesColor"] = "#FF0000";
      } else {
        dockingStation["IdealNumberOfBikesColor"] = "#000000";
      }
      if (
        dockingStation["NumberOfAvailableBikes"] <
        dockingStation["MinimumBikesRequired"]
      ) {
        dockingStation["MinimumBikesRequiredColor"] = "#f66733";
      } else {
        dockingStation["MinimumBikesRequiredColor"] = "#000000";
      }
      return dockingStation;
    });
    this.dockingStations = dockingStations;
    this.allDockingStations = dockingStations;
    this.filteredDockingStations = dockingStations;
    this.searchDockingStation();
  }

  toggleExpandRow(row) {
    this.table.rowDetail.toggleExpandRow(row);
  }

  ngOnDestroy(): void {
    this.dockingStations = null;
  }

  searchDockingStation() {
    if (this.searchItem === null || this.searchItem === "") {
      this.onDockingStationStateChange();
    }
    else {
      if (this.filteredDockingStations != null) {
        this.dockingStations = this.filteredDockingStations.filter(d => d.Name.toLowerCase().indexOf(this.searchItem.toLowerCase()) > -1
          ||
          d.DockingPointsHwIds.toLowerCase().indexOf(this.searchItem.toLowerCase()) > -1
        );
      }
    }
  }

  navigateToDockingStationSupportPage(stationId) {
    this.router.navigateByUrl('dockingStations/live;general=1;stationId=' + stationId);
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
      }
      //Top checkbox checked only if user permitted areas and selected areas mapped
      if (this.areaIds.length == this.areas.length) {
        this.checkAll = true;
      }
      if (this.areaIds.length < 1) {
        return this.loggerService.showErrorMessage("Please select one or more area(s) to filter.");
      }
      this.getDSforSelectedAreas();
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
      }
    }
    this.getDSforSelectedAreas();
  }

  openRepairHistory(dockingPointId: any = "") {
    const dialogOpenDPRef = this.dialog.open(AllDockingPointRepairHistoryPopupComponent, {
      width: '1100px',
      data: {
        "selectedDate": this.repairSelectedDate,
        "isCustomDateShown": this.repairIsCustomDateShown,
        "fromDate": this.repairFromDate,
        "toDate": this.repairToDate,
        "fromDateValue": this.repairFromDateVal,
        "toDateValue": this.repairToDateVal,
        "selectedPerson": this.repairSelectedPerson,
        "isFiltered": this.repairFiltered
      },
      disableClose: true
    });

    dialogOpenDPRef.afterClosed().subscribe(result => {
      if (result) {
        const dialogOpenDPRef = this.dialog.open(DockingPointRepairHistoryDetailsPopupComponent, {
          width: '580px',
          data: {
            "selectedDate": result["selectedDate"],
            "isCustomDateShown": result["isCustomDateShown"],
            "fromDate": result["fromDate"],
            "toDate": result["toDate"],
            "fromDateValue": result["fromDateValue"],
            "toDateValue": result["toDateValue"],
            "selectedPerson": result["selectedPerson"],
            "historyData": result["historyData"]
          },
          disableClose: true
        });

        dialogOpenDPRef.afterClosed().subscribe(result => {
          this.setDPRepairHistorySelectFilters(result);
          this.openRepairHistory(dockingPointId);
        });
      }
      else
        this.repairFiltered = false;
    });
  }

  private setDPRepairHistorySelectFilters(result: any) {
    this.repairSelectedDate = result["selectedDate"];
    this.repairFromDate = result["fromDate"];
    this.repairToDate = result["toDate"];
    this.repairFromDateVal = result["fromDateValue"];
    this.repairToDateVal = result["toDateValue"];
    this.repairSelectedPerson = result["selectedPerson"]["id"];
    this.repairFiltered = true;
    this.repairIsCustomDateShown = result["isCustomDateShown"];
  }

  openDeleteDialog(stationId: number) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '350px',
      data: { "message": "DOCKING_STATION.DELETE_CONFIRMATION_MSG" }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.dockingStationService.deleteDockingStation(stationId)
          .subscribe(result => {
            this.loggerService.showSuccessfulMessage(
              "Docking station successfully deleted. "
            );
            this.ngOnInit();
          }, error => {
            if (error.status == 400) {
              this.loggerService.showErrorMessage("Error occurred while deleting docking station.");
            } else if (error.status == 404) {
              this.loggerService.showErrorMessage("Docking station not found.");
            } else {
              this.loggerService.showErrorMessage("Deleting docking station failed.");
            }
          });
      }
    });
  }

  onDockingStationStateChange() {
    if (this.selectedDockingStationState === DockingStationState.All) {
      this.filteredDockingStations = this.allDockingStations;
    } else if (this.selectedDockingStationState === DockingStationState.Available) {
      this.filteredDockingStations = this.allDockingStations.filter(ds => ds.Disabled === false);
    } else {
      this.filteredDockingStations = this.allDockingStations.filter(ds => ds.Disabled === true);
    }
    this.dockingStations = this.filteredDockingStations;
    this.searchItem = "";
  }
}
