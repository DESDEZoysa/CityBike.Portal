import { Injectable } from '@angular/core';
import { Router, Route, CanActivate, CanLoad, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Injectable()
export class AuthenticatedGuard implements CanActivate, CanLoad {
  tempUrlPath: string;

  constructor(private router: Router, private auth: AuthService) {
  }

  validateURL(toURL: string) {
    if (!this.auth.oAuthToken.isValid) {
      this.auth.redirectURL = toURL || null;
      this.auth.logout();
      //this.router.navigate(['/auth/signin']);
      if (!this.tempUrlPath)
        window.location.href = `/auth/signin?redirect_uri=${toURL}`;
      else
        window.location.href = `/auth/signin`;

      return false;
    }
    else
      localStorage.removeItem("tempUrlPath");
    return true;
  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    return this.validateURL(state.url);
    // // not logged in so redirect to login page with the return url
    // this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    // return false;
  }

  canActivateChild(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    return this.canActivate(route, state);
  }

  canLoad(route: Route): boolean {
    localStorage.setItem("tempUrlPath", window.location.href);
    this.tempUrlPath = localStorage.getItem("tempUrlPath");
    this.tempUrlPath = localStorage.getItem("tempUrlPath");

    const url = `/${route.path}`;
    return this.validateURL(url);
  }
}
