import { Component, OnInit, Input, ViewChild, Output, EventEmitter } from '@angular/core';
import { Bike } from '../../core/models';
import { IssueService, LoggerService } from '../../services';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { ReportErrorComponent } from '../bike-support/report-error/report-error.component';
import { IndividualErrorComponent } from '../bike-support/individual-error/individual-error.component';
import { ScreenLayouts } from '../../core/constants/screen-layouts';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { CommonType } from '../../core/enums/commonType';
import { User } from '../../core/models/user/user';
import { FormControl } from '@angular/forms';
import { ReplaySubject, Subject } from 'rxjs';
import * as moment from 'moment';
import 'moment-timezone';
import { take, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-bike-issues',
  templateUrl: './bike-issues.component.html',
  styleUrls: ['./bike-issues.component.scss']
})
export class BikeIssuesComponent implements OnInit {
  @Input() bike: Bike;
  @ViewChild('issuesTable', { static: true }) table: any;
  @Output() bikeReload = new EventEmitter();

  isMobile: boolean;
  bikeIssues;
  filteredIssues;
  loadingIndicator: boolean = true; reportFilterToggle: number;
  filteredErrorReports: any[];
  ;
  completedReportsView: boolean;
  reasons;
  group1;
  group2;
  group3;
  public errorReportGrouped: any[];
  errorReports;
  otherFell: boolean = false;
  comments: any;
  disabledBike: boolean = false;

  public readonly LAYOUT = ScreenLayouts;
  public layout: number = this.LAYOUT.MD;

  selectedCategory: any;
  allErrorCategories: any;

  reportFilters = {
    All: -1,
    Ongoing: 0,
    Completed: 1
  };

  dateRanges = [
    { id: 1, name: 'COMMON.LAST_HOUR' },
    { id: 2, name: 'COMMON.LAST_DAY' },
    { id: 3, name: 'COMMON.LAST_WEEK' },
    { id: 4, name: 'COMMON.LAST_MONTH'},
    { id: 5, name: 'COMMON.ALL' },
    { id: -2, name: 'COMMON.CUSTOM' }
  ];

  dateValues = {
    Custom: -2,
    LastHour: 1,
    LastDay: 2,
    LastWeek: 3,
    LastMonth: 4,
    All: 5
  };

  users: User[] = [];
  bikeList: any[];
  selectedAppUser: any;
  fromDate: string;
  fromDateValue: string;
  toDate: string;
  toDateValue: string;
  isCustomDateShown: boolean;
  selectedDate: any;
  currentDayEndTimeStamp: string;
  issueStatus: any[];
  selectedStatus: number;
  endUsers: any;

  protected issueCategories: any[];

  public categoryCtrl: FormControl = new FormControl();
  public categoryFilterCtrl: FormControl = new FormControl();
  public filteredCategories: ReplaySubject<any[]> = new ReplaySubject<any[]>(1);

  /** Subject that emits when the component has been destroyed. */
  protected _onDestroy = new Subject<void>();
  issueCategorieIds: any;

  allCategoriesErrorReports: any[] = [];
  selectedCategoryErrorReports: any[] = [];
  selectedIssueIds: number[] = [];

