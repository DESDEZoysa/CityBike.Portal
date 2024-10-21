import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AuthService, DockingStationService, LoggerService } from '../../services';
import { FormControl, FormGroup, MaxLengthValidator, Validators } from '@angular/forms';
import { DockingStationTechData } from '../../core/models/dock/docking-station-tech-data';
import * as moment from 'moment';

@Component({
  selector: 'app-station-technical-details',
  templateUrl: './station-technical-details.component.html',
  styleUrls: ['./station-technical-details.component.scss']
})

export class StationTechnicalDetailsComponent implements OnInit {

  dockingStationId: any;
  technicalDetails: DockingStationTechData;
  isEdit: boolean = false;
  tecDetailsForm: FormGroup;
  isAdmin: boolean = false;
  isSubmitted: boolean = false;

  constructor(@Inject(MAT_DIALOG_DATA) public data: number,
    public dialogRef: MatDialogRef<StationTechnicalDetailsComponent>,
    private dockingStationService: DockingStationService,
    private loggerService: LoggerService,
    private authService: AuthService,) {
    this.dockingStationId = this.data['stationId'];
    this.isAdmin = this.authService.isAdmin();
  }

  ngOnInit(): void {
    this.buildFormControls();
    this.loadDockingStationTechnicalData();
  }

  loadDockingStationTechnicalData() {
    this.dockingStationService.getDockingStationTechnicalData(this.dockingStationId)
      .subscribe(result => {
        this.mapTechnicalData(result);
        this.technicalDetails = result;

      }, error => {
        if (error.status == 404) {
          this.loggerService.showErrorMessage("Technical details not found");
        } else {
          this.loggerService.showErrorMessage("Getting docking station technical data failed");
        }
      });
  }

  private mapTechnicalData(result: any) {
    if (result.ElectricitySuppliedDate)
      result.ElectricitySuppliedDate = moment(result.ElectricitySuppliedDate).format('YYYY-MM-DD');
    if (!result.ElectricitySuppliedDate)
      result.ElectricitySuppliedDate = "N/A";
    if (!result.FuseLocation)
      result.FuseLocation = "N/A";
    if (!result.FuseCurrent)
      result.FuseCurrent = "N/A";
    if (!result.EmergencyContact)
      result.EmergencyContact = "N/A";
  }

  onCancel() {
    this.isEdit = !this.isEdit;
  }

  onClose() {
    this.dialogRef.close();
  }

  editTechDetails() {
    this.isEdit = !this.isEdit;
    if (this.isEdit) {
      this.updateFormValues();
    }
  }

  onSubmit() {
    if (this.tecDetailsForm.valid) {
      this.isSubmitted = true;

      let techDataValues = this.tecDetailsForm.getRawValue();
      techDataValues.ElectricitySuppliedDate = techDataValues.ElectricitySuppliedDate ?
        moment(techDataValues.ElectricitySuppliedDate).format('YYYY-MM-DDTHH:mm:ss') : null;
      techDataValues.ElectricitySuppliedPersonal = this.technicalDetails.ElectricitySuppliedPersonal;
      const techData = { ...techDataValues } as DockingStationTechData;

      this.dockingStationService.updateDockingStationTechnicalDetails(this.dockingStationId, techData)
        .subscribe(result => {
          this.loggerService.showSuccessfulMessage(
            "Docking station technical details updated successfully."
          );
          this.isSubmitted = false;
          this.onClose();
        }, error => {
          this.isSubmitted = false;
          if (error.status == 400) {
            this.loggerService.showErrorMessage("Error occurred while updating technical details");
          } else if (error.status == 404) {
            this.loggerService.showErrorMessage("Technical details not found");
          } else {
            this.loggerService.showErrorMessage("Updating technical data failed");
          }
        });
    }
  }

  private buildFormControls() {
    this.tecDetailsForm = new FormGroup({
      ElectricitySuppliedDate: new FormControl(null),
      FuseLocation: new FormControl(null, [
        Validators.required
      ]),
      FuseCurrent: new FormControl(null, [
        Validators.required
      ]),
      EmergencyContact: new FormControl(null, [
        Validators.required, Validators.maxLength(100)
      ])
    });
  }

  updateFormValues() {
    this.tecDetailsForm.patchValue({
      ElectricitySuppliedDate: this.technicalDetails.ElectricitySuppliedDate.includes("N/A") ? 
        null : this.technicalDetails.ElectricitySuppliedDate,
      FuseLocation: this.technicalDetails.FuseLocation,
      FuseCurrent: this.technicalDetails.FuseCurrent,
      EmergencyContact: this.technicalDetails.EmergencyContact
    });
  }

}
