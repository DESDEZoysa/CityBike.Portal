import { Component, OnInit, ViewChild, Input, Output, EventEmitter } from '@angular/core';
import { SessionsService } from '../../services/sessions.service';
import { BikesService, LoggerService } from '../../services';
import { Router } from '@angular/router';
import * as moment from 'moment';
import 'moment-timezone';
import { Bike } from '../../core/models';
import { MatDialog } from '@angular/material/dialog';
import { SessionTerminateDialogComponent } from '../../sessions/session-terminate-dialog/session-terminate-dialog.component';
import { ScreenLayouts } from '../../core/constants/screen-layouts';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { SessionReasons } from '../../core/constants/session-reasons';
import { BikeModes } from '../../core/enums/bikeModes';
import { RideSessionComponent } from '../../sessions/ride-session/ride-session.component';


@Component({
  selector: 'app-bike-sessions',
  templateUrl: './bike-sessions.component.html',
  styleUrls: ['./bike-sessions.component.scss']
})
export class BikeSessionsComponent implements OnInit {
  @Input() bike: Bike;
  @Input() onGoingSessions: any[];
  @ViewChild('sessionTable', { static: true }) table: any;
  @Output() bikeReload = new EventEmitter();

  rideSessions;
  filteredRideSessions;
  isMobile: boolean = false;
  comment: string;
  loadingIndicator: boolean = true;
  searchItem: string = "";
  sessionsOngoingView: boolean = true;
  sessionLastDayView: boolean = false;
  sessionsLastWeekView: boolean = false;
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
  fromDate: string;
  toDate: string;
  selectedDate: any;
  currentDayEndTimeStamp: string;
  reasons: any;

  public readonly LAYOUT = ScreenLayouts;
  public layout: number = this.LAYOUT.MD;
  refreshIntervalId: any;

