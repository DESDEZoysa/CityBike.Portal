import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, LoggerService } from '../../services';
import { UserService } from '../../services/users.service';
import { AreasService } from '../../services/areas.service';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ReplaySubject, Subject } from 'rxjs';
import { Area } from '../../core/models/common/area';
import { MatSelect } from '@angular/material/select';
import { take, takeUntil } from 'rxjs/operators';
import { UserRole } from '../../core/enums/userRole';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';
import { LocalStorageKeys } from '../../core/constants';
import { UserRoles } from '../../core/constants/user-roles';
import { CarService } from '../../services/cars.service';

let FirstName = new FormControl('', Validators.required);
let LastName = new FormControl('', Validators.required);
let PhoneNumber = new FormControl('', Validators.required);
let CountryId = new FormControl('', Validators.required);
let RoleId = new FormControl('', Validators.required);
let PrivilegeId = new FormControl('', Validators.nullValidator);
let CarId = new FormControl('', Validators.nullValidator);

@Component({
  selector: 'app-users-edit',
  templateUrl: './user-edit.component.html',
  styleUrls: ['./user-edit.component.scss']
})
export class UserEditComponent implements OnInit, OnDestroy {
  @ViewChild('multiSelect', { static: false }) multiSelect: MatSelect;

  public form: FormGroup;
  countries;
  selectedCountry;
  userId: number;
  user: any;
  roles;
  selectedRole;
  isChanged: boolean = false;
  areaIds = [];
  userArea = [];
  checkAll: boolean = false;
  roleId;
  isActive: boolean;

  /**area Search related */
  protected areas: Area[]; //= AREAS
  public areaMultiCtrl: FormControl = new FormControl();
  public areaMultiFilterCtrl: FormControl = new FormControl();
  public filteredAreaMulti: ReplaySubject<Area[]> = new ReplaySubject<Area[]>(1);
  protected _onDestroy = new Subject<void>();
  privileges: any;
  selectedPrivilege: any;
  isStreetTeam: boolean;
  privilegeId: any;
  selectedCar: any;

  constructor(
    private router: Router,
    private fb: FormBuilder,
    private authService: AuthService,
    private dialog: MatDialog,
    private userService: UserService,
    private loggerService: LoggerService,
    private areaService: AreasService,
    private carService: CarService
  ) {
    this.userId = parseInt(this.router.url.split('/')[2]);
  }

  ngOnInit() {
    this.form = this.fb.group({
      Email: new FormControl(
        { value: null, disabled: true },
        Validators.compose([Validators.required, Validators.email])
      ),
      FirstName: FirstName,
      LastName: LastName,
      PhoneNumber: PhoneNumber,
      CountryId: CountryId,
      RoleId: RoleId,
      PrivilegeId: PrivilegeId,
      CarId: CarId
    });

    this.getCountries();
    this.getUserRoles();
    this.getUserPrivileges();
    this.getUserDetails();
    this.getUserPrivilegeByUser();
    this.getAreaList();
    this.enableEmailField();

    this.areaMultiFilterCtrl.valueChanges
      .pipe(takeUntil(this._onDestroy))
      .subscribe(() => {
        this.filterAreaMulti();
      });
  }

  enableEmailField() {
    var authToken = JSON.parse(localStorage.getItem(LocalStorageKeys.OAUTH_TOKEN));
    let userRole = authToken._claims[0];
    if (userRole == UserRoles.ADMIN)
      this.form.get('Email').enable();
  }

  filterAreaMulti() {
    if (!this.areas) {
      return;
    }
    // get the search keyword
    let search = this.areaMultiFilterCtrl.value;
    if (!search) {
      this.filteredAreaMulti.next(this.areas.slice());
      return;
    } else {
      search = search.toLowerCase();
    }
    // filter the banks
    this.filteredAreaMulti.next(
      this.areas.filter(area => area.Name.toLowerCase().indexOf(search) > -1)
    );
  }

  toggleSelectAll(selectAllValue: boolean) {
    this.filteredAreaMulti.pipe(take(1), takeUntil(this._onDestroy))
      .subscribe(val => {
        if (selectAllValue) {
          this.areaMultiCtrl.patchValue(val, { emitEvent: false });
        } else {
          this.areaMultiCtrl.patchValue([], { emitEvent: false });
        }
      });
  }

  getUserSelectedAreas() {
    this.userService.getUserAreaByUserId(this.userId)
      .subscribe((data) => {
        this.userArea = data;
        let selectedAreas = [];
        data.forEach((userArea) => {
          var in_array = this.areas.filter(function (item) {
            return item.AreaId == userArea.AreaId
          });
          var index = this.areas.indexOf(in_array[0]);
          if (index != -1) {
            selectedAreas.push(this.areas[index]);
          }
        });
        if (selectedAreas.length > 0) {
          this.areaMultiCtrl.patchValue(selectedAreas);
        }
        if (selectedAreas.length == this.areas.length) {
          this.checkAll = true;
        }
      }, (error: any) => {
        this.loggerService.showErrorMessage("Error getting user details.");
      });
  }

