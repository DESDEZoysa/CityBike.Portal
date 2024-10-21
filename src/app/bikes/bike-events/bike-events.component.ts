import { Component, OnInit, Input, ViewChild, Output, EventEmitter } from "@angular/core";
import { Bike, BikeAddress } from "../../core/models";
import { LoggerService } from "../../services";
import { EventService } from "../../services/events.service";
import * as moment from "moment";
import "moment-timezone";
import { MatDialog } from "@angular/material/dialog";
import { ScreenLayouts } from "../../core/constants/screen-layouts";
import { BreakpointState, BreakpointObserver } from "@angular/cdk/layout";
import { FormControl } from "@angular/forms";
import { ReplaySubject, Subject } from "rxjs";
import { take, takeUntil } from "rxjs/operators";
import { EventDetailsDialogComponent } from "../../events/event-details-dialog/event-details-dialog.component";

export interface SortedCategory {
  ErrorCategoryName: string;
  EventCategoryId: number
  Count: number
}

@Component({
  selector: "app-bike-events",
  templateUrl: "./bike-events.component.html",
  styleUrls: ["./bike-events.component.scss"]
})

export class BikeEventsComponent implements OnInit {
  @ViewChild("eventsTable", { static: true }) table: any;
  @Input() bike: Bike;
  @Output() bikeReload = new EventEmitter();

  dateRanges = [
    { id: 1, name: 'COMMON.LAST_HOUR' },
    { id: 2, name: 'COMMON.LAST_DAY' },
    { id: 3, name: 'COMMON.LAST_WEEK' },
    { id: 4, name: 'COMMON.LAST_MONTH' },
    { id: -2, name: 'COMMON.CUSTOM' }
  ];
  dateValues = {
    Custom: -2,
    LastHour: 1,
    LastDay: 2,
    LastWeek: 3,
    LastMonth: 4
  };

  bikeEvents;
  filteredEvents;
  selectedMonth = new Date("YYYY-MM");
  startDate = new Date();
  isMobile: boolean = false;
  loadingIndicator: boolean = true;

  dateSelected;
  categorySelected;
  choseDate;
  categories: any = null;
  date = moment();
  defaultDateSelected;
  currentDayEndTimeStamp;

  public readonly LAYOUT = ScreenLayouts;
  public layout: number = this.LAYOUT.MD;

  protected sortedCaletories: SortedCategory[];

  public categoryCtrl: FormControl = new FormControl();
  public categoryFilterCtrl: FormControl = new FormControl();
  public filteredCategories: ReplaySubject<SortedCategory[]> = new ReplaySubject<SortedCategory[]>(1);

  /** Subject that emits when the component has been destroyed. */
  protected _onDestroy = new Subject<void>();
  categoryIds = [];
  allBikes: any;
  isCustomDateShown: boolean;
  fromDate: string;
  toDate: string;
  selectedDate: any;
  fromDateValue: string;
  toDateValue: string;
  selectedCategories: any;
  hasCategoryChanged: boolean;
  toggleAllSelected: boolean = true;

