import { WorkshopService } from './../services/workshop.service';
import { RepairService } from './../services/repair.service';
import { Component, OnInit, ViewChild } from '@angular/core';
import { LoggerService, InventoryService, AuthService } from '../services';
import { MatDialogRef, MatDialogConfig, MatDialog } from '@angular/material/dialog';
import { CreateVariantComponent } from './create-variant/create-variant.component';
import { ImagePopUpDialog, ImageDetails } from '../shared/Image-popup/image-popup.component';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { ScreenLayouts } from '../core/constants/screen-layouts';
import { TranslateService } from '@ngx-translate/core';
import { PartRepairInventoryComponent } from './part-repair-inventory/part-repair-inventory.component';
import { FormControl } from '@angular/forms';
import { ReplaySubject, Subject } from 'rxjs-compat';
import { take, takeUntil } from 'rxjs/operators';
import { LocalStorageKeys } from '../core/constants';
import { UserService } from '../services/users.service';
import { UserPrivileges } from '../core/enums/userPrivileges';
import { UserRoles } from '../core/constants/user-roles';


@Component({
  selector: 'app-inventory',
  templateUrl: './inventory.component.html',
  styleUrls: ['./inventory.component.scss']
})
export class InventoryComponent implements OnInit {
  @ViewChild('inventryTable', { static: false }) table: any;
  bikeDetails: any;
  isMobile: boolean = false;
  invDialogRef: MatDialogRef<ImagePopUpDialog>;
  parts: ImageDetails = null;
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
  types = {
    Create: 'Create',
    Update: 'Update'
  };
  loadingIndicator: boolean = false;

  public readonly LAYOUT = ScreenLayouts;
  public layout: number = this.LAYOUT.MD;
  allWorkshops: any[];
  selectedWorkshop: number;
  allworkshopPartDetails: any;

  protected partsList: any[];

  public partCtrl: FormControl = new FormControl();
  public partFilterCtrl: FormControl = new FormControl();
  public filteredParts: ReplaySubject<any[]> = new ReplaySubject<any[]>(1);

  /** Subject that emits when the component has been destroyed. */
  protected _onDestroy = new Subject<void>();
  partIds: any;
  allInventoryDetails: any[] = [];
  readonly partAccessConst = 'INVENTORY.PARTS';
  isAdminOrMaintenance: any = false;

