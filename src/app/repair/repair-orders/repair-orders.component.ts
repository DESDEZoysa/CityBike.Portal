
import { forkJoin as observableForkJoin, Observable } from 'rxjs';
import { WorkshopService } from './../../services/workshop.service';
import { Component, OnInit, ViewChild } from '@angular/core';
import { LoggerService } from '../../services';
import { RepairOrdersService } from '../../services/repair-orders.service';
import 'moment-timezone';
import { Router } from '@angular/router';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { ScreenLayouts } from '../../core/constants/screen-layouts';
import * as moment from 'moment';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-repair-orders',
  templateUrl: './repair-orders.component.html',
  styleUrls: ['./repair-orders.component.scss']
})
export class RepairOrdersComponent implements OnInit {
  @ViewChild('repairOrdersTable', { static: true }) table: any;

  repairOrders: any;
  filteredRepairOrders: any;
  isMobile: boolean = false;

  completedOrdersView: any;
  loadingIndicator: boolean = true;

  public readonly LAYOUT = ScreenLayouts;
  public layout: number = this.LAYOUT.MD;
  allWorkshops: any[];
  selectedWorkshop: any;
  allOrders: boolean = false;

  constructor(
    private repairOrdersService: RepairOrdersService,
    private loggerService: LoggerService,
    private router: Router,
    public dialog: MatDialog,
    public breakpointObserver: BreakpointObserver,
    private workshopService: WorkshopService
  ) {
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) && (document.documentElement.clientWidth < 768)) {
      this.isMobile = true;
    }
  }

  ngOnInit() {
    this.allWorkshops = [];
    this.manageScreenWidth();
    this.getAllOnGoingRepairOrders();
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

  onResize() {
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) && (document.documentElement.clientWidth < 768)) {
      this.isMobile = true;
    } else {
      this.isMobile = false;
    }
  }

  //both ongoing and completed orders 
  getAllRepairOrders() {
    this.loadingIndicator = true;
    this.repairOrdersService.getAllRepairOrders(false).subscribe(
      data => {
        this.repairOrders = data;
        this.allOrders = true;

        this.listCompletedOrders();
        this.loadingIndicator = false;
      }, error => {
        this.loadingIndicator = false;
        this.loggerService.showErrorMessage(error);
      });
  }

  getAllOnGoingRepairOrders() {
    this.loadingIndicator = true;
    observableForkJoin(this.repairOrdersService.getAllRepairOrders(true), this.workshopService.GetAllWorkshops()).subscribe(
      data => {
        this.repairOrders = data[0];
        if (data[1]) {
          this.allWorkshops = data[1];
          this.allWorkshops.unshift({ "Id": 'All', "Name": "COMMON.ALL" });
          this.selectedWorkshop = 'All';
        }
        this.listOngoingOrders();
        this.loadingIndicator = false;
      }, error => {
        this.loadingIndicator = false;
        this.loggerService.showErrorMessage(error);
      });
  }

  closeRepairOrder(repairOrderId) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '300px',
      data: { "message": "Are you sure want to close this repair order?" }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.repairOrdersService.closeRepairOrder(repairOrderId).subscribe(data => {
          if (data == null) {
            this.repairOrders.forEach((order) => {
              if (order.RepairId == repairOrderId) {
                order['CompletedDate'] = moment().utc().format('YYYY-MM-DDTHH:mm:ss') + 'Z';
                return order;
              }
            });
            this.loggerService.showSuccessfulMessage("Repair order successfully closed");
            this.listOngoingOrders();
          }
        }, error => {
          this.loggerService.showErrorMessage(error);
        });
      }
    });
  }

  //Load all orders or filter from previously fetch results
  getCompletedOrders() {
    if (!this.allOrders)
      this.getAllRepairOrders();
    else
      this.listCompletedOrders();
  }

  listOngoingOrders() {
    this.completedOrdersView = false;
    if (this.selectedWorkshop == 'All')
      this.filteredRepairOrders = this.repairOrders.filter(obj => obj.CompletedDate == null);
    else {
      let workshopDet = this.allWorkshops.find(x => x.Id == parseInt(this.selectedWorkshop));
      this.filteredRepairOrders = this.repairOrders.filter(obj => obj.CompletedDate == null && obj.WorkshopName == workshopDet["Name"]);
    }
  }

  listCompletedOrders() {
    this.completedOrdersView = true;
    if (this.selectedWorkshop == 'All')
      this.filteredRepairOrders = this.repairOrders.filter(obj => obj.CompletedDate != null);
    else {
      let workshopDet = this.allWorkshops.find(x => x.Id == parseInt(this.selectedWorkshop));
      this.filteredRepairOrders = this.repairOrders.filter(obj => obj.CompletedDate != null && obj.WorkshopName == workshopDet["Name"]);
    }
  }

  navigateToBikeDetails(bikeId) {
    this.router.navigateByUrl('bikes/' + bikeId + '/details');
  }

  updateAddress(data) {
    let index = this.filteredRepairOrders.findIndex(i => i.RepairId == data.Id);
    if (index >= 0) {
      this.filteredRepairOrders[index].Address = data.Address;
    }
  }

  getAllWorkshops() {
    this.workshopService.GetAllWorkshops().subscribe(res => {
      if (res) {
        this.allWorkshops = res;
        this.allWorkshops.unshift({ "Id": 'All', "Name": "COMMON.ALL" });
        this.selectedWorkshop = 'All';
      }
    });
  }

  filterRepairOrdersByWorkshop() {
    if (this.completedOrdersView)
      this.listCompletedOrders();
    else
      this.listOngoingOrders();
  }
}
