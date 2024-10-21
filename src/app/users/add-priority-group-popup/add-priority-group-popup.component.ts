import { PriorityGroupService } from './../../services/priority-groups.service';
import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { LoggerService } from '../../services';
import { TranslateService } from '@ngx-translate/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface PriorityGroupData {
  Id: string;
  priorityGroupId: string;
  priorityGroupName: string;
  operationType: any;
}

@Component({
  selector: 'app-add-priority-group-popup',
  templateUrl: './add-priority-group-popup.component.html',
  styleUrls: ['./add-priority-group-popup.component.scss']
})
export class AddPriorityGroupPopupComponent implements OnInit {
  form: FormGroup;
  priorityGroupName: string;
  Id: string;
  operationType: any;
  priorityGroupId: string;


  constructor(
    public dialogRef: MatDialogRef<AddPriorityGroupPopupComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PriorityGroupData,
    public dialog: MatDialog,
    private translate: TranslateService,
    private fb: FormBuilder,
    private loggerService: LoggerService,
    private priorityGroupService: PriorityGroupService
  ) {
  }



  ngOnInit() {
    this.priorityGroupName = this.data.priorityGroupName ? this.data.priorityGroupName : '';
    this.Id = this.data.Id ? this.data.Id : '';
    this.priorityGroupId = this.data.priorityGroupId ? this.data.priorityGroupId : '';
    this.operationType = this.data.operationType;
    this.form = this.fb.group({
      PriorityGroupId: new FormControl(this.priorityGroupId, Validators.required),
      PriorityGroupName: new FormControl(this.priorityGroupName, Validators.required)
    });
  }

  onSubmit() {
    let priorityGroupData = {};
    Object.assign(priorityGroupData, this.form.getRawValue());
    if (this.operationType == 1)
      this.createPriorityGroup(priorityGroupData);
    else {
      priorityGroupData["Id"] = this.Id;
      this.updatePriorityGroup(priorityGroupData);
    }
  }

  createPriorityGroup(priorityGroup) {
    this.priorityGroupService.createPriorityGroup(priorityGroup).subscribe(data => {
      this.loggerService.showSuccessfulMessage("Priority Group has been successfully created");
      this.dialogRef.close({ "IsSuccess": true });
    }, err => {

    });
  }

  updatePriorityGroup(priorityGroup) {
    this.priorityGroupService.updatePriorityGroup(priorityGroup).subscribe(data => {
      this.loggerService.showSuccessfulMessage("Priority Group has been successfully updated");
      this.dialogRef.close({ "IsSuccess": true });
    }, err => {

    });
  }
}