  constructor(
    private dialog: MatDialog,
    private eventService: EventService,
    private loggerService: LoggerService,
    // private menuItemService: MenuItemService,
    public breakpointObserver: BreakpointObserver
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
    this.setDefualtFilters();
    this.getEventCategoriesByBikeId();
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

  setDefualtFilters() {
    this.currentDayEndTimeStamp = moment().utc().format('YYYY-MM-DDTHH:mm:ss');
    this.selectedDate = this.dateValues.LastDay;
    this.fromDate = moment().subtract(1, 'days').utc().format('YYYY-MM-DDTHH:mm:ss');
    this.toDate = this.currentDayEndTimeStamp;
    this.fromDateValue = moment().subtract(1, 'days').utc().format('YYYY-MM-DDTHH:mm:ss');
    this.toDateValue = this.currentDayEndTimeStamp;
    this.hasCategoryChanged = false;
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

  getEventCategoriesByBikeId() {
    let params = { BikeId: this.bike.BikeId, From: this.fromDateValue, To: this.toDateValue };

    this.eventService.getEventCategoriesByBikeId(params).subscribe(
      result => {
        result.sort(function (a, b) {
          if (a.ErrorCategoryName < b.ErrorCategoryName) { return -1; }
          if (a.ErrorCategoryName > b.ErrorCategoryName) { return 1; }
          return 0;
        });
        if (result.length > 0) {
          result = result.filter(x => x.ErrorCategoryName != 'All');
          this.arrangeAllCategoryCount(result);
          this.sortedCaletories = this.categories;

          // load the initial event list
          this.filteredCategories.next(this.sortedCaletories.slice());

          //check if already selectedCategories exist show that when date filter changed
          let selectedCategories = [];
          this.categoryIds.forEach(category => {
            let categoryDet = this.categories.find(x => x.EventCategoryId == category);
            if (categoryDet)
              selectedCategories.push(categoryDet);
          });

          if (selectedCategories.length != 0 && this.hasCategoryChanged)
            this.selectedCategories = selectedCategories;
          else
            this.selectedCategories = this.categories;

          //set selected category       
          this.categoryCtrl.patchValue(this.selectedCategories);
          this.filterByCategories(false);
        } else {
          this.loadingIndicator = false;
        }
      });
  }

  getMultipleCategoriesRequest(): any {
    let request = {
      Categories: this.categoryIds,
      BikeId: this.bike.BikeId,
      FromDate: this.fromDateValue, //this.fromDate
      ToDate: this.toDateValue, //toDate
      //Active has changed to BikeStatus for proper understandability
      BikeStatus: (this.bike.Disabled) ? 1 : 0
    };
    return request;
  }

  toggleExpandRow(row) {
    this.table.rowDetail.toggleExpandRow(row);
  }

  getBikeEvents() {
    if (this.bike) {
      this.loadingIndicator = true;
      let filterRequest = this.getMultipleCategoriesRequest();
      this.eventService.filterAllEventsByCategories(filterRequest).subscribe(
        result => {
          //sort result by date
          result.sort(function (a, b) {
            return (new Date(b.ReceivedOn).getTime() - new Date(a.ReceivedOn).getTime());
          });

          if (result && result.length == 0) {
            //clear categories before populating data again
            this.filteredCategories.complete();
            this.filteredCategories = new ReplaySubject<SortedCategory[]>(1);
            this.categoryFilterCtrl.patchValue([]);
            this.toggleAllSelected = false;
            this.hasCategoryChanged = true;
          }

          this.bikeEvents = result;
          this.filteredEvents = result;
          this.arrangeAlertList(result);
          this.loadingIndicator = false;
        },
        () => {
          this.loadingIndicator = false;
          this.loggerService.showErrorMessage("Getting bike event details failed!");
        }
      );
    }
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

  arrangeAlertList(alertList) {
    alertList.forEach(event => {
      let alertType = this.categories.filter(e => e.EventCategoryId == event["Category"]);
      if (alertType != null && alertType != "") {
        event["Category"] = alertType[0]["ErrorCategoryName"];
      }
      event["Text"] = "ALERT_CATEGORIES." + event["Text"];
      event["ReceivedOn"] = `${event["ReceivedOn"]}Z`;
      return event;
    });
    this.dateSelected = 2;
    this.categorySelected = "All";
    alertList = alertList.filter(obj => obj.ReceivedOn >= moment().subtract(1, "months").utc().format('YYYY-MM-DDTHH:mm:ss'));
    this.filteredEvents = alertList;
  }

  onCategoryChange(event) {
    this.filteredEvents = this.bikeEvents;
    var lastDay = moment().subtract(1, "d").format("YYYY-MM-DD");
    let last30thDate = moment().subtract(1, "months").format("YYYY-MM-DD");

    if (this.choseDate) {
      this.dateSelected = "";
    }
    if (this.dateSelected != "") {
      if (event.value != "All" && this.dateSelected != 100) {
        if (this.dateSelected == 1) {
          this.filteredEvents = this.filteredEvents.filter(
            obj =>
              obj.Category == event.value &&
              obj.ReceivedOn >= moment().subtract(24, "hours").utc().format('YYYY-MM-DDTHH:mm:ss')
          );
        } else if (this.dateSelected == 2) {
          this.filteredEvents = this.filteredEvents.filter(
            obj =>
              obj.Category == event.value &&
              obj.ReceivedOn >= moment().subtract(1, "months").utc().format('YYYY-MM-DDTHH:mm:ss')
          );
        }
      } else if (event.value != "All" && this.dateSelected == 100) {
        this.filteredEvents = this.filteredEvents.filter(
          obj => obj.Category == event.value
        );
      } else if (event.value == "All" && this.dateSelected != 100) {
        if (this.dateSelected == 1) {
          this.filteredEvents = this.filteredEvents.filter(
            obj => obj.ReceivedOn >= moment().subtract(24, "hours").utc().format('YYYY-MM-DDTHH:mm:ss')
          );
        } else if (this.dateSelected == 2) {
          this.filteredEvents = this.filteredEvents.filter(
            obj => obj.ReceivedOn >= moment().subtract(1, "months").utc().format('YYYY-MM-DDTHH:mm:ss')
          );
        }
      }
    } else {
      var selectedDate = moment(this.choseDate).format("YYYY-MM-DD");
      if (event.value != "All") {
        this.filteredEvents = this.filteredEvents.filter(
          obj =>
            obj.Category == event.value &&
            obj.ReceivedOn.split("T")[0] == selectedDate
        );
      } else {
        this.filteredEvents = this.filteredEvents.filter(
          obj => obj.ReceivedOn.split("T")[0] == selectedDate
        );
        //obj => obj.ReceivedOn.split("T")[0] == selectedDate
      }
    }
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

    //clear categories before populating data again
    this.filteredCategories.complete();
    this.filteredCategories = new ReplaySubject<SortedCategory[]>(1);

    if (this.selectedDate != this.dateValues.Custom) {
      this.toDate = this.currentDayEndTimeStamp;
    }
    if (this.selectedDate == this.dateValues.Custom) {
      this.isCustomDateShown = true;
      //empty current events list
      this.filteredEvents = [];
    } else if (this.selectedDate == this.dateValues.LastHour) {
      this.fromDate = moment().subtract(1, 'hour').utc().format('YYYY-MM-DDTHH:mm:ss');
      this.fromDateValue = this.fromDate;
      this.toDate = moment().subtract(0, 'hour').utc().format('YYYY-MM-DDTHH:mm:ss');
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
        this.getEventCategoriesByBikeId();
        this.getBikeEvents();
      }
    }
  }


  datePicked(event) {
    this.dateSelected = "";
    // this.getEventCategoriesByBikeId(event.value);
    this.filteredEvents = this.bikeEvents;
    if (event.value != null) {
      var selectedDate = moment(event.value).format("YYYY-MM-DD");
      if (this.categorySelected == "All") {
        this.filteredEvents = this.filteredEvents.filter(
          obj => obj.ReceivedOn.split("T")[0] == selectedDate
        );
      } else {
        this.filteredEvents = this.filteredEvents.filter(
          obj =>
            obj.ReceivedOn.split("T")[0] == selectedDate &&
            obj.Category == this.categorySelected
        );
      }
    }
  }

  updateAddress(data: BikeAddress): void {
    let index = this.filteredEvents.findIndex(i => i.AlertId == data.Id);
    this.filteredEvents[index].Address = data.Address;
  }

  filterByCategories(opened: boolean) {
    if (!opened) {
      if (this.categoryCtrl.value != null) {
        this.categoryIds = [];
        this.categoryCtrl.value.forEach((category) => {
          this.categoryIds.push(category.EventCategoryId);
        });
      }

      //observe event category change and set neccessary boolean flags for identifications
      if (this.categories.length == this.categoryCtrl.value.length) {
        this.toggleAllSelected = true;
        this.hasCategoryChanged = false;
      }
      else {
        this.toggleAllSelected = false;
        this.hasCategoryChanged = true;
      }
    }
    if (this.categoryIds.length < 1) {
      return this.loggerService.showErrorMessage("Please select one or more category(s) to filter.");
    } else {
      this.getBikeEvents();
    }
  }

  toggleSelectAll(selectAllValue: boolean) {
    this.filteredCategories.pipe(take(1), takeUntil(this._onDestroy))
      .subscribe(val => {
        if (selectAllValue) {
          this.categoryCtrl.patchValue(val, { emitEvent: false });
          this.hasCategoryChanged = false;
          this.toggleAllSelected = true;
          this.categoryIds = [];
        } else {
          this.categoryCtrl.patchValue([], { emitEvent: false });
          this.toggleAllSelected = false;
        }
      });
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
