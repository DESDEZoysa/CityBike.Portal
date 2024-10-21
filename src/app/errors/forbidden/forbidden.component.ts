import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services';

@Component({
  selector: 'app-forbidden',
  templateUrl: './forbidden.component.html',
  styleUrls: ['./forbidden.component.scss']
})
export class ForbiddenComponent {

  constructor(private router: Router, private auth: AuthService) { }

  onLoggedOut() {
    this.auth.logout();
    //this.router.navigate(['/auth/signin']);
    window.location.href = "/auth/signin";
  }

}
