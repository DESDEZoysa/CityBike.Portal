import { Component, OnInit, Input, ViewChild } from '@angular/core';
import { Bike } from '../../core/models';
import { LoggerService, InventoryService } from '../../services';
import { MatDialogRef, MatDialogConfig, MatDialog } from '@angular/material/dialog';
import { ImageDetails, ImagePopUpDialog } from '../../shared/Image-popup/image-popup.component';
import { RepairService } from '../../services/repair.service';
import * as moment from 'moment';
import 'moment-timezone';
import { RepairHistory } from '../../core/models/repair/repairHistory';
import { ScreenLayouts } from '../../core/constants/screen-layouts';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';

@Component({
  selector: 'app-bike-repair-history',
  templateUrl: './bike-repair-history.component.html',
  styleUrls: ['./bike-repair-history.component.scss']
})
export class BikeRepairHistoryComponent implements OnInit {

  @ViewChild('repairTable', { static: true }) table: any;
  @Input() bike: Bike;
  repairHistory;
  allRepairHistory;
  isMobile: boolean = false;

  dialogRef: MatDialogRef<ImagePopUpDialog>;
  obsDetails: ImageDetails = null;
  lastCloseResult: string;
  config: MatDialogConfig = {
    disableClose: false,
    width: '55%',
    height: '65%',
    position: {
      top: '',
      bottom: '',
      left: '',
      right: ''
    }
  };
  filerDate;
  dateRanges = [
    { id: -1, name: 'All' },
    { id: 1, name: 'Last Week' },
    { id: 2, name: 'Last Month' },
    { id: 3, name: 'Last Year' },
    { id: -2, name: 'Custom' }
  ];
  bikePartList = [];
  repairPersonList = [];
  selectedDate = -1;
  selectedPart = 'All';
  selectedPerson = 'All';
  customStartDate;
  customEndDate
  isCustomDateShown = false;

  public readonly LAYOUT = ScreenLayouts;
  public layout: number = this.LAYOUT.MD;

  constructor(private loggerService: LoggerService, private repairService: RepairService, private inventoryService: InventoryService, public dialog: MatDialog,
    public breakpointObserver: BreakpointObserver) {
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      this.isMobile = true;
    }

    let anyPerson = { id: 'All', name: 'All' };
    this.repairPersonList.push(anyPerson);

    let anyPart = { id: 'All', name: 'All' };
    this.bikePartList.push(anyPart);

    this.filerDate = moment().subtract(100, 'years').format('YYYY-MM-DD');
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
  ngOnInit() {
    this.manageScreenWidth();
    this.getBikeHistory();
    this.getAllParts();
  }

