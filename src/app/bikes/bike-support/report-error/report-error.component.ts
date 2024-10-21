import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { RepairService, LoggerService, BikesService } from '../../../services';
import { IssueService } from '../../../services/issue.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { LocalStorageKeys } from '../../../core/constants';
import { UserRoles } from '../../../core/constants/user-roles';


const criticalErrorCategoryId: number = 100100;

export interface ErrorDialogData {
  group1: any[];
  group2: any[];
  group3: any[];
  bikeId: any;
  otherFell: boolean;
  otherCritical: boolean;
  disableBike: boolean;
  disabledRegister: boolean;
  comments: any;
  sessionId: any;
  bikeLocked: boolean;
  isRepairRequired: boolean;
  selectedErrorCategories: any[];
}

@Component({
  selector: 'app-report-error',
  templateUrl: './report-error.component.html',
  styleUrls: ['./report-error.component.scss']
})
export class ReportErrorComponent implements OnInit {
  reportFields: any;
  panelOpenState = false;
  errorCategories: any[];
  filteredCategories: any[];
  disableBike: boolean = false;
  selectedErrors: any[];
  otherFell: boolean = false;
  otherCritical: boolean = false;
  comments: any;
  group1: any;
  group2: any[];
  group3: any[];
  bikeId: any;
  disabledRegister: boolean = false;
  sessionId: any;
  isBikeLocked: boolean = false;
  endUserId: any;
  isRepairRequired: boolean;
  selectedErrorCategories: any[];


  constructor(
    private spinner: NgxSpinnerService,
    private issueService: IssueService,
    private repairService: RepairService,
    private bikesService: BikesService,
    private loggerService: LoggerService,
    public dialogRef: MatDialogRef<ReportErrorComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ErrorDialogData,
    public dialog: MatDialog) {
    this.selectedErrors = [];
    this.otherFell = false;
    this.otherCritical = false;
  }

  ngOnInit() {
    this.endUserId = JSON.parse(localStorage.getItem(LocalStorageKeys.USER_DETAILS)).UserId;
    this.group1 = this.data.group1;
    this.group2 = this.data.group2;
    this.group3 = this.data.group3;

    //hide error categories for customer service
    this.hideErrorCategoriesForCustomerService();

    this.bikeId = this.data.bikeId;
    this.otherFell = this.data.otherFell == undefined ? false : this.data.otherFell;
    this.otherCritical = this.data.otherCritical == undefined ? false : this.data.otherCritical;
    this.disableBike = this.data.disableBike == undefined ? false : this.data.disableBike;
    this.disabledRegister = this.data.disabledRegister == undefined ? false : this.data.disabledRegister;
    this.comments = this.data.comments == undefined ? '' : this.data.comments;
    this.sessionId = this.data.sessionId;
    this.isBikeLocked = this.data.bikeLocked ? this.data.bikeLocked : false;
    this.isRepairRequired = this.data.isRepairRequired ? this.data.isRepairRequired : false;
    if (this.isRepairRequired && this.data.selectedErrorCategories && this.data.selectedErrorCategories.length > 0) {
      this.selectedErrorCategories = this.data.selectedErrorCategories;
      this.group1.map(x => this.MapErrorResponse(x));
      this.group2.map(x => this.MapErrorResponse(x));
      this.group3.map(x => this.MapErrorResponse(x));
      this.selectedErrors = this.selectedErrorCategories.map(x => {
        var payload = {};
        payload["subCategoryId"] = x.Id;
        payload["DisableBike"] = x.DisableBike;
        return payload;
      });
    }
    this.resetDialog();
  }

  MapErrorResponse(parent) {
    let subCategory = parent.SubCategory;
    for (let i = 0; i < subCategory.length; i++) {
      var isExist = this.selectedErrorCategories.find(x => x.Id == subCategory[i].Id);
      subCategory[i].Result = isExist ? true : false;
    }
  }


  OnChange($event, subcategory) {
    if (this.selectedErrors.length > 0) {
      if ($event.checked && this.selectedErrors.filter(x => x.DisableBike == true).length == 0) {
        this.disableBike = subcategory.DisableBike;
        this.selectedErrors.push({ "subCategoryId": subcategory.Id, "DisableBike": subcategory.DisableBike });
      }
      else if ($event.checked && this.selectedErrors.filter(x => x.DisableBike == true).length != 0) {
        this.selectedErrors.push({ "subCategoryId": subcategory.Id, "DisableBike": subcategory.DisableBike });
      }
      else if (!$event.checked) {
        this.selectedErrors = this.selectedErrors.filter(x => x.subCategoryId != subcategory.Id);
        if (this.selectedErrors.filter(x => x.DisableBike == true).length == 0)
          this.disableBike = false;
      }
    }
    else {
      this.disableBike = subcategory.DisableBike;
      this.selectedErrors.push({ "subCategoryId": subcategory.Id, "DisableBike": subcategory.DisableBike });
    }
    this.handleDisableBikeStatusWhenErrorsSelected();
  }

