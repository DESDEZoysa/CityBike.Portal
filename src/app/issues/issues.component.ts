
import { forkJoin as observableForkJoin, ReplaySubject, Subject } from 'rxjs';
import { BikesService } from './../services/bikes.service';
import { UserService } from './../services/users.service';
import { ViewRepairActionsComponent } from './../bikes/bike-support/view-repair-actions/view-repair-actions.component';
import { Component, OnInit, ViewChild } from '@angular/core';
import { LoggerService } from '../services';
import { Router } from '@angular/router';
import { IssueService } from '../services/issue.service';
import { MatDialog } from '@angular/material/dialog';
import { MatSelect } from '@angular/material/select';
import { ReportErrorComponent } from '../bikes/bike-support/report-error/report-error.component';
import { TranslateService, LangChangeEvent } from '@ngx-translate/core';
import { IndividualErrorComponent } from '../bikes/bike-support/individual-error/individual-error.component';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { ScreenLayouts } from '../core/constants/screen-layouts';
import { CommonType } from '../core/enums/commonType';
import { User } from '../core/models/user/user';
import * as moment from 'moment';
import 'moment-timezone';
import { FormControl } from '@angular/forms';
import { take, takeUntil } from 'rxjs/operators';
import { ExcelService } from '../services/excel.service';
import { LocalStorageKeys } from '../core/constants';
import { ConvertTimePipe } from '../core/pipes/convert-time.pipe';

@Component({
  selector: 'app-issues',
  templateUrl: './issues.component.html',
  styleUrls: ['./issues.component.scss'],
  providers: [ConvertTimePipe]
})
export class IssuesComponent implements OnInit {

  @ViewChild('ordersTable', { static: true }) table: any;
  @ViewChild('bikeSelect', { static: true }) bikeSelect: MatSelect;
  @ViewChild('endUserSelect', { static: true }) enduserSelect: MatSelect;

  isMobile: boolean = false;
  reasons: any;
  public errorReports: any[];
  group1: any;
  group2: any;
  group3: any;
  public errorReportGrouped: any[];
  otherFell: boolean = false;
  comments: any;
  disabledBike: boolean = false;
  reportFilterToggle: any;
  filteredErrorReports: any;
  loadingIndicator: boolean = true;

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

  users: User[] = [];
  bikeList: any[];
  selectedBike: string;
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
  issueCategorieIds: any;
  protected issueCategories: any[];

  /** control for the selected categories for multi-selection */
  public categoryCtrl: FormControl = new FormControl();
  public categoryFilterCtrl: FormControl = new FormControl();
  public filteredCategories: ReplaySubject<any[]> = new ReplaySubject<any[]>(1);

  /** control for the selected enduser for single-selection */
  public enduserCtrl: FormControl = new FormControl();
  public enduserFilterCtrl: FormControl = new FormControl();
  public filteredEndUsers: ReplaySubject<any[]> = new ReplaySubject<any[]>(1);

  /** control for the selected bike for single-selection */
  public bikeCtrl: FormControl = new FormControl();
  public bikeFilterCtrl: FormControl = new FormControl();
  public filteredBikes: ReplaySubject<any[]> = new ReplaySubject<any[]>(1);

  /** Subject that emits when the component has been destroyed. */
  protected _onDestroy = new Subject<void>();

  allCategoriesErrorReports: any[] = [];
  selectedCategoryErrorReports: any[] = [];
  selectedIssueIds: number[] = [];

