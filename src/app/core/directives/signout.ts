import { Directive, HostListener } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Directive({
    selector: '[sign-out]'
})
export class SignOutDirective {

    constructor(private router: Router,
        private route: ActivatedRoute,
        private auth: AuthService) { }

    @HostListener('click') onClick() {
        this.auth.logout();
        //this.router.navigate(['/auth/signin']);
        window.location.href = "/auth/signin";
    }
}
