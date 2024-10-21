import { AddPriorityGroupPopupComponent } from './../add-priority-group-popup/add-priority-group-popup.component';
import { PriorityGroupService } from './../../services/priority-groups.service';
import { Component, OnInit, ViewChild } from '@angular/core';
import { ScreenLayouts } from '../../core/constants/screen-layouts';
import { LoggerService } from '../../services';
import { MatDialog } from '@angular/material/dialog';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';

@Component({
  selector: 'app-priority-groups',
  templateUrl: './priority-groups.component.html',
  styleUrls: ['./priority-groups.component.scss']
})

export class PriorityGroupsComponent implements OnInit {
  @ViewChild('priorityGroupsTable', { static: false }) table: any;
  bikeDetails: any;
  isMobile: boolean = false;

  types = {
    Create: 1,
    Update: 2
  };
  loadingIndicator: boolean = false;
  public readonly LAYOUT = ScreenLayouts;
  public layout: number = this.LAYOUT.MD;
  prioritygroups: any[];

  constructor(
    private loggerService: LoggerService,
    private priorityGroupService: PriorityGroupService,
    private dialog: MatDialog,
    public breakpointObserver: BreakpointObserver
  ) {
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      && (document.documentElement.clientWidth < 768)) {
      this.isMobile = true;
    }
  }

  onResize() {
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      && (document.documentElement.clientWidth < 768)) {
      this.isMobile = true;
    } else {
      this.isMobile = false;
    }
  }

  openCreatePriorityGroup(type: any, priorityGroupData: any): void {
    let data = {};
    data["operationType"] = type;
    if (type == this.types.Update) {
      data["Id"] = priorityGroupData["Id"];
      data["priorityGroupId"] = priorityGroupData["PriorityGroupId"];
      data["priorityGroupName"] = priorityGroupData["PriorityGroupName"];
    }
    const dialogRef = this.dialog.open(AddPriorityGroupPopupComponent, {
      width: '320px',
      data: data
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.ngOnInit();
      }
    });
  }

  ngOnInit() {
    this.prioritygroups = [];
    this.manageScreenWidth();
    this.getAllPriorityGroups();
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

  toggleExpandRow(row) {
    this.table.rowDetail.toggleExpandRow(row);
  }

  getAllPriorityGroups() {
    this.priorityGroupService.getAllPriorityGroups().subscribe(res => {
      this.prioritygroups = res;
      this.prioritygroups.sort((a, b) => (a.Id > b.Id) ? 1 : -1);
    }, err => {
      this.loggerService.showErrorMessage(err);
    });
  }


  deletePriorityGroup(row) {
    this.priorityGroupService.deletePriorityGroup(row.Id).subscribe(res => {
      this.loggerService.showSuccessfulMessage("Priority Group has been successfully deleted");
      this.getAllPriorityGroups();
    }, err => {
      if (err && err.error.Code == 1451) {
        this.loggerService.showErrorMessage("Cannot delete without unassigning from docking station");
      }
      else
        this.loggerService.showSuccessfulMessage("Error occured when deleting priority group");
    })
  }
}
