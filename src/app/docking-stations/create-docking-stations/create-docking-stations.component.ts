
import { forkJoin as observableForkJoin, Observable } from 'rxjs';
import { Component, OnInit, ViewChild, ElementRef } from "@angular/core";
import { FormGroup, FormBuilder, Validators } from "@angular/forms";
import { DockingStationService } from "../../services/docking-station.service";
import { ActivatedRoute } from "@angular/router";
import { DockingStation } from "../../core/models";
import { LoggerService, AuthService, AppSettings } from "../../services";
import { ConfirmDialogComponent } from "../../shared/confirm-dialog/confirm-dialog.component";
import { MatDialog } from "@angular/material/dialog";
import { SystemSettingsService } from "../../services/system-settings.service";
import { ValueRangeValidator } from "../../core/validators/valueRangeValidator";
import OlMap from "ol/map";
import OlVector from "ol/source/vector";
import OlXYZ from "ol/source/xyz";
import OlTileLayer from "ol/layer/tile";
import OlVectorLayer from "ol/layer/vector";
import OlView from "ol/view";
import OlProj from "ol/proj";
import OlFeature from "ol/feature";
import OlPoint from "ol/geom/point";
import OlPolygon from "ol/geom/polygon";
import OlStyle from "ol/style/style";
import OlIcon from "ol/style/icon";
import OlCircle from "ol/style/circle";
import OlText from "ol/style/text";
import OlStroke from "ol/style/stroke";
import OlFill from "ol/style/fill";
import OlLineString from "ol/geom/linestring";
import OlOverlay from "ol/overlay";
import OlSelect from "ol/interaction/select";
import OlCondition from "ol/events/condition";
import { NgxSpinnerService } from "ngx-spinner";
import { AreasService } from "../../services/areas.service";
import { MapExtension } from "../../core/extensions";
import { PriorityGroupService } from "../../services/priority-groups.service";
import { AddPriorityGroupPopupComponent } from "../../users/add-priority-group-popup/add-priority-group-popup.component";
import { LocalStorageKeys } from "../../core/constants";
import { UserRoles } from "../../core/constants/user-roles";
import { DisableStationConfirmationPopupComponent } from './disable-station-confirmation-popup/disable-station-confirmation-popup.component';

@Component({
  selector: "app-create-docking-stations",
  templateUrl: "./create-docking-stations.component.html",
  styleUrls: ["./create-docking-stations.component.scss"]
})
export class CreateDockingStationsComponent implements OnInit {
  @ViewChild("map", { static: true }) mapElement: ElementRef;
  @ViewChild("popup", { static: true }) popupElement: ElementRef;
  @ViewChild("dockingPointTable", { static: false }) table: any;
  @ViewChild("priorityReservationTable", { static: true }) priorityReservationTable: any;

  map: OlMap;
  source: OlXYZ;
  vectorLayer: OlVectorLayer;
  style: OlStyle;
  popup: OlOverlay;
  onClick: OlSelect;

  dockingStationForm: FormGroup;
  dockingPointForm: FormGroup;
  dockingStationId: number;
  dockingPointId: number;
  dockingStationDetails: any;
  dockingStationBtnTxt = "DOCKING_STATION.ADD_STATION"; //"Add Docking Station";
  dockingPointBtnTxt = "DOCKING_STATION.ADD_DOCKING_POINT"; //"Add Docking Point";
  dockingPoints = [];
  isDockingPointDisabled = true;
  minChargeLevel: number = 0;
  bikes: any;
  isBikesAvilable: boolean = false;
  countries = [];
  docPositionLon: any;
  docPositionLat: any;
  areas = [];
  searchCtrl = '';

  isMobile: boolean = false;
  dockingPointState = [
    { value: "1", viewValue: "Available" },
    { value: "2", viewValue: "Occupied" },
    { value: "3", viewValue: "Disabled" }
  ];
  isDisabled: any;
  dockLayer: any;
  priorityReservationForm: FormGroup;
  priorityReservations: any[];
  isPriorityGroupInfoDisabled = true;
  priorityReservationInfo: any;
  prioritygroups: any;
  allFilteredGroups: any;
  userRole: any;
  isAdmin: boolean;
  selectedPriorityGroup: any;
  numberOfReservations: any;

