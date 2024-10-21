import { Injectable } from '@angular/core';
import { Router, Route, CanActivate, CanLoad, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Injectable()
export class AnonymousGuard implements CanActivate, CanLoad {

  constructor(private router: Router, private auth: AuthService) {
  }

  validate() {
    if (!this.auth.oAuthToken.isValid) { return true; }
    if (this.router.url === '/') {
      let redirectRoute: any = this.router.config.find((route: Route) => route.path === '' && route.pathMatch === 'full' && !!route.redirectTo);
      redirectRoute = redirectRoute ? redirectRoute.redirectTo : '';
      this.router.navigate([redirectRoute]);
    }
    return false;
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
