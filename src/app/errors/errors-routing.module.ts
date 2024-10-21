import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { NotFoundComponent } from './not-found/not-found.component';
import { UnauthorizedComponent } from './unauthorized/unauthorized.component';
import { ForbiddenComponent } from './forbidden/forbidden.component';

const routes: Routes = [{
  path: '',
  children: [
    {
      path: 'notfound',
      component: NotFoundComponent
    },
    {
      path: 'unauthorized',
      component: UnauthorizedComponent
    },
    {
      path: 'forbidden',
      component: ForbiddenComponent
    }
  ]
}];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ErrorsRoutingModule { }