  onCriticalChange() {
    if (this.otherCritical) {
      this.disableBike = true;
      this.selectedErrors.push({ "subCategoryId": criticalErrorCategoryId, "DisableBike": true });
    } else if (this.otherFell || !this.otherCritical) {
      this.disableBike = false;
      this.selectedErrors = this.selectedErrors.filter(x => x.subCategoryId != criticalErrorCategoryId);
    }
    this.handleDisableBikeStatusWhenErrorsSelected();
  }

  handleDisableBikeStatusWhenErrorsSelected() {
    if (this.selectedErrors.filter(x => x.DisableBike == true).length > 0) {
      this.disableBike = true;
    } else {
      this.disableBike = false;
    }
  }

  createErrorOrUpdate(type: string) {
    this.resetDialog();
    this.errorCategories = this.errorCategories.concat(this.group1);
    this.errorCategories = this.errorCategories.concat(this.group2);
    this.errorCategories = this.errorCategories.concat(this.group3);
    if (this.validateReportForm()) {
      let errorReportObj = {};
      errorReportObj['BikeId'] = this.bikeId;
      errorReportObj['ErrorCategories'] = this.errorCategories;
      errorReportObj['OtherFell'] = this.otherFell;
      errorReportObj['OtherCriticalFell'] = this.otherCritical;
      errorReportObj['Comments'] = this.comments;
      errorReportObj['IsBikeDisabled'] = this.disableBike;
      errorReportObj['EndUserId'] = this.endUserId;
      if (this.isRepairRequired) {
        this.selectedErrorCategories = [];
        var selectedErrorCategories = this.errorCategories.forEach(x => {
          x.SubCategory.forEach(sub => {
            if (sub.Result) {
              this.selectedErrorCategories.push(sub);
            }
          });
        });
        this.dialogRef.close({
          "IsBikeDisabled": errorReportObj["IsBikeDisabled"], "errorReport": errorReportObj,
          "selectedErrorCategories": this.selectedErrorCategories, "comments": this.comments,
          "disableBike": this.disableBike, "otherFell": this.otherFell, "otherCritical": this.otherCritical
        });
      }
      else
        this.CreateErrorReport(errorReportObj);
    }
    else
      this.loggerService.showWarningMessage("No failure type selected");
  }

  validateReportForm(): boolean {
    let isValid = false;
    if (this.selectedErrors.length != 0)
      isValid = true;
    if (this.selectedErrors.length == 0 && (this.otherFell || this.otherCritical)) {
      isValid = true;
    }
    return isValid;
  }

  CreateErrorReport(errorReportObj) {
    this.issueService.CreateErrorReport(errorReportObj).subscribe(data => {
      this.loggerService.showSuccessfulMessage("Error reported successfully.");
      
      //reduce and accumator use to get subset of the selected error categories
      let selectedErrorCategories = this.errorCategories.reduce((accumulator, errorCategory) => {
        let selectedSubCategories = errorCategory.SubCategory.filter(sub => sub.Result);
        return accumulator.concat(selectedSubCategories);
      }, []);
      this.dialogRef.close({ "IsBikeDisabled": errorReportObj.IsBikeDisabled, "selectedErrorCategories": selectedErrorCategories });
    }, error => {
      this.loggerService.showErrorMessage(error);
    });
  }

  resetDialog() {
    this.errorCategories = [];
  }

  addLock() {
    this.spinner.show();
    this.bikesService.sendLockCommand(this.bikeId, true).subscribe((data) => {
      //if (data.Status) {
      this.spinner.hide();
      this.loggerService.showSuccessfulMessage("Lock command executed successfully");
      this.isBikeLocked = true;
      //}
      //else {
      //   this.loggerService.showErrorMessage("Executing lock command failed");
      //}
    }, () => {
      this.loggerService.showErrorMessage("Executing lock command failed");
      this.spinner.hide();
    })
  }

  endSession() {
    this.spinner.show();
    this.bikesService.endBikeSession(this.bikeId, this.sessionId, new Date().toISOString(), false)
      .subscribe((data) => {
        //if (data.Status) {
        this.spinner.hide();
        this.loggerService.showSuccessfulMessage("End Session command executed successfully");
        this.sessionId = null;
        // }
        // else {
        //this.loggerService.showErrorMessage("Executing end session command is failed");
        //}
      }, () => {
        this.loggerService.showErrorMessage("Executing end session command is failed");
        this.spinner.hide();
      });

  }

  hideErrorCategoriesForCustomerService() {
    var authToken = JSON.parse(
      localStorage.getItem(LocalStorageKeys.OAUTH_TOKEN)
    );
    let userRole = authToken._claims[0];

    this.group1.map(x => {
      if (userRole == UserRoles.CUSTOMER_SERVICE) {
        // Error category - Does not release from charging point (215)
        x.SubCategory = x.SubCategory.filter(s => s.Id != 215);
      }
      return x;
    });
  }

}
