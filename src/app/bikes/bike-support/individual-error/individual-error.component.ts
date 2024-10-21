import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { IssueService, LoggerService } from '../../../services';
import { CreateRepairActionPopupComponent } from '../../../repair/create-repair-action/create-repair-action-popup/create-repair-action-popup.component';

export interface IndividualErrorData {
  bikeId: string;
  createdDate: string;
  category: string;
  severity: string;
  resolvedDate: string;
  resolvedBy: string;
  comment: string;
  resolved: boolean;
  visualId: string;
  dockingstationname: string;
  dpVisualId: string;
  dphwid: string;
  id: string;
  group1;
  group2;
  group3;
  categories;
  errorCommentId: string;
  endUser: string;
  endAppUserId: string;
}

@Component({
  selector: 'app-individual-error',
  templateUrl: './individual-error.component.html',
  styleUrls: ['./individual-error.component.scss']
})
export class IndividualErrorComponent implements OnInit {

  bikeId: string;
  createdDate: string;
  category: string;
  categories: string;
  severity: string;
  resolvedDate: string;
  resolvedBy: string;
  comment: string;
  resolved: boolean;
  visualId: string;
  dockingstationname: string;
  dphwid: string;
  dpVisualId: string;
  id: string;
  group1;
  group2;
  group3;
  errorCommentId: string;
  endUser: string;


  constructor(
    public dialogRef: MatDialogRef<IndividualErrorComponent>,
    @Inject(MAT_DIALOG_DATA) public data: IndividualErrorData,
    public dialog: MatDialog,
    private translate: TranslateService,
    private issueService: IssueService,
    private loggerService: LoggerService
  ) {
    this.group1 = [];
    this.group2 = [];
    this.group3 = [];
  }

  ngOnInit() {
    this.group1 = this.data.group1;
    this.group2 = this.data.group2;
    this.group3 = this.data.group3;
    this.getCategoryName();
  }

  setIssueData() {
    this.bikeId = this.data.bikeId;
    this.visualId = this.data.visualId;
    this.createdDate = this.data.createdDate;
    this.resolvedDate = this.data.resolvedDate;
    this.comment = this.data.comment;
    this.resolvedBy = this.data.resolvedBy;
    this.resolved = this.data.resolved;
    this.id = this.data.id;
    this.dockingstationname = this.data.dockingstationname;
    this.dphwid = this.data.dphwid;
    this.dpVisualId = this.data.dpVisualId;
    this.categories = this.data.categories;
    this.errorCommentId = this.data.errorCommentId;
    this.endUser = (this.data.endAppUserId) ? this.data.endAppUserId : this.data.endUser;
  }

  getCategoryName() {
    this.group1.forEach((element) => {
      element.SubCategory.forEach((cat) => {
        if (cat.Id == this.data.category) {
          this.category = cat.Name;
          if (cat.DisableBike) {
            this.severity = "Critical";
          } else {
            this.severity = "Not Critical"
          }
        }
      });
    });
    this.group2.forEach((element) => {
      element.SubCategory.forEach((cat) => {
        if (cat.Id == this.data.category) {
          this.category = cat.Name;
          if (cat.DisableBike) {
            this.severity = "Critical";
          } else {
            this.severity = "Not Critical"
          }
        }

      });
    });

    this.group3.forEach((element) => {
      element.SubCategory.forEach((cat) => {
        if (cat.Id == this.data.category) {
          this.category = cat.Name;
          if (cat.DisableBike) {
            this.severity = "Critical";
          } else {
            this.severity = "Not Critical"
          }
        }
      });
    });

    this.setIssueData();
  }


  resolveIssue(bikeId) {
    this.issueService.ResolveIssue(bikeId, this.errorCommentId).subscribe(result => {
      if (result > 0) {
        this.loggerService.showSuccessfulMessage("Issue resolved sucessfully.");
        this.dialogRef.close({ "reloadNeed": true });
      } else {
        this.loggerService.showErrorMessage("Issue resolving failed");
      }
    });
  }

  CreateRepairAction(bikeId) {
    const dialogRef = this.dialog.open(CreateRepairActionPopupComponent, {
      width: '1200px',
      height: '480px',
      data: {
        'bikeId': bikeId,
        'issueId': this.errorCommentId
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result != null) {
        this.dialogRef.close({ "reloadNeed": true });
      }
      else {
        this.dialogRef.close();
      }
    });
  }

}