  onResize() {
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      this.isMobile = true;
    } else {
      this.isMobile = false;
    }
  }

  getBikeHistory(): void {
    if (this.bike) {
      this.repairService.getBikeRepairHistory(this.bike.BikeId).subscribe(data => {
        this.repairHistory = data;
        this.allRepairHistory = data;

        let repaires = data.filter((v, i, a) => a.findIndex((t) => (t.RepairedBy.UserId === v.RepairedBy.UserId)) === i);
        this.arrangeRepairPersonDropDown(repaires);

      }, error => {
        this.loggerService.showErrorMessage(error);
      });
    }
  }

  getAllParts() {
    this.inventoryService.getAllBikeParts().subscribe(data => {
      this.arrangeBikePartDropDown(data);
    }, error => {
      this.loggerService.showErrorMessage("Getting parts failed!");
    });
  }

  arrangeBikePartDropDown(bikeParts) {
    let BikePartArray = [];
    bikeParts.forEach((bikePart) => {
      let partData = [];
      partData['id'] = bikePart['PartId'];
      partData['name'] = bikePart['Name'];
      BikePartArray.push(partData);
    });

    let sortedArray = BikePartArray.sort(function (a, b) {
      return a.name - b.name;
    });
    this.bikePartList.push(...sortedArray);
  }

  arrangeRepairPersonDropDown(repairPerson) {
    let RepairPersonArray = [];
    repairPerson.forEach((person) => {
      let personData = [];
      personData['id'] = person.RepairedBy['UserId'];
      personData['name'] = person.RepairedBy['FirstName'] + person.RepairedBy['LastName'];
      RepairPersonArray.push(personData);
    });

    let sortedArray = RepairPersonArray.sort(function (a, b) {
      return a.name - b.name;
    });
    this.repairPersonList.push(...sortedArray);
  }

  openPart(observation: any) {
    let dialogInfo = {
      width: '500', height: '400'
    };
    this.dialogRef = this.dialog.open(ImagePopUpDialog, dialogInfo);
    this.obsDetails = {
      Name: observation.PartName,
      Url: observation.PartImageUrl,
      Description: observation.PartDescription
    };
    this.dialogRef.componentInstance.details = this.obsDetails;
    this.dialogRef.afterClosed().subscribe(result => {
      this.lastCloseResult = result;
      this.dialogRef = null;
      this.obsDetails = null;
    });
  }

  openVariant(observation: any) {
    let dialogInfo = {
      width: '500', height: '400'
    };
    this.dialogRef = this.dialog.open(ImagePopUpDialog, dialogInfo);
    this.obsDetails = {
      Name: observation.VariantName,
      Url: observation.VariantImageUrl,
      Description: observation.VariantDescription
    };
    this.dialogRef.componentInstance.details = this.obsDetails;
    this.dialogRef.afterClosed().subscribe(result => {
      this.lastCloseResult = result;
      this.dialogRef = null;
      this.obsDetails = null;
    });
  }

  onDateChange(event) {
    this.isCustomDateShown = false;
    this.customStartDate = "";
    this.customEndDate = "";

    if (this.selectedDate == -1) {
      this.filerDate = moment().subtract(100, 'years').format('YYYY-MM-DD');
    } else if (this.selectedDate == -2) {
      this.isCustomDateShown = true;
    } else if (this.selectedDate == 1) {
      this.filerDate = moment().subtract(7, 'days').format('YYYY-MM-DD');
    } else if (this.selectedDate == 2) {
      this.filerDate = moment().subtract(1, 'months').format('YYYY-MM-DD');
    } else if (this.selectedDate == 3) {
      this.filerDate = moment().subtract(1, 'years').format('YYYY-MM-DD');
    }

    this.repairHistory = this.filterItems(this.allRepairHistory,
      [['RepairedAt', this.filerDate], ['UserId', this.selectedPerson], ['PartId', this.selectedPart]]);
  }

  onRepairPersonChange(event) {
    this.repairHistory = this.filterItems(this.allRepairHistory,
      [['RepairedAt', this.filerDate], ['UserId', this.selectedPerson], ['PartId', this.selectedPart]]);
  }

  onPartChange(event) {
    this.repairHistory = this.filterItems(this.allRepairHistory,
      [['RepairedAt', this.filerDate], ['UserId', this.selectedPerson], ['PartId', this.selectedPart]]);
  }

  onStartDatePicked(event) {
    if (event.value != null) {
      this.customStartDate = moment(event.value).format('YYYY-MM-DD');

      if ((this.customStartDate != null && this.customStartDate != "") && (this.customEndDate != null && this.customEndDate != "")) {
        if (this.customStartDate > this.customEndDate) {
          this.loggerService.showErrorMessage('Invalid date range selected.From date should be smaller than To date.');
        }
      }
    }

    this.repairHistory = this.filterItems(this.allRepairHistory,
      [['RepairedAt', [this.customStartDate, this.customEndDate]], ['UserId', this.selectedPerson], ['PartId', this.selectedPart]]);
  }

  onEndDatePicked(event) {
    if (event.value != null) {
      this.customEndDate = moment(event.value).format('YYYY-MM-DD');
      if ((this.customStartDate != null && this.customStartDate != "") && (this.customEndDate != null && this.customEndDate != "")) {
        if (this.customStartDate > this.customEndDate) {
          this.loggerService.showErrorMessage('Invalid date range selected.From date should be greater than To date.');
        }
      }
    }

    this.repairHistory = this.filterItems(this.allRepairHistory,
      [['RepairedAt', [this.customStartDate, this.customEndDate]], ['UserId', this.selectedPerson], ['PartId', this.selectedPart]]);
  }

  filterItems(array, filters) {
    let filterDates = array.filter(val => {
      if (filters[0][1] == -1) {
        return true;
      } else if (val[filters[0][0]].split('T')[0] >= filters[0][1][0] && val[filters[0][0]].split('T')[0] <= filters[0][1][1]) {
        return true;
      } else {
        return false;
      }
    });

    let filterDatesPerson = filterDates.filter(val => {
      if (filters[1][1] == "All") {
        return true;
      } else if (val['RepairedBy'][filters[1][0]] != filters[1][1]) {
        return false;
      } else {
        return true;
      }
    });

    let filterAll = filterDatesPerson.filter(val => {
      if (filters[2][1] == "All") {
        return true;
      } else if (val['Part'][filters[2][0]] != filters[2][1]) {
        return false;
      } else {
        return true;
      }
    });
    return filterAll;
  }

  toggleExpandRow(row) {
    this.table.rowDetail.toggleExpandRow(row);
  }

  completeRepair(repairId) {
    var repair = new RepairHistory();
    repair.RepairId = repairId;
    repair.IsCompleted = true;
    repair.CompletedAt = new Date().toISOString()

    this.repairService.completeRepairAction(repairId, repair).subscribe(res => {
      var completeRepair = this.repairHistory.find(a => a.RepairId == repairId);
      if (completeRepair) {
        completeRepair.IsCompleted = true;
      }
      this.repairHistory = [...this.repairHistory]
      this.loggerService.showSuccessfulMessage("Repair completed successfully");
    },
      error => {
        this.loggerService.showErrorMessage("Error,repair completed failed");
      })
  }
}
