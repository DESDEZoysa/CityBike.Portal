import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared/shared.module';
import { InventoryRoutingModule } from './inventory-routing.module';
import { InventoryComponent } from './inventory.component';
import { CreateVariantComponent } from './create-variant/create-variant.component';
import { NgxSpinnerModule } from 'ngx-spinner';
import { PartRepairInventoryComponent } from './part-repair-inventory/part-repair-inventory.component';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

@NgModule({
  imports: [
    CommonModule,
    SharedModule,
    InventoryRoutingModule,
    NgxSpinnerModule,
    NgxMatSelectSearchModule
  ],
  declarations: [
    InventoryComponent,
    CreateVariantComponent,
    PartRepairInventoryComponent
  ],
  entryComponents: [
    PartRepairInventoryComponent
  ]
})

export class InventoryModule { }