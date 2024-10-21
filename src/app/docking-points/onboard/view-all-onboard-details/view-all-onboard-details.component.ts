import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { ScreenLayouts } from '../../../core/constants/screen-layouts';
import { BikesService, LoggerService } from '../../../services';


export interface ViewOnboardData {
  onboardBikes: any;
  dockingStationId: any;
}

@Component({
  selector: 'app-view-all-onboard-details',
  templateUrl: './view-all-onboard-details.component.html',
  styleUrls: ['./view-all-onboard-details.component.scss']
})

export class ViewAllOnboardDetailsComponent implements OnInit {
  @ViewChild('onboardTable', { static: true }) table: any;
  isMobile: boolean;

  public readonly LAYOUT = ScreenLayouts;
  public layout: number = this.LAYOUT.MD;
  onboardBikes: any[];
  loadingIndicator: boolean;
  allOnboardBikes: any[];
  isCurrentStation: boolean;
  dockingStationId: any;
  toggleValues = {
    Candidates: 1,
    Completed: 2
  };
  selectedVal: number;

  constructor(private loggerService: LoggerService, public dialogRef: MatDialogRef<ViewAllOnboardDetailsComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ViewOnboardData,
    public dialog: MatDialog, public breakpointObserver: BreakpointObserver, private router: Router, private bikeService: BikesService) {
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      this.isMobile = true;
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

  onResize() {
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      this.isMobile = true;
    } else {
      this.isMobile = false;
    }
  }

  ngOnInit() {
    this.isCurrentStation = false;
    this.loadingIndicator = false;
    this.manageScreenWidth();
    //this.onboardBikes = this.data.onboardBikes;
    this.dockingStationId = this.data.dockingStationId;
    this.getAllOnboardLogs();
  }

  toggleExpandRow(row) {
    this.table.rowDetail.toggleExpandRow(row);
  }

  getAllOnboardLogs() {
    this.loadingIndicator = true;
    this.bikeService.getAllBikeOnboardLogs().subscribe(res => {
      this.onboardBikes = res;
      this.allOnboardBikes = res;
      this.listPreparedBikes();
      this.loadingIndicator = false;
    }, err => {
      this.loadingIndicator = false;
    })
  }

  startPassiveSessionBikeCommand(bike): void {
    this.bikeService.startPassiveSessionBikeCommand(bike.Serial).subscribe(data => {
      if (data.Status) {
        this.loggerService.showSuccessfulMessage("Start passive session command successful");
        var index = this.onboardBikes.findIndex(x => x.Serial == bike.Serial);
        this.onboardBikes[index]["InSession"] = true;
        var allIndex = this.allOnboardBikes.findIndex(x => x.Serial == bike.Serial);
        this.allOnboardBikes[allIndex]["InSession"] = true;
      } else {
        this.loggerService.showErrorMessage("Error,start passive session command failed");
      }
    }, error => {
      this.loggerService.showErrorMessage("Error,start passive session command failed");
    });
  }

  stopPassiveSessionBikeCommand(bike): void {
    this.bikeService.stopPassiveSessionBikeCommand(bike.Serial).subscribe(data => {
      if (data.Status) {
        this.loggerService.showSuccessfulMessage("Stop passive session command successful");
        var index = this.onboardBikes.findIndex(x => x.Serial == bike.Serial);
        this.onboardBikes[index]["InSession"] = false;
        var allIndex = this.allOnboardBikes.findIndex(x => x.Serial == bike.Serial);
        this.allOnboardBikes[allIndex]["InSession"] = false;
      } else {
        this.loggerService.showErrorMessage("Error,stop passive session command failed");
      }
    }, error => {
      this.loggerService.showErrorMessage("Error,stop passive session command failed");
    });
  }

  listPreparedBikes() {
    this.selectedVal = this.toggleValues.Candidates;
    if (this.isCurrentStation)
      this.onboardBikes = this.allOnboardBikes.filter(x => !x.IsOnboarded && x.NearByDockingStationId == this.dockingStationId);
    else
      this.onboardBikes = this.allOnboardBikes.filter(x => !x.IsOnboarded);
  }

  listCompletedBikes() {
    this.selectedVal = this.toggleValues.Completed;
    if (this.isCurrentStation)
      this.onboardBikes = this.allOnboardBikes.filter(x => x.IsOnboarded && x.NearByDockingStationId == this.dockingStationId);
    else
      this.onboardBikes = this.allOnboardBikes.filter(x => x.IsOnboarded);
  }

  changeState() {
    if (this.selectedVal == this.toggleValues.Candidates)
      this.listPreparedBikes();
    else if (this.selectedVal == this.toggleValues.Completed)
      this.listCompletedBikes();
  }
}
