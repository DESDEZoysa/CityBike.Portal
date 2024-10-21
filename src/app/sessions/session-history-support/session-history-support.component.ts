import { ActivatedRoute } from '@angular/router';
import { Component, OnInit, ViewChild } from '@angular/core';
import { SessionsService } from '../../services/sessions.service';
import { LoggerService } from '../../services';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { BikeAddress } from '../../core/models';
import * as moment from 'moment';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { ScreenLayouts } from '../../core/constants/screen-layouts';
import { SessionReasons } from '../../core/constants/session-reasons';


@Component({
  selector: 'app-session-history-support',
  templateUrl: './session-history-support.component.html',
  styleUrls: ['./session-history-support.component.scss']
})

export class SessionHistorySupportComponent implements OnInit {
  @ViewChild('sessionHistoryTable', { static: true }) table: any;

  endUserId: string = null;
  allRideSessions: any;
  isMobile: boolean = false;
  loadingIndicator: boolean = true;
  isCustomDateShown: boolean;
  fromDate: string;
  toDate: string;
  selectedDate: any;
  dateValues = {
    Custom: -2,
    LastHour: 1,
    LastDay: 2,
    LastWeek: 3,
    LastMonth: 4
  };

  activeFilters = [
    { id: -1, name: 'All' },
    { id: 0, name: 'Ongoing' },
    { id: 1, name: 'Completed' }
  ];

  dateRanges = [
    { id: 1, name: 'Last Hour' },
    { id: 2, name: 'Last Day' },
    { id: 3, name: 'Last Week' },
    { id: 4, name: 'Last Month' },
    { id: -2, name: 'Custom' }
  ];

  currentDayEndTimeStamp: string;
  sessionStatus: number;
  rideSessions: any;
  reasons: any;


  public readonly LAYOUT = ScreenLayouts;
  public layout: number = this.LAYOUT.MD;