  constructor(
    private fb: FormBuilder,
    private dockingStationService: DockingStationService,
    private dialog: MatDialog,
    private systemSettingsService: SystemSettingsService,
    private loggerService: LoggerService,
    private authService: AuthService,
    private activatedRoute: ActivatedRoute,
    private spinner: NgxSpinnerService,
    private areaService: AreasService,
    private priorityGroupService: PriorityGroupService,
    private appSettings: AppSettings
  ) {
    this.activatedRoute.params.subscribe(params => {
      this.dockingStationId = params["id"];
      if (this.dockingStationId) {
        this.isDockingPointDisabled = false;
        this.isPriorityGroupInfoDisabled = false;
        this.dockingStationBtnTxt = "DOCKING_STATION.UPDATE_STATION"; //"Update Docking Station";
        this.getDockingStationDetails();
      }
    });

    if (
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      )
    ) {
      this.isMobile = true;
    }
  }

  onResize() {
    if (
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      )
    ) {
      this.isMobile = true;
    } else {
      this.isMobile = false;
    }
  }

  ngOnInit() {
    this.priorityReservations = [];
    this.prioritygroups = [];
    this.selectedPriorityGroup = null;
    this.spinner.show();
    this.mapInitialize();
    this.getSystemConfiguration();
    this.createDockingStationForm();
    this.createDockingPointForm();
    this.getCountries();
    this.getAreas();
    this.getUserRole();
    this.isAdmin = this.userRole == UserRoles.ADMIN;

    setTimeout(() => {
      this.map.updateSize();
    }, 2000);
    this.spinner.hide();
  }

  private mapInitialize() {
    this.source = new OlVector({
      wrapX: false
    });

    let tileLayer = new OlTileLayer({
      source: new OlXYZ({
        crossOrigin: null,
        url:
          "https://cartodb-basemaps-{a-c}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png"
      })
    });

    this.vectorLayer = new OlVectorLayer({
      source: this.source
    });

    this.dockLayer = new OlVectorLayer({
      style: (f, r) => this.styleDockFunction(f, r),
      source: new OlVector({})
    });

    let view = new OlView({
      center: OlProj.fromLonLat(this.appSettings.map_center_position),
      zoom: 17
    });

    this.map = new OlMap({
      layers: [tileLayer, this.vectorLayer, this.dockLayer],
      view: view
    });

    // add select interaction for single-click
    this.map.setTarget(this.mapElement.nativeElement);

    this.map.on("singleclick", event => {
      let lonLat = OlProj.toLonLat(event.coordinate);
      var lon = lonLat[0];
      var lat = lonLat[1];

      this.addPositionMarker(lon, lat);
    });
  }

  private getAreas() {
    this.areaService.getAllAreas().subscribe(
      res => {
        res = res.sort(function (a, b) {
          if (a.Name < b.Name) { return -1; }
          if (a.Name > b.Name) { return 1; }
          return 0;
        });
        this.areas = res;
      },
      error => {
        this.loggerService.showErrorMessage("Getting areas failed.");
      }
    );
  }

  private createDockingStationForm() {
    this.dockingStationForm = this.fb.group({
      Name: ["", Validators.required],
      Country: ["", Validators.required],
      City: ["", Validators.required],
      AreaId: ["", Validators.required],
      Street: [],
      District: [],
      ZipCode: [],
      Position: this.fb.group({
        Longitude: [
          "",
          [Validators.required, ValueRangeValidator.checkValueRange(-180, 180)]
        ],
        Latitude: [
          "",
          [Validators.required, ValueRangeValidator.checkValueRange(-90, 90)]
        ],
        Altitude: []
      }),
      ZoneId: [""],
      Radius: ["", [Validators.required]],
      IdealNumberOfBikes: ["", [Validators.required]],
      MinimumNumberOfBikes: ["", [Validators.required]],
      Disabled: [""],
      IsOnboardStation: [false]
    });
  }

  private createDockingPointForm() {
    this.dockingPointForm = this.fb.group({
      HardwareId: ["", [Validators.required]],
      VisualId: ["", [Validators.required]],
      State: [{ value: "1", disabled: true }],
      ApplicationVersion: [{ value: "", disabled: true }]
    });
  }

  saveDock() {
    var dock = Object.assign({}, this.dockingStationForm.value);
    if (!dock.Position.Altitude) {
      dock.Position.Altitude = 0;
    }

    if (this.dockingStationId && this.dockingStationId > 0) {
      dock.DockingStationId = this.dockingStationId;
      this.dockingStationService
        .updateDockingStation(this.dockingStationId, dock)
        .subscribe(
          res => {
            this.isDockingPointDisabled = false;
            this.isPriorityGroupInfoDisabled = false;
            this.loggerService.showSuccessfulMessage(
              "Docking station updated successfully"
            );
            this.getDockingstationDetById();
            this.nextStep();
          },
          error => {
            this.loggerService.showErrorMessage(
              "Docking station updating error"
            );
          }
        );
    } else {
      this.dockingStationService.createDockingStation(dock).subscribe(
        res => {
          this.dockingStationId = res.DockingStationId;
          this.isDockingPointDisabled = false;
          this.isPriorityGroupInfoDisabled = false;
          this.dockingStationBtnTxt = "DOCKING_STATION.UPDATE_STATION"; //"Update Docking Station";
          this.loggerService.showSuccessfulMessage(
            "Docking station saved successfully"
          );
          this.getDockingstationDetById();
          this.nextStep();
        },
        error => {
          this.loggerService.showErrorMessage("Docking station saving error");
        }
      );
    }
  }

  getDockingStationDetails() {
    observableForkJoin(
      this.dockingStationService.getDockingStation(
        this.dockingStationId,
        false
      ),
      this.dockingStationService.getDockingPointsForStation(
        this.dockingStationId
      ),
      this.dockingStationService.getUndockedBikesInDockingStation(
        this.dockingStationId
      ),
      this.priorityGroupService.getAllPriorityReservationsByDockingStation(
        this.dockingStationId
      )
    ).subscribe(
      data => {
        // console.log(data[0]);
        this.dockingStationDetails = data[0];
        this.dockingPoints = data[1].DockingPoints;
        if (data[2] && data[2].length > 0) {
          this.isBikesAvilable = true;
        }
        this.isDisabled = (this.dockingStationDetails.Disabled == false) ? true : false;;
        this.patchDockingStationForm(data[0]);

        if (data[3]) {
          this.priorityReservationInfo = data[3];
          this.priorityReservations = data[3]["PriorityGroups"];
          this.priorityReservations.sort((a, b) => (a.Id > b.Id) ? 1 : -1);
        }
        this.getAllPriorityGroups();
      },
      (error: any) => { }
    );
  }

  patchDockingStationForm(dock) {
    this.dockingStationForm.patchValue({
      Name: dock.Name,
      AreaId: dock.AreaId,
      Country: dock.Address.Country,
      City: dock.Address.City,
      District: dock.Address.District,
      Street: dock.Address.Street,
      ZipCode: dock.Address.ZipCode,
      IdealNumberOfBikes: dock.IdealNumberOfBikes,
      MinimumNumberOfBikes: dock.MinimumBikesRequired,
      Position: {
        Longitude: dock.Position.Longitude,
        Latitude: dock.Position.Latitude,
        Altitude: dock.Position.Altitude
      },
      Radius: dock.Radius,
      ZoneId: dock.ZoneId,
      Disabled: dock.IsEnabled,
      IsOnboardStation: dock.IsOnboardStation
    });

    this.addPositionMarker(dock.Position.Longitude, dock.Position.Latitude);
    let point = [dock.Position.Longitude, dock.Position.Latitude];
    let projectedPoint = OlProj.fromLonLat(point);
    this.map.getView().setCenter(projectedPoint);
  }

  addDockingPoint() {
    var point = Object.assign({}, this.dockingPointForm.getRawValue());

    if (!this.dockingPointId || this.dockingPointId == 0) {
      this.dockingStationService
        .createDockingPoint(this.dockingStationId, point)
        .subscribe(
          res => {
            this.loggerService.showSuccessfulMessage(
              "Docking point saved successfully"
            );
            this.dockingPointForm.reset();
            this.dockingPoints.push(point);
            this.dockingPoints = [...this.dockingPoints];
            point.DockingPointId = res.id;
            this.dockingPointId = 0;
            this.dockingPointForm.patchValue({
              State: "1"
            });
            this.dockingPointForm.get("State").disable();
          },
          error => {
            if (error && error.error.Code == 1062) {
              this.loggerService.showErrorMessage("Docking point Hardware Id already exists");
            }
            else
              this.loggerService.showErrorMessage("Docking point saving error");
          }
        );
    } else {
      var editIndex = this.dockingPoints.findIndex(
        a => a.DockingPointId == this.dockingPointId
      );
      point.DockingStationId = this.dockingStationId;
      point.DockingPointId = this.dockingPointId;

      this.dockingStationService
        .updateDockingPointDetails(
          this.dockingStationId,
          this.dockingPointId,
          point
        )
        .subscribe(
          res => {
            this.loggerService.showSuccessfulMessage(
              "Docking point updated successfully"
            );
            this.dockingPointForm.reset();
            this.dockingPoints[editIndex] = point;
            this.dockingPoints = [...this.dockingPoints];
            this.dockingPointId = 0;
            this.dockingPointBtnTxt = "Add Docking Point";
            this.dockingPointForm.patchValue({
              State: "1"
            });
            this.dockingPointForm.get("State").disable();
          },
          error => {
            if (error && error.error.Code == 1062) {
              this.loggerService.showErrorMessage("Docking point Hardware Id already exists");
            }
            else
              this.loggerService.showErrorMessage("Docking point updating error");
          }
        );
    }
  }

  editDockingPoint(dockingPointId) {
    var point = this.dockingPoints.find(
      a => a.DockingPointId == dockingPointId
    );
    this.patchDockingPoint(point);
    this.dockingPointId = dockingPointId;
    this.dockingPointBtnTxt = "Update Docking Point";
  }

  deleteDockingPoint(dockingPointId) {
    var deleteIndex = this.dockingPoints.findIndex(
      a => a.DockingPointId == dockingPointId
    );
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: "250px",
      data: {}
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.dockingStationService
          .deleteDockingPoint(this.dockingStationId, dockingPointId)
          .subscribe(
            res => {
              this.dockingPoints.splice(deleteIndex, 1);
              this.loggerService.showSuccessfulMessage(
                "Docking point deleted successfully"
              );
              this.dockingPointForm.reset();
              this.dockingPointId = 0;
              this.dockingPointForm.patchValue({
                State: "1"
              });
              this.dockingPointForm.get("State").disable();
            },
            error => {
              this.loggerService.showErrorMessage(
                "Docking point deletion error"
              );
            }
          );
      }
    });
  }

  stateChangeConfirmation() {
    if (this.isDisabled)
      this.showConfirmationPopup();
    else
      this.showDisableDockingStationConfirmationDialog();
  }

  showDisableDockingStationConfirmationDialog() {
    const dialogRef = this.dialog.open(DisableStationConfirmationPopupComponent, {
      width: '435px',
      data: {
        dockingStationName: this.dockingStationDetails.Name,
        dockingStationId: this.dockingStationDetails.DockingStationId
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result && result.isConfirmed) {
        let dpStateChangeDto = {
          "IsDisabled": !this.isDisabled,
          "DisabledReason": result.comment
        }
        this.updateDockingStationState(this.dockingStationDetails.DockingStationId, dpStateChangeDto);
      } else {
        this.isDisabled = true;
      }
    });
  }

  showConfirmationPopup() {
    var dialogMsg = "Are you sure want to enable selected docking station?";
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '435px',
      data: { message: dialogMsg }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        let dpStateChangeDto = {
          "IsDisabled": !this.isDisabled,
          "DisabledReason": ""
        }
        this.updateDockingStationState(this.dockingStationDetails.DockingStationId, dpStateChangeDto);
      } else {
        this.isDisabled = false;
      }
    });
  }

  updateDockingStationState(dockingStationId: any, dpStateChangeDto: any) {
    this.dockingStationService.enableDisableStation(dockingStationId, dpStateChangeDto)
      .subscribe(data => {
        this.loggerService.showSuccessfulMessage("Docking station state successfully changed.");
      }, error => {
        this.loggerService.showErrorMessage("Docking station state change failed!");
      });
  }

  patchDockingPoint(point) {
    this.dockingPointForm.get("State").enable();

    this.dockingPointForm.patchValue({
      HardwareId: point.HardwareId,
      VisualId: point.VisualId,
      State: point.State.toString(),
      ApplicationVersion: point.ApplicationVersion
    });
  }

  toggleExpandRow(row, type) {
    if (type == 1)
      this.table.rowDetail.toggleExpandRow(row);
    else
      this.priorityReservationTable.rowDetail.toggleExpandRow(row);
  }

  private getSystemConfiguration(): void {
    this.systemSettingsService.getSETTING().subscribe(
      data => {
        this.minChargeLevel = data.MinChargeLevel;
      },
      error => {
        if (error.status == 403) {
          this.loggerService.showErrorMessage(
            "Don't have permission to obtain data"
          );
        } else {
          this.loggerService.showErrorMessage(error);
        }
      }
    );
  }

  private getCountries() {
    this.authService.geCountries().subscribe(
      res => {
        this.countries = res;
      },
      error => { }
    );
  }

  private addPositionMarker(lon, lat) {
    var iconFeature = new OlFeature({
      geometry: new OlPoint(
        OlProj.transform([lon, lat], "EPSG:4326", "EPSG:3857")
      )
    });

    var markerStyle = new OlStyle({
      image: new OlIcon(
        /** @type {olx.style.IconOptions} */ {
          anchor: [0.5, 0.5],
          anchorXUnits: "fraction",
          anchorYUnits: "fraction",
          opacity: 0.75,
          src: "/assets/images/pos.png"
        }
      )
    });

    let bikeSource = this.vectorLayer.getSource();
    let dockSource = this.dockLayer.getSource();

    var existingFeatures = bikeSource.getFeatures();
    if (existingFeatures.length > 0) {
      bikeSource.removeFeature(existingFeatures[0]);
    }

    iconFeature.setStyle(markerStyle);
    bikeSource.addFeature(iconFeature);
    this.map.updateSize();

    this.dockingStationForm.patchValue({
      Position: {
        Longitude: lon,
        Latitude: lat
      }
    });

    if (this.dockingStationDetails && this.dockingStationDetails["Radius"]) {
      let areaFeature = this.getDockingStationAreaFeature(this.dockingStationDetails);
      dockSource.addFeature(areaFeature);
    }
  }

  step = 0;

  setStep(index: number) {
    this.step = index;
  }

  nextStep() {
    this.step++;
  }

  prevStep() {
    this.step--;
  }

  getDockingStationAreaFeature(station: DockingStation) {
    let polygonText = station.Geometry;
    polygonText = polygonText.substring(7);
    polygonText = polygonText.replace(/\(/g, '[').replace(/\)/g, ']').replace(/\,/g, '],[').replace(/ /g, ',');
    let points = JSON.parse(polygonText);

    let polygon = new OlPolygon([points]);
    polygon.transform('EPSG:4326', 'EPSG:3857');

    let feature = new OlFeature({
      name: station.Name,
      geometry: polygon,
      data: station,
      type: "dock"
    });

    feature.setId(station.DockingStationId);
    return feature;
  }

  styleDockFunction(feature: OlFeature, resolution) {
    let data = feature.get('data');

    let color = MapExtension.getStationFeatureColor(data);
    let styles = MapExtension.getDockingStationsStyles(false, color);
    let text = '';
    if (resolution < 19) {
      text = MapExtension.getFeatureName(feature);
    };
    styles[1].getText().setText(text);
    return styles;
  }

  openCreatePriorityGroup(): void {
    let data = {};
    data["operationType"] = 1;
    const dialogRef = this.dialog.open(AddPriorityGroupPopupComponent, {
      width: '280px',
      data: data
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.getAllPriorityGroups();
      }
    });
  }

  getAllPriorityGroups() {
    this.priorityGroupService.getAllPriorityGroups().subscribe(res => {
      this.prioritygroups = res;
      this.prioritygroups.sort((a, b) => (a.Id > b.Id) ? 1 : -1);
      if (this.priorityReservationInfo) {
        let priorityGroupIds = this.priorityReservationInfo["PriorityGroupIds"];
        if (priorityGroupIds) {
          this.allFilteredGroups = this.prioritygroups.filter(x => {
            return priorityGroupIds.indexOf(x.Id) < 0;
          });
        }
      }
      else
        this.allFilteredGroups = this.prioritygroups;
    }, err => {
      this.loggerService.showErrorMessage(err);
    });
  }

  getUserRole() {
    var authToken = JSON.parse(
      localStorage.getItem(LocalStorageKeys.OAUTH_TOKEN)
    );
    this.userRole = authToken._claims[0];
  }

  getAllPriorityReservations() {
    this.priorityGroupService.getAllPriorityReservationsByDockingStation(
      this.dockingStationId
    ).subscribe(res => {
      if (res) {
        this.priorityReservationInfo = res;
        this.priorityReservations = res["PriorityGroups"];
        this.priorityReservations.sort((a, b) => (a.Id > b.Id) ? 1 : -1);
      }
      this.getAllPriorityGroups();
      this.getDockingstationDetById();
    }, err => {

    });
  }

  assignPriorityReservation() {
    let priorityDockObj = {};
    priorityDockObj["DockingStationId"] = this.dockingStationId;
    priorityDockObj["PriorityGroups"] = [{ "PriorityGroupId": this.selectedPriorityGroup, "NumberOfReservedBikes": this.numberOfReservations }];
    this.priorityGroupService.createPriorityGroupDockingStation(this.dockingStationId, priorityDockObj).subscribe(res => {
      this.getAllPriorityReservations();
      if (!this.dockingStationDetails["NumberOfPriorityReservations"] || this.dockingStationDetails["NumberOfPriorityReservations"] < this.numberOfReservations) {
        this.updateNumberOfReservations(this.numberOfReservations);
      }
      this.numberOfReservations = null;
      this.selectedPriorityGroup = null;
    }, err => {

    });
  }

  updateNumberOfReservations(numberOfReservations) {
    this.dockingStationService.updateNumberOfReservations(this.dockingStationId, numberOfReservations)
      .subscribe(res => {
        this.getAllPriorityReservations();
      }, err => {
      })
  }

  deletePriorityReservation(actionId) {
    this.priorityGroupService.deletePriorityReservation(actionId).subscribe(res => {
      this.priorityReservations = this.priorityReservations.filter(x => x.ActionId != actionId);
      this.priorityReservationInfo = null;
      let maxNumberOfReservered = Math.max(...this.priorityReservations.map(o => o.NumberOfReservedBikes), 0);
      if (!this.dockingStationDetails["NumberOfPriorityReservations"] || this.dockingStationDetails["NumberOfPriorityReservations"] != maxNumberOfReservered)
        this.updateNumberOfReservations(maxNumberOfReservered);
      else
        this.getAllPriorityReservations();
      this.numberOfReservations = null;
      this.selectedPriorityGroup = null;
    }, err => {

    });
  }

  getDockingstationDetById() {
    this.dockingStationService.getDockingStation(
      this.dockingStationId,
      false
    ).subscribe(res => {
      this.dockingStationDetails = res;
    }, err => {

    });
  }
}