  constructor(
    private sessionService: SessionsService,
    private bikeService: BikesService,
    private router: Router,
    private loggerService: LoggerService,
    public dialog: MatDialog,
    public breakpointObserver: BreakpointObserver
  ) {
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      this.isMobile = true;
    }
  }

  ngOnInit() {
    this.reasons = SessionReasons.reasons;
    this.manageScreenWidth();
    this.selectedDate = this.dateValues.Ongoing;
    this.currentDayEndTimeStamp = moment().utc().format('YYYY-MM-DDTHH:mm:ss');
  }

  //reload componemt when parent data received via observable
  ngOnChanges(): void {
    this.getRideSessions();
  }

  ngOnDestroy() {
    clearInterval(this.refreshIntervalId);
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
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      this.isMobile = true;
    } else {
      this.isMobile = false;
    }
  }

  toggleExpandRow(row) {
    this.table.rowDetail.toggleExpandRow(row);
  }

  getRideSessions() {
    this.isCustomDateShown = false;
    this.loadingIndicator = true;

    this.bikeService.getBikeSessionByBikeId(this.bike.BikeId, true).subscribe(result => {
      this.formatRideDetails(result);
      this.loadingIndicator = false;
    }, err => {
      this.loadingIndicator = false;
    });
  }

  formatRideDetails(result) {
    if (result) {
      let resArr = [];
      resArr.push(result);
      result = resArr;
      result = result.map(x => this.calculateTripDuration(x));
      result = result.map(r => this.setSessionReasons(r));
      result.sort(function (a, b) {
        return new Date(b.StartTime).getTime() - new Date(a.StartTime).getTime();
      });
    }
    this.rideSessions = result;
    this.filteredRideSessions = this.rideSessions;
  }

  listLastWeekSessions() {
    this.isCustomDateShown = false;
    this.sessionsOngoingView = false;
    this.loadingIndicator = true;
    let lastWeekTime = moment().subtract(7, 'days').utc().format('YYYY-MM-DDTHH:mm:ss');
    this.bikeService.GetFilteredSessions(this.bike.BikeId, lastWeekTime, moment.utc().format('YYYY-MM-DDTHH:mm:ss'))
      .subscribe(result => {
        if (result) {
          result = result.map(x => this.calculateTripDuration(x));
          result = result.map(r => this.setSessionReasons(r));
          result.sort(function (a, b) {
            return new Date(b.StartTime).getTime() - new Date(a.StartTime).getTime();
          });
        }
        this.filteredRideSessions = result;
        this.loadingIndicator = false;
      });
  }

  listLastDaySessions() {
    this.isCustomDateShown = false;
    this.sessionsOngoingView = false;
    this.loadingIndicator = true;
    var lastDay = moment().subtract(24, 'hours').utc().format('YYYY-MM-DDTHH:mm:ss');
    this.bikeService.GetFilteredSessions(this.bike.BikeId, lastDay, moment.utc().format('YYYY-MM-DDTHH:mm:ss'))
      .subscribe(result => {
        if (result) {
          result = result.map(x => this.calculateTripDuration(x));
          result = result.map(r => this.setSessionReasons(r));
          result.sort(function (a, b) {
            return new Date(b.StartTime).getTime() - new Date(a.StartTime).getTime();
          });
        }
        this.filteredRideSessions = result;
        this.loadingIndicator = false;
      });
  }

  setSessionReasons(session) {
    if (session.StartedReason != null) {
      let startReason = this.reasons.filter(f => f.id == session.StartedReason);
      session['StartReason'] = startReason[0].name;
    }
    if (session.EndedReason != null) {
      let endedReason = this.reasons.filter(f => f.id == session.EndedReason);
      session['EndReason'] = endedReason[0].name;
    }
    return session;
  }

  listOngoingSessions() {
    this.isCustomDateShown = false;
    this.sessionsOngoingView = true;
    this.filteredRideSessions = this.rideSessions ? this.rideSessions : [];
    this.getRideSessions();
  }

  listCustomSession() {
    this.isCustomDateShown = true;
    this.sessionsOngoingView = false;
    this.filteredRideSessions = [];
  }

  calculateTripDuration(session) {
    let now = moment().utc();
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
    return session;
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
          this.refreshIntervalId = setInterval(
            () => this.bikeService.getBikeDetails(this.bike.BikeId).subscribe(res => {
              var bikeDet = res;
              if (bikeDet["BikeModeId"] != BikeModes.InUseInSession && bikeDet["BikeModeId"] != BikeModes.InUsePassiveSession) {
                this.bikeReload.emit({ "state": +true });
                this.loggerService.showSuccessfulMessage('Successfully terminate the session.');
                this.ngOnInit();
                clearInterval(this.refreshIntervalId);
              }
            }),
            2000
          );
        }
      }, (error: any) => {
        this.loggerService.showErrorMessage('Error occured while terminating the session.');
      });
  }

  searchSession(event) {
    if (this.searchItem === null || this.searchItem === '') {
      if (this.selectedDate == this.dateValues.Ongoing) {
        this.getRideSessions();
      } else if (this.selectedDate == this.dateValues.Last24hrs) {
        this.listLastDaySessions();
      } else if (this.selectedDate == this.dateValues.Last7Days) {
        this.listLastWeekSessions();
      }

    }
    else {
      if (this.filteredRideSessions != null) {
        this.filteredRideSessions = this.filteredRideSessions.filter(
          b =>
            b.RideSessionId.toLowerCase().indexOf(this.searchItem.toLowerCase()) > -1
            ||
            b.EndUserId.toLowerCase().indexOf(this.searchItem.toLowerCase()) > -1
        );
      }
    }
  }

  onDateChange(event) {
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
    let toDate = moment(this.toDate).startOf('day').format('YYYY-MM-DDTHH:mm:ss');

    if ((this.fromDate != null && this.fromDate != "") && (this.toDate != null && this.toDate != "")) {
      if (this.fromDate > this.toDate) {
        this.filteredRideSessions = null;
        this.loggerService.showErrorMessage('Invalid date range selected. From date should be smaller than To date.');
      } else {
        this.loadingIndicator = true;
        this.filteredRideSessions = [];
        this.bikeService.GetFilteredSessions(this.bike.BikeId, fromValue, toDate)
          .subscribe(result => {
            if (result) {
              result = result.map(x => this.calculateTripDuration(x));
              result = result.map(r => this.setSessionReasons(r));
              result.sort(function (a, b) {
                return new Date(b.StartTime).getTime() - new Date(a.StartTime).getTime();
              });
            }
            this.filteredRideSessions = result;
            this.loadingIndicator = false;
          });
      }
    }
  }

  openDetailsDialog(sessionId) {
    const dialogRef = this.dialog.open(RideSessionComponent, {
      width: '1360px',
      maxHeight: '90vh',
      data: { SessionId: sessionId }
    });
    dialogRef.afterClosed().subscribe(result => {
    });
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
