import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { AppSettings, AuthService, LoggerService } from '../../services';
import { UserService } from '../../services/users.service';
import { Area } from '../../core/models/common/area';
import { ReplaySubject, Subject } from 'rxjs-compat';
import { take, takeUntil } from 'rxjs/operators';
import { AreasService } from '../../services/areas.service';
import { UserRole } from '../../core/enums/userRole';

let FirstName = new FormControl('', Validators.required);
let LastName = new FormControl('', Validators.required);
let PhoneNumber = new FormControl('', Validators.required);
let CountryId = new FormControl('', Validators.required);
let RoleId = new FormControl('', Validators.required);
let PrivilegeId = new FormControl('', Validators.nullValidator);

@Component({
  selector: 'app-add-user',
  templateUrl: './add-user.component.html',
  styleUrls: ['./add-user.component.scss']
})
export class AddUserComponent implements OnInit {

  public form: FormGroup;
  countries;
  countryCode;
  selectedCountry;
  resourceURL;
  logoTitle: string;
  roles;
  selectedRole;
  roleId;
  isChanged: boolean = false;
  checkAll: boolean = false;
  areaIds = [];

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

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private loggerService: LoggerService,
    private userService: UserService,
    private areaService: AreasService,
    private appSettings: AppSettings
  ) { }

  ngOnInit() {
    this.form = this.fb.group({
      Email: [null, Validators.compose([Validators.required, Validators.email])],
      FirstName: FirstName,
      LastName: LastName,
      PhoneNumber: PhoneNumber,
      CountryId: CountryId,
      RoleId: RoleId,
      PrivilegeId: PrivilegeId
    });

    this.logoTitle = this.appSettings.logoTitle;
    this.getCountries();
    this.getUserRoles();
    this.getAreaList();
    this.getUserPrivileges();

    this.areaMultiFilterCtrl.valueChanges
      .pipe(takeUntil(this._onDestroy))
      .subscribe(() => {
        this.filterAreaMulti();
      });
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
      },
      error => {
        this.loggerService.showErrorMessage("Getting areas failed.");
      }
    );
  }

  onSubmit() {
    let user = {};
    Object.assign(user, this.form.value);
    user['UserId'] = 0; //Defauls UserId Added

    if (this.areaMultiCtrl.value != null) {
      this.areaIds = [];
      this.areaMultiCtrl.value.forEach((areas) => {
        this.areaIds.push(areas.AreaId);
      });
    }
    user['AreaId'] = this.areaIds;
    this.InviteUser(user);
  }

  private InviteUser(user: any) {
    this.userService.InviteUser(user).subscribe((response) => {
      if (response != null) {
        this.form.reset() // Clear form fields
        this.loggerService.showSuccessfulMessage("Invitation sent to the user email");
        this.router.navigate(['/users']);
      }
    },
      (error: any) => {
        if (typeof error.error === 'object') {
          this.loggerService.showErrorMessage(error.error.PhoneNumber[0]);
        } else {
          this.loggerService.showErrorMessage(error.error.replace('_UNIQUE', ''));
        }
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
    this.countryCode = this.selectedCountry.Code;
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

  getUserPrivileges() {
    this.userService.getUserPrivileges().subscribe(data => {
      this.privileges = data;
    }, error => {
      this.loggerService.showErrorMessage("Error getting privilege details.");
    });
  }

  onPrivilegeChanges(event) {
    this.selectedPrivilege = this.privileges.find(x => x.PrivilegeId == event.value);
    this.isChanged = true;
  }
}
