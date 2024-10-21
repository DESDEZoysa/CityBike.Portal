import { Injectable } from '@angular/core';
import { Router, Route, CanActivate, CanLoad, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { LocalStorageKeys } from '../constants';

@Injectable()
export class DashboardGuard implements CanActivate, CanLoad {

  constructor(private router: Router, private auth: AuthService) {
  }

  validate() {
    if (!this.auth.oAuthToken.isValid) { return true; }
    var isExist = window.location.href.includes("token=");
    var dashboard_token = localStorage.getItem(LocalStorageKeys.DASHBOARD_TOKEN);
    if (!isExist && dashboard_token) {
      this.auth.logout();
      window.location.href = `/auth/signin`;
      return false;
    }

    return true;
  }
  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    return this.validate();
  }

  canActivateChild(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    return this.canActivate(route, state);
  }

  canLoad(route: Route): boolean {
    return this.validate();
  }

}
