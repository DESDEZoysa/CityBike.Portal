import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { SessionsService } from '../services/sessions.service';
import { LoggerService, SettingsService } from '../services';
import * as moment from 'moment';
import { Router } from '@angular/router';
import { SessionTerminateDialogComponent } from './session-terminate-dialog/session-terminate-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { MatSelect } from '@angular/material/select';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { ScreenLayouts } from '../core/constants/screen-layouts';
import { LocalStorageKeys } from '../core/constants';
import { ExcelService } from '../services/excel.service';
import { ConvertTimePipe } from '../core/pipes/convert-time.pipe';
import { FormControl } from '@angular/forms';
import { AreasService } from '../services/areas.service';
import { ReplaySubject, Subject } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';
import { Area } from '../core/models/common/area';
import { SessionReasons } from '../core/constants/session-reasons';
import { RideSessionComponent } from './ride-session/ride-session.component';

@Component({
  selector: 'app-sessions',
  templateUrl: './sessions.component.html',
  styleUrls: ['./sessions.component.scss'],
  providers: [ConvertTimePipe]
})
export class SessionsComponent implements OnInit, OnDestroy {
  @ViewChild('sessionTable', { static: true }) table: any;
  @ViewChild('multiSelect', { static: true }) multiSelect: MatSelect;

  rideSessions;
  filteredRideSessions;
  exportRideSessions;
  isMobile: boolean = false;
  comment: string;
  loadingIndicator: boolean = true;
  searchItem: string = "";
  sessionsOngoingView: boolean = true;
  sessionLastDayView: boolean = false;
  sessionsLastWeekView: boolean = false;
  currentDayEndTimeStamp: any;
  fromDate: any;
  dateRanges = [
    { id: 1, name: 'Ongoing' },
    { id: 2, name: 'Last 24 Hours' },
    { id: 3, name: 'Last 7 Days' },
    { id: -2, name: 'Custom' }
  ];

  dateValues = {
    Custom: -2,
    Ongoing: 1,
    Last24hrs: 2,
    Last7Days: 3
  };
  isCustomDateShown: boolean;
  selectedDate: number;
  toDate: string;
  // selectedTimeZone: any;
  protected areas: Area[]; //= AREAS
  areaIds = [];
  selectedAreas;
  checkAll: boolean = false;
  reasons: any;
  isLoading: boolean = false;

  public readonly LAYOUT = ScreenLayouts;
  public layout: number = this.LAYOUT.MD;

  /**Search related */
  public areaMultiCtrl: FormControl = new FormControl();
  public areaMultiFilterCtrl: FormControl = new FormControl();
  public filteredAreaMulti: ReplaySubject<Area[]> = new ReplaySubject<Area[]>(1);
  protected _onDestroy = new Subject<void>();

