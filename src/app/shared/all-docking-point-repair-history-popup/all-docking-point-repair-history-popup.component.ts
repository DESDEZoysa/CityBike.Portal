import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import * as moment from 'moment';
import { AuthService, LoggerService, RepairService } from '../../services';
import { DockingPointRepairHistoryPopupComponent } from '../docking-point-repair-history-popup/docking-point-repair-history-popup.component';


export interface DockingPointData {
  dockingStations: any;
  selectedDate: any;
  fromDate: any;
  toDate: any;
  fromDateValue: any;
  toDateValue: any;
  selectedPerson: any;
  isFiltered: any;
  isCustomDateShown: any;
  historyData: any;
}

@Component({
  selector: 'app-all-docking-point-repair-history-popup',
  templateUrl: './all-docking-point-repair-history-popup.component.html',
  styleUrls: ['./all-docking-point-repair-history-popup.component.scss']
})
export class AllDockingPointRepairHistoryPopupComponent implements OnInit {

  @ViewChild('repairTable', { static: true }) table: any;
  repairHistory: any;
  allRepairHistory: any;
  isMobile: boolean = false;
  dateRanges = [
    { id: -1, name: 'COMMON.ALL' },
    { id: 1, name: 'COMMON.LAST_DAY' },
    { id: 2, name: 'COMMON.LAST_WEEK' },
    { id: 3, name: 'COMMON.LAST_MONTH' },
    { id: -2, name: 'COMMON.CUSTOM' }
  ];
  dateValues = {
    All: -1,
    Custom: -2,
    LastDay: 1,
    LastWeek: 2,
    LastMonth: 3
  };

  selectedDate = -1;
  repairPersonList = [];
  selectedPerson: any;
  loadingIndicator: boolean = true;
  isCustomDateShown = false;
  fromDate: string;
  fromDateValue: string;
  toDate: string;
  toDateValue: string;
  public readonly LAYOUT = {
    XS: 768,
    SM: 992,
    MD: 1200,
    LG: 1600,
    XL: 1920,
    XXL: 2560,
  };

