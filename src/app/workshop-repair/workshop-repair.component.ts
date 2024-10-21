import { Component, OnInit, ViewChild } from '@angular/core';
import { BikesService, LoggerService, InventoryService } from '../services';
import { MatDialogRef, MatDialogConfig, MatDialog } from '@angular/material/dialog';
import { ImagePopUpDialog, ImageDetails } from '../shared/Image-popup/image-popup.component';
import * as moment from 'moment';
import 'moment-timezone';
import { RepairService } from '../services/repair.service';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { WorkshopHistoryDetailsPopupComponent } from '../bikes/bike-work-history/workshop-history-details-popup/workshop-history-details-popup.component';
import { WorkshopService } from '../services/workshop.service';
import { TranslateService } from '@ngx-translate/core';
import { ConvertTimePipe } from '../core/pipes/convert-time.pipe';
import { forkJoin as observableForkJoin } from 'rxjs';

@Component({
  selector: 'app-workshop-repair',
  templateUrl: './workshop-repair.component.html',
  styleUrls: ['./workshop-repair.component.scss'],
  providers: [ConvertTimePipe]
})
export class WorkshopRepairComponent implements OnInit {

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
    { id: -1, name: 'COMMON.ALL' },
    { id: 1, name: 'COMMON.LAST_DAY' },
    { id: 2, name: 'COMMON.LAST_WEEK' },
    { id: 3, name: 'COMMON.LAST_MONTH' },
    { id: 4, name: 'COMMON.LAST_YEAR' },
    { id: -2, name: 'COMMON.CUSTOM' }
  ];
  selectedDate = 1;
  repairPersonList = [];
  selectedPerson = 'All';
  bikePartList = [];
  selectedPart = 'All';
  filerDate;
  loadingIndicator: boolean = true;
  isCustomDateShown = false;

  selectedWorkshop = 'All';
  public readonly LAYOUT = {
    XS: 768,
    SM: 992,
    MD: 1200,
    LG: 1600,
    XL: 1920,
    XXL: 2560,
  };

  statusFilters = {
    All: -1,
    Ongoing: 0,
    Completed: 1
  };

  selectedStatus: number;

  public layout: number = this.LAYOUT.MD;

  workOrientedList: any[];
  otherWorkOrientedList: any[];
  partOrientedList: any[];
  otherPartList: any[];
  repairHistoryDatas: any[];
  currentDate;
  workshopList: any[];


  driveTrain: any[];
  light: any[];
  dockingComponents: any[];
  pedalArm: any[];
  seat: any[];
  cables: any[];
  mudguards: any[];
  handlebarComponents: any[];
  pcb: any[];
  brakeSystem: any[];
  wheels: any[];
  otherComponents: any[];
  totalHours: any = 0;
  remaingMinutes: any;
  customStartDate;
  customEndDate;
  customStartDateVal: string;
  customEndDateVal: string;
  repairStatus: any[];
  bikes: any;

  constructor(
    private bikeService: BikesService,
    private loggerService: LoggerService,
    private inventoryService: InventoryService,
    private repairService: RepairService,
    public dialog: MatDialog,
    public breakpointObserver: BreakpointObserver, private workshopService: WorkshopService,
    private translate: TranslateService,
    private convertTime: ConvertTimePipe) {
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      this.isMobile = true;
    }
    this.bikes = [];
    let allBike = { id: 'All', visualId: 'COMMON.ALL', serial: 'All' };
    this.bikeList.push(allBike);

    let anyPart = { id: 'All', name: 'All' };
    this.bikePartList.push(anyPart);

    this.filerDate = moment().utc().subtract(1, 'days').format('YYYY-MM-DDTHH:mm:ss');
    this.currentDate = moment().utc().format('YYYY-MM-DDTHH:mm:ss');
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
    // this.getAllBikes();
    this.getAllWorkshops();
    this.getAllWorkshopHistory(this.filerDate, this.currentDate);
    this.workOrientedList = [];
    this.otherWorkOrientedList = [];
    this.repairHistoryDatas = [];
    this.selectedStatus = this.statusFilters.Ongoing;
    this.loadRepairCategories();
    this.loadRepairStatus();
  }

  getAllWorkshopHistory(from: Date, to: Date): void {
    observableForkJoin([this.repairService.getAllWorkshopHistory(from, to), this.bikeService.getBikes()])
      .subscribe(
        data => {
          this.bikes = data[1];
          this.arrangeBikeDropDownList(this.bikes);
          let historyData = data[0];
          historyData.map(x => this.mapHistoryData(x));
          this.repairHistory = historyData;
          this.allRepairHistory = historyData;
          this.listOngoingRepairs();
          this.mapTotalDurationSpent(this.repairHistory);
          this.loadingIndicator = false;

        }, error => {
          this.loadingIndicator = false;
          this.loggerService.showErrorMessage(error);
        });
  }

  loadRepairCategories() {
    this.repairService.GetAllWorkshopCategories().subscribe(data => {
      this.driveTrain = data.driveTrain;
      this.light = data.light;
      this.dockingComponents = data.dockingComponents;
      this.pedalArm = data.pedalArm;
      this.seat = data.seat;
      this.cables = data.cables;
      this.mudguards = data.mudguards;
      this.handlebarComponents = data.handlebarComponents;
      this.pcb = data.pcb;
      this.brakeSystem = data.brakeSystem;
      this.wheels = data.wheels;
      this.otherComponents = data.otherComponents;
      this.translateAllWorkshopRepairCategories();
    }, error => {
      this.loggerService.showErrorMessage(error);
    });
  }

  translateAllWorkshopRepairCategories() {
    this.driveTrain.map(x => this.translateWorkshopRepairCategories(x));
    this.light.map(x => this.translateWorkshopRepairCategories(x));
    this.dockingComponents.map(x => this.translateWorkshopRepairCategories(x));
    this.pedalArm.map(x => this.translateWorkshopRepairCategories(x));
    this.seat.map(x => this.translateWorkshopRepairCategories(x));
    this.cables.map(x => this.translateWorkshopRepairCategories(x));
    this.mudguards.map(x => this.translateWorkshopRepairCategories(x));
    this.handlebarComponents.map(x => this.translateWorkshopRepairCategories(x));
    this.pcb.map(x => this.translateWorkshopRepairCategories(x));
    this.brakeSystem.map(x => this.translateWorkshopRepairCategories(x));
    this.wheels.map(x => this.translateWorkshopRepairCategories(x));
    this.otherComponents.map(x => this.translateWorkshopRepairCategories(x));
  }

  translateWorkshopRepairCategories(repairCat) {
    let tranlationLabel = "WORKSHOP_FORM." + repairCat.TranslationName;
    this.translate.get(tranlationLabel).subscribe(name => {
      repairCat.DisplayName = (name != tranlationLabel) ? name : repairCat.Name;
    });
  }

  mapHistoryData(data) {
    data["WorkshopName"] = (data.IsStreetTeam && !data["WorkshopName"]) ? "Kolumbus Team" : data["WorkshopName"];
    data["Status"] = (data.IsCompleted) ? "Completed" : "Ongoing";
  }

  arrangePartDetails() {
    this.repairHistory.forEach((repairHis) => {
      this.workOrientedList = [];
      this.otherWorkOrientedList = [];
      repairHis.WorkEventDetailsDTOs.forEach(workEvent => {
        this.partOrientedList = [];
        this.otherPartList = [];
        if (workEvent.Part.PartId > 0) {
          let partOrientedObj = {
            'RepairId': workEvent.RepairId,
            'PartId': workEvent.Part.PartId,
            'PartName': workEvent.Part.PartName,
            'PartDesc': this.transLabel((workEvent.IsNewPart) ? (workEvent.Variant.VariantId > 0) ? "WORKSHOP_HISTORY.DETAILS_BODY.NEW" : "WORKSHOP_HISTORY.DETAILS_BODY.NEW_PART" : "WORKSHOP_HISTORY.DETAILS_BODY.PRE_USED"),
            'VariantName': workEvent.Variant.VariantName,
            'VariantId': workEvent.Variant.VariantId,
            'HasWarranty': workEvent.HasWarranty,
            'RepairedBy': workEvent.RepairedBy,
            'RepairedAt': workEvent.RepairedAt,
            'WorkshopId': workEvent.WorkshopId,
            'WorkshopName': workEvent.WorkshopName,
            'RepairedAtLongFormatted': this.formatRepairedDate(workEvent.RepairedAt),
            'HoursSpent': workEvent.HoursSpent,
            'MinutesSpent': workEvent.MinutesSpent,
            'Comments': workEvent.Comments
          }
          this.partOrientedList.push(partOrientedObj);

          let isWorkExist = (workEvent.WorkCategory) ? this.workOrientedList.find(x => x.WorkCategoryType == workEvent.WorkCategory.WorkCategoryType) : null;
          if (isWorkExist) {
            isWorkExist["PartOrientedList"] = isWorkExist["PartOrientedList"].concat(this.partOrientedList);
          }
          else {
            let workTypeObj = {
              'WorkCategoryType': (workEvent.WorkCategory) ? workEvent.WorkCategory.WorkCategoryType : null,
              'PartOrientedList': this.partOrientedList,
              'WorkCategoryImageURL': (workEvent.WorkCategory) ? workEvent.WorkCategory.WorkCategoryImageURL : null,
              'WorkCategorySubType': (workEvent.WorkCategory) ? workEvent.WorkCategory.WorkCategorySubType : null,
              'WorkCategorySubTypeName': (workEvent.WorkCategory) ? workEvent.WorkCategory.WorkCategorySubTypeName : null,
              'SubTranslationName': (workEvent.WorkCategory) ? workEvent.WorkCategory.SubTranslationName : null,
            }
            this.workOrientedList.push(workTypeObj);
          }
        }
        else if (workEvent.Part.PartId == 0 && (repairHis.IsStreetTeam || (!repairHis.IsStreetTeam && workEvent.Reason.ReasonId != 18))) {
          let otherPartObj = {
            'RepairId': workEvent.RepairId,
            'WorkCategorySubType': (!repairHis.IsStreetTeam && workEvent.WorkCategory) ?
              workEvent.WorkCategory.WorkCategorySubType : (repairHis.IsStreetTeam && workEvent.Reason) ?
                workEvent.Reason.Description : null,
            'WorkCategorySubTypeName': (!repairHis.IsStreetTeam && workEvent.WorkCategory) ?
              workEvent.WorkCategory.WorkCategorySubTypeName : (repairHis.IsStreetTeam && workEvent.Reason) ?
                workEvent.Reason.Description : null,
            'SubTranslationName': (!repairHis.IsStreetTeam && workEvent.WorkCategory) ?
              workEvent.WorkCategory.SubTranslationName : (repairHis.IsStreetTeam && workEvent.Reason) ?
                workEvent.Reason.Description : null,
            'WorkshopId': workEvent.WorkshopId,
            'WorkshopName': workEvent.WorkshopName,
            'RepairedBy': workEvent.RepairedBy,
            'RepairedAt': workEvent.RepairedAt,
            'RepairedAtLongFormatted': this.formatRepairedDate(workEvent.RepairedAt),
            'HoursSpent': workEvent.HoursSpent,
            'MinutesSpent': workEvent.MinutesSpent,
            'Comments': workEvent.Comments
          }
          this.otherPartList.push(otherPartObj);

          let isWorkExist = (workEvent.WorkCategory) ? this.otherWorkOrientedList.find(x => x.WorkCategoryType == workEvent.WorkCategory.WorkCategoryType) : null;
          if (isWorkExist) {
            isWorkExist["OtherPartList"] = isWorkExist["OtherPartList"].concat(this.otherPartList);
          }
          else {
            let workTypeObj = {
              'WorkCategoryType': (workEvent.WorkCategory) ? workEvent.WorkCategory.WorkCategoryType : null,
              'OtherPartList': this.otherPartList,
              'WorkCategoryImageURL': (workEvent.WorkCategory) ? workEvent.WorkCategory.WorkCategoryImageURL : null
            }
            this.otherWorkOrientedList.push(workTypeObj);
          }
        }
      });

      let workshopId = 0;
      let bikeDetails = this.bikes.find(x => x.BikeId == repairHis.BikeId);
      if (bikeDetails)
        workshopId = bikeDetails["WorkshopId"];

      let bike = {
        "WorkshopId": workshopId,
        "AccumulateTotalDistance": repairHis.AccumulateTotalDistance
      };

      let repairHistoryData = {
        'workOrientedList': this.workOrientedList,
        'otherWorkOrientedList': this.otherWorkOrientedList,
        'dateStarted': repairHis.RepairStartedAt,
        'createdAt': repairHis.CreatedAt,
        'bikeId': repairHis.BikeId,
        'comments': repairHis.Comments,
        'createdBy': repairHis.CreatedBy,
        'createdUser': repairHis.CreatedUser,
        'hoursSpent': repairHis.HoursSpent,
        'minutesSpent': repairHis.MinutesSpent,
        'visualId': repairHis.VisualId,
        'workshopId': repairHis.WorkshopId,
        'workshopName': (!repairHis.IsStreetTeam) ? repairHis.WorkshopName : (repairHis.WorkshopId) ?
          repairHis.WorkshopName : "Kolumbus Team",
        'isStreetTeam': repairHis.IsStreetTeam,
        'isUpdated': repairHis.IsUpdated,
        'modifiedBy': repairHis.ModifiedBy,
        'modifiedUser': repairHis.ModifiedUser,
        'accumulateTotalDistance': repairHis.AccumulateTotalDistance,
        'bike': bike,
        'isCompleted': repairHis.IsCompleted
      }
      this.repairHistoryDatas.push(repairHistoryData);
    });
  }

  openHistoryDetails(row) {
    let historyData = this.repairHistoryDatas.filter(x => x.createdAt == row.CreatedAt)[0];
    const dialogRef = this.dialog.open(WorkshopHistoryDetailsPopupComponent, {
      width: '780px',
      height: '800px',
      data: {
        'historyData': historyData,
        'driveTrain': this.driveTrain,
        'light': this.light,
        'dockingComponents': this.dockingComponents,
        'pedalArm': this.pedalArm,
        'seat': this.seat,
        'cables': this.cables,
        'mudguards': this.mudguards,
        'handlebarComponents': this.handlebarComponents,
        'pcb': this.pcb,
        'brakeSystem': this.brakeSystem,
        'wheels': this.wheels,
        'otherComponents': this.otherComponents,
        'bike': historyData.bike,
        'bikeId': row.BikeId
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result != null) {
        this.ngOnInit();
      }
      this.clearWorkshopRepairCategories();
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
    this.repairPersonList = [];
    let anyPerson = { id: 'All', name: 'COMMON.ALL' };
    this.repairPersonList.push(anyPerson);
    let RepairPersonArray = [];
    repairPerson.forEach((person) => {
      let personData = [];
      personData['id'] = person.CreatedBy;
      personData['name'] = person.CreatedUser;
      RepairPersonArray.push(personData);
    });

    let sortedArray = RepairPersonArray.sort(function (a, b) {
      return a.name - b.name;
    });
    this.repairPersonList.push(...sortedArray);
  }

  getAllWorkshops() {
    this.workshopList = [];
    this.workshopService.GetAllWorkshops().subscribe(res => {
      if (res) {
        this.workshopList = res;
        let anyWorkshop = { Id: 'All', Name: 'COMMON.ALL' };
        let streetTeam = { Id: 'Kolumbus Team', Name: 'Kolumbus Team' };
        this.workshopList.unshift(streetTeam);
        this.workshopList.unshift(anyWorkshop);
      }
    });
  }

  toggleExpandRow(row) {
    this.table.rowDetail.toggleExpandRow(row);
  }

  onBikeChange(event) {
    this.onRepairFilterChange();
  }

  onDateChange(event) {
    let currentDayEndTimeStamp = moment().utc();
    this.currentDate = moment(currentDayEndTimeStamp).format('YYYY-MM-DDTHH:mm:ss');
    this.isCustomDateShown = false;
    this.customStartDate = "";
    this.customEndDate = "";
    this.customStartDateVal = "";
    this.customEndDateVal = "";
    this.repairHistory = "";
    this.loadingIndicator = true;

    if (this.selectedDate == -1) {
      this.filerDate = moment(currentDayEndTimeStamp).subtract(100, 'years').format('YYYY-MM-DDTHH:mm:ss');
    } else if (this.selectedDate == 1) {
      this.filerDate = moment(currentDayEndTimeStamp).subtract(1, 'days').format('YYYY-MM-DDTHH:mm:ss');
    } else if (this.selectedDate == 2) {
      this.filerDate = moment(currentDayEndTimeStamp).subtract(7, 'days').format('YYYY-MM-DDTHH:mm:ss');
    } else if (this.selectedDate == 3) {
      this.filerDate = moment(currentDayEndTimeStamp).subtract(1, 'months').format('YYYY-MM-DDTHH:mm:ss');
    } else if (this.selectedDate == 4) {
      this.filerDate = moment(currentDayEndTimeStamp).subtract(1, 'years').format('YYYY-MM-DDTHH:mm:ss');
    } else if (this.selectedDate == -2) {
      this.isCustomDateShown = true;
      this.loadingIndicator = false;
    }

    //reload and arrange data for predefined time ranges 
    if (this.selectedDate != -2) {
      this.reloadRepairHistoryWithFilters(this.filerDate, this.currentDate);
    }
  }

  onStartDatePicked(event) {
    if (event.value != null) {
      this.customStartDate = moment(event.value).format('YYYY-MM-DD');
      this.customStartDateVal = moment(event.value).startOf('day').format('YYYY-MM-DDTHH:mm:ss');

      if ((this.customStartDate != null && this.customStartDate != "") && (this.customEndDate != null && this.customEndDate != "")) {
        if (this.customStartDate > this.customEndDate) {
          this.loggerService.showErrorMessage('Invalid date range selected.From date should be smaller than To date.');
        }
      }
      this.filerDate = this.customStartDateVal;
    }
    //this.getAllWorkshopHistory(this.customStartDate, this.customEndDate);
  }

  onEndDatePicked(event) {
    if (event.value != null) {
      this.customEndDate = moment(event.value).format('YYYY-MM-DD');
      this.customEndDateVal = moment(event.value).endOf('day').format('YYYY-MM-DDTHH:mm:ss');

      if ((this.customStartDate != null && this.customStartDate != "") && (this.customEndDate != null && this.customEndDate != "")) {
        if (this.customStartDate > this.customEndDate) {
          this.loggerService.showErrorMessage('Invalid date range selected.From date should be greater than To date.');
        }
      }
      this.currentDate = this.customEndDateVal;
    }
  }

  onCustomDateSearchClicked() {
    this.loadingIndicator = true;
    this.reloadRepairHistoryWithFilters(this.customStartDateVal, this.customEndDateVal);
  }

  reloadRepairHistoryWithFilters(from: any, to: any) {
    this.repairService.getAllWorkshopHistory(from, to)
      .subscribe(data => {
        data.map(x => this.mapHistoryData(x));
        this.repairHistory = data;
        this.allRepairHistory = data;
        this.onRepairStatusChange();
        this.mapTotalDurationSpent(this.repairHistory);
        let repaires = data.filter((v, i, a) => a.findIndex((t) => (t.CreatedBy === v.CreatedBy)) === i);
        this.arrangeRepairPersonDropDown(repaires);
        this.arrangePartDetails();

        this.loadingIndicator = false;

      }, error => {
        this.loadingIndicator = false;
        this.loggerService.showErrorMessage(error);
      });
  }

  onRepairPersonChange(event) {
    this.onRepairFilterChange();
  }

  onWorkshopChange(event) {
    this.onRepairFilterChange();
  }

  clearWorkshopRepairCategories() {
    this.driveTrain.map(x => this.resetWorkshopRepairCategories(x));
    this.light.map(x => this.resetWorkshopRepairCategories(x));
    this.dockingComponents.map(x => this.resetWorkshopRepairCategories(x));
    this.pedalArm.map(x => this.resetWorkshopRepairCategories(x));
    this.seat.map(x => this.resetWorkshopRepairCategories(x));
    this.cables.map(x => this.resetWorkshopRepairCategories(x));
    this.mudguards.map(x => this.resetWorkshopRepairCategories(x));
    this.handlebarComponents.map(x => this.resetWorkshopRepairCategories(x));
    this.pcb.map(x => this.resetWorkshopRepairCategories(x));
    this.brakeSystem.map(x => this.resetWorkshopRepairCategories(x));
    this.wheels.map(x => this.resetWorkshopRepairCategories(x));
    this.otherComponents.map(x => this.resetWorkshopRepairCategories(x));
  }

  resetWorkshopRepairCategories(data) {
    data.Result = false;
    data.selectedVariant = null
    return;
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
      } else if (val[filters[1][0]] >= filters[1][1][0] && val[filters[1][0]] <= filters[1][1][1]) {
        return true;
      } else {
        return false;
      }
    });

    let filterBikeDatesPerson = filterBikeDates.filter(val => {
      if (filters[2][1] == "All") {
        return true;
      } else if (val['CreatedBy'] != filters[2][1]) {
        return false;
      } else {
        return true;
      }
    });

    let filterAll = filterBikeDatesPerson.filter(val => {
      if (filters[3][1] == "All") {
        return true;
      } else if (filters[3][1] == "Kolumbus Team" && val["IsStreetTeam"] == true) {
        return true;
      } else if (val[filters[3][0]] != filters[3][1]) {
        return false;
      }
      else {
        return true;
      }
    });
    this.mapTotalDurationSpent(filterAll);
    return filterAll;
  }

  transLabel(label) {
    let result = "";
    this.translate.get(label).subscribe(name => {
      result = name;
    });
    return result;
  }

  loadRepairStatus() {
    this.repairStatus = [];
    this.repairStatus.push({ "id": this.statusFilters.All, name: "COMMON.ALL" });
    this.repairStatus.push({ "id": this.statusFilters.Ongoing, name: "COMMON.ONGOING" });
    this.repairStatus.push({ "id": this.statusFilters.Completed, name: "COMMON.COMPLETED" });
  }

  listOngoingRepairs() {
    this.filterOngoingRepairs();
    let repaires = this.repairHistory.filter((v, i, a) => a.findIndex((t) => (t.CreatedBy === v.CreatedBy)) === i);
    this.arrangeRepairPersonDropDown(repaires);
    this.arrangePartDetails();
  }

  listCompletedRepairs() {
    this.filterCompletedRepairs();
    let repaires = this.repairHistory.filter((v, i, a) => a.findIndex((t) => (t.CreatedBy === v.CreatedBy)) === i);
    this.arrangeRepairPersonDropDown(repaires);
    this.arrangePartDetails();
  }

  listAllRepairs() {
    this.filterAllRepairs();
    let repaires = this.repairHistory.filter((v, i, a) => a.findIndex((t) => (t.CreatedBy === v.CreatedBy)) === i);
    this.arrangeRepairPersonDropDown(repaires);
    this.arrangePartDetails();
  }

  mapTotalDurationSpent(repairHistory) {
    var totalMinutes = repairHistory.reduce((sum, item) => sum + item.MinutesSpent, 0);
    var extraHours = Math.floor(totalMinutes / 60);

    this.totalHours = (repairHistory.reduce((sum, item) => sum + item.HoursSpent, 0)) + extraHours;
    this.remaingMinutes = Math.floor(totalMinutes % 60);
  }

  filterOngoingRepairs() {
    let activeRepairs = this.allRepairHistory.filter(x => !x.IsCompleted);
    this.repairHistory = this.filterItems(activeRepairs,
      [['VisualId', this.selectedBike], ['CreatedAt', [this.filerDate, this.currentDate]], ['UserId', this.selectedPerson], ['WorkshopId', this.selectedWorkshop]]);
  }

  filterCompletedRepairs() {
    let completedRepairs = this.allRepairHistory.filter(x => x.IsCompleted);
    this.repairHistory = this.filterItems(completedRepairs,
      [['VisualId', this.selectedBike], ['CreatedAt', [this.filerDate, this.currentDate]], ['UserId', this.selectedPerson], ['WorkshopId', this.selectedWorkshop]]);
  }

  filterAllRepairs() {
    this.repairHistory = this.filterItems(this.allRepairHistory,
      [['VisualId', this.selectedBike], ['CreatedAt', [this.filerDate, this.currentDate]], ['UserId', this.selectedPerson], ['WorkshopId', this.selectedWorkshop]]);
  }

  onRepairStatusChange() {
    if (this.selectedStatus == this.statusFilters.Ongoing)
      this.listOngoingRepairs();
    else if (this.selectedStatus == this.statusFilters.Completed)
      this.listCompletedRepairs();
    else if (this.selectedStatus == this.statusFilters.All)
      this.listAllRepairs();
  }

  onRepairFilterChange() {
    if (this.selectedStatus == this.statusFilters.Ongoing)
      this.filterOngoingRepairs();
    else if (this.selectedStatus == this.statusFilters.Completed)
      this.filterCompletedRepairs();
    else if (this.selectedStatus == this.statusFilters.All)
      this.filterAllRepairs();
  }

  formatRepairedDate(repairedDate: any) {
    let formattedDate: string;
    repairedDate = this.convertTime.transform(repairedDate);
    let reportedDate = moment(repairedDate);
    let now = moment(this.convertTime.transform(moment().utc().format()));
    let diff = now.diff(reportedDate);

    let startOfToday = moment().utc().startOf('day');
    let startOfYesterday = moment().utc().subtract(1, 'day').startOf('day');
    let durationInDays = moment.duration(diff).asDays();
    
    if (durationInDays < 8) {
      if (reportedDate.isSameOrAfter(startOfToday,'day')) {
        formattedDate = `Today ${moment(repairedDate).format("HH:mm")}`;
      } else if (reportedDate.isSameOrAfter(startOfYesterday,'day') && reportedDate.isBefore(startOfToday)) {
        formattedDate = `Yesterday ${moment(repairedDate).format("HH:mm")}`;
      } else 
        formattedDate = `Last ${moment(repairedDate).format("dddd HH:mm")}`;
    }
    else
      formattedDate = moment(repairedDate).format("MMM Do HH:mm");
    return formattedDate;
  }
}
