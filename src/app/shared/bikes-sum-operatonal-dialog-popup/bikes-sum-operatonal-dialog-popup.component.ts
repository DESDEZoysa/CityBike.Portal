import { Component, Inject, OnInit } from '@angular/core';
import * as moment from 'moment';
import 'moment-timezone';
import { BikesService, LoggerService } from '../../services';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ExcelService } from '../../services/excel.service';

export interface BikeStatsData {
  dashboardCategory: any;
}

@Component({
  selector: 'app-bikes-sum-operatonal-dialog-popup',
  templateUrl: './bikes-sum-operatonal-dialog-popup.component.html',
  styleUrls: ['./bikes-sum-operatonal-dialog-popup.component.scss']
})
export class BikesSumOperatonalDialogPopupComponent implements OnInit {

  operationalBikesData: any;
  isMobile: boolean = false;
  loadingIndicator: boolean = false;
  dateRanges = [
    { id: 1, name: 'COMMON.LAST_DAY' },
    { id: 2, name: 'COMMON.LAST_WEEK' },
    { id: 3, name: 'COMMON.LAST_MONTH' },
    { id: -2, name: 'COMMON.CUSTOM' }
  ];
  dateValues = {
    Custom: -2,
    LastDay: 1,
    LastWeek: 2,
    LastMonth: 3
  };

  selectedDate = -1;
  isCustomDateShown = false;
  fromDate: string;
  fromDateValue: string;
  toDate: string;
  toDateValue: string;
  currentDayEndTimeStamp: any;
  public readonly LAYOUT = {
    XS: 768,
    SM: 992,
    MD: 1200,
    LG: 1600,
    XL: 1920,
    XXL: 2560,
  };

  public layout: number = this.LAYOUT.MD;
  dashboardCategory: any;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: BikeStatsData,
    public dialogRef: MatDialogRef<BikesSumOperatonalDialogPopupComponent>,
    private loggerService: LoggerService,
    private bikesService: BikesService,
    public breakpointObserver: BreakpointObserver,
    private excelService: ExcelService) {
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      this.isMobile = true;
    }

    this.dashboardCategory = this.data.dashboardCategory;
  }

  ngOnInit() {
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
    this.setDefaultFilters();
    this.getAverageOperationalBikes();
  }

  setDefaultFilters() {
    this.currentDayEndTimeStamp = moment().utc().format('YYYY-MM-DDTHH:mm:ss');
    this.selectedDate = this.dateValues.LastDay;
    this.fromDate = moment().subtract(1, 'days').utc().format('YYYY-MM-DDTHH:mm:ss');
    this.toDate = this.currentDayEndTimeStamp;
    this.fromDateValue = moment().subtract(1, 'days').utc().format('YYYY-MM-DDTHH:mm:ss');
    this.toDateValue = this.currentDayEndTimeStamp;
  }

  onResize() {
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      this.isMobile = true;
    } else {
      this.isMobile = false;
    }
  }

  getAverageOperationalBikes() {
    this.loadingIndicator = true;
    let filterObj = {
      'DashboardCategory': this.dashboardCategory,
      'FromDate': this.fromDate,
      'ToDate': this.toDate
    }
    this.bikesService.getAverageOfSumOperationalBikes(filterObj)
      .subscribe(res => {
        this.operationalBikesData = res;
        this.loadingIndicator = false;
      }, err => {
        this.loadingIndicator = false;
      });
  }

  closeDialog() {
    this.dialogRef.close();
  }

  onStartDatePicked(event: any) {
    if (event.value != null) {
      this.fromDate = moment(event.value).format('YYYY-MM-DD');
    }
  }

  onEndDatePicked(event: any) {
    if (event.value != null) {
      this.toDate = moment(event.value).format('YYYY-MM-DD');
    }
  }

  onCustomDateSearchClicked() {
    let fromValue = moment(this.fromDate).startOf('day').format('YYYY-MM-DDTHH:mm:ss');
    let toValue = moment(this.toDate).endOf('day').format('YYYY-MM-DDTHH:mm:ss');

    if ((this.fromDate != null && this.fromDate != "") && (this.toDate != null && this.toDate != "")) {
      this.loadingIndicator = true;
      if (fromValue > toValue) {
        this.loadingIndicator = false;
        return this.loggerService.showErrorMessage("Invalid date range selected. End date should be grater than start date");
      } else {
        this.sendFilterRequestForValidDateRange();
      }
    }
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
      this.operationalBikesData = [];
    } else if (this.selectedDate == this.dateValues.LastDay) {
      this.fromDate = moment().subtract(1, 'days').utc().format('YYYY-MM-DDTHH:mm:ss');
      this.fromDateValue = this.fromDate;
    } else if (this.selectedDate == this.dateValues.LastWeek) {
      this.fromDate = moment().subtract(7, 'days').utc().format('YYYY-MM-DDTHH:mm:ss');
      this.fromDateValue = this.fromDate;
    }
    else if (this.selectedDate == this.dateValues.LastMonth) {
      this.fromDate = moment().subtract(1, 'months').utc().format('YYYY-MM-DDTHH:mm:ss');
      this.fromDateValue = this.fromDate;
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
        this.getAverageOperationalBikes();
      }
    }
  }

  generateExcel() {
    if (this.operationalBikesData?.length > 0) {
      let dataToExport = JSON.parse(JSON.stringify(this.operationalBikesData));
      this.excelService.generateOperationalBikesCountExcel(dataToExport);
    } else {
      return this.loggerService.showErrorMessage("No event records found to export");
    }
  }
}