  constructor(
    private issueService: IssueService,
    private loggerService: LoggerService,
    private router: Router,
    private dialog: MatDialog,
    private translate: TranslateService,
    //private menuItemService: MenuItemService,
    public breakpointObserver: BreakpointObserver
  ) {
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      this.isMobile = true;
    }
    this.group1 = [];
    this.group2 = [];
    this.group3 = [];
    this.issueCategories = [];
    this.allErrorCategories = [];
    this.bikeIssues = [];
    this.errorReportGrouped = [];
    this.issueCategorieIds = [];
  }

  setDefaultFilters() {
    this.currentDayEndTimeStamp = moment().utc().format('YYYY-MM-DDTHH:mm:ss');
    this.selectedStatus = this.reportFilters.Ongoing;
    this.selectedDate = this.dateValues.All;
    this.fromDate = moment().subtract(1, 'months').utc().format('YYYY-MM-DDTHH:mm:ss');
    this.toDate = this.currentDayEndTimeStamp;
    this.fromDateValue = moment().subtract(1, 'months').utc().format('YYYY-MM-DDTHH:mm:ss');
    this.toDateValue = this.currentDayEndTimeStamp;
    this.selectedAppUser = "All";
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

  ngOnDestroy() {
    this._onDestroy.next();
    this._onDestroy.complete();
  }

  ngOnInit() {
    this.manageScreenWidth();
    this.setDefaultFilters();
    this.loadIssueStatus();
    this.otherFell = false;
    this.disabledBike = false;
    this.reportFilterToggle = this.reportFilters.Ongoing;
    this.getAllErrorReportsByFilter(true);
    this.getBikeIssues();
    this.loadErrorCategories();
    this.loadAllErrorCategories();
    this.translate.onLangChange.subscribe((params: LangChangeEvent) => {
      this.translateAllCategories();
      this.mapAllIssueCategories();
      if (this.selectedCategory)
        this.selectedCategory = this.issueCategories[0];
      this.formatErrorCategories();
      if (this.reportFilterToggle == this.reportFilters.Ongoing)
        this.listOngoingOrders();
      else if (this.reportFilterToggle == this.reportFilters.Completed)
        this.listCompletedOrders();
      else if (this.reportFilterToggle == this.reportFilters.All)
        this.listAllIssues();
    });
    //this.menuItemService.updateMenubar(MenuItemRefreshTypes.Issues);

    // listen for search field value changes
    this.categoryFilterCtrl.valueChanges
      .pipe(takeUntil(this._onDestroy))
      .subscribe(() => {
        this.filterCategories();
      });
  }

  
  refreshIssueDetails() {
    this.loadIssueStatus();
    this.otherFell = false;
    this.disabledBike = false;
    this.getAllErrorReportsByFilter();
    this.getBikeIssues();
    // this.loadErrorCategories();
    // this.loadAllErrorCategories();
  }

  protected filterCategories() {
    if (!this.issueCategories) {
      return;
    }
    // get the search keyword
    let search = this.categoryFilterCtrl.value;
    if (!search) {
      this.filteredCategories.next(this.issueCategories.slice());
      return;
    } else {
      search = search.toLowerCase();
    }
    // filter 
    this.filteredCategories.next(
      this.issueCategories.filter(issue => issue.DisplayName.toLowerCase().indexOf(search) > -1)
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
          //console.log('Layout', this.layout);
        });
    });
  }

  getBikeIssues() {
    this.loadingIndicator = true;
    this.issueService.GetAllErrorReportsPerBike(this.bike.BikeId).subscribe(result => {
      this.bikeIssues = result.errorReportGroupedDTOs;
      this.errorReports = result.errorReportResponseDTOs;
      this.bikeIssues = this.bikeIssues.map(x => {
        if (x.EndUserId == CommonType.AutoUser)
          x.EndUser = "System generated";
        return x;
      });
      this.formatErrorCategories();
      this.listOngoingOrders();
      this.loadingIndicator = false;
    },
      () => {
        this.loadingIndicator = false;
        this.loggerService.showErrorMessage("Getting bike issue details failed!");
      }
    );
  }

  getAllErrorReportsByFilter(isOnInit: boolean = false) {
    this.loadingIndicator = true;
    let filterRequest = this.getMultipleCategoriesRequest();
    if (this.selectedDate == this.dateValues.All) {
      filterRequest.FromDate = null;
      filterRequest.ToDate = null;
    }
    this.issueService.getAllErrorReportsByFilter(filterRequest).subscribe(result => {
      this.errorReportGrouped = result.errorReportGroupedDTOs;
      this.errorReports = result.errorReportResponseDTOs;
      this.errorReportGrouped = this.errorReportGrouped.map(x => {
        if (x.EndUserId == CommonType.AutoUser)
          x.EndUser = "System generated";
        return x;
      });
      this.formatErrorCategories();
      this.filteredErrorReports = this.errorReportGrouped;
      // Prevent getting incorrect error reports when user selected one category with merged error reports
      if (this.selectedIssueIds.length === 1) {
        this.filteredErrorReports = this.filteredErrorReports.filter(report =>
          report.ErrorCategories.some(category => this.selectedIssueIds.includes(category.Id))
        );
      }
      // set all initial error reports to temp variable
      if (isOnInit) {
        this.allCategoriesErrorReports = this.filteredErrorReports;
        this.selectedCategoryErrorReports = this.allCategoriesErrorReports;
      } else {
        this.selectedCategoryErrorReports = this.filteredErrorReports;
      }
      this.setIssueCategoryCount();

      this.endUsers = Array.from(new Set(this.filteredErrorReports.map((report: any) => report.EndAppUserId)))
        .filter(x => x != null);
      this.endUsers.unshift("COMMON.ALL");
      this.loadingIndicator = false;
    }, error => {
      this.loadingIndicator = false;
      this.loggerService.showErrorMessage("Getting all error reports failed.");
    });
  }

  getMultipleCategoriesRequest(): any {
    let request = {
      Categories: this.issueCategorieIds,
      BikeId: this.bike.BikeId,
      FromDate: this.fromDateValue, //this.fromDate
      ToDate: this.toDateValue, //toDate
      //IssueStatus contains values as Ongoing,Completed and All
      IssueStatus: this.selectedStatus
    };
    return request;
  }

  formatErrorCategories() {
    this.errorReportGrouped.forEach(x => {
      let errorText = "";
      x.ErrorCategories.forEach(errorCat => {
        let errorcategory = "REPORT_ERROR." + errorCat.Name.toUpperCase();
        this.translate.get(errorcategory).subscribe(name => {
          errorCat.DisplayText = name;
        });
        errorText += errorCat.DisplayText + ",";
      });
      x.ErrorCategoriesText = errorText.substr(0, errorText.length - 1);
    });
  }


  loadErrorCategories() {
    this.issueService.GetErrorCategories().subscribe(data => {
      this.group1 = data.group1;
      this.group2 = data.group2;
      this.group3 = data.group3;
      this.translateAllCategories();
    }, error => {
      this.loggerService.showErrorMessage(error);
    });
  }

  loadAllErrorCategories() {
    this.issueService.GetAllErrorCategories().subscribe(data => {
      this.allErrorCategories = data.slice(5);
      this.mapAllIssueCategories();
      this.issueCategories.sort((first,second) => first.DisplayName.localeCompare(second.DisplayName));
      // load the initial category list
      this.filteredCategories.next(this.issueCategories.slice());
      //set selected category
      this.categoryCtrl.patchValue(this.issueCategories);
      this.filterByCategories(false);
    }, error => {
      this.loggerService.showErrorMessage(error);
    });
  }

  translateAllCategories() {
    this.group1.map(x => this.translateCategories(x));
    this.group2.map(x => this.translateCategories(x));
    this.group3.map(x => this.translateCategories(x));
  }

  translateCategories(parent) {
    let parentLabel = "REPORT_ERROR." + parent.Name.toUpperCase();
    this.translate.get(parentLabel).subscribe(parentName => {
      parent.DisplayName = (parentName != parentLabel) ? parentName : parent.Name;
      let subCategory = parent.SubCategory;
      for (let i = 0; i < subCategory.length; i++) {
        let childName = "REPORT_ERROR." + subCategory[i].Name.toUpperCase();
        this.translate.get(childName).subscribe(subName => {
          subCategory[i].DisplayName = (subName != childName) ? subName : subCategory[i].Name;
        });
      }
    });
  }

  listOngoingOrders() {
    this.reportFilterToggle = this.reportFilters.Ongoing;
    if (!this.selectedCategory || (this.selectedCategory && this.selectedCategory.Id == 0))
      this.filteredErrorReports = this.errorReportGrouped.filter(obj => obj.IsCompleted == false);
    else
      this.filteredErrorReports = this.errorReportGrouped.filter(obj => obj.IsCompleted == false
        && this.isCategoryExist(obj.ErrorCategories, this.selectedCategory.Id).length > 0);
  }

  listCompletedOrders() {
    this.reportFilterToggle = this.reportFilters.Completed;
    if (!this.selectedCategory || (this.selectedCategory && this.selectedCategory.Id == 0))
      this.filteredErrorReports = this.errorReportGrouped.filter(obj => obj.IsCompleted == true);
    else
      this.filteredErrorReports = this.errorReportGrouped.filter(obj => obj.IsCompleted == true
        && this.isCategoryExist(obj.ErrorCategories, this.selectedCategory.Id).length > 0);
  }

  listAllIssues() {
    this.reportFilterToggle = this.reportFilters.All;
    if (!this.selectedCategory || (this.selectedCategory && this.selectedCategory.Id == 0))
      this.filteredErrorReports = this.errorReportGrouped;
    else
      this.filteredErrorReports = this.errorReportGrouped.filter(obj =>
        this.isCategoryExist(obj.ErrorCategories, this.selectedCategory.Id).length > 0);
  }

  mapAllErrorReportResponses(rowId, bikeId, errorCatId) {
    this.group1.map(x => this.mapErrorReportResponses(x, rowId, bikeId, errorCatId));
    this.group2.map(x => this.mapErrorReportResponses(x, rowId, bikeId, errorCatId));
    this.group3.map(x => this.mapErrorReportResponses(x, rowId, bikeId, errorCatId));
  }

  mapErrorReportResponses(parent, rowId, bikeId, errorCatId) {
    let subCategory = parent.SubCategory;
    for (let i = 0; i < subCategory.length; i++) {
      //check the current row's errorcategories has this subcategory, if yes then set the result to true
      let subCat = this.errorReports.find(x => x.Id == rowId && x.BikeId == bikeId && x.ErrorCategories && this.mapErrorCategory(x.ErrorCategories, subCategory[i].Id));
      if (subCat != undefined && subCat != null) {
        subCategory[i].Result = true;
        if (!this.disabledBike)
          this.disabledBike = subCategory[i].DisableBike;
      }
    }

    //check the current row's errorcategoryId is zero otherFell flag will become true
    if (errorCatId == 0 && this.errorReports.find(x => x.ErrorCategories && this.mapErrorCategory(x.ErrorCategories, errorCatId)))
      this.otherFell = true;
  }

  mapErrorCategory(errorCat, subCategory): boolean {
    return errorCat.includes(subCategory);
  }

  OpenErrorReportPopUp(row) {
    this.mapAllErrorReportResponses(row.Id, row.BikeId, row.ErrorCategoryId);
    this.comments = row.Comments;
    const dialogRef = this.dialog.open(ReportErrorComponent, {
      width: '1200px',
      height: '800px',
      data: {
        'group1': this.group1, 'group2': this.group2, 'group3': this.group3, 'bikeId': row.bikeId, 'otherFell': this.otherFell,
        'disableBike': this.disabledBike, 'disabledRegister': true, 'comments': this.comments
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      this.clearSelectedErrorCategories();
      this.otherFell = false;
      this.disabledBike = false;
    });
  }

  OpenIndividualIssueDetail(row) {
    this.mapAllErrorReportResponses(row.Id, row.BikeId, row.ErrorCategoryId);
    const dialogRef = this.dialog.open(IndividualErrorComponent, {
      width: '700px',
      data: {
        'bikeId': this.bike.BikeId,
        'visualId': row.VisualId,
        'createdDate': row.ReportedDate,
        'category': row.ErrorCategoryId,
        'severity': "",
        'categories': row.ErrorCategoriesText,
        'resolvedDate': row.CompletedDate,
        'resolvedBy': (row.CompletedBy != -1) ? row.CompletedBy : "System Resolved",
        'comment': row.Comments,
        'id': row.Id,
        'group1': this.group1,
        'group2': this.group2,
        'group3': this.group3,
        'errorCommentId': row.ErrorCommentId,
        'endUser': row.EndUser,
        'endAppUserId': row.EndAppUserId
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result != null) {
        this.refreshIssueDetails();
        this.bikeReload.emit({ "state": +true });
      }
    });
  }

  clearSelectedErrorCategories() {
    this.group1.map(x => this.resetSubCategories(x));
    this.group2.map(x => this.resetSubCategories(x));
    this.group3.map(x => this.resetSubCategories(x));
  }

  resetSubCategories(parent) {
    let subCategory = parent.SubCategory;
    for (let i = 0; i < subCategory.length; i++) {
      if (subCategory[i].hasOwnProperty("Result"))
        subCategory[i].Result = false;
    }
  }

  private mapAllIssueCategories() {
    this.issueCategories = [];
    // this.translate.get("REPORT_ERROR.ALL").subscribe(name => {
    //   this.issueCategories.push({ "DisplayName": name, "Id": 0 });
    // });

    this.allErrorCategories.map(x => this.mapIssueCategories(x));
  }


  mapIssueCategories(category) {
    let childName = "REPORT_ERROR." + category.Name.toUpperCase();
    this.translate.get(childName).subscribe(subName => {
      category.DisplayName = (subName != childName) ? subName : category.Name;
    });
    this.issueCategories.push(category);
  }

  onCategoryChange() {
    this.issueCategorieIds = [];
    if (this.selectedCategory.Id != 0)
      this.issueCategorieIds.push(this.selectedCategory.Id);
    this.getAllErrorReportsByFilter();
  }

  filterByCategories(opened: boolean) {
    if (!opened) {
      if (this.categoryCtrl.value != null) {
        this.issueCategorieIds = [];
        this.selectedIssueIds = [];
        this.categoryCtrl.value.forEach((category) => {
          this.selectedIssueIds.push(category.Id);
          // Add all available error categories in merged error reports to the issueCategorieIds array.
          const matchingErrorReports = this.selectedCategoryErrorReports.filter(er =>
            er.ErrorCategories.some(ec => ec.Id === category.Id)
          );
          if (matchingErrorReports.length > 0) {
            this.issueCategorieIds.push(
              ...matchingErrorReports.flatMap(report =>
                report.ErrorCategories.map(category => category.Id)
              )
            );
          } else {
            this.issueCategorieIds.push(category.Id);
          }
        });
         // remove duplicates from arrays
         this.issueCategorieIds = Array.from(new Set(this.issueCategorieIds));
         this.selectedIssueIds = Array.from(new Set(this.selectedIssueIds));
      }
      if (this.issueCategorieIds.length < 1) {
        let errorMsg = "";
        let actionLabel = "";
        this.translate.get("REPORT_ERROR.ERROR_MSG").subscribe(name => {
          errorMsg = name;
        });
        let errorcategory = "COMMON.CLOSE";
        this.translate.get(errorcategory).subscribe(name => {
          actionLabel = name;
        });
        return this.loggerService.showErrorMessage(errorMsg, actionLabel, {
          duration: 3000
        });
      } else {
        this.getAllErrorReportsByFilter();
      }
    }
  }

  toggleSelectAll(selectAllValue: boolean) {
    this.filteredCategories.pipe(take(1), takeUntil(this._onDestroy))
      .subscribe(val => {
        if (selectAllValue) {
          this.categoryCtrl.patchValue(val, { emitEvent: false });
        } else {
          this.categoryCtrl.patchValue([], { emitEvent: false });
        }
      });
  }

  onIssueStatusChange() {
    // if (this.selectedStatus == this.reportFilters.All)
    //   this.listAllIssues();
    // else if (this.selectedStatus == this.reportFilters.Ongoing)
    //   this.listOngoingOrders();
    // else if (this.selectedStatus == this.reportFilters.Completed)
    //   this.listCompletedOrders();
    this.reportFilterToggle = this.selectedStatus;
    this.getAllErrorReportsByFilter();
  }

  onBikeChange(event) {
    this.getAllErrorReportsByFilter();
  }

  isCategoryExist(errorCategories, selectedId) {
    return errorCategories.filter(x => x.Id == selectedId);
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
      this.toDate = this.currentDayEndTimeStamp;
    }
    if (this.selectedDate == this.dateValues.Custom) {
      this.isCustomDateShown = true;
      //empty current events list
      this.filteredErrorReports = [];
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
    } else if (this.selectedDate == this.dateValues.All) {
      this.fromDate = null;
      this.toDate = null;
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
    if (this.fromDate != "" && this.toDate != "") {
      if (this.fromDate > this.toDate) {
        this.loggerService.showErrorMessage('Invalid date range selected.From date should be smaller than To date.');
      }
      // else if (dates > 60) {
      //   this.loggerService.showErrorMessage('Invalid date range selected.Duration should be less than 60 days');
      // }
      else {
        this.getAllErrorReportsByFilter();
      }
    }
  }

  loadIssueStatus() {
    this.issueStatus = [];
    this.issueStatus.push({ "id": this.reportFilters.All, name: "REPORT_ERROR.ALL_ISSUES" });
    this.issueStatus.push({ "id": this.reportFilters.Ongoing, name: "REPORT_ERROR.ONGOING_ORDERS" });
    this.issueStatus.push({ "id": this.reportFilters.Completed, name: "REPORT_ERROR.COMPLETED_ORDERS" });
  }

  onAppUserChange() {
    this.filteredErrorReports = this.errorReportGrouped;
    if (this.selectedAppUser != "All")
      this.filteredErrorReports = this.filteredErrorReports.filter(x => x.EndAppUserId == this.selectedAppUser);
  }

  private setIssueCategoryCount(): void {
    this.allErrorCategories.forEach(issue => {
      let issueCount = 0;
      this.selectedCategoryErrorReports.filter(er => {
        issueCount = issueCount + er.ErrorCategories.filter(ec => ec.Id === issue.Id)?.length
      });
      issue.Count = issueCount ? issueCount : 0;
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
