
import { forkJoin as observableForkJoin, Observable, ReplaySubject, Subject } from 'rxjs';
import { EventDetailsDialogComponent } from './event-details-dialog/event-details-dialog.component';
import { Component, OnInit, ViewChild } from '@angular/core';
import * as moment from 'moment';
import { EventService } from '../services/events.service';
import { LoggerService, BikesService } from '../services';

import { LocalStorageKeys } from '../core/constants';
import { Router } from '@angular/router';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { ScreenLayouts } from '../core/constants/screen-layouts';
import { FormControl } from '@angular/forms';
import { take, takeUntil } from 'rxjs/operators';
import { ExcelService } from '../services/excel.service';
import { TimeZonePipe } from '../core/pipes/time-zone.pipe';
import { MatDialog } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-alerts',
  templateUrl: './events.component.html',
  styleUrls: ['./events.component.scss'],
  providers: [TimeZonePipe]
})
export class EventsComponent implements OnInit {
  @ViewChild('eventsTable', { static: true }) table: any;

  bikeEvents;
  filteredEvents;
  selectedMonth = new Date('YYYY-MM');
  startDate = new Date();
  isMobile: boolean = false;
  bikeList = [];
  loadingIndicator: boolean = true;
  categories: any;
  date = moment();
  selectedCategory;
  selectedBike;
  dateRanges = [
    { id: 1, name: 'COMMON.LAST_HOUR' },
    { id: 2, name: 'COMMON.LAST_DAY' },
    { id: 3, name: 'COMMON.LAST_WEEK' },
    { id: 4, name: 'COMMON.LAST_MONTH' },
    { id: -2, name: 'COMMON.CUSTOM' }
  ];
  activeFilters = [
    { id: -1, name: 'COMMON.ALL' },
    { id: 0, name: 'COMMON.ENABLED' },
    { id: 1, name: 'COMMON.DISABLED' }
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
  currentDayEndTimeStamp;
  isCustomDateShown = false;
  bikeStatus;
  ipadView = false;

  public readonly LAYOUT = ScreenLayouts;
  public layout: number = this.LAYOUT.MD;
  protected sortedCaletories: SortedCategory[];
  public categoryCtrl: FormControl = new FormControl();
  public categoryFilterCtrl: FormControl = new FormControl();
  public filteredCategories: ReplaySubject<SortedCategory[]> = new ReplaySubject<SortedCategory[]>(1);

  /** Subject that emits when the component has been destroyed. */
  protected _onDestroy = new Subject<void>();
  categoryIds = [];
  allCategoryIds = [];
  allBikes: any;
  selectedCategories: any[];
  toggleAllSelected: boolean = true;

  constructor(
    private eventService: EventService,
    private loggerService: LoggerService,
    private bikeService: BikesService,
    private excelService: ExcelService,
    private timeZonePipe: TimeZonePipe,
    private translate: TranslateService,
    private router: Router,
    public breakpointObserver: BreakpointObserver,
    public dialog: MatDialog
  ) {
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) && (document.documentElement.clientWidth < 768)) {
      this.isMobile = true;
    } else if (/iPad/i.test(navigator.userAgent)) {
      this.ipadView = true;
    }
  }

  ngOnInit() {
    this.allBikes = [];
    this.selectedCategories = [];
    this.manageScreenWidth();
    this.setDefualtFilters();
    this.getEventCategories();
    // listen for search field value changes
    this.categoryFilterCtrl.valueChanges
      .pipe(takeUntil(this._onDestroy))
      .subscribe(() => {
        this.filterCategories();
      });
  }

  ngOnDestroy() {
    this._onDestroy.next();
    this._onDestroy.complete();
  }

  protected filterCategories() {
    if (!this.sortedCaletories) {
      return;
    }
    // get the search keyword
    let search = this.categoryFilterCtrl.value;
    if (!search) {
      this.filteredCategories.next(this.sortedCaletories.slice());
      return;
    } else {
      search = search.toLowerCase();
    }
    // filter 
    this.filteredCategories.next(
      this.sortedCaletories.filter(bank => bank.ErrorCategoryName.toLowerCase().indexOf(search) > -1)
    );
  }

  getCategoryByName(category: string): any {
    let alertType = this.categories.filter(e => e.ErrorCategoryName == category);
    return alertType[0];
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
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) && (document.documentElement.clientWidth < 768)) {
      this.isMobile = true;
    } else {
      this.isMobile = false;
    }
  }

  private sortByStringAlphabetically(value) {
    value.sort(function (a, b) {
      if (a.ErrorCategoryName < b.ErrorCategoryName) { return -1; }
      if (a.ErrorCategoryName > b.ErrorCategoryName) { return 1; }
      return 0;
    });
  }

  toggleExpandRow(row) {
    this.table.rowDetail.toggleExpandRow(row);
  }

  navigateToBikeDetails(bikeId) {
    this.router.navigateByUrl('bikes/' + bikeId + '/details');
  }

  setDefualtFilters() {
    this.currentDayEndTimeStamp = moment().utc().format('YYYY-MM-DDTHH:mm:ss');
    this.selectedCategory = 'All';
    this.selectedBike = 'All'
    this.selectedDate = this.dateValues.LastDay;
    this.fromDate = moment().subtract(1, 'days').utc().format('YYYY-MM-DDTHH:mm:ss');
    this.toDate = this.currentDayEndTimeStamp;
    this.bikeStatus = -1;
    this.fromDateValue = moment().subtract(1, 'days').utc().format('YYYY-MM-DDTHH:mm:ss');
    this.toDateValue = this.currentDayEndTimeStamp;
  }

  getEventCategories() {
    let filterRequest = this.getFilterRequest();
    let categoryFilter = {
      BikeId: (this.selectedBike != 'All') ? this.selectedBike : 0,
      From: filterRequest.FromDate,
      To: filterRequest.ToDate
    }
    this.eventService.getEventCategories(categoryFilter).subscribe(result => {
      if (result)
        result = result.filter(x => x.ErrorCategoryName != 'All');
      this.sortByStringAlphabetically(result);
      this.arrangeAllCategoryCount(result);
      this.sortedCaletories = this.categories;
      // load the initial bank list
      this.filteredCategories.next(this.sortedCaletories.slice());
      //check if already selectedCategories exist show that when date filter changed
      let selectedCategories = [];
      this.categoryIds.forEach(category => {
        let categoryDet = this.categories.find(x => x.EventCategoryId == category);
        if (categoryDet)
          selectedCategories.push(categoryDet);
      });
      if (selectedCategories.length != 0)
        this.selectedCategories = selectedCategories;
      else
        this.selectedCategories = this.categories;
      //set selected category
      this.categoryCtrl.patchValue(this.selectedCategories);
      this.filterByCategories(false);
    });

  }

  getEvents() {
    this.loadingIndicator = true;
    let filterRequest = this.getMultipleCategoriesRequest();
    observableForkJoin(
      this.eventService.filterAllEventsByCategories(filterRequest),
      this.bikeService.getBikes()
    )
      .subscribe(result => {
        //sort events by date
        result[0] = result[0].sort(function (a, b) {
          return new Date(b.ReceivedOn).getTime() - new Date(a.ReceivedOn).getTime();
        });
        this.allBikes = result[1];
        this.bikeEvents = result[0];
        this.filteredEvents = result[0];
        this.arrangeEventList(result[0]);
        this.arrangeBikeDropDownList(result[1]);
        this.loadingIndicator = false;
      }, error => {
        this.loadingIndicator = false;
        this.loggerService.showErrorMessage("Getting bike event details failed!");
      });
  }

  generateExcel() {
    if (this.filteredEvents.length > 0) {
      let convertType = JSON.parse(localStorage.getItem(LocalStorageKeys.PREFERRED_TIMEZONE));
      let dataToExport = JSON.parse(JSON.stringify(this.filteredEvents));

      dataToExport.forEach((events) => {
        this.translate.get(events['Text']).subscribe(text => { events['Text'] = text; });
      });

      if (convertType == null || convertType == undefined) { convertType = 'CET'; }
      if (convertType == 'CET') {
        dataToExport = this.convertToTimeType(dataToExport);
      } else {
        this.excelService.generateEventExcel(dataToExport);
      }
    } else {
      return this.loggerService.showErrorMessage("No event records found to export");
    }
  }

  convertToTimeType(dataToExport) {
    dataToExport.forEach((events) => {
      events['ReceivedOn'] = this.timeZonePipe.transform(events['ReceivedOn']);
      return events;
    });
    this.excelService.generateEventExcel(dataToExport);
  }

  arrangeAllCategoryCount(categories) {
    let allCount = 0;
    categories.forEach(category => {
      if (category.EventCategoryId != 1000) {
        allCount = allCount + category.Count;
      }
    });
    categories.forEach(category => {
      if (category.EventCategoryId == 1000) {
        category.Count = allCount
      }
      return category;
    });
    this.categories = categories;
  }

  getFilterRequest(): any {
    let selectedCategory = this.selectedCategory == "All" ? null : this.getCategoryCodeByName(this.selectedCategory);
    let selectedBike = this.selectedBike == "All" ? null : this.selectedBike;
    let request = {
      Category: selectedCategory,
      BikeId: selectedBike,
      FromDate: this.fromDateValue, //this.fromDate
      ToDate: this.toDateValue, //toDate
      //Active has changed to BikeStatus for proper understandability
      BikeStatus: this.bikeStatus
    };
    return request;
  }

  getMultipleCategoriesRequest(): any {
    let selectedBike = this.selectedBike == "All" ? null : this.selectedBike;
    let request = {
      Categories: this.categoryIds,
      BikeId: selectedBike,
      FromDate: this.fromDateValue, //this.fromDate
      ToDate: this.toDateValue, //toDate
      //Active has changed to BikeStatus for proper understandability
      BikeStatus: this.bikeStatus
    };
    return request;
  }

  getCategoryCodeByName(category: string): any {
    let alertType = this.categories.filter(e => e.ErrorCategoryName == category);
    return alertType[0]['EventCategoryId'];
  }

  filterByCategories(opened: boolean) {
    if (!opened) {
      if (this.categoryCtrl.value != null) {
        this.categoryIds = [];
        this.categoryCtrl.value.forEach((category) => {
          this.categoryIds.push(category.EventCategoryId);
        });
      }

      //only set at events initialization
      if (this.allCategoryIds.length == 0)
        this.allCategoryIds = this.categoryIds;

      //observe category change and set neccessary boolean flags for identifications
      if (this.categoryIds.length == this.allCategoryIds.length)
        this.toggleAllSelected = true;
      else
        this.toggleAllSelected = false;

      if (this.categoryIds.length < 1) {
        return this.loggerService.showErrorMessage("Please select one or more category(s) to filter.");
      } else {
        this.getEvents();
      }
    }
  }

  arrangeEventList(alertList) {
    alertList.forEach((event) => {
      let alertType = this.categories.filter(e => e.id == event['Category']);
      //get bike and set visual ID and Serial to alerts
      let bikeDet = this.allBikes.find(x => x.BikeId == event["BikeId"]);
      if (bikeDet) {
        event["VisualId"] = bikeDet["VisualId"];
        event["Serial"] = bikeDet["Serial"];
      }
      if (alertType != null && alertType != '') {
        event['Category'] = alertType[0]['name'];
      }

      event["ReceivedOn"] = `${event["ReceivedOn"]}Z`;
      event['Text'] = "ALERT_CATEGORIES." + event['Text'];
      return event;
    });
    if (this.bikeStatus == -1)
      this.filteredEvents = alertList;
    else {
      if (this.selectedBike == "All") {
        let filteredBikeEvents = [];
        let bikes = this.allBikes.filter(x => x.Disabled == !!(this.bikeStatus));
        bikes.forEach(bike => {
          let dd = alertList.filter(x => x.BikeId == bike.BikeId);
          filteredBikeEvents = filteredBikeEvents.concat(alertList.filter(x => x.BikeId == bike.BikeId));
        });
        this.filteredEvents = filteredBikeEvents;
      }
      else
        this.filteredEvents = alertList;
    }
  }

  arrangeBikeDropDownList(bikes) {
    let bikeDropDownArray = [];
    this.bikeList = [];
    let allBike = { id: 'All', visualId: 'COMMON.ALL', serial: 'All' };
    this.bikeList.push(allBike);

    bikes.forEach((bike) => {
      let bikeData = [];
      bikeData['id'] = bike['BikeId'];
      bikeData['visualId'] = bike['VisualId'];
      bikeData['serial'] = bike['Serial'];
      bikeDropDownArray.push(bikeData);
    });

    let sortedArray = bikeDropDownArray.sort(function (a, b) {
      return a.visualId - b.visualId;
    });
    this.bikeList.push(...sortedArray);
  }


  toggleSelectAll(selectAllValue: boolean) {
    this.filteredCategories.pipe(take(1), takeUntil(this._onDestroy))
      .subscribe(val => {
        if (selectAllValue) {
          this.categoryCtrl.patchValue(val, { emitEvent: false });
          this.toggleAllSelected = true;
        } else {
          this.categoryCtrl.patchValue([], { emitEvent: false });
          this.toggleAllSelected = false;
        }
      });
  }

  onBikeChange(event) {
    this.getEvents();
  }

  onActiveChange(event) {
    this.getEvents();
  }

  onStartDatePicked(event) {
    if (event.value != null) {
      this.fromDate = moment(event.value).format('YYYY-MM-DD');
      this.fromDateValue = moment(event.value).startOf('day').format('YYYY-MM-DDTHH:mm:ss');
    }
  }

  onEndDatePicked(event) {
    if (event.value != null) {
      this.toDate = moment(event.value).format('YYYY-MM-DD');
      this.toDateValue = moment(event.value).endOf('day').format('YYYY-MM-DDTHH:mm:ss');
    }
  }

  onCustomDateSearchClicked() {
    this.sendFilterRequestForValidDateRange();
  }

  onDateChange(event) {
    this.isCustomDateShown = false;
    this.fromDate = "";
    this.toDate = "";

    if (this.selectedDate != this.dateValues.Custom) {
      this.toDate = moment().utc().format('YYYY-MM-DDTHH:mm:ss');
    }

    if (this.selectedDate == this.dateValues.Custom) {
      this.isCustomDateShown = true;
      //empty current events list
      this.filteredEvents = [];
    } else if (this.selectedDate == this.dateValues.LastHour) {
      this.fromDate = moment().subtract(1, 'hour').utc().format('YYYY-MM-DDTHH:mm:ss');
      this.fromDateValue = this.fromDate;
      this.toDate = moment().utc().format('YYYY-MM-DDTHH:mm:ss');
      this.toDateValue = this.toDate;
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
    var dates = duration.asDays();
    if ((this.fromDate != null && this.fromDate != "") && (this.toDate != null && this.toDate != "")) {
      if (this.fromDate > this.toDate) {
        this.loggerService.showErrorMessage('Invalid date range selected.From date should be smaller than To date.');
      }
      else if (dates > 60) {
        this.loggerService.showErrorMessage('Invalid date range selected.Duration should be less than 60 days');
      }
      else {
        this.getEventCategories();
      }
    }
  }

  openDetailsDialog(details, title) {
    const dialogRef = this.dialog.open(EventDetailsDialogComponent, {
      width: '450px',
      data: { details: details, title }
    });
    dialogRef.afterClosed().subscribe(result => {
    });
  }
}

export interface SortedCategory {
  ErrorCategoryName: string;
  EventCategoryId: number
  Count: number
}
