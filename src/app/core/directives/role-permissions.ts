import { Directive, Input, TemplateRef, ViewContainerRef } from '@angular/core';
import { UserRoles } from '../constants/user-roles';
import { AuthService } from '../../services/auth.service';

@Directive({
    selector: '[ifRole]'
})
export class IfRoleDirective {
    @Input("ifRole") roleName: string;

    constructor(private templateRef: TemplateRef<any>,
        private viewContainer: ViewContainerRef,
        private authService: AuthService) {
    }

    ngOnInit() {
        //Admin only 
        if (this.authService.oAuthToken._claims) {
            if (this.authService.oAuthToken._claims.includes(UserRoles.ADMIN) && (this.roleName == (UserRoles.ADMIN))) {
                this.viewContainer.createEmbeddedView(this.templateRef);
            }
            //Support only
            else if (this.authService.oAuthToken._claims.includes(UserRoles.CUSTOMER_SERVICE) && (this.roleName == (UserRoles.CUSTOMER_SERVICE))) {
                this.viewContainer.createEmbeddedView(this.templateRef);
            }
            //Service only
            else if (this.authService.oAuthToken._claims.includes(UserRoles.STREET_TEAM) && (this.roleName == (UserRoles.STREET_TEAM))) {
                this.viewContainer.createEmbeddedView(this.templateRef);
            }
            // Maintenance only
            else if (this.authService.oAuthToken._claims.includes(UserRoles.WORKSHOP) && (this.roleName == (UserRoles.WORKSHOP))) {
                this.viewContainer.createEmbeddedView(this.templateRef);

            }
            //Both Admin and maintenance
            else if ((this.authService.oAuthToken._claims.includes(UserRoles.ADMIN) && this.roleName == UserRoles.ADMIN + "," + UserRoles.WORKSHOP) ||
                (this.authService.oAuthToken._claims.includes(UserRoles.WORKSHOP) && this.roleName == UserRoles.ADMIN + "," + UserRoles.WORKSHOP)) {
                this.viewContainer.createEmbeddedView(this.templateRef);

            }
            //Both Admin and maintenance and support
            else if ((this.authService.oAuthToken._claims.includes(UserRoles.ADMIN) && this.roleName == UserRoles.ADMIN + "," + UserRoles.WORKSHOP +  "," + UserRoles.CUSTOMER_SERVICE) ||
                (this.authService.oAuthToken._claims.includes(UserRoles.WORKSHOP) && this.roleName == UserRoles.ADMIN + "," + UserRoles.WORKSHOP +  "," + UserRoles.CUSTOMER_SERVICE) || 
                (this.authService.oAuthToken._claims.includes(UserRoles.CUSTOMER_SERVICE) && this.roleName == UserRoles.ADMIN + "," + UserRoles.WORKSHOP +  "," + UserRoles.CUSTOMER_SERVICE)) {
                this.viewContainer.createEmbeddedView(this.templateRef);

            }
            //Both Admin and support
            else if ((this.authService.oAuthToken._claims.includes(UserRoles.ADMIN) && this.roleName == UserRoles.ADMIN + "," + UserRoles.CUSTOMER_SERVICE) ||
                (this.authService.oAuthToken._claims.includes(UserRoles.CUSTOMER_SERVICE) && this.roleName == UserRoles.ADMIN + "," + UserRoles.CUSTOMER_SERVICE)) {
                this.viewContainer.createEmbeddedView(this.templateRef);

            }
            // Both Admin and maintenance and service
            else if ((this.authService.oAuthToken._claims.includes(UserRoles.ADMIN) && this.roleName == UserRoles.ADMIN + "," + UserRoles.WORKSHOP + "," + UserRoles.STREET_TEAM) ||
                (this.authService.oAuthToken._claims.includes(UserRoles.WORKSHOP) && this.roleName == UserRoles.ADMIN + "," + UserRoles.WORKSHOP + "," + UserRoles.STREET_TEAM) ||
                (this.authService.oAuthToken._claims.includes(UserRoles.STREET_TEAM) && this.roleName == UserRoles.ADMIN + "," + UserRoles.WORKSHOP + "," + UserRoles.STREET_TEAM)) {
                this.viewContainer.createEmbeddedView(this.templateRef);

            }

            // Both Admin and maintenance and support and service
            else if ((this.authService.oAuthToken._claims.includes(UserRoles.ADMIN) && this.roleName == UserRoles.ADMIN + "," + UserRoles.WORKSHOP + "," + UserRoles.CUSTOMER_SERVICE + "," + UserRoles.STREET_TEAM) ||
                (this.authService.oAuthToken._claims.includes(UserRoles.WORKSHOP) && this.roleName == UserRoles.ADMIN + "," + UserRoles.WORKSHOP + "," + UserRoles.CUSTOMER_SERVICE + "," + UserRoles.STREET_TEAM) ||
                (this.authService.oAuthToken._claims.includes(UserRoles.CUSTOMER_SERVICE) && this.roleName == UserRoles.ADMIN + "," + UserRoles.WORKSHOP + "," + UserRoles.CUSTOMER_SERVICE + "," + UserRoles.STREET_TEAM) ||
                (this.authService.oAuthToken._claims.includes(UserRoles.STREET_TEAM) && this.roleName == UserRoles.ADMIN + "," + UserRoles.WORKSHOP + "," + UserRoles.CUSTOMER_SERVICE + "," + UserRoles.STREET_TEAM)) {
                this.viewContainer.createEmbeddedView(this.templateRef);

            }
            else if (this.authService.oAuthToken._claims.includes(UserRoles.CUSTOMER) && (this.roleName == UserRoles.CUSTOMER)) {
                this.viewContainer.createEmbeddedView(this.templateRef);
            }
            else {
                this.viewContainer.clear();
            }
        }
    }
}