  constructor(
    private sessionService: SessionsService,
    private router: Router,
    private loggerService: LoggerService,
    public dialog: MatDialog,
    private activateRouter: ActivatedRoute,
    public breakpointObserver: BreakpointObserver
  ) {
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) && document.documentElement.clientWidth < 768) {
      this.isMobile = true;
    }
    this.activateRouter.queryParams.subscribe(params => {
      this.endUserId = params['endUserId'];
    });
  }

  ngOnInit() {
    this.reasons = SessionReasons.reasons;
    this.manageScreenWidth();
    this.getAllRideSessionByEndUserId();
    this.setDefaultFilter();
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

  setDefaultFilter() {
    this.selectedDate = this.dateValues.LastWeek;
    this.setDefaultDate();
    this.sessionStatus = -1;
  }

  setDefaultDate() {
    this.currentDayEndTimeStamp = moment().utc().format('YYYY-MM-DDTHH:mm:ss');
    this.fromDate = moment().subtract(7, 'days').utc().format('YYYY-MM-DDTHH:mm:ss');
    this.toDate = this.currentDayEndTimeStamp;
  }

  onResize() {
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) && document.documentElement.clientWidth < 768) {
      this.isMobile = true;
    } else {
      this.isMobile = false;
    }
  }

  toggleExpandRow(row) {
    this.table.rowDetail.toggleExpandRow(row);
  }

  getAllRideSessionByEndUserId() {
    if (this.endUserId == null || this.endUserId == '') {
      this.loggerService.showErrorMessage("Please enter valid URL or EndUserId.");
      this.loadingIndicator = false;
    }
    else {
      this.loadingIndicator = true;
      this.sessionService.getAllRideSessionByEndUserId(this.endUserId).subscribe(data => {
        data.forEach(function (item, index) {
          item['Index'] = index;
          item['Start'] = {
            BikeId: item.BikeId,
            Position: item.StartLocation
          };
          item['End'] = {
            BikeId: item.BikeId,
            Position: item.EndLocation
          };
        });
        this.allRideSessions = data;
        let sessions = this.allRideSessions.filter(x => x.StartTime >= this.fromDate && x.StartTime < this.toDate);
        this.setSessionReasons(sessions);
        this.loadingIndicator = false;
      }, error => {
        this.loadingIndicator = false;
        this.loggerService.showErrorMessage("Getting session history failed.");
      });
    }
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
  }

  updateStartAddress(data: BikeAddress, row: any): void {
    this.allRideSessions[row.Index].StartDockingStationName = data.Address.DisplayText;
  }

  updateEndAddress(data: BikeAddress, row: any): void {
    this.allRideSessions[row.Index].EndDockingStationName = data.Address.DisplayText;
  }

  navigateToBikeDetailPage(bikeId) {
    this.router.navigateByUrl('bikes/' + bikeId + '/details');
  }

  onActiveChange(event) {
    if (this.sessionStatus != 0) {
      this.onDateChange();
    }
    else {
      this.setDefaultDate();
      this.rideSessions = this.allRideSessions.filter(x => x.EndTime == null);
    }
  }

  onStartDatePicked(event) {
    if (event.value != null) {
      this.fromDate = moment(event.value).utc().format('YYYY-MM-DDTHH:mm:ss');
    }
    this.sendFilterRequestForValidDateRange();
  }

  onEndDatePicked(event) {
    if (event.value != null) {
      this.toDate = moment(event.value).utc().format('YYYY-MM-DDTHH:mm:ss');
    }
    this.sendFilterRequestForValidDateRange();
  }


  onDateChange() {
    this.isCustomDateShown = false;
    this.fromDate = "";
    this.toDate = "";
    if (this.selectedDate != this.dateValues.Custom) {
      this.toDate = this.currentDayEndTimeStamp;
    }
    if (this.selectedDate == this.dateValues.Custom) {
      this.isCustomDateShown = true;
    } else if (this.selectedDate == this.dateValues.LastHour) {
      this.fromDate = moment().subtract(1, 'hour').utc().format('YYYY-MM-DDTHH:mm:ss');
      this.toDate = moment().subtract(0, 'hour').utc().format('YYYY-MM-DDTHH:mm:ss');
    } else if (this.selectedDate == this.dateValues.LastDay) {
      this.fromDate = moment().subtract(24, 'hour').utc().format('YYYY-MM-DDTHH:mm:ss');
    } else if (this.selectedDate == this.dateValues.LastWeek) {
      this.fromDate = moment().subtract(7, 'days').utc().format('YYYY-MM-DDTHH:mm:ss');
    }
    else if (this.selectedDate == this.dateValues.LastMonth) {
      this.fromDate = moment().subtract(1, 'months').utc().format('YYYY-MM-DDTHH:mm:ss');
    }
    this.sendFilterRequestForValidDateRange();
  }

  sendFilterRequestForValidDateRange() {
    var from = moment(this.fromDate);
    var to = moment(this.toDate);
    var duration = moment.duration(to.diff(from));
    var dates = duration.asDays();
    if ((this.fromDate != null && this.fromDate != "") && (this.toDate != null && this.toDate != "")) {
      if (this.fromDate > this.toDate) {
        this.loggerService.showErrorMessage('Invalid date range selected.From date is greater than To date.');
      }
      else if (dates > 60) {
        this.loggerService.showErrorMessage('Invalid date range selected.Duration should be less than 60 days');
      }
      else {
        if (this.sessionStatus == -1) {
          this.rideSessions = this.allRideSessions.filter(x => x.StartTime >= this.fromDate && x.StartTime < this.toDate);
          this.rideSessions = this.rideSessions.filter(x => {
            if (x.EndTime || (!x.EndTime && x.CurrentSessionId))
              return x;
          });
        }
        else if (this.sessionStatus == 1)
          this.rideSessions = this.allRideSessions.filter(x => x.EndTime != null && x.StartTime >= this.fromDate && x.StartTime < this.toDate);
      }
    }
  }
}
