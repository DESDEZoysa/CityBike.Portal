import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTreeModule } from '@angular/material/tree';

@NgModule({
    imports: [
        FormsModule, ReactiveFormsModule,
        MatToolbarModule, MatButtonModule, MatCheckboxModule, MatFormFieldModule, MatInputModule, MatTabsModule,
        MatSelectModule, MatSnackBarModule, MatIconModule, MatCardModule, MatTooltipModule, MatButtonToggleModule,
        MatChipsModule, MatDividerModule, MatListModule, MatMenuModule, MatRadioModule, MatExpansionModule, MatDialogModule, MatTreeModule,
        MatSlideToggleModule, MatBadgeModule
    ],
    exports: [
        FormsModule, ReactiveFormsModule,
        MatToolbarModule, MatButtonModule, MatCheckboxModule, MatFormFieldModule, MatInputModule, MatTabsModule,
        MatSelectModule, MatSnackBarModule, MatIconModule, MatCardModule, MatTooltipModule, MatButtonToggleModule,
        MatChipsModule, MatDividerModule, MatListModule, MatMenuModule, MatRadioModule, MatExpansionModule, MatDialogModule, MatTreeModule,
        MatSlideToggleModule, MatBadgeModule
    ],
})
export class AppMaterialModule { }