import { Injectable } from '@angular/core';
import { Router, Route, CanActivate, CanLoad, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { UserRoles } from '../constants/user-roles';

@Injectable()
export class StreetTeamGuard implements CanActivate {

    constructor(private router: Router, private auth: AuthService) { }

    public canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
        return this.validateUserRole();
    }

    validateUserRole() {
        if (this.auth.oAuthToken.isValid) {
            if (this.auth.oAuthToken._claims.includes(UserRoles.STREET_TEAM)) {
                return true;
            } else {
                this.router.navigate(['/errors/forbidden']);
                return false;
            }
        }
        return false;
    }
}