import { NgModule } from '@angular/core';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { OAuthtInterceptor } from './oauth-request-interceptor';

@NgModule({
  providers: [{ provide: HTTP_INTERCEPTORS, useClass: OAuthtInterceptor, multi: true }]
})
export class InterceptorModule { }