  constructor(
    private loggerService: LoggerService,
    private issueService: IssueService,
    private router: Router,
    private dialog: MatDialog,
    private translate: TranslateService,
    //private menuItemService: MenuItemService,
    public breakpointObserver: BreakpointObserver,
    private excelService: ExcelService,
    private convertTime: ConvertTimePipe,
    private userservice: UserService,
    private bikeService: BikesService
  ) {
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      && (document.documentElement.clientWidth < 768)) {
      this.isMobile = true;
    }
    this.group1 = [];
    this.group2 = [];
    this.group3 = [];
    this.issueCategories = [];
    this.allErrorCategories = [];
    this.errorReportGrouped = [];
    this.issueCategorieIds = [];
  }

  setDefaultFilters() {
    this.currentDayEndTimeStamp = moment().utc().format('YYYY-MM-DDTHH:mm:ss');
    //this.selectedCategory = 'All';
    this.selectedBike = 'All';
    this.selectedStatus = this.reportFilters.Ongoing;
    this.selectedDate = this.dateValues.LastDay;
    this.fromDate = moment().subtract(1, 'days').utc().format('YYYY-MM-DDTHH:mm:ss');
    this.toDate = this.currentDayEndTimeStamp;
    this.fromDateValue = moment().subtract(1, 'days').utc().format('YYYY-MM-DDTHH:mm:ss');
    this.toDateValue = this.currentDayEndTimeStamp;
    this.selectedAppUser = "All";
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
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      && (document.documentElement.clientWidth < 768)) {
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
    this.loadIssueData();
    //this.getAllUsers();
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
    //this.menuItemService.updateMenubar(RefreshTypes.Issues);

    //listen for search field value changes for categories
    this.categoryFilterCtrl.valueChanges
      .pipe(takeUntil(this._onDestroy))
      .subscribe(() => {
        this.filterCategories();
      });

    //listen for search field value changes for endusers
    this.enduserFilterCtrl.valueChanges
      .pipe(takeUntil(this._onDestroy))
      .subscribe(() => {
        this.filterEndusers();
      });

    //listen for search field value changes for bikes
    this.bikeFilterCtrl.valueChanges
      .pipe(takeUntil(this._onDestroy))
      .subscribe(() => {
        this.filterBikes();
      });
  }

  private setInitialEndUserValue() {
    this.filteredEndUsers
      .pipe(take(1), takeUntil(this._onDestroy))
      .subscribe(() => {
        this.enduserSelect.compareWith = (a: any, b: any) => a === b;
      });
  }

  private setInitialBikeValue() {
    this.filteredBikes
      .pipe(take(1), takeUntil(this._onDestroy))
      .subscribe(() => {
        this.bikeSelect.compareWith = (a: any, b: any) => a === b;
      });
  }


  refreshIssueDetails() {
    this.loadIssueStatus();
    this.otherFell = false;
    this.disabledBike = false;
    this.getAllErrorReportsByFilter();
    this.loadIssueData();
    // this.loadErrorCategories();
    // this.loadAllErrorCategories();
  }

  private filterBikes() {
    if (!this.bikeList) {
      return;
    }
    // get the search keyword
    let search = this.bikeFilterCtrl.value;
    if (!search) {
      this.filteredBikes.next(this.bikeList.slice());
      return;
    } else {
      search = search.toLowerCase();
    }
    // filter
    this.filteredBikes.next(
      this.bikeList.filter(item => item.visualId.toLowerCase().indexOf(search) > -1)
    );
  }

  private filterEndusers() {
    if (!this.endUsers) {
      return;
    }
    // get the search keyword
    let search = this.enduserFilterCtrl.value;
    if (!search) {
      this.filteredEndUsers.next(this.endUsers.slice());
      return;
    } else {
      search = search.toLowerCase();
    }
    // filter
    this.filteredEndUsers.next(
      this.endUsers.filter(item => item.toLowerCase().indexOf(search) > -1)
    );
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

  OpenIndividualIssueDetail(row) {
    this.mapAllErrorReportResponses(row.Id, row.BikeId, row.ErrorCategoryId);
    const dialogRef = this.dialog.open(IndividualErrorComponent, {
      width: '600px',
      data: {
        'bikeId': row.BikeId,
        'visualId': row.VisualId,
        'createdDate': row.ReportedDate,
        'category': row.ErrorCategoryId,
        'categories': row.ErrorCategoriesText,
        'dockingstationname': row.DockingStationName,
        'dphwid': row.DockingPointHardwareId,
        'dpVisualId': row.DPVisualId,
        'severity': "",
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
      }
    });
  }

  OpenIssueRepairAction(row) {
    const dialogRef = this.dialog.open(ViewRepairActionsComponent, {
      width: '1400px',
      height: '755px',
      data: {
        'bikeId': row.BikeId,
        'issueId': row.ErrorCommentId,
        'bike': row
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result != null) {
        this.ngOnInit();
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

  getAllErrorReports() {
    this.loadingIndicator = true;
    this.issueService.GetAllErrorReports().subscribe(result => {
      this.errorReportGrouped = result.errorReportGroupedDTOs;
      this.errorReports = result.errorReportResponseDTOs;
      this.errorReportGrouped = this.errorReportGrouped.map(x => {
        if (x.EndUserId == CommonType.AutoUser)
          x.EndUser = "System generated";
        return x;
      });
      this.formatErrorCategories();
      this.listOngoingOrders();
      this.loadingIndicator = false;
    }, error => {
      this.loadingIndicator = false;
      this.loggerService.showErrorMessage("Getting all error reports failed.");
    });
  }

  getAllErrorReportsByFilter(isOnInit: boolean = false) {
    this.loadingIndicator = true;
    let filterRequest = this.getMultipleCategoriesRequest();
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

      //for enduser search funtionality
      this.setInitialEndUserValue();
      this.enduserCtrl.setValue(this.endUsers[0]);
      this.filteredEndUsers.next(this.endUsers.slice());

      this.loadingIndicator = false;
    }, error => {
      this.loadingIndicator = false;
      this.loggerService.showErrorMessage("Getting all error reports failed.");
    });
  }

  getMultipleCategoriesRequest(): any {
    let selectedBike = this.selectedBike == "All" ? null : this.selectedBike;
    let request = {
      Categories: this.issueCategorieIds,
      BikeId: selectedBike,
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

  loadIssueData() {
    observableForkJoin(this.issueService.GetErrorCategories(), this.bikeService.getBikes())
      .subscribe(data => {
        let issueCategories = data[0];
        let bikes = data[1];
        this.arrangeBikeDropDownList(bikes);

        //for bike search funtionality
        this.setInitialBikeValue();
        this.bikeCtrl.setValue(this.bikeList[0].id);
        this.filteredBikes.next(this.bikeList.slice());

        this.group1 = issueCategories.group1;
        this.group2 = issueCategories.group2;
        this.group3 = issueCategories.group3;
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
      // this.selectedCategory = this.issueCategories[0];
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

  navigateToBikeStreetServicePage(visualId) {
    this.router.navigateByUrl('bikes/support?visualId=' + visualId);
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

  // onCategoryChange() {
  //   if (this.selectedCategory && this.selectedCategory.Id != 0) {
  //     if (this.reportFilterToggle == this.reportFilters.Completed)
  //       this.filteredErrorReports = this.errorReportGrouped.filter(obj => obj.IsCompleted == true && this.isCategoryExist(obj.ErrorCategories, this.selectedCategory.Id).length > 0);
  //     else if (this.reportFilterToggle == this.reportFilters.Ongoing)
  //       this.filteredErrorReports = this.errorReportGrouped.filter(obj => obj.IsCompleted == false && this.isCategoryExist(obj.ErrorCategories, this.selectedCategory.Id).length > 0);
  //     else if (this.reportFilterToggle == this.reportFilters.All)
  //       this.filteredErrorReports = this.errorReportGrouped.filter(obj => this.isCategoryExist(obj.ErrorCategories, this.selectedCategory.Id).length > 0);
  //   }
  //   else {
  //     if (this.reportFilterToggle == this.reportFilters.Completed)
  //       this.listCompletedOrders();
  //     else if (this.reportFilterToggle == this.reportFilters.Ongoing)
  //       this.listOngoingOrders();
  //     else if (this.reportFilterToggle == this.reportFilters.All)
  //       this.listAllIssues();
  //   }
  // }

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
          this.categoryCtrl.patchValue(val);
        } else {
          this.categoryCtrl.patchValue([]);
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

  getAllUsers() {
    this.userservice.getSystemUsers().subscribe(data => {
      this.users = data;
    });
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
      this.toDate = this.toDateValue;
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
      // else if (dates > 60) {
      //   this.loggerService.showErrorMessage('Invalid date range selected.Duration should be less than 60 days');
      // }
      else {
        this.getAllErrorReportsByFilter(false);
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

  generateExcel() {
    if (this.filteredErrorReports.length > 0) {
      let convertType = JSON.parse(localStorage.getItem(LocalStorageKeys.PREFERRED_TIMEZONE));
      let dataToExport = JSON.parse(JSON.stringify(this.filteredErrorReports));
      if (convertType == null || convertType == undefined) {
        convertType = 'CET';
      }
      if (convertType == 'CET') {
        dataToExport = this.convertToTimeType(dataToExport);
      } else {
        this.excelService.generateIssueExcel(dataToExport);
      }
    } else {
      return this.loggerService.showErrorMessage("No event records found to export");
    }
  }

  convertToTimeType(dataToExport) {
    dataToExport.forEach((issue) => {
      issue['ReportedDate'] = this.convertTime.transform(issue['ReportedDate']);
      issue['CompletedDate'] = this.convertTime.transform(issue['CompletedDate']);
      return issue;
    });
    this.excelService.generateIssueExcel(dataToExport);
  }

  setIssueCategoryCount(): void {
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
