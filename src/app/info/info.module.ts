import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { InfoRoutingModule } from './info-routing.module';
import { AboutComponent } from './about/about.component';
import { TransEnglishComponent } from './terms-conditions/trans-english/trans-english.component';
import { TransNorwegianComponent } from './terms-conditions/trans-norwegian/trans-norwegian.component';
import { SharedModule } from '../shared/shared.module';

@NgModule({
  imports: [
    CommonModule,
    InfoRoutingModule,
    SharedModule
  ],
  declarations: [
    AboutComponent,
    TransEnglishComponent,
    TransNorwegianComponent,
  ]
})

export class InfoModule { }
