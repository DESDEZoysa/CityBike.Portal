import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { UserRoles } from '../constants/user-roles';

@Injectable()
export class DefaultRouteGuard implements CanActivate {

    constructor(private router: Router, private auth: AuthService) { }

    public canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
        return this.validateUserRole();
    }

    validateUserRole() {
        if (this.auth.oAuthToken.isValid) {
            if (this.auth.oAuthToken._claims.includes(UserRoles.ADMIN) ||
                this.auth.oAuthToken._claims.includes(UserRoles.WORKSHOP) ||
                this.auth.oAuthToken._claims.includes(UserRoles.TICKET_INTEGRATOR) ||
                this.auth.oAuthToken._claims.includes(UserRoles.CUSTOMER_SERVICE) ||
                this.auth.oAuthToken._claims.includes(UserRoles.STREET_TEAM)) {
                //this.router.navigate(['/dockingStations']);
                window.location.href = "/bikes";
            } else if (this.auth.oAuthToken._claims.includes(UserRoles.CUSTOMER)) {
                //this.router.navigate(['/customer/dashboard']);
                window.location.href = "/customer/dashboard";
            }
        }
        this.auth.logout();
        //this.router.navigate(['/auth/signin']);
        window.location.href = "/auth/signin";
        return false;
    }


}