  public layout: number = this.LAYOUT.MD;
  currentDayEndTimeStamp: any;
  totalHours: any;
  remaingMinutes: any;
  isFiltered: boolean;
  dockingStations: any;
  dpVisualId: any;
  isAdmin: boolean = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: DockingPointData,
    public dialogRef: MatDialogRef<DockingPointRepairHistoryPopupComponent>,
    private loggerService: LoggerService,
    private repairService: RepairService,
    public dialog: MatDialog,
    public breakpointObserver: BreakpointObserver,
    private translate: TranslateService,
    private authService: AuthService) {
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      this.isMobile = true;
    }
    this.dockingStations = this.data.dockingStations;
    this.isFiltered = this.data.isFiltered;
    this.isAdmin = this.authService.isAdmin();
  }

  onResize() {
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      this.isMobile = true;
    } else {
      this.isMobile = false;
    }
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

    if (!this.isFiltered)
      this.setDefaultFilters();
    else
      this.setSelectedFilters();
    this.getAllFilteredRepairHistory();
  }

  setDefaultFilters() {
    this.currentDayEndTimeStamp = moment().utc().format('YYYY-MM-DDTHH:mm:ss');
    this.selectedDate = this.dateValues.LastDay;
    this.fromDate = moment().subtract(1, 'days').utc().format('YYYY-MM-DDTHH:mm:ss');
    this.toDate = this.currentDayEndTimeStamp;
    this.fromDateValue = moment().subtract(1, 'days').utc().format('YYYY-MM-DDTHH:mm:ss');
    this.toDateValue = this.currentDayEndTimeStamp;
    this.selectedPerson = "All";
  }

  getAllFilteredRepairHistory() {
    this.loadingIndicator = true;
    let filterObj = {
      "FromDate": this.fromDateValue,
      "ToDate": this.toDateValue
    };
    this.repairService.getAllDPRepairHistoryByFilter(filterObj).subscribe(data => {
      this.allRepairHistory = data;
      this.repairHistory = data;

      this.calculatedRepairDuration();

      let repairedPersons = data.map(x => { return x.RepairedBy; });
      this.arrangeRepairPersonDropDown(repairedPersons);
      this.onRepairPersonChange();
      this.loadingIndicator = false;
    }, err => {
      this.loadingIndicator = false;
    });
  }

  onRepairPersonChange() {
    if (this.selectedPerson == "All")
      this.repairHistory = this.allRepairHistory;
    else
      this.repairHistory = this.allRepairHistory.filter(x => x.RepairedBy && x.RepairedBy.UserId == this.selectedPerson);
  }

  onStartDatePicked(event: any) {
    if (event.value != null) {
      this.fromDate = moment(event.value).format('YYYY-MM-DD');
      this.fromDateValue = moment(event.value).startOf('day').format('YYYY-MM-DDTHH:mm:ss');
    }
  }

  onEndDatePicked(event: any) {
    if (event.value != null) {
      this.toDate = moment(event.value).format('YYYY-MM-DD');
      this.toDateValue = moment(event.value).endOf('day').format('YYYY-MM-DDTHH:mm:ss');
    }
  }

  onCustomDateSearchClicked() {
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
      this.repairHistory = [];
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
    else if (this.selectedDate == this.dateValues.All) {
      this.fromDate = moment().subtract(100, 'years').utc().format('YYYY-MM-DDTHH:mm:ss');
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
        this.getAllFilteredRepairHistory();
      }
    }
  }

  arrangeRepairPersonDropDown(repairPersons: any) {
    this.repairPersonList = [];
    let anyPerson = { id: 'All', name: 'COMMON.ALL' };
    this.repairPersonList.push(anyPerson);
    let repairPersonArray = [];
    repairPersons.forEach((person) => {
      let personData = [];
      if (person) {
        let isExist = repairPersonArray.some(x => x.id == person['UserId']);
        if (!isExist) {
          personData['id'] = person['UserId'];
          personData['name'] = person['FirstName'] + " " + person['LastName'];
          repairPersonArray.push(personData);
        }
      }
    });

    let sortedArray = repairPersonArray.sort(function (a, b) {
      return a.name - b.name;
    });
    this.repairPersonList.push(...sortedArray);
  }

  closeDialog() {
    this.dialogRef.close();
  }

  openHistoryDetails(data: any) {
    this.dialogRef.close({
      // "dockingPointId": this.dockingPointId,
      // "dpVisualId": this.dpVisualId,
      // "dockingStationName": this.dockingStationName,
      "selectedDate": this.selectedDate,
      "isCustomDateShown": this.isCustomDateShown,
      "fromDate": this.fromDate,
      "toDate": this.toDate,
      "fromDateValue": this.fromDateValue,
      "toDateValue": this.toDateValue,
      "selectedPerson": this.repairPersonList.find(x => x.id == this.selectedPerson),
      "historyData": data
    });
  }

  private setSelectedFilters() {
    this.currentDayEndTimeStamp = moment().utc().format('YYYY-MM-DDTHH:mm:ss');
    this.selectedDate = this.data.selectedDate;
    this.fromDate = this.data.fromDate;
    this.toDate = this.data.toDate;
    this.fromDateValue = this.data.fromDateValue;
    this.toDateValue = this.data.toDateValue;
    this.selectedPerson = this.data.selectedPerson;
    this.isCustomDateShown = this.data.isCustomDateShown;
  }

  deleteDPRepair(row: any) {
    this.repairService.deleteDockingPointRepair(row["DockingPointId"], row["DPFixId"]).subscribe({
      next: (res) => {
        if (res) {
          this.repairHistory = this.repairHistory.filter(r => r.DPFixId != row["DPFixId"]);
          this.calculatedRepairDuration();
          this.loggerService.showSuccessfulMessage("docking point repair has been successfully deleted");
        }
      },
      error: (e) => {
        this.loggerService.showSuccessfulMessage("Error while deleting docking point repair");
      }
    });
  }


  private calculatedRepairDuration() {
    var totalMinutes = this.repairHistory.reduce((sum, item) => sum + item.MinutesSpent, 0);
    var extraHours = Math.floor(totalMinutes / 60);
    this.totalHours = (this.repairHistory.reduce((sum, item) => sum + item.HoursSpent, 0)) + extraHours;
    this.remaingMinutes = totalMinutes % 60;
  }
}