  constructor(
    private loggerService: LoggerService,
    private inventoryService: InventoryService,
    private repairService: RepairService,
    private dialog: MatDialog,
    public breakpointObserver: BreakpointObserver,
    private translate: TranslateService,
    private workshopService: WorkshopService,
    public authService: AuthService,
    public userService: UserService
  ) {
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) && (document.documentElement.clientWidth < 768)) {
      this.isMobile = true;
    }
  }

  onResize() {
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) && (document.documentElement.clientWidth < 768)) {
      this.isMobile = true;
    } else {
      this.isMobile = false;
    }
  }

  ngOnDestroy() {
    this._onDestroy.next();
    this._onDestroy.complete();
  }

  openCreateUpdateVariantDialog(type: string, variant: any): void {
    const dialogRef = this.dialog.open(CreateVariantComponent, {
      width: '300px',
      data: { type: type, variant: variant }
    });

    dialogRef.afterClosed().subscribe(result => {
      this.ngOnInit();
    });
  }

  ngOnInit() {
    let loggedInUser = JSON.parse(localStorage.getItem(LocalStorageKeys.USER_DETAILS));
    let authToken = JSON.parse(localStorage.getItem(LocalStorageKeys.OAUTH_TOKEN));
    this.isAdminOrMaintenance = this.authService.isAdminOrManitanance();
    if (!this.isAdminOrMaintenance && loggedInUser && authToken && authToken._claims
      && authToken._claims[0] == UserRoles.STREET_TEAM)
      this.hasWorkshopPrivilegeUser(loggedInUser.UserId);

    this.manageScreenWidth();
    // this.getAllPartsAndVariants();
    this.getAllWorkshopsWithStreetTeam();
    this.selectedWorkshop = 1; // load Bike Garage default
    this.getAllPartVariantsByFilter(this.selectedWorkshop);
    this.loadAllParts();
    this.partFilterCtrl.valueChanges
      .pipe(takeUntil(this._onDestroy))
      .subscribe(() => {
        this.filterParts();
      });
    this.translate.onLangChange
      .pipe(takeUntil(this._onDestroy))
      .subscribe(() => {
      this.bikeDetails?.forEach(element => {
        element.TranslatedPartName = this.translate.instant(this.getInventoryPartMappingName(element.PartName));
      });
    });
  }

  protected filterParts() {
    if (!this.partsList) {
      return;
    }
    // get the search keyword
    let search = this.partFilterCtrl.value;
    if (!search) {
      this.filteredParts.next(this.partsList.slice());
      return;
    } else {
      search = search.toLowerCase();
    }
    // filter
    this.filteredParts.next(
      this.partsList.filter(part => part.Name.toLowerCase().indexOf(search) > -1)
    );
  }

  loadAllParts() {
    this.inventoryService.getAllPartDetails().subscribe(data => {
      this.partsList = data;
      // load the initial part list
      this.filteredParts.next(this.partsList.slice());
      //set selected part
      this.partCtrl.patchValue(this.partsList);
    }, error => {
      this.loggerService.showErrorMessage(error);
    });
  }

  filterByParts(opened: boolean) {
    if (!opened) {
      if (this.partCtrl.value != null) {
        this.partIds = [];
        this.partCtrl.value.forEach((part) => {
          this.partIds.push(part.PartId);
        });
      }
      if (this.partIds.length < 1) {
        let errorMsg = "";
        let actionLabel = "";
        this.translate.get("INVENTORY.ERROR_MSG").subscribe(name => {
          errorMsg = name;
        });
        let errorcategory = "COMMON.CLOSE";
        this.translate.get(errorcategory).subscribe(name => {
          actionLabel = name;
        });
        return this.loggerService.showErrorMessage(errorMsg, actionLabel, {
          duration: 3000
        });
      }
      else {
        this.getAllInventoriesByFilter();
      }
    }
  }

  toggleSelectAll(selectAllValue: boolean) {
    this.filteredParts.pipe(take(1), takeUntil(this._onDestroy))
      .subscribe(val => {
        if (selectAllValue) {
          this.partCtrl.patchValue(val, { emitEvent: false });
        } else {
          this.partCtrl.patchValue([], { emitEvent: false });
        }
      });
  }

  getAllInventoriesByFilter() {
    this.bikeDetails = [];
    this.partIds.forEach(partId => {
      let inventoryDetails = this.allInventoryDetails.filter(x => x.PartId == partId);
      if (this.bikeDetails.length == 0)
        this.bikeDetails = inventoryDetails;
      else {
        for (var item in inventoryDetails) {
          this.bikeDetails.push(inventoryDetails[item]);
        }
      }
      this.bikeDetails.forEach(element => {
        element.TranslatedPartName = this.translate.instant(this.getInventoryPartMappingName(element.PartName));
      });
    });
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

  getAllPartsAndVariants() {
    this.loadingIndicator = true;
    this.inventoryService.getAllPartsAndVariants().subscribe(data => {
      this.bikeDetails = data;
      this.allInventoryDetails = data;
      this.loadingIndicator = false;
    }, error => {
      this.loadingIndicator = false;
      this.loggerService.showErrorMessage('Getting parts and variants failed');
    });
  }

  getAllPartVariantsByFilter(workshopId) {
    this.loadingIndicator = true;
    this.inventoryService.getAllPartVariantsByFilter(workshopId).subscribe(data => {
      this.allworkshopPartDetails = data["AllWorkshopPartVariants"];
      this.bikeDetails = data["WorkshopPartVariants"];
      this.allInventoryDetails = data["WorkshopPartVariants"];
      this.loadingIndicator = false;
      this.filterByParts(false);
    }, error => {
      this.loadingIndicator = false;
      this.loggerService.showErrorMessage('Getting parts and variants failed');
    });
  }

  toggleExpandRow(row) {
    this.table.rowDetail.toggleExpandRow(row);
  }

  openPart(part: any) {
    let dialogInfo = {
      width: '500', height: '400'
    };
    this.invDialogRef = this.dialog.open(ImagePopUpDialog, dialogInfo);
    this.parts = {
      Name: part.PartName,
      Url: part.PartImageUrl,
      Description: part.PartDescription
    };
    this.invDialogRef.componentInstance.details = this.parts;
    this.invDialogRef.afterClosed().subscribe(result => {
      this.lastCloseResult = result;
      this.invDialogRef = null;
      this.parts = null;
    });
  }

  openVariant(variant: any) {
    let dialogInfo = {
      width: '500', height: '400'
    };
    this.invDialogRef = this.dialog.open(ImagePopUpDialog, dialogInfo);
    this.parts = {
      Name: variant.VariantName,
      Url: variant.VariantImageUrl,
      Description: variant.VariantDescription
    };
    this.invDialogRef.componentInstance.details = this.parts;
    this.invDialogRef.afterClosed().subscribe(result => {
      this.lastCloseResult = result;
      this.invDialogRef = null;
      this.parts = null;
    });
  }


  /**Start - Workshop related section */

  getAllWorkshopsWithStreetTeam() {
    this.allWorkshops = [];
    this.workshopService.getAllWorkshopsWithStreetTeam().subscribe(res => {
      if (res) {
        this.allWorkshops = res;
      }
    });
  }

  filterBasedOnWorkshop() {
    this.getAllPartVariantsByFilter(this.selectedWorkshop);
  }
  /**End - Workshop related section */

  openAllWorkshopPartDetails(variant: any): void {
    const dialogRef = this.dialog.open(PartRepairInventoryComponent, {
      width: '800px',
      minHeight: '450px',
      data: {
        variant: variant,
        allworkshopPartDetails: this.allworkshopPartDetails,
        allWorkshops: this.allWorkshops,
        selectedWorkshop: this.selectedWorkshop,
        isAdminOrMaintenance: this.isAdminOrMaintenance
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      this.getAllPartVariantsByFilter(this.selectedWorkshop);
    });
  }

  getInventoryPartMappingName(name: string): string {
    let partMappingName;
    switch (name) {
      case 'Battery-controller-ext.cable':
        partMappingName = `${this.partAccessConst}.BATTERY_CONTROLLER_EXT_CABLE`
        break;
      case 'Battery-PCB-ext.cable':
        partMappingName = `${this.partAccessConst}.BATTERY_PCB_EXT_CABLE`
        break;
      case 'Cable to battery ext.cable':
        partMappingName = `${this.partAccessConst}.CABLE_TO_BATTERY_EXT_CABLE`
        break;
      case 'Cable to controller (yellow)':
        partMappingName = `${this.partAccessConst}.CABLE_TO_CONTROLLER_YELLOW`
        break;
      case 'Cable to display (red)':
        partMappingName = `${this.partAccessConst}.CABLE_TO_DISPLAY_RED`
        break;
      case 'Cable to lock (black)':
        partMappingName = `${this.partAccessConst}.CABLE_TO_LOCK_BLACK`
        break;
      case 'Charging/dp-cable':
        partMappingName = `${this.partAccessConst}.CHARGING_DP_CABLE`
        break;
      default:
        partMappingName = `${this.partAccessConst}.${name.replace(/ /g, "_").toUpperCase()}`
        break;
    }
    return partMappingName;
  }

  hasWorkshopPrivilegeUser(userId: any) {
    this.userService.getUserPrivilegeByUser(userId).subscribe(res => {
      if (res) {
        let userPrivilege = res;
        if (userPrivilege.PrivilegeId == UserPrivileges.Workshop)
          this.isAdminOrMaintenance = true;
      }
    }, err => {

    });
  }

}