  constructor(
    private sessionService: SessionsService,
    private router: Router,
    private loggerService: LoggerService,
    public dialog: MatDialog,
    public breakpointObserver: BreakpointObserver,
    private excelService: ExcelService,
    private convertTime: ConvertTimePipe,
    private areaService: AreasService,
    private settings: SettingsService
  ) {
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) && (document.documentElement.clientWidth < 768)) {
      this.isMobile = true;
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
    this.reasons = SessionReasons.reasons;
    this.selectedDate = this.dateValues.Ongoing;
    this.currentDayEndTimeStamp = moment().utc().format('YYYY-MM-DDTHH:mm:ss');

    //get local storage to check current selected areas
    this.selectedAreas = JSON.parse(localStorage.getItem(LocalStorageKeys.SELECTED_AREAS));

    this.getAreaList();

    // listen for search field value changes
    this.areaMultiFilterCtrl.valueChanges
      .pipe(takeUntil(this._onDestroy))
      .subscribe(() => {
        this.filterBanksMulti();
      });
  }

  ngOnDestroy() {
    this._onDestroy.next();
    this._onDestroy.complete();
  }

  setDefaultSelectedAreas() {
    if (this.selectedAreas == null || this.selectedAreas == undefined) {
      if (this.areas.length > 0) {
        let defaultAreaIds = [];
        let selectedAreaIds = [];

        this.areas.forEach((area, index) => {
          defaultAreaIds.push(area.AreaId);
          selectedAreaIds.push(this.areas[index]);
          this.areaIds.push(area.AreaId);
        });

        this.settings.setSetting(LocalStorageKeys.SELECTED_AREAS, JSON.stringify(defaultAreaIds));
        if (selectedAreaIds.length > 0) {
          this.areaMultiCtrl.patchValue(selectedAreaIds);
          this.checkAll = true;
        }
      }
    } else {
      if (this.selectedAreas.length > 0) {
        let selectedAreasLoad = [];

        this.selectedAreas.forEach((selectedArea) => {
          var in_array = this.areas.filter(function (item) {
            return item.AreaId == selectedArea
          });
          var index = this.areas.indexOf(in_array[0]);
          if (index != -1) {
            selectedAreasLoad.push(this.areas[index]);
            this.areaIds.push(selectedArea);
          }
        });

        this.areaMultiCtrl.patchValue(selectedAreasLoad);
        this.checkAll = false;
        if (selectedAreasLoad.length == this.areas.length) {
          this.checkAll = true;
        }
      }
    }
    this.getRideSessions();
  }

  toggleSelectAll(selectAllValue: boolean) {
    this.filteredAreaMulti.pipe(take(1), takeUntil(this._onDestroy))
      .subscribe(val => {
        if (selectAllValue) {
          this.areaMultiCtrl.patchValue(val);
          this.filterByAreas(false);
        } else {
          this.areaMultiCtrl.patchValue([]);
        }
      });
  }

  filterBanksMulti() {
    if (!this.areas) {
      return;
    }
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

  filterByAreas(opened: boolean) {
    if (!opened) {
      if (this.areaMultiCtrl.value != null) {
        this.areaMultiCtrl.value.forEach((areas) => {
          if (!this.areaIds.includes(areas.AreaId)) {
            this.areaIds.push(areas.AreaId);
          }
        });
      }

      //Top checkbox checked only if user permitted areas and selected areas mapped
      if (this.areaIds.length == this.areas.length) {
        this.checkAll = true;
      }

      if (this.areaIds.length < 1) {
        return this.loggerService.showErrorMessage("Please select one or more area(s) to filter.");
      }
      if (this.sessionsOngoingView) {
        this.getRideSessions();
      } else if (this.sessionLastDayView) {
        this.listLastDaySessions();
      } else if (this.sessionsLastWeekView) {
        this.listLastWeekSessions();
      } else if (this.isCustomDateShown) {
        if ((this.toDate == null) || (this.fromDate == null)) {
          return this.loggerService.showErrorMessage("Date fields cannot be empty");
        } else {
          this.filterSessionsByCustomDateAndAreas();
        }
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

        this.setDefaultSelectedAreas();
      },
      error => {
        this.loggerService.showErrorMessage("Getting areas failed.");
      }
    );
  }

  toggleExpandRow(row) {
    this.table.rowDetail.toggleExpandRow(row);
  }

  getRideSessions(isExport?: boolean) {
    this.loadingIndicator = true;
    this.sessionsOngoingView = true;

    if (this.areaMultiCtrl.value != null) {
      this.areaMultiCtrl.value.forEach((areas) => {
        if (!this.areaIds.includes(areas.AreaId)) {
          this.areaIds.push(areas.AreaId);
        }
      });
    }
    if (this.areaIds.length < 1) {
      this.loadingIndicator = false;
      return this.loggerService.showErrorMessage("Please select one or more area(s) to filter.");
    }
    if (this.areaIds.length > 0) {
      this.filteredRideSessions;
      this.sessionService.getActiveSessionsIncludingAreas(this.areaIds, isExport)
        .subscribe(result => {
          this.rideSessions = result;
          result.sort(function (a, b) {
            return new Date(b.StartTime).getTime() - new Date(a.StartTime).getTime();
          });
          this.setSessionReasons(result);
          this.calculateTripDuration(result);

          //handle session export object
          if (isExport) {
            this.exportRideSessions = result;
            this.generateExcel();
          }

          //if search item not null
          if (this.searchItem !== null || this.searchItem !== '') {
            this.filteredRideSessions = this.rideSessions.filter(
              b => ((b.VisualId != null) ? b.VisualId.indexOf(this.searchItem) > -1 : false) ||
                (b.RideSessionId.toLowerCase().indexOf(this.searchItem.toLowerCase()) > -1)
            );
          }

          this.loadingIndicator = false;
          this.sessionsOngoingView = true;
          this.sessionLastDayView = false;
          this.sessionsLastWeekView = false;
          this.settings.setSetting(LocalStorageKeys.SELECTED_AREAS, JSON.stringify(this.areaIds));
          this.areaIds = [];
        });
    }
  }

  calculateTripDuration(result) {
    let now = moment().utc();
    result.forEach((session) => {
      if (session.EndTime == null) {
        let start = moment(session.StartTime);
        let d = now.diff(start);
        session.Duration = moment.utc(d).format("HH:mm");
      } else {
        let start = moment(session.StartTime);
        let end = moment(session.EndTime);
        let d = end.diff(start);
        session.Duration = moment.utc(d).format("HH:mm");
      }
    });
    this.rideSessions = result;
  }

  setSessionReasons(sessions) {
    sessions.forEach((session) => {
      if (session.StartedReason != null) {
        let startReason = this.reasons.filter(f => f.id == session.StartedReason);
        session['StartReason'] = startReason[0].name;
      }
      if (session.EndedReason != null) {
        let endedReason = this.reasons.filter(f => f.id == session.EndedReason);
        session['EndReason'] = endedReason[0].name;
      }
    });
    this.rideSessions = sessions;
    this.filteredRideSessions = this.rideSessions;
  }

  listLastWeekSessions(isExport?: boolean) {
    this.isCustomDateShown = false;
    this.loadingIndicator = true;
    this.sessionsLastWeekView = true;
    let lastWeekTime = moment().subtract(7, 'days').utc().format('YYYY-MM-DDTHH:mm:ss');
    if (this.areaMultiCtrl.value != null) {
      this.areaMultiCtrl.value.forEach((areas) => {
        if (!this.areaIds.includes(areas.AreaId)) {
          this.areaIds.push(areas.AreaId);
        }
      });
    }
    if (this.areaIds.length < 1) {
      this.loadingIndicator = false;
      return this.loggerService.showErrorMessage("Please select one or more area(s) to filter.");
    }
    if (this.areaIds.length > 0) {
      this.sessionService.GetFilteredSessionsByArea(lastWeekTime, moment.utc().format('YYYY-MM-DDTHH:mm:ss'), this.areaIds, isExport)
        .subscribe(result => {
          if (result) {
            result.sort(function (a, b) {
              return new Date(b.StartTime).getTime() - new Date(a.StartTime).getTime();
            });
            this.setSessionReasons(result);
            this.calculateTripDuration(result);
          }
          this.sessionsLastWeekView = true;
          this.rideSessions = result;

          //handle session export object
          if (!isExport)
            this.filteredRideSessions = result;
          else {
            this.exportRideSessions = result;
            this.generateExcel();
          }

          //if search item not null
          if (this.searchItem !== null || this.searchItem !== '') {
            this.filteredRideSessions = this.rideSessions.filter(
              b => ((b.VisualId != null) ? b.VisualId.indexOf(this.searchItem) > -1 : false) ||
                (b.RideSessionId.toLowerCase().indexOf(this.searchItem.toLowerCase()) > -1)
            );
          }
          this.loadingIndicator = false;
          this.sessionsOngoingView = false;
          this.sessionLastDayView = false;
          this.sessionsLastWeekView = true;
          this.settings.setSetting(LocalStorageKeys.SELECTED_AREAS, JSON.stringify(this.areaIds));
          this.areaIds = [];
        });
    }
  }

  listLastDaySessions(isExport?: boolean) {
    this.toDate = "";
    this.fromDate = "";
    this.isCustomDateShown = false;
    this.loadingIndicator = true;
    this.sessionLastDayView = true;
    var lastDay = moment().subtract(24, 'hours').utc().format('YYYY-MM-DDTHH:mm:ss');
    if (this.areaMultiCtrl.value != null) {
      this.areaIds = [];
      this.areaMultiCtrl.value.forEach((areas) => {
        if (!this.areaIds.includes(areas.AreaId)) {
          this.areaIds.push(areas.AreaId);
        }
      });
    }
    if (this.areaIds.length < 1) {
      this.loadingIndicator = false;
      return this.loggerService.showErrorMessage("Please select one or more area(s) to filter.");
    }
    if (this.areaIds.length > 0) {
      this.sessionService.GetFilteredSessionsByArea(lastDay, moment.utc().format('YYYY-MM-DDTHH:mm:ss'), this.areaIds, isExport)
        .subscribe(result => {
          this.rideSessions = [];
          this.filteredRideSessions = [];
          if (result) {
            result.sort(function (a, b) {
              return new Date(b.StartTime).getTime() - new Date(a.StartTime).getTime();
            });
            this.setSessionReasons(result);
            this.calculateTripDuration(result);
          }
          this.sessionsLastWeekView = true;
          this.rideSessions = result;

          //handle session export object
          if (!isExport)
            this.filteredRideSessions = result;
          else {
            this.exportRideSessions = result;
            this.generateExcel();
          }

          //if search item not null
          if (this.searchItem !== null || this.searchItem !== '') {
            this.filteredRideSessions = this.rideSessions.filter(
              b => ((b.VisualId != null) ? b.VisualId.indexOf(this.searchItem) > -1 : false) ||
                (b.RideSessionId.toLowerCase().indexOf(this.searchItem.toLowerCase()) > -1)
            );
          }
          this.loadingIndicator = false;
          this.sessionsOngoingView = false;
          this.sessionLastDayView = true;
          this.sessionsLastWeekView = false;
          this.settings.setSetting(LocalStorageKeys.SELECTED_AREAS, JSON.stringify(this.areaIds));
          this.areaIds = [];
        });
    }
  }

  listOngoingSessions() {
    this.toDate = "";
    this.fromDate = "";
    this.isCustomDateShown = false;
    this.getRideSessions();
  }

  listCustomSession() {
    this.isCustomDateShown = true;
    this.sessionsOngoingView = false;
    this.sessionLastDayView = false;
    this.sessionsLastWeekView = false;
    this.filteredRideSessions = [];
  }

  navigateToBikeDetails(bikeId) {
    this.router.navigateByUrl('bikes/' + bikeId + '/details');
  }

  openDialog(selectedBikeId: number, selectedRideSessionId: string): void {
    let feeResult = false;
    const dialogRef = this.dialog.open(SessionTerminateDialogComponent, {
      width: '300px',
      data: { bikeId: selectedBikeId, comment: this.comment, rideSessionId: selectedRideSessionId, isFeeIncluded: feeResult }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result != null) {
        this.terminateSession(result);
      }
      this.comment = "";
    });
  }

  terminateSession(result) {
    let comment = { Comment: result.comment, RideSessionId: result.rideSessionId, IsTerminatedWithFee: result.isFeeIncluded };
    this.sessionService.terminateSession(result.bikeId, comment)
      .subscribe(data => {
        if (data.Status == true) {
          this.loggerService.showSuccessfulMessage('Successfully terminate the session.');
          this.ngOnInit();
        }
      }, (error: any) => {
        this.loggerService.showErrorMessage('Error occured while terminating the session.');
      });
  }

  searchSession(event) {
    if (this.searchItem === null || this.searchItem === '') {
      if (this.sessionsOngoingView) {
        this.getRideSessions();
      } else if (this.sessionLastDayView) {
        this.listLastDaySessions();
      } else if (this.sessionsLastWeekView) {
        this.listLastWeekSessions();
      }
    }
    else {
      if (this.rideSessions != null) {
        this.filteredRideSessions = this.rideSessions.filter(
          b => ((b.VisualId != null) ? b.VisualId.indexOf(this.searchItem) > -1 : false) ||
            (b.RideSessionId.toLowerCase().indexOf(this.searchItem.toLowerCase()) > -1) ||
            (b.EndUserId.toLowerCase().indexOf(this.searchItem.toLowerCase()) > -1)
        );
      }
    }
  }

  onDateChange() {
    this.isCustomDateShown = false;
    this.toDate = "";
    this.fromDate = "";
    if (this.selectedDate != this.dateValues.Custom) {
      this.toDate = this.currentDayEndTimeStamp;
    }
    if (this.selectedDate == this.dateValues.Custom) {
      this.isCustomDateShown = true;
    }
    else if (this.selectedDate == this.dateValues.Ongoing) {
      this.listOngoingSessions();
    }
    else if (this.selectedDate == this.dateValues.Last24hrs) {
      this.listLastDaySessions();
    } else if (this.selectedDate == this.dateValues.Last7Days) {
      this.listLastWeekSessions();
    }
  }

  filterSessionsByCustomDateAndAreas(isExport?: boolean) {
    if (isExport) {
      this.isLoading = true;
    }

    let endDate = this.toDate ? this.toDate : this.currentDayEndTimeStamp;
    let fromValue = moment(this.fromDate).startOf('day').format('YYYY-MM-DDTHH:mm:ss');
    let toDateValue = moment(endDate).endOf('day').format('YYYY-MM-DDTHH:mm:ss');

    if (this.areaMultiCtrl.value != null) {
      this.areaIds = [];
      this.areaMultiCtrl.value.forEach((areas) => {
        if (!this.areaIds.includes(areas.AreaId)) {
          this.areaIds.push(areas.AreaId);
        }
      });
    }

    if (this.areaIds.length < 1) {
      this.loadingIndicator = false;
      return this.loggerService.showErrorMessage("Please select one or more area(s) to filter.");
    } else {
      this.sessionService.GetFilteredSessionsByArea(fromValue, toDateValue, this.areaIds, isExport)
        .subscribe(result => {
          if (result) {
            result.sort(function (a, b) {
              return new Date(b.StartTime).getTime() - new Date(a.StartTime).getTime();
            });
            this.setSessionReasons(result);
            this.calculateTripDuration(result);
          }
          //handle session export object
          if (!isExport)
            this.filteredRideSessions = result;
          else {
            this.exportRideSessions = result;
            this.generateExcel();
          }

          this.isLoading = false;
          this.loadingIndicator = false;
          this.sessionsOngoingView = false;
          this.sessionLastDayView = false;
          this.sessionsLastWeekView = false;
          this.isCustomDateShown = true;
          this.areaIds = [];
        });
    }
  }

  onStartDatePicked(event) {
    if (event.value != null)
      this.fromDate = moment(event.value).format('YYYY-MM-DD');
  }

  onEndDatePicked(event) {
    if (event.value != null)
      this.toDate = moment(event.value).format('YYYY-MM-DD');
  }

  onCustomDateSearchClicked() {
    let fromValue = moment(this.fromDate).startOf('day').format('YYYY-MM-DDTHH:mm:ss');
    let toValue = moment(this.toDate).endOf('day').format('YYYY-MM-DDTHH:mm:ss');

    if ((this.fromDate != null && this.fromDate != "") && (this.toDate != null && this.toDate != "")) {
      this.loadingIndicator = true;
      if (fromValue > toValue) {
        this.loadingIndicator = false;
        this.filteredRideSessions = null;
        return this.loggerService.showErrorMessage("Invalid date range selected. End date should be grater than start date");
      } else {
        this.filterSessionsByCustomDateAndAreas();
      }
    }
  }

  handleExcelReportGeneration() {
    if (this.sessionsOngoingView) {
      this.getRideSessions(true);
    } else if (this.sessionLastDayView) {
      this.listLastDaySessions(true);
    } else if (this.sessionsLastWeekView) {
      this.listLastWeekSessions(true);
    } else if (this.isCustomDateShown) {
      if ((this.fromDate == null)) {
        return this.loggerService.showErrorMessage("Starting date cannot be empty");
      } else {
        this.filterSessionsByCustomDateAndAreas(true);
      }
    }
  }

  generateExcel() {
    if (this.exportRideSessions.length > 0) {
      let convertType = JSON.parse(localStorage.getItem(LocalStorageKeys.PREFERRED_TIMEZONE));
      let dataToExport = JSON.parse(JSON.stringify(this.exportRideSessions));
      if (convertType == null || convertType == undefined) {
        convertType = 'CET';
      }
      if (convertType == 'CET') {
        dataToExport = this.convertToTimeType(dataToExport);
      } else {
        this.excelService.generateSessionExcel(dataToExport);
      }
    } else {
      return this.loggerService.showErrorMessage("No session records found to export");
    }
  }

  convertToTimeType(dataToExport) {
    dataToExport.forEach((session) => {
      session['StartTime'] = this.convertTime.transform(session['StartTime']);
      session['EndTime'] = this.convertTime.transform(session['EndTime']);
      return session
    });

    this.excelService.generateSessionExcel(dataToExport);
    //dataToExport = "";
  }

  openDetailsInNewWindow(link: any, sessionId: any) {
    const defaultWidth = window.innerWidth;
    const defaultHeight = window.innerHeight;
    const urlToOpen = window.location.origin + link;
    const windowName = 'session-details-window' + sessionId;

    // Open the link in a new browser window
    window.open(urlToOpen, windowName, `width=${defaultWidth},height=${defaultHeight}`);
  }
}
