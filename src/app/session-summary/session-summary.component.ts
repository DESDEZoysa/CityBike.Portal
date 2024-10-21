
import { forkJoin as observableForkJoin, Observable } from 'rxjs';
import { Component, OnInit, ViewChild } from '@angular/core';
import * as moment from 'moment';
import { LocalStorageKeys } from '../core/constants';
import { BikeStatusColor } from '../core/constants/bike-status-color';
import { BikeDisableState } from '../core/enums/bikeDisableState';
import { BikeModes } from '../core/enums/bikeModes';
import { BikeStatus } from '../core/enums/bikeStatus';
import { CommonHandler } from '../core/handlers/common-handler';
import { TimeZonePipe } from '../core/pipes/time-zone.pipe';
import { BikesService, LoggerService } from '../services';
import { SessionsService } from '../services/sessions.service';
import { UserService } from '../services/users.service';

@Component({
  selector: 'app-session-summary',
  templateUrl: './session-summary.component.html',
  styleUrls: ['./session-summary.component.scss'],
  providers: [TimeZonePipe]
})
export class SessionSummaryComponent implements OnInit {
  @ViewChild('BikehistoryTable', { static: false }) bikeHistorytable: any;
  @ViewChild('DPhistoryTable', { static: false }) dpHistorytable: any;
  sessionDPHistory: any;
  sessionBikeHistory: any;
  allBikesSessionHistory: any;
  selectedMonth = new Date('YYYY-MM');
  startDate = new Date();
  isMobile: boolean = false;
  bikeList = [];
  loadingIndicator: boolean = true;
  categories: any;
  date = moment();
  dateRanges = [
    { id: 1, name: 'Last Hour' },
    { id: 2, name: 'Last Day' },
    { id: 3, name: 'Last Week' },
    { id: 4, name: 'Last Month' },
    { id: -2, name: 'Custom' }
  ];
  dateValues = {
    Custom: -2,
    LastHour: 1,
    LastDay: 2,
    LastWeek: 3,
    LastMonth: 4
  };
  fromDate;
  toDate;
  fromDateValue;
  toDateValue;
  selectedDate;
  isCustomDateShown = false;
  authToken: any;
  isLoading: boolean;
  refreshIntervalId: any;
  userId: any;
  bikes: any;
  areaIds = [];

  constructor(private sessionService: SessionsService, private loggerService: LoggerService,
    private userService: UserService, private bikesService: BikesService) {
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
    this.setDefaultFilters();
    this.authToken = JSON.parse(localStorage.getItem(LocalStorageKeys.OAUTH_TOKEN));
    if (this.authToken._claims) {
      if (this.userId == null || typeof this.userId === 'undefined') {
        this.setUserDetails();
      }
      this.getLoggedInUserAreas();
    }
    else {
      this.isLoading = true;
      setTimeout(() => {
        this.setUserDetails();
        if (this.userId == null || typeof this.userId === 'undefined') {
          //wait for 2 seconds and try once
          setTimeout(() => {
            this.setUserDetails();
            if (this.userId == null || typeof this.userId === 'undefined') {
              return this.loggerService.showErrorMessage("Cannot find logged in user details.Please logoff and login again");
            }
          }, 3000);
        }
        this.getLoggedInUserAreas();
      }, 4000);
    }

    this.refreshIntervalId = setInterval(() => this.refreshSessionSummmary(), 60000 * 5);
  }

  ngOnDestroy() {
    clearInterval(this.refreshIntervalId);
  }

  toggleExpandBikeTableRow(row) {
    this.bikeHistorytable.rowDetail.toggleExpandRow(row);
  }

  toggleExpandDPTableRow(row) {
    this.dpHistorytable.rowDetail.toggleExpandRow(row);
  }

  setDefaultFilters() {
    let currentDayEndTimeStamp = moment().utc();
    this.selectedDate = this.dateValues.LastDay;
    this.fromDate = moment(currentDayEndTimeStamp).subtract(1, 'days').format('YYYY-MM-DDTHH:mm:ss');
    this.toDate = moment(currentDayEndTimeStamp).format('YYYY-MM-DDTHH:mm:ss');
    this.fromDateValue = moment(currentDayEndTimeStamp).subtract(1, 'days').format('YYYY-MM-DDTHH:mm:ss');
    this.toDateValue = moment(currentDayEndTimeStamp).format('YYYY-MM-DDTHH:mm:ss');
  }

