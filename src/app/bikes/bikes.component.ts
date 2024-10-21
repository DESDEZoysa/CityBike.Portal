
import { forkJoin as observableForkJoin, ReplaySubject, Subject, Observable } from 'rxjs';
import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { BikesService, LoggerService, SettingsService } from '../services';
import { BikeAddress } from '../core/models';
import { ImportExportService } from '../services/import-export.service';
import 'rxjs/Rx';
import { BikeStatusColor } from '../core/constants/bike-status-color';
import { LiveMap } from '../core/constants/live-map';
import { BikeModes } from '../core/enums/bikeModes';
import { BikeDisableState } from '../core/enums/bikeDisableState';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { ScreenLayouts } from '../core/constants/screen-layouts';
import { AreasService } from '../services/areas.service';
import { Area } from '../core/models/common/area';
import { FormControl } from '@angular/forms';
import { take, takeUntil } from 'rxjs/operators';
import { CommonHandler } from '../core/handlers/common-handler';
import { BikeStatus } from '../core/enums/bikeStatus';
import * as moment from 'moment';
import { LocalStorageKeys } from '../core/constants';
import { UserRoles } from '../core/constants/user-roles';

@Component({
  selector: 'app-bikes',
  templateUrl: './bikes.component.html',
  styleUrls: ['./bikes.component.scss']
})
export class BikesComponent implements OnInit, OnDestroy {
  @ViewChild('bikeTable', { static: true }) table: any;

  public bikes: any[];
  loadingIndicator: boolean = true;
  resourceExcelURL;
  resourcePdfURL;
  isMobile: boolean = false;
  bikeMap = false;
  searchItem: string = "";
  allBikes: any[];
  bikeLegends: any;
  selectedVal: any = BikeModes.All;
  bikeModes = [];
  protected areas: Area[]; //= AREAS
  areaIds = [];
  modeId: number = 0;
  selectedAreas: any;

  public readonly LAYOUT = ScreenLayouts;
  public layout: number = this.LAYOUT.MD;

  /**Search related */
  public areaMultiCtrl: FormControl = new FormControl();
  public areaMultiFilterCtrl: FormControl = new FormControl();
  public filteredAreaMulti: ReplaySubject<Area[]> = new ReplaySubject<Area[]>(1);
  protected _onDestroy = new Subject<void>();
  userRole: any;
  toggleAllSelected: boolean = true;

