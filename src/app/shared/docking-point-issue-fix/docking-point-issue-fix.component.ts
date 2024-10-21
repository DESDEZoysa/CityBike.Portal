import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { LoggerService, RepairService } from '../../services';

export interface DockingPointIssueFixData {
  dpFixId: any;
  dpVisualId: any;
  fixCategories: any;
  dockingPointId: any;
  dpDisabled: any;
  dpDisabledReason: any;
  isUpdate: any;
  hoursSpent: any;
  minutesSpent: any;
  comments: any;
}

@Component({
  selector: 'app-docking-point-issue-fix',
  templateUrl: './docking-point-issue-fix.component.html',
  styleUrls: ['./docking-point-issue-fix.component.scss']
})
export class DockingPointIssueFixComponent implements OnInit {

  dpVisualId: any;
  fixCategories: any;
  selectedFixCategoryIds: any = [];
  activateDockingPoint: boolean = true;
  hoursSpent: any;
  minutesSpent: any;
  dockingPointId: any;
  comments: any;
  dpDisabled: any;
  dpDisabledReason: any;
  dpFixId: any;
  isUpdate: any;
  minutesInput: any;
  isCommentsEmpty: boolean;
  isTimeSpentEmpty: boolean;

  constructor(
    public dialogRef: MatDialogRef<DockingPointIssueFixComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DockingPointIssueFixData,
    public dialog: MatDialog,
    private loggerService: LoggerService,
    private repairService: RepairService) {
    this.dpFixId = this.data.dpFixId;
    this.dpVisualId = this.data.dpVisualId;
    this.dockingPointId = this.data.dockingPointId;
    this.dpDisabled = this.data.dpDisabled;
    this.dpDisabledReason = this.data.dpDisabledReason;
    this.fixCategories = this.data.fixCategories;
    this.isUpdate = this.data.isUpdate;
    this.hoursSpent = (this.data.hoursSpent) ? this.data.hoursSpent : "";
    this.minutesSpent = (this.data.minutesSpent) ? this.data.minutesSpent : "";
    this.comments = (this.data.comments) ? this.data.comments : "";
  }

  ngOnInit() {
    this.selectedFixCategoryIds = [];
    if (this.isUpdate) {
      this.fixCategories.map(category => {
        if (category.Result)
          this.selectedFixCategoryIds.push(category.FixId);
        return;
      });
    }
    this.minutesInput = new FormControl("", [Validators.max(59), Validators.min(0)]);
  }

  manageFixCategoryIds(event, categoryId) {
    if (event.checked) {
      this.selectedFixCategoryIds.push(categoryId);
    } else {
      this.selectedFixCategoryIds = this.selectedFixCategoryIds.filter((number) => number != categoryId);
    }
  }

  cancel() {
    this.dialogRef.close();
  }

  ActivateDockingPoint() {
    if ((this.hoursSpent && this.hoursSpent > 0) || (this.minutesSpent && this.minutesSpent > 0)) {
        this.isTimeSpentEmpty = false;
        if (this.selectedFixCategoryIds.length != 0 || (this.selectedFixCategoryIds.length == 0 && this.comments)) {
          this.isCommentsEmpty = false;
          let fixIssue = {
            "DockingPointId": this.dockingPointId,
            "HoursSpent": this.hoursSpent == '' ? 0 : this.hoursSpent,
            "MinutesSpent": this.minutesSpent == '' ? 0 : this.minutesSpent,
            "FixCategoryIds": this.selectedFixCategoryIds,
            "Comments": this.comments,
            "ActivateDockingPoint": this.activateDockingPoint
          };
          this.repairService.fixDockingPointIssue(fixIssue).subscribe(data => {
            if (data == null) {
              this.loggerService.showSuccessfulMessage("Docking point activated");
              this.dialogRef.close({ "IsResolved": true });
            }
          }, error => {
            this.loggerService.showErrorMessage("Error occurred while registering docking point repairs");
          });
          
        }
        else
          this.isCommentsEmpty = true;
      }
      else
        this.isTimeSpentEmpty = true;
  }

  updateDockingPointRepairs() {
    let dpRepairs = {
      "DPFixId": this.dpFixId,
      "DockingPointId": this.dockingPointId,
      "HoursSpent": this.hoursSpent == '' ? 0 : this.hoursSpent,
      "MinutesSpent": this.minutesSpent == '' ? 0 : this.minutesSpent,
      "FixCategoryIds": this.selectedFixCategoryIds,
      "Comments": this.comments,
      "ActivateDockingPoint": this.activateDockingPoint
    };
    this.repairService.updateDockingPointRepairs(dpRepairs).subscribe(data => {
      if (data == null) {
        this.loggerService.showSuccessfulMessage("Docking point repairs updated");
        this.dialogRef.close({ "IsResolved": true });
      }
    }, error => {
      this.loggerService.showErrorMessage("Error occurred while updating docking point repairs");
    });
  }

}