  onStartDatePicked(event) {
    if (event.value != null) {
      this.fromDate = moment(event.value).format('YYYY-MM-DD');
      this.fromDateValue = moment(event.value).startOf('day').format('YYYY-MM-DDTHH:mm:ss');
    }
    this.sendFilterRequestForValidDateRange();
  }

  onEndDatePicked(event) {
    if (event.value != null) {
      this.toDate = moment(event.value).format('YYYY-MM-DD');
      this.toDateValue = moment(event.value).endOf('day').format('YYYY-MM-DDTHH:mm:ss');
    }
    this.sendFilterRequestForValidDateRange();
  }

  onDateChange(event: any) {
    this.isCustomDateShown = false;
    this.fromDate = "";
    this.toDate = "";
    let currentDayEndTimeStamp = moment().utc();

    if (this.selectedDate == this.dateValues.Custom) {
      this.isCustomDateShown = true;

      this.sessionBikeHistory = [];
      this.sessionDPHistory = [];
    } else if (this.selectedDate == this.dateValues.LastHour) {
      this.fromDate = moment(currentDayEndTimeStamp).subtract(1, 'hour').format('YYYY-MM-DDTHH:mm:ss');
      this.fromDateValue = this.fromDate;
      this.toDate = moment(currentDayEndTimeStamp).format('YYYY-MM-DDTHH:mm:ss');
      this.toDateValue = this.toDate;
    } else if (this.selectedDate == this.dateValues.LastDay) {
      this.fromDate = moment(currentDayEndTimeStamp).subtract(1, 'days').format('YYYY-MM-DDTHH:mm:ss');
      this.fromDateValue = this.fromDate;
      this.toDate = moment(currentDayEndTimeStamp).format('YYYY-MM-DDTHH:mm:ss');
      this.toDateValue = this.toDate;
    } else if (this.selectedDate == this.dateValues.LastWeek) {
      this.fromDate = moment(currentDayEndTimeStamp).subtract(7, 'days').format('YYYY-MM-DDTHH:mm:ss');
      this.fromDateValue = this.fromDate;
      this.toDate = moment(currentDayEndTimeStamp).format('YYYY-MM-DDTHH:mm:ss');
      this.toDateValue = this.toDate;
    }
    else if (this.selectedDate == this.dateValues.LastMonth) {
      this.fromDate = moment(currentDayEndTimeStamp).subtract(1, 'months').format('YYYY-MM-DDTHH:mm:ss');
      this.fromDateValue = this.fromDate;
      this.toDate = moment(currentDayEndTimeStamp).format('YYYY-MM-DDTHH:mm:ss');
      this.toDateValue = this.toDate;
    }
    this.sendFilterRequestForValidDateRange();
  }

  sendFilterRequestForValidDateRange() {
    var from = moment(this.fromDate);
    var to = moment(this.toDate);
    var duration = moment.duration(to.diff(from));
    if ((this.fromDate != null && this.fromDate != "") && (this.toDate != null && this.toDate != "")) {
      if (this.fromDate > this.toDate) {
        this.loggerService.showErrorMessage('Invalid date range selected.From date should be smaller than To date.');
      }
      else {
        this.getAllSessionSummaryData();
      }
    }
  }

  setRefreshFilters() {
    let currentDayEndTimeStamp = moment().utc();
    if (this.selectedDate == this.dateValues.LastHour) {
      this.fromDate = moment(currentDayEndTimeStamp).subtract(1, 'hour').format('YYYY-MM-DDTHH:mm:ss');
      this.fromDateValue = this.fromDate;
      this.toDate = moment(currentDayEndTimeStamp).format('YYYY-MM-DDTHH:mm:ss');
      this.toDateValue = this.toDate;
    } else if (this.selectedDate == this.dateValues.LastDay) {
      this.fromDate = moment(currentDayEndTimeStamp).subtract(1, 'days').format('YYYY-MM-DDTHH:mm:ss');
      this.fromDateValue = this.fromDate;
      this.toDate = moment(currentDayEndTimeStamp).format('YYYY-MM-DDTHH:mm:ss');
      this.toDateValue = this.toDate;
    } else if (this.selectedDate == this.dateValues.LastWeek) {
      this.fromDate = moment(currentDayEndTimeStamp).subtract(7, 'days').format('YYYY-MM-DDTHH:mm:ss');
      this.fromDateValue = this.fromDate;
      this.toDate = moment(currentDayEndTimeStamp).format('YYYY-MM-DDTHH:mm:ss');
      this.toDateValue = this.toDate;
    }
    else if (this.selectedDate == this.dateValues.LastMonth) {
      this.fromDate = moment(currentDayEndTimeStamp).subtract(1, 'months').format('YYYY-MM-DDTHH:mm:ss');
      this.fromDateValue = this.fromDate;
      this.toDate = moment(currentDayEndTimeStamp).format('YYYY-MM-DDTHH:mm:ss');
      this.toDateValue = this.toDate;
    }
  }

