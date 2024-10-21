import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AboutComponent } from './about/about.component';
import { TransNorwegianComponent } from './terms-conditions/trans-norwegian/trans-norwegian.component';
import { TransEnglishComponent } from './terms-conditions/trans-english/trans-english.component';

const routes: Routes = [
  {
    path: '',
    children: [
      { path: 'about', component: AboutComponent },
      { path: 'terms-no', component: TransNorwegianComponent },
      { path: 'terms-en', component: TransEnglishComponent }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class InfoRoutingModule { }