  getAreaList() {
    this.areaService.getAllAreas().subscribe(
      res => {
        res = res.sort(function (a, b) {
          if (a.Name < b.Name) { return -1; }
          if (a.Name > b.Name) { return 1; }
          return 0;
        });

        this.areas = res;
        this.filteredAreaMulti.next(this.areas.slice());
        this.getUserSelectedAreas();
      },
      error => {
        this.loggerService.showErrorMessage("Getting areas failed.");
      }
    );
  }

  getUserDetails() {
    this.userService.getUserById(this.userId).subscribe((data) => {
      if (data.Roles.length > 0) {
        this.roleId = data.Roles[0].RoleId;
        if (this.roleId == UserRole.StreetTeam)
          this.isStreetTeam = true;
      } else {
        this.roleId = "";
      }
      this.user = data
      //console.log(data)
      this.isActive = this.user.Active;

      this.form.get('FirstName').setValue(this.user.FirstName);
      this.form.get('LastName').setValue(this.user.LastName);
      this.form.get('CountryId').setValue(this.user.Country.CountryId);
      this.form.get('PhoneNumber').setValue(this.user.MobileNumber);
      this.form.get('Email').setValue(this.user.Email);
    }, (error: any) => {
      this.loggerService.showErrorMessage("Error getting user details.");
    });
  }

  getUserRoles() {
    this.userService.getUserRoles().subscribe(data => {
      this.roles = data;
    }, error => {
      this.loggerService.showErrorMessage("Error getting role details.");
    });
  }

  onRoleChange(event) {
    this.isStreetTeam = false;
    this.selectedRole = this.roles.find(x => x.RoleId == event.value);
    if (this.selectedRole.RoleId == UserRole.StreetTeam)
      this.isStreetTeam = true;
    this.isChanged = true;
  }

  onSubmitChanges() {
    if (this.areaMultiCtrl.value != null) {
      this.areaIds = [];
      this.areaMultiCtrl.value.forEach((areas) => {
        this.areaIds.push(areas.AreaId);
      });
    }

    if (typeof this.selectedRole === 'undefined') {
      this.selectedRole = this.user['Roles'][0];
    }

    var userPrevilage = (this.selectedPrivilege != null) ? { PrivilegeId: this.selectedPrivilege.PrivilegeId, UserId: this.userId } : null;
    var userCar = (this.selectedCar != null) ? { CarId: this.selectedCar.CarId, UserId: this.userId } : null;
    let userUpdateDto = {
      UserRole: {
        UserId: this.userId,
        RoleId: this.selectedRole.RoleId,
        AreaId: this.areaIds
      },
      AreaId: this.areaIds,
      UserId: this.userId,
      UserPrivilege: userPrevilage,
      UserCar: userCar,
      FirstName: this.form.value.FirstName,
      LastName: this.form.value.LastName,
      CountryId: this.form.value.CountryId,
      PhoneNumber: this.form.value.PhoneNumber,
      Email: this.form.value.Email
    };

    this.userService.updateUserBasicDetails(userUpdateDto).subscribe(data => {
      if (data.UserRole.UserRoleId > 0) {
        this.isChanged = false;
        // Update email address displayed top of the navigation menu after successful details update.
        this.user.Email = data.Email;
        this.loggerService.showSuccessfulMessage("User details changed successfully.");
      }
    }, error => {
      this.loggerService.showErrorMessage("Error getting user details.");
    });
  }

  ngOnDestroy() {
    this._onDestroy.next();
    this._onDestroy.complete();
  }

  getUserPrivileges() {
    this.userService.getUserPrivileges().subscribe(data => {
      this.privileges = data;
    }, error => {
      this.loggerService.showErrorMessage("Error getting privilege details.");
    });
  }

  getUserPrivilegeByUser() {
    this.userService.getUserPrivilegeByUser(this.userId).subscribe(data => {
      if (data) {
        this.privilegeId = data.PrivilegeId;
      }
    }, error => {
      this.loggerService.showErrorMessage("Error getting user privilege details.");
    });
  }

  onPrivilegeChanges(event) {
    this.selectedPrivilege = this.privileges.find(x => x.PrivilegeId == event.value);
    this.isChanged = true;
  }

  stateChangeConfirmation() {
    this.showConfirmationPopup();
  }

  showConfirmationPopup() {
    var dialogMsg = this.isActive ? "Are you sure want to activate this user?" : "Are you sure want to deactivate this user?";
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '350px',
      data: { message: dialogMsg }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.activateOrDeactivateUser(this.user.UserId, this.isActive);
      }
    });
  }

  activateOrDeactivateUser(userId: any, state: boolean) {
    this.userService.UserActivation(userId, state)
      .subscribe(data => {
        this.loggerService.showSuccessfulMessage("User account activation successfully changed");
      }, error => {
        this.loggerService.showErrorMessage("Error while chaning user activation");
      });
  }

  getCountries() {
    this.authService.geCountries().subscribe(data => {
      this.countries = data;
    }, error => {
      this.loggerService.showErrorMessage("Getting country details failed!");
    });
  }

  onCountryChange(event) {
    this.selectedCountry = this.countries.find(x => x.CountryId == event.value);
  }
}