  constructor(
    private bikesService: BikesService,
    private loggerService: LoggerService,
    private router: Router,
    private importExportService: ImportExportService,
    public breakpointObserver: BreakpointObserver,
    private settings: SettingsService,
    private areaService: AreasService) {
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) && (document.documentElement.clientWidth < 768)) {
      this.isMobile = true;
    }
    if (typeof this.router.url.split('/')[2] != 'undefined') {
      this.modeId = parseInt(this.router.url.split('/')[2]);
    }
  }

  onResize() {
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) && (document.documentElement.clientWidth < 768)) {
      this.isMobile = true;
    } else {
      this.isMobile = false;
    }
  }

  ngOnInit() {
    this.manageScreenWidth();

    //get local storage to check current selected areas
    this.selectedAreas = JSON.parse(localStorage.getItem(LocalStorageKeys.SELECTED_AREAS));
    this.bikeLegends = LiveMap.legendInfo;

    this.getAreaList();

    // listen for search field value changes
    this.areaMultiFilterCtrl.valueChanges
      .pipe(takeUntil(this._onDestroy))
      .subscribe(() => {
        this.filterAreasMulti();
      });

    this.userRole = UserRoles.CUSTOMER_SERVICE;
    let authToken = JSON.parse(localStorage.getItem(LocalStorageKeys.OAUTH_TOKEN));
    if (authToken)
      this.userRole = authToken._claims[0];
  }

  toggleSelectAll(selectAllValue: boolean) {
    this.filteredAreaMulti.pipe(take(1), takeUntil(this._onDestroy))
      .subscribe(val => {
        if (selectAllValue) {
          this.areaMultiCtrl.patchValue(val);
          //this.toggleAllSelected = true;
        } else {
          this.areaMultiCtrl.patchValue([]);
          //this.toggleAllSelected = false;
        }
      });
  }

  ngOnDestroy() {
    this._onDestroy.next();
    this._onDestroy.complete();
  }

  filterByAreas(opened: boolean) {
    if (!opened) {
      if (this.areaMultiCtrl.value != null) {
        this.areaMultiCtrl.value.forEach((areas) => {
          this.areaIds.push(areas.AreaId);
        });
      }
      //update newly selected areas in browser
      this.settings.setSetting(LocalStorageKeys.SELECTED_AREAS, JSON.stringify(this.areaIds));

      //Top checkbox checked only if user permitted areas and selected areas mapped
      if (this.areaIds.length == this.areas.length) {
        this.toggleAllSelected = true;
      }

      if (this.areaIds.length < 1) {
        return this.loggerService.showErrorMessage("Please select one or more area(s) to filter.");
      } else {
        this.getBikesByArea();
      }
    }
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
        });
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

  getAreaList() {
    this.areaService.getAssignOrDefaultAreasForUser().subscribe(
      res => {
        res = res.sort(function (a, b) {
          if (a.Name < b.Name) { return -1; }
          if (a.Name > b.Name) { return 1; }
          return 0;
        });

        this.areas = res;
        this.filteredAreaMulti.next(this.areas.slice());
        // this.areaMultiCtrl.patchValue(res);
        // this.filterByAreas(false);
        this.setDefaultSelectedAreas();
      },
      error => {
        this.loggerService.showErrorMessage("Getting areas failed.");
      }
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
          this.toggleAllSelected = true;
        }
      }
    } else {
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
      this.toggleAllSelected = false;
      if (selectedAreasLoad.length == this.areas.length) {
        this.toggleAllSelected = true;
      }
    }
    this.getBikesByArea();
  }

  navigateToBikeDetails(bikeId) {
    this.router.navigateByUrl('bikes/' + bikeId + '/details');
  }

  navigateToBikeSupportPage(visualId) {
    this.router.navigateByUrl('bikes/support?visualId=' + visualId);
  }

  navigateToBikeSession(sessionId) {
    this.router.navigateByUrl('sessions/' + sessionId);
  }

  getBikesByArea() {
    this.loadingIndicator = true;
    this.bikesService.getAllBikesAndModesByArea(this.areaIds)
      .subscribe(data => {
        this.arrangeBikeList(data.BikeListDTO);
        this.bikeModes = data.BikeModeListDTO;
        this.bikeModes = this.bikeModes.map(bm => (bm.Name === "All" ? { ...bm, Name: 'COMMON.ALL' } : bm));
        this.loadingIndicator = false;
        if (this.userRole == UserRoles.WORKSHOP) {
          this.selectedVal = BikeModes.DisabledInWorkshop.toString();
          this.filterBikesByModeId();
        }
        else {
          if (this.modeId == 0) {
            this.selectedVal = BikeModes.All.toString();
          } else {
            let modeSelected = this.bikeModes.filter(x => x.Id == this.modeId);
            this.selectedVal = modeSelected[0].Id.toString();
            this.filterBikesByModeId();
          }
        }
        this.areaIds = [];
      }, error => {
        this.loadingIndicator = false;
        if (error.status == 403) {
          this.loggerService.showErrorMessage("Don't have permission to obtain data");
        } else {
          this.loggerService.showErrorMessage("Getting bike details failed!");
        }
        this.selectedVal = BikeModes.All.toString();
      });
  }

  getAllBikeModes() {
    this.bikesService.getAllBikeModesByArea(this.areaIds).subscribe(data => {
      this.bikeModes = data;
    }, error => {
      this.loggerService.showErrorMessage("Getting all bike modes failed!");
    });
  }

  arrangeBikeList(bikes) {
    bikes.forEach((bike) => {
      let bikestatusId = CommonHandler.getBikeStatus(bike, bike["DockingStationId"], bike['DockingPointId']);
      if (bikestatusId == BikeStatus.DockedWithNoError ||
        bikestatusId == BikeStatus.LockedWithNoError ||
        bikestatusId == BikeStatus.LooseBikeWithNoError) {
        bike["bikeStatusColor"] = BikeStatusColor.BLACK;
        var bikeStatus = this.bikeLegends.filter(e => e.color == BikeStatusColor.BLACK);
        bike['bikeStatus'] = "BIKE_STATUS.AVAILABLE";
      }
      else if (bikestatusId == BikeStatus.DockedWithError ||
        bikestatusId == BikeStatus.LockedWithError ||
        bikestatusId == BikeStatus.LooseBikeWithError) {
        bike["bikeStatusColor"] = BikeStatusColor.AMBER;
        var bikeStatus = this.bikeLegends.filter(e => e.color == BikeStatusColor.AMBER);
        bike['bikeStatus'] = "BIKE_STATUS.SHOULD_BE_CHECKED";
      }
      else if (bikestatusId == BikeStatus.NormalInSession) {
        bike["bikeStatusColor"] = BikeStatusColor.GREEN;
        var bikeStatus = this.bikeLegends.filter(e => e.color == BikeStatusColor.GREEN);
        bike['bikeStatus'] = "BIKE_STATUS.IN_SESSION"
      }
      else if (bikestatusId == BikeStatus.ErrorBikesInSession) {
        bike["bikeStatusColor"] = BikeStatusColor.GREEN;
        var bikeStatus = this.bikeLegends.filter(e => e.color == BikeStatusColor.GREEN);
        bike['bikeStatus'] = "BIKE_STATUS.IN_SESSION";
      }
      else if (bikestatusId == BikeStatus.DisableToWorkshop ||
        bikestatusId == BikeStatus.DisabledWithMoving ||
        bikestatusId == BikeStatus.DisabledWithTesting ||
        bike.DisabledReason == BikeDisableState.InStorage ||
        bike.DisabledReason == BikeDisableState.InWorkshop ||
        bike.DisabledReason == BikeDisableState.RepairFinished ||
        bikestatusId == BikeStatus.NormalPassiveSession ||
        bikestatusId == BikeStatus.ErrorPassiveSession || 
        bikestatusId == BikeStatus.DisabledWithStreetTeam || 
        bikestatusId == BikeStatus.DisabledOnLoan) {
        bike["bikeStatusColor"] = "";
        if (bikestatusId == BikeStatus.DisableToWorkshop)
          bike['bikeStatus'] = "BIKE_STATUS.TO_WORKSHOP";
        else if (bikestatusId == BikeStatus.DisabledWithMoving)
          bike['bikeStatus'] = "BIKE_STATUS.IN_CAR";
        else if (bikestatusId == BikeStatus.DisabledWithTesting)
          bike['bikeStatus'] = "BIKE_STATUS.IN_TESTING";
        else if (bike.DisabledReason == BikeDisableState.InStorage)
          bike['bikeStatus'] = "BIKE_STATUS.IN_STORAGE";
        else if (bike.DisabledReason == BikeDisableState.InWorkshop)
          bike['bikeStatus'] = "BIKE_STATUS.IN_WORKSHOP";
        else if (bike.DisabledReason == BikeDisableState.RepairFinished)
          bike['bikeStatus'] = "BIKE_STATUS.REPAIR_FINISHED";
        else if (bikestatusId == BikeStatus.NormalPassiveSession || bikestatusId == BikeStatus.ErrorPassiveSession)
          bike['bikeStatus'] = "BIKE_STATUS.IN_PASSIVE_SESSION";
        else if (bikestatusId == BikeStatus.DisabledWithStreetTeam)
          bike['bikeStatus'] = "BIKE_STATUS.WITH_STREET_TEAM";
        else if (bikestatusId == BikeStatus.DisabledOnLoan)
          bike['bikeStatus'] = "BIKE_STATUS.ON_LOAN";
      }
      else if ((bikestatusId == BikeStatus.Disabled ||
        bikestatusId == BikeStatus.DisabledLoose) && bike.DisabledReason == BikeDisableState.Missing) {
        bike["bikeStatusColor"] = BikeStatusColor.BLUE;
        bike['bikeStatus'] = "BIKE_STATUS.MISSING";
      }
      else if (bikestatusId == BikeStatus.DisabledCheckedNeedRepair && bike.DisabledReason == BikeDisableState.CheckedNeedFix) {
        bike["bikeStatusColor"] = BikeStatusColor.PURPLE;
        bike['bikeStatus'] = "BIKE_STATUS.CHECKED_NEEDS_REPAIR";
      }
      else if (bikestatusId == BikeStatus.Disabled ||
        bikestatusId == BikeStatus.DisabledLoose) {
        bike["bikeStatusColor"] = BikeStatusColor.RED;
        var bikeStatus = this.bikeLegends.filter(e => e.color == BikeStatusColor.RED);
        bike['bikeStatus'] = "BIKE_STATUS.MUST_BE_CHECKED";
      }

      bike["GracePeriodDuration"] = this.convertGracePeriod(bike["GracePeriod"]);
      return bike;
    });
    this.bikes = bikes;
    this.allBikes = bikes;
    this.searchBike(event);
  }

  ridirectUrlNoTrips() {
    this.router.navigateByUrl('/bikes/notontrips');
  }

  ridirectUrlTrips() {
    this.router.navigateByUrl('/bikes/ontrips');
  }

  updateAddress(data: BikeAddress): void {
    let index = this.bikes.findIndex(i => i.BikeId == data.BikeId);
    if (index >= 0) {
      this.bikes[index].Address = data.Address;
    }
  }

  downLoadPdf() {
    this.importExportService.downloadBikeListPDFReport().subscribe(data => {
      this.downloadPdfFile(data);
    }, error => {
      this.loggerService.showErrorMessage("Error occured while downloading the PDF.");
    });
  }

  downLoadExcel() {
    this.importExportService.downloadBikeListExcelReport().subscribe(data => {
      this.downloadExcelFile(data);
    }, error => {
      this.loggerService.showErrorMessage("Error occured while downloading the Excel.");
    });
  }

  downloadExcelFile(data) {
    //var blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    // var url = window.URL.createObjectURL(data);
    // window.open(url, '_self'); 

    var url = window.URL.createObjectURL(data);
    var downloadLink = document.createElement("a");
    downloadLink.href = url;

    // var currentDatetime = new Date().toISOString();
    // downloadLink.download = "Citybike_bikeList_" + currentDatetime + ".xlsx";    
    downloadLink.download = "CityBike_BikeList.xlsx";

    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  }



  downloadPdfFile(data) {
    var url = window.URL.createObjectURL(data);
    var downloadLink = document.createElement("a");
    downloadLink.href = url;

    downloadLink.download = "CityBike_BikeList.pdf";

    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  }

  toggleExpandRow(row) {
    this.table.rowDetail.toggleExpandRow(row);
  }

  searchBike(event) {
    if (this.searchItem === null || this.searchItem === '') {
      this.filterBikesByModeId();
    }
    else {
      if (this.allBikes != null) {
        if (this.selectedVal == BikeModes.All) {
          this.bikes = this.allBikes.filter(b => b.VisualId.indexOf(this.searchItem) > -1 || b.Serial.toLowerCase().indexOf(this.searchItem.toLowerCase()) > -1);
        } else {
          if (this.selectedVal == BikeModes.AllAvailable) {
            this.bikes = this.allBikes.filter(x => x.BikeModeId == BikeModes.AvailableDocked || x.BikeModeId == BikeModes.AvailableFree);
          } else if (this.selectedVal == BikeModes.AllInUse) {
            this.bikes = this.allBikes.filter(x => x.BikeModeId == BikeModes.InUseInSession || x.BikeModeId == BikeModes.AvailableDocked || x.BikeModeId == BikeModes.AvailableFree);
          } else if (this.selectedVal == BikeModes.AllDisabled) {
            this.bikes = this.allBikes.filter(x => x.Disabled == true);
          } else if (this.selectedVal == BikeModes.AllDisabledRepair) {
            this.bikes = this.allBikes.filter(x => x.BikeModeId == BikeModes.DisabledToWorkshop || x.BikeModeId == BikeModes.DisabledInWorkshop || x.BikeModeId == BikeModes.DisabledRepairFinished
              || x.BikeModeId == BikeModes.DisabledCheckRequired);
          }
          else {
            this.bikes = this.allBikes.filter(x => x.BikeModeId == this.selectedVal);
          }
          if (this.searchItem !== null || this.searchItem !== '') {
            this.bikes = this.bikes.filter(b => b.VisualId.indexOf(this.searchItem) > -1 || b.Serial.toLowerCase().indexOf(this.searchItem.toLowerCase()) > -1);
          }
        }
      }
    }
  }

  filterBikesByModeId() {
    let modeId = this.selectedVal;
    if (this.allBikes != null) {
      if (modeId == BikeModes.All) {
        this.bikes = this.allBikes;
      }
      else if (modeId == BikeModes.AllAvailable) {
        this.bikes = this.allBikes.filter(x => x.BikeModeId == BikeModes.AvailableDocked || x.BikeModeId == BikeModes.AvailableFree);
        if (this.searchItem !== null || this.searchItem !== '') {
          this.bikes = this.bikes.filter(b => b.VisualId.indexOf(this.searchItem) > -1 || b.Serial.toLowerCase().indexOf(this.searchItem.toLowerCase()) > -1);
        }
      }
      else if (modeId == BikeModes.AllInUse) {
        this.bikes = this.allBikes.filter(x => x.BikeModeId == BikeModes.InUseInSession || x.BikeModeId == BikeModes.AvailableDocked || x.BikeModeId == BikeModes.AvailableFree);
        if (this.searchItem !== null || this.searchItem !== '') {
          this.bikes = this.bikes.filter(b => b.VisualId.indexOf(this.searchItem) > -1 || b.Serial.toLowerCase().indexOf(this.searchItem.toLowerCase()) > -1);
        }
      }
      else if (modeId == BikeModes.AllDisabled) {
        this.bikes = this.allBikes.filter(x => x.Disabled == true);
        if (this.searchItem !== null || this.searchItem !== '') {
          this.bikes = this.bikes.filter(b => b.VisualId.indexOf(this.searchItem) > -1 || b.Serial.toLowerCase().indexOf(this.searchItem.toLowerCase()) > -1);
        }
      }
      else if (modeId == BikeModes.AllDisabledRepair) {
        this.bikes = this.allBikes.filter(x => x.BikeModeId == BikeModes.DisabledToWorkshop || 
          x.BikeModeId == BikeModes.DisabledInWorkshop || x.BikeModeId == BikeModes.DisabledRepairFinished ||
          x.BikeModeId == BikeModes.DisabledCheckRequired || x.BikeModeId == BikeModes.DisabledTesting || 
          x.BikeModeId == BikeModes.DisabledMoving || x.BikeModeId == BikeModes.DisabledCheckedNeedsRepair ||
          x.BikeModeId == BikeModes.DisabledWithStreetTeam);
        if (this.searchItem !== null || this.searchItem !== '') {
          this.bikes = this.bikes.filter(b => b.VisualId.indexOf(this.searchItem) > -1 || b.Serial.toLowerCase().indexOf(this.searchItem.toLowerCase()) > -1);
        }
      }
      else {
        this.bikes = this.allBikes.filter(x => x.BikeModeId == modeId);
        if (this.searchItem !== null || this.searchItem !== '') {
          this.bikes = this.bikes.filter(b => b.VisualId.indexOf(this.searchItem) > -1 || b.Serial.toLowerCase().indexOf(this.searchItem.toLowerCase()) > -1);
        }
      }
    }
  }

  convertGracePeriod(value) {
    let graceDurationText = '';
    let now = moment().utc();
    let gracePeriod = moment(value);
    let diff = gracePeriod.diff(now);
    let duration = moment.duration(diff);
    graceDurationText = this.mapDurationText(duration, graceDurationText, diff);
    return graceDurationText;
  }

  private mapDurationText(duration: any, graceDurationText: string, diff: any) {
    let diffHours = moment.utc(diff).format("h");
    let diffMins = moment.utc(diff).format("mm");
    let durationInSec = duration.asSeconds();
    let durationInMin = duration.asMinutes();
    if (durationInSec > 0) {
      if (durationInSec < 60)
        graceDurationText = `${Math.round(durationInSec)} sec`;
      else if (durationInMin < 60)
        graceDurationText = `${Math.round(durationInMin)} min`;
      else
        graceDurationText = `${diffHours} hrs ${diffMins} min`;
    }
    return graceDurationText;
  }
}
