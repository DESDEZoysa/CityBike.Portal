
import { tap } from 'rxjs/operators';
import { Injectable, Injector } from '@angular/core';
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../../services/auth.service';
import { Observable } from 'rxjs'
import { Router } from '@angular/router';


@Injectable()
export class OAuthtInterceptor implements HttpInterceptor {

  constructor(private router: Router, private injector: Injector) { }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    /* https://github.com/angular/angular/issues/18224#issuecomment-316971151 */
    const auth = this.injector.get(AuthService);
    request = request.clone({ setHeaders: { Authorization: `Bearer ${auth.oAuthToken.token}` } });
    //return next.handle(request);

    return next.handle(request).pipe(tap(event => { }, (error: any) => {
      if (error instanceof HttpErrorResponse) {
        if (error.status === 401) {
          auth.logout();
          //this.router.navigateByUrl('/auth/signin');
          window.location.href = "/auth/signin";
        }
      }
    }));
  }
}