  refreshSessionSummmary() {
    this.setRefreshFilters();
    this.getAllSessionSummaryData();
  }

  getLoggedInUserAreas() {
    this.isLoading = true;
    this.userService.getUserAreaByUserId(this.userId).subscribe((data) => {
      if (data.length > 0) {
        data.forEach((area) => {
          this.areaIds.push(area.AreaId);
        });
      }
      this.getAllSessionSummaryData();
    });
  }

  getAllSessionSummaryData() {
    this.isLoading = true;
    if (this.areaIds.length > 0) {
      this.getAllStatisticsByLoggedUserAreas();
    } else {
      this.getAllStatistics();
    }
  }

  getAllStatisticsByLoggedUserAreas() {
    let requestDto = { fromDate: this.fromDateValue, toDate: this.toDateValue, isSuccessfulSession: false, areaIds: this.areaIds };
    observableForkJoin([
      this.bikesService.getAllBikeModesByArea(this.areaIds),
      this.sessionService.GetAllFilteredSessionHistory(requestDto)
    ])
      .subscribe(data => {
        this.mapBikeStats(data[0]);
        this.mapSessionSummaryStats(data[1]);
        this.isLoading = false;
      }, err => {
        this.isLoading = false;
      });
  }

  getAllStatistics() {
    let requestDto = { fromDate: this.fromDateValue, toDate: this.toDateValue, isSuccessfulSession: false, areaIds: this.areaIds };
    observableForkJoin([
      this.bikesService.getAllBikeModes(),
      this.sessionService.GetAllFilteredSessionHistory(requestDto)
    ])
      .subscribe(data => {
        this.mapBikeStats(data[0]);
        this.mapSessionSummaryStats(data[1]);
        this.isLoading = false;
      }, err => {
        this.isLoading = false;
      });
  }

  private setUserDetails() {
    let user = JSON.parse(localStorage.getItem(LocalStorageKeys.USER_DETAILS));
    if (user != null) {
      this.userId = user.UserId;
    }
  }

  private mapSessionSummaryStats(res: any) {
    let allSessionSummary = res;
    if (allSessionSummary) {
      this.sessionBikeHistory = allSessionSummary["SessionHistoryBikeDtos"];
      this.sessionBikeHistory = this.sessionBikeHistory.map((x: any) => this.setBikeStatus(x));
      this.sessionDPHistory = allSessionSummary["SessionHistoryDPDtos"];
      this.sessionDPHistory.map(x => {
        x["DisplayText"] = `${x["NumberOfSessions"]} (${Math.round(x["TotalPercentage"])}%)`;
      });
      this.allBikesSessionHistory = allSessionSummary["AllBikeSessionHistoryDtos"];
      this.allBikesSessionHistory.map(x => {
        x["DisplayText"] = `${x["NumberOfSessions"]} (${Math.round(x["TotalPercentage"])}%)`;
      });
      this.allBikesSessionHistory = this.allBikesSessionHistory.map((x: any) => this.setBikeStatus(x));
    }
  }

  private mapBikeStats(bikeModes: any) {
    this.bikes = {
      All: bikeModes.find(x => x.Id == BikeModes.All).TotalCount,
      AllId: bikeModes.find(x => x.Id == BikeModes.All).Id,

      AllInUse: bikeModes.find(x => x.Id == BikeModes.AllInUse).TotalCount,
      AllInUseId: bikeModes.find(x => x.Id == BikeModes.AllInUse).Id,

      InUseInSession: bikeModes.find(x => x.Id == BikeModes.InUseInSession).TotalCount,
      InUseInSessionId: bikeModes.find(x => x.Id == BikeModes.InUseInSession).Id,

      DisabledCheckRequired: bikeModes.find(x => x.Id == BikeModes.DisabledCheckRequired).TotalCount,
      DisabledCheckRequiredId: bikeModes.find(x => x.Id == BikeModes.DisabledCheckRequired).Id,
    };
  }

  private setBikeStatus(bike: any) {
    bike["BikeStatus"] = CommonHandler.getBikeStatus(bike, bike["DockingStationId"], bike['DockingPointId']);
    return bike;
  }
}
