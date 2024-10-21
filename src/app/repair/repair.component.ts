import { Component, OnInit, ViewChild } from '@angular/core';
import { BikesService, LoggerService, InventoryService } from '../services';
import { MatDialogRef, MatDialogConfig, MatDialog } from '@angular/material/dialog';
import { ImagePopUpDialog, ImageDetails } from '../shared/Image-popup/image-popup.component';
import * as moment from 'moment';
import 'moment-timezone';
import { RepairService } from '../services/repair.service';
import { RepairHistory } from '../core/models/repair/repairHistory';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';

@Component({
  selector: 'app-repair',
  templateUrl: './repair.component.html',
  styleUrls: ['./repair.component.scss']
})
export class RepairComponent implements OnInit {
  @ViewChild('repairTable', { static: true }) table: any;

  repairHistory: any;
  allRepairHistory: any;
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
  bikeList = [];
  selectedBike = 'All';
  dateRanges = [
    { id: -1, name: 'All' },
    { id: 1, name: 'Last Week' },
    { id: 2, name: 'Last Month' },
    { id: 3, name: 'Last Year' },
  ];
  selectedDate = -1;
  repairPersonList = [];
  selectedPerson = 'All';
  bikePartList = [];
  selectedPart = 'All';
  filerDate;
  loadingIndicator: boolean = true;

  public readonly LAYOUT = {
    XS: 768,
    SM: 992,
    MD: 1200,
    LG: 1600,
    XL: 1920,
    XXL: 2560,
  };

  public layout: number = this.LAYOUT.MD;

  constructor(
    private bikeService: BikesService,
    private loggerService: LoggerService,
    private inventoryService: InventoryService,
    private repairService: RepairService,
    public dialog: MatDialog,
    public breakpointObserver: BreakpointObserver) {
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      this.isMobile = true;
    }

    let allBike = { id: 'All', visualId: 'All', serial: 'All' };
    this.bikeList.push(allBike);

    let anyPerson = { id: 'All', name: 'All' };
    this.repairPersonList.push(anyPerson);

    let anyPart = { id: 'All', name: 'All' };
    this.bikePartList.push(anyPart);

    this.filerDate = moment().subtract(100, 'years').format('YYYY-MM-DD');
  }

  onResize() {
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      this.isMobile = true;
    } else {
      this.isMobile = false;
    }
  }

  ngOnInit() {
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
    this.getAllBikeHistory();
    this.getAllBikes();
    this.getAllParts();
  }

  getAllBikeHistory(): void {
    this.loadingIndicator = true;
    this.repairService.getAllBikeRepairHistory().subscribe(data => {
      this.allRepairHistory = data;
      this.repairHistory = data;
      let repaires = data.filter((v, i, a) => a.findIndex((t) => (t.RepairedBy.UserId === v.RepairedBy.UserId)) === i);
      this.arrangeRepairPersonDropDown(repaires);
      this.loadingIndicator = false;
    }, error => {
      this.loadingIndicator = false;
      this.loggerService.showErrorMessage(error);
    });
  }

  getAllBikes() {
    this.bikeService.getBikes().subscribe(data => {
      this.arrangeBikeDropDownList(data);
    }, error => {
      this.loggerService.showErrorMessage(error);
    });
  }

  getAllParts() {
    this.inventoryService.getAllBikeParts().subscribe(data => {
      this.arrangeBikePartDropDown(data);
    }, error => {
      this.loggerService.showErrorMessage("Getting parts failed!");
    });
  }

  arrangeBikeDropDownList(bikes) {
    let bikeDropDownArray = [];
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

  toggleExpandRow(row) {
    this.table.rowDetail.toggleExpandRow(row);
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

  onBikeChange(event) {
    this.repairHistory = this.filterItems(this.allRepairHistory,
      [['VisualId', this.selectedBike], ['RepairedAt', this.filerDate], ['UserId', this.selectedPerson], ['PartId', this.selectedPart]]);
  }

  onDateChange(event) {
    if (this.selectedDate == -1) {
      this.filerDate = moment().subtract(100, 'years').format('YYYY-MM-DD');
    } else if (this.selectedDate == 1) {
      this.filerDate = moment().subtract(7, 'days').format('YYYY-MM-DD');
    } else if (this.selectedDate == 2) {
      this.filerDate = moment().subtract(1, 'months').format('YYYY-MM-DD');
    } else if (this.selectedDate == 3) {
      this.filerDate = moment().subtract(1, 'years').format('YYYY-MM-DD');
    }

    this.repairHistory = this.filterItems(this.allRepairHistory,
      [['VisualId', this.selectedBike], ['RepairedAt', this.filerDate], ['UserId', this.selectedPerson], ['PartId', this.selectedPart]]);
  }

  onRepairPersonChange(event) {
    this.repairHistory = this.filterItems(this.allRepairHistory,
      [['VisualId', this.selectedBike], ['RepairedAt', this.filerDate], ['UserId', this.selectedPerson], ['PartId', this.selectedPart]]);
  }

  onPartChange(event) {
    this.repairHistory = this.filterItems(this.allRepairHistory,
      [['VisualId', this.selectedBike], ['RepairedAt', this.filerDate], ['UserId', this.selectedPerson], ['PartId', this.selectedPart]]);
  }

  filterItems(array, filters) {
    let filterBikes = array.filter(val => {
      if (filters[0][1] == "All") {
        return true;
      } else if (val[filters[0][0]] != filters[0][1]) {
        return false;
      } else {
        return true;
      }
    });

    let filterBikeDates = filterBikes.filter(val => {
      if (filters[1][1] == -1) {
        return true;
      } else if (val[filters[1][0]].split('T')[0] < filters[1][1]) {
        return false;
      } else {
        return true;
      }
    });

    let filterBikeDatesPerson = filterBikeDates.filter(val => {
      if (filters[2][1] == "All") {
        return true;
      } else if (val['RepairedBy'][filters[2][0]] != filters[2][1]) {
        return false;
      } else {
        return true;
      }
    });

    let filterAll = filterBikeDatesPerson.filter(val => {
      if (filters[3][1] == "All") {
        return true;
      } else if (val['Part'][filters[3][0]] != filters[3][1]) {
        return false;
      } else {
        return true;
      }
    });
    return filterAll;
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
      this.repairHistory = [...this.repairHistory];
      this.loggerService.showSuccessfulMessage("Repair completed successfully");
    }, error => {
      this.loggerService.showErrorMessage("Error,repair completed failed");
    });


  }

}



