import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';


export interface DPErrorReportData {
  dpVisualId: any;
  dpErrorCategories: any[];
}

@Component({
  selector: 'app-docking-point-error-report-popup',
  templateUrl: './docking-point-error-report-popup.component.html',
  styleUrls: ['./docking-point-error-report-popup.component.scss']
})
export class DockingPointErrorReportPopupComponent {
  dpErrorCategories: any[];
  comments: any;
  dpVisualId: any;
  isEmpty: boolean = true;

  constructor(@Inject(MAT_DIALOG_DATA) public data: DPErrorReportData,
    public dialogRef: MatDialogRef<DockingPointErrorReportPopupComponent>) {
    this.dpErrorCategories = this.data.dpErrorCategories.map(x => {
      x["Result"] = false;
      return x;
    });
    this.dpVisualId = this.data.dpVisualId;
  }

  ngDoCheck() {
    //enable disable complate button based on selections    
    var isChecked = this.dpErrorCategories.some(({ Result }) => Result == true);
    if (!isChecked)
      this.isEmpty = true;
    else if (typeof (this.comments) != "undefined" || isChecked) {
      this.isEmpty = false;
    }
  }


  createDPIssue() {
    let errorCategoryIds = this.dpErrorCategories.filter(x => x.Result == true).map(x => x.Id);
    let dpErrorReportDto = {
      "ErrorCategoryIds": errorCategoryIds,
      "Comments": this.comments
    };
    this.dialogRef.close({ "dpErrorReportDto": dpErrorReportDto });
  }

}
