import { BikeModes } from './../../core/enums/bikeModes';
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import OlMap from 'ol/map';
import OlVector from 'ol/source/vector';
import OlXYZ from 'ol/source/xyz';
import OlTileLayer from 'ol/layer/tile';
import OlVectorLayer from 'ol/layer/vector';
import OlView from 'ol/view';
import OlProj from 'ol/proj';
import OlFeature from 'ol/feature';
import OlPoint from 'ol/geom/point';
import OlStyle from 'ol/style/style';
import OlCircle from 'ol/style/circle';
import OlText from 'ol/style/text';
import OlStroke from 'ol/style/stroke';
import OlFill from 'ol/style/fill';
import OlLineString from 'ol/geom/linestring';
import OlOverlay from 'ol/overlay';
import OlSelect from 'ol/interaction/select';
import OlCondition from 'ol/events/condition';
import { AppSettings, BikesService, DockingStationService, LoggerService, RepairService } from '../../services';
import { ActivatedRoute } from '@angular/router';
import { LockState } from '../../core/enums/lockState';
import 'moment-timezone';
import { MatDialog } from '@angular/material/dialog';
import { NgxSpinnerService } from 'ngx-spinner';
import { ReportErrorComponent } from './report-error/report-error.component';
import { TranslateService, LangChangeEvent } from '@ngx-translate/core';
import { IssueService } from '../../services/issue.service';
import { BikeAddress } from '../../core/models';
import * as moment from 'moment';
import 'moment-timezone';
import { SessionTerminateDialogComponent } from '../../sessions/session-terminate-dialog/session-terminate-dialog.component';
import { SessionsService } from '../../services/sessions.service';
import { BikeDisableState } from '../../core/enums/bikeDisableState';
import { MapExtension } from '../../core/extensions';

@Component({
  selector: 'app-bike-support',
  templateUrl: './bike-support.component.html',
  styleUrls: ['./bike-support.component.scss']
})

export class BikeSupportComponent implements OnInit {

  @ViewChild('map', { static: true }) mapElement: ElementRef;
  @ViewChild('popup', { static: true }) popupElement: ElementRef;

  map: OlMap;
  source: OlXYZ;
  vectorLayer: OlVectorLayer;
  dockRadiusLayer: OlVectorLayer;
  dockSource: OlXYZ;
  style: OlStyle;
  popup: OlOverlay;
  onClick: OlSelect
  visualId: string;
  bikeId: number;
  endUserId: string;
  summaryDetails: string;
  sessionDetails: string;
  bikeSession: any;
  comment: string;

  isMobile: boolean = false;
  positionObservationId = 300;
  commandBtns = {
    disableReportError: false,
    disableEndSession: true,
    disableFreeLock: true,
  };
  bikeImagePath: string;
  colors = {
    "blue": "#0000FF",
    "black": "#000000"
  };
  bikeStatus = {
    "start": "Start",
    "dock": "Docked",
    "running": "Running",
    "parked": "Parked"
  };
  featureCategory = {
    "point": "point",
    "line": "line"
  }
  pulseTimestamp: string;
  errorCategories: any[];
  group1: any[];
  group2: any[];
  group3: any[];
  bike: any;
  bikeLocked: boolean = false;
  hazardImagePath: string;
  hazardText: string;
  hazardTextColor: string;
  stations: any;

  constructor(
    private bikeService: BikesService,
    private activateRouter: ActivatedRoute,
    private repairService: RepairService,
    private loggerService: LoggerService,
    private sessionService: SessionsService,
    private dialog: MatDialog,
    private spinner: NgxSpinnerService,
    private translate: TranslateService,
    private issueService: IssueService,
    private stationService: DockingStationService,
    private appSettings: AppSettings
  ) {
    this.activateRouter.queryParams.subscribe(params => {
      this.visualId = params['visualId'];
      this.endUserId = params['endUserId'];
    })
    this.group1 = [];
    this.group2 = [];
    this.group3 = [];
  }

  onResize() {
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      this.isMobile = true;
    } else {
      this.isMobile = false;
    }
  }

  ngOnInit() {
    this.initializeMap();
    this.getDockingStations();
    this.geBikeSession();
    this.loadErrorCategories();
    this.translate.onLangChange.subscribe((params: LangChangeEvent) => {
      this.translateAllCategories();
      if (this.bike) {
        this.getBikeSummary(this.bike);
        this.getBikeSessionStatus(this.bike);
      }
    });
  }

  private initializeMap() {
    this.source = new OlVector({
      wrapX: false
    });

    this.dockSource = new OlVector({
      wrapX: false
    });

    let tileLayer = new OlTileLayer({
      source: new OlXYZ({
        crossOrigin: null,
        url: 'https://cartodb-basemaps-{a-c}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png'
      })
    });
    this.vectorLayer = new OlVectorLayer({
      style: (f, r) => this.styleFunction(f),
      source: this.source
    });

    this.dockRadiusLayer = new OlVectorLayer({
      style: (f, r) => this.styleDockRadiusFunction(f),
      source: this.dockSource
    });


    let view = new OlView({
      center: OlProj.fromLonLat(this.appSettings.map_center_position),
      zoom: 10
    });
    this.map = new OlMap({
      layers: [tileLayer, this.dockRadiusLayer, this.vectorLayer],
      view: view
    });
    // add select interaction for on hover
    this.map.addInteraction(this.getOnHoverInteracion());
    // overlay/popup that will show on mouse hover
    this.popup = new OlOverlay({
      element: this.popupElement.nativeElement,
      offset: [10, 10]
    });
    this.map.addOverlay(this.popup);
    this.map.setTarget(this.mapElement.nativeElement);
  }

  loadErrorCategories() {
    this.issueService.GetErrorCategories().subscribe(data => {
      this.group1 = data.group1;
      this.group2 = data.group2;
      this.group3 = data.group3;
      this.translateAllCategories();
    }, error => {
      this.loggerService.showErrorMessage(error);
    });
  }

  clearSelectedErrorCategories() {
    this.group1.map(x => this.resetSubCategories(x));
    this.group2.map(x => this.resetSubCategories(x));
    this.group3.map(x => this.resetSubCategories(x));
  }

  translateAllCategories() {
    this.group1.map(x => this.translateCategories(x));
    this.group2.map(x => this.translateCategories(x));
    this.group3.map(x => this.translateCategories(x));
  }

  resetSubCategories(parent) {
    let subCategory = parent.SubCategory;
    for (let i = 0; i < subCategory.length; i++) {
      if (subCategory[i].hasOwnProperty("Result"))
        subCategory[i].Result = false;
    }
  }

  translateCategories(parent) {
    let parentLabel = "REPORT_ERROR." + parent.Name.toUpperCase();
    this.translate.get(parentLabel).subscribe(parentName => {
      parent.DisplayName = (parentName != parentLabel) ? parentName : parent.Name;
      let subCategory = parent.SubCategory;
      for (let i = 0; i < subCategory.length; i++) {
        let childName = "REPORT_ERROR." + subCategory[i].Name.toUpperCase();
        this.translate.get(childName).subscribe(subName => {
          subCategory[i].DisplayName = (subName != childName) ? subName : subCategory[i].Name;
        });
      }
    });
  }

  getDockingStations() {
    this.stationService.getDockingStationsByArea(true).subscribe(res => {
      this.stations = res;
      if (this.stations) {
        for (let station of this.stations) {
          this.addDockingStationRadius(station);
        }
      }
    }, err => {

    });
  }

  addDockingStationRadius(station) {
    // Draw docking station radius
    let lineFeature = this.getDockingStationRadiusFeature(station);
    this.dockSource.addFeature(lineFeature);
  }

  getDockingStationRadiusFeature(station: any) {
    let polygonText = station.Geometry;
    polygonText = polygonText.substring(7);
    polygonText = polygonText.replace(/\(/g, '[').replace(/\)/g, ']').replace(/\,/g, '],[').replace(/ /g, ',');
    let points = JSON.parse(polygonText);
    let feature = new OlFeature({
      geometry: new OlLineString(points).transform('EPSG:4326', 'EPSG:3857'),
      type: "dock-radius"
    });
    feature.setId(station.DockingStationId);
    return feature;
  }

  geBikeSession() {
    this.spinner.show();
    this.bikeService.getBikeSession(this.visualId, this.endUserId)
      .subscribe(res => {

        if (res == "No active session found") {
          this.translate.get("SUPPORT.NO_ACTIVE_SESSION_FOUND").subscribe(val => {
            this.summaryDetails = val;
          });
          this.spinner.hide();
          this.loggerService.showErrorMessage(`No active sessions for end user ${this.endUserId}`);
          return;
        }

        this.bikeSession = Object.assign({}, res);
        this.bikeId = this.bikeSession.BikeId;

        if (this.bikeSession.StartTime) {
          var m1 = moment(this.bikeSession.StartTime).tz("Europe/Berlin").format("YYYY-MM-DD HH:mm:ss") + " CET";
          this.bikeSession.StartTime = m1;
        }
        res.Position = res.CurrentPosition;
        this.bike = res;
        this.bike["LockStateValue"] = this.getLockStateVal(res);
        this.getBikeSummary(res);
        this.getBikeDisabledReasonForCustomBikes();
        this.getBikeSessionStatus(res);
        this.getBikeProperties(res);
        this.setHazardNotification(res);
        this.formatTimeDuration(res.LatestPulse);

        if (res.CurrentSessionId && res.StartTime) {
          var endTime = new Date().toISOString();
          this.getBikePositions(res.BikeId, res.StartTime, endTime)
        }
        else {
          this.updateCurrentPosition(res);
        }
        this.spinner.hide();
      }), () => {
        this.spinner.hide();
        this.loggerService.showErrorMessage("Error occured while getting session details");
      }
  }

  freeLock() {
    this.spinner.show();
    this.bikeService.sendUnLockCommand(this.bikeId, true).subscribe(() => {
      this.loggerService.showSuccessfulMessage("Unlock command executed successfully");
      this.spinner.hide();
      this.geBikeSession();
    }, () => {
      this.loggerService.showErrorMessage("Executing unlock command failed");
      this.spinner.hide();
    })
  }

  addLock() {
    this.spinner.show();
    this.bikeService.sendLockCommand(this.bikeId, true).subscribe(() => {
      this.loggerService.showSuccessfulMessage("Lock command executed successfully");
      this.spinner.hide();
      this.geBikeSession();
    }, () => {
      this.loggerService.showErrorMessage("Executing lock command failed");
      this.spinner.hide();
    })
  }

  openDialog(): void {
    let feeResult = false;
    const dialogRef = this.dialog.open(SessionTerminateDialogComponent, {
      width: '300px',
      data: { bikeId: this.bikeId, comment: this.comment, rideSessionId: this.bikeSession.CurrentSessionId, isFeeIncluded: feeResult }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result != null) {
        this.terminateSession(result);
      }
      this.comment = "";
    });
  }

  terminateSession(result) {
    let comment = { Comment: result.comment, RideSessionId: result.rideSessionId, IsTerminatedWithFee: result.isFeeIncluded };
    this.spinner.show();
    this.sessionService.terminateSession(result.bikeId, comment)
      .subscribe(data => {
        if (data.Status == true) {
          this.loggerService.showSuccessfulMessage('Successfully terminate the session.');
          this.spinner.hide();
          this.geBikeSession();
          this.mapElement.nativeElement.innerHTML = '';
          this.initializeMap();
        }
      }, (error: any) => {
        this.loggerService.showErrorMessage('Error occured while terminating the session.');
        this.spinner.hide();
      });
  }

  updateAddress(data: BikeAddress): void {
    this.bike.Address = data.Address;
  }

  createReportError() {
    const dialogRef = this.dialog.open(ReportErrorComponent, {
      width: '1100px',
      height: '780px',
      data: { 'group1': this.group1, 'group2': this.group2, 'group3': this.group3, 'bikeId': this.bikeId, 'sessionId': this.bikeSession.CurrentSessionId, 'bikeLocked': this.bikeLocked }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result != undefined && result.IsBikeDisabled && !this.bikeSession.CurrentSessionId && !this.bikeSession.Disabled) {
        var bikeStateChangeDTO = { Disabled: true, DisabledReason: BikeDisableState.CheckRequired };
        this.bikeService.enableDisableBike(this.bikeId, bikeStateChangeDTO)
          .subscribe(data => {
            this.loggerService.showSuccessfulMessage("Bike mode changed to Check-Required");
            this.geBikeSession();
            this.mapElement.nativeElement.innerHTML = '';
            this.initializeMap();
          }, error => {
            this.loggerService.showErrorMessage(error.error.Message);
            this.geBikeSession();
            this.mapElement.nativeElement.innerHTML = '';
            this.initializeMap();
          });
      }
      else {
        this.geBikeSession();
        this.mapElement.nativeElement.innerHTML = '';
        this.initializeMap();
      }
    });
    this.clearSelectedErrorCategories();
  }

  private getBikeSummary(bike) {
    if (bike.DockingPointId) {
      this.translate.get('SUPPORT.DOCKED_AT').subscribe(val => {
        this.summaryDetails = val + bike.DockingStationName;
      });
    }
    else if (!bike.DockingPointId && !bike.CurrentSessionId
      && (bike.BikeModeId == BikeModes.AvailableDocked || bike.BikeModeId == BikeModes.AvailableFree)) {
      this.translate.get('SUPPORT.AVAILABLE_BIKE').subscribe(val => {
        this.summaryDetails = val;
      });
    }
    else if (!bike.DockingPointId && !bike.CurrentSessionId
      && bike.Disabled) {
      this.translate.get('SUPPORT.DISABLED').subscribe(val => {
        this.summaryDetails = val;
      });
    }
    else if (!bike.DockingPointId && !bike.CurrentSessionId
      && bike.BikeModeId == BikeModes.InUsePassiveSession) {
      this.translate.get('SUPPORT.IN_USE_PASSIVE_SESSION').subscribe(val => {
        this.summaryDetails = val;
      });
    }
    else if (bike.CurrentSessionId && bike.LockState == LockState.UnlockedArrest) {
      this.translate.get('SUPPORT.IN_USE_AT').subscribe(val => {
        this.summaryDetails = val + bike.PositionAddress.Street;
      });
      this.bikeLocked = false;
    }
    else if (bike.CurrentSessionId && bike.LockState == LockState.LockedArrest) {
      this.translate.get('SUPPORT.TEMPORARILY_LOCKED_BY_CUSTOMER').subscribe(val => {
        this.summaryDetails = val;
      });
      this.bikeLocked = true;
    }
    else if (bike.CurrentSessionId && bike.LockState == LockState.InTransition) {
      this.translate.get('SUPPORT.IN_USE_LOCK_IN_TRANSITION').subscribe(val => {
        this.summaryDetails = val;
      });
    }
  }

  private getBikeSessionStatus(bike) {
    if (bike.CurrentSessionId && bike.BikeModeId == BikeModes.InUseInSession) {
      this.translate.get('SUPPORT.RENTED_BY').subscribe(val => {
        this.sessionDetails = val + bike.EndUserId;
      });
    }
    else if (!bike.DockingPointId && !bike.CurrentSessionId
      && bike.BikeModeId == BikeModes.InUsePassiveSession) {
      this.translate.get('SUPPORT.IN_PASSIVE_SESSION').subscribe(val => {
        this.sessionDetails = val;
      });
    }
    else if (!bike.CurrentSessionId
      && (bike.BikeModeId == BikeModes.AvailableDocked || bike.BikeModeId == BikeModes.AvailableFree)) {
      this.translate.get('SUPPORT.NO_ACTIVE_SESSION').subscribe(val => {
        this.sessionDetails = val;
      });
    }
    else if (!bike.CurrentSessionId && bike.Disabled) {
      this.translate.get('SUPPORT.NO_ACTIVE_SESSION').subscribe(val => {
        this.sessionDetails = val;
      });
    }
  }

  getBikeProperties(bike) {
    if (bike.DockingPointId) {
      this.bikeImagePath = `/assets/images/docked.png`;
      this.commandBtns.disableReportError = false;
    }
    else if (!bike.DockingPointId && !bike.CurrentSessionId) {
      this.bikeImagePath = `/assets/images/parked.png`;
      this.commandBtns.disableReportError = false;
    }
    else if (bike.CurrentSessionId && bike.LockState == LockState.UnlockedArrest) {
      this.bikeImagePath = `/assets/images/running.png`;
    }
    else if (bike.CurrentSessionId && bike.LockState == LockState.LockedArrest) {
      this.bikeImagePath = `/assets/images/parked.png`;
    }
    else if (bike.CurrentSessionId && bike.LockState == LockState.InTransition) {
      this.bikeImagePath = `/assets/images/parked.png`;
    }
    if (bike.CurrentSessionId) {
      this.commandBtns.disableReportError = false;
      this.commandBtns.disableFreeLock = false;
      this.commandBtns.disableEndSession = false;
    }
  }

  setHazardNotification(bike) {
    if (bike.Disabled == 1) {
      this.hazardText = "Is Disabled";
      this.hazardTextColor = "alert-label red";
      this.hazardImagePath = '/assets/images/disabled.png';
    } else {
      if (bike.ActiveIssueCount > 0) {
        this.hazardTextColor = "alert-label yellow";
        this.hazardText = "Has Issues";
        this.hazardImagePath = '/assets/images/active_issues.png';
      }
    }
  }

  getBikePositions(bikeId, from, to) {
    this.spinner.show();
    this.bikeService.getBikePositionDetails(bikeId, this.positionObservationId, from, to)
      .subscribe(data => {
        this.spinner.hide();
        this.updatePositionOnMap(data.Observations)
      }, () => {
        this.spinner.hide();
      })
  }

  //moving,to-workshop,in-workshop,in-storage
  getBikeDisabledReasonForCustomBikes() {
    if (this.bike["BikeModeId"] == BikeModes.DisabledInStorage)
      this.bike["DisabledReason"] = BikeDisableState.InStorage;
    else if (this.bike["BikeModeId"] == BikeModes.DisabledToWorkshop)
      this.bike["DisabledReason"] = BikeDisableState.ToWorkshop;
    else if (this.bike["BikeModeId"] == BikeModes.DisabledInWorkshop)
      this.bike["DisabledReason"] = BikeDisableState.InWorkshop;
    else if (this.bike["BikeModeId"] == BikeModes.DisabledMoving)
      this.bike["DisabledReason"] = BikeDisableState.Moving;
  }

  //update positions and draw the line between start and end position
  updatePositionOnMap(observations) {
    if (!observations || observations.length <= 0) return;
    let points = [];

    observations.forEach(element => {
      points.push([element.Value.Longitude, element.Value.Latitude])
    });

    let firstPosition = observations[0];
    let lastPosition = observations[observations.length - 1]
    let firstFeature = new OlFeature({
      geometry: new OlPoint(OlProj.transform([firstPosition.Value.Longitude, firstPosition.Value.Latitude], 'EPSG:4326', 'EPSG:3857')),
      type: this.bikeStatus.start,
      category: this.featureCategory.point,
      data: this.getMapPoint(firstPosition.Value)
    });

    this.source.addFeature(firstFeature);

    let lastFeature = new OlFeature({
      geometry: new OlPoint(OlProj.transform([lastPosition.Value.Longitude, lastPosition.Value.Latitude], 'EPSG:4326', 'EPSG:3857')),
      type: this.bikeStatus.running,
      category: this.featureCategory.point,
      data: this.getMapPoint(lastPosition.Value)
    });

    this.source.addFeature(lastFeature);

    // Draw line
    let lineFeature = new OlFeature({
      geometry: new OlLineString(points).transform('EPSG:4326', 'EPSG:3857'),
      category: this.featureCategory.line,
    });

    this.source.addFeature(lineFeature);
    this.zoomToExtent();
  }

  //when there are no position observations show current bike location on the map
  updateCurrentPosition(bike) {
    let position = bike.CurrentPosition;
    if (position != null) {
      let firstFeature = new OlFeature({
        geometry: new OlPoint(OlProj.transform([position.Longitude, position.Latitude], 'EPSG:4326', 'EPSG:3857')),
        type: this.getBikeStateDisplay(bike),
        data: this.getMapPoint(position),
        category: this.featureCategory.point,
      });
      this.source.addFeature(firstFeature);
      this.zoomToExtent();
    }
    else {
      this.loggerService.showErrorMessage("Bike currently does not have any position.");
    }
    //this.spinner.hide();
  }

  getBikeStateDisplay(bike): string {
    let text = "";
    if (bike.DockingPointId)
      text = this.bikeStatus.dock;
    else if (!bike.DockingPointId && bike.CurrentSessionId)
      text = this.bikeStatus.running;
    else if (!bike.DockingPointId && !bike.CurrentSessionId)
      text = this.bikeStatus.parked;
    return text;
  }

  getOnHoverInteracion(): OlSelect {
    let select = new OlSelect({
      condition: OlCondition.pointerMove,
      hitTolerance: 5,
      style: (f, r) => this.interactionStyleFunction(f)
    });
    select.on('select', (event) => {
      if (event.selected.length > 0) {
        let features = event.target.getFeatures().getArray();
        let feature = features[0];
        let data = feature.get('data');

        // change cursor to pointer
        this.mapElement.nativeElement.style.cursor = 'pointer';

        // show popup
        if (data) {
          this.popup.setPosition(event.mapBrowserEvent.coordinate);
          this.popupElement.nativeElement.style.display = '';
          this.popupElement.nativeElement.innerHTML =
            `<span>Longitude:${data.Longitude}</span><br/>
             <span>Latitude :${data.Latitude}</span><br/>
             <span>Altitude :${data.Altitude}</span><br/>`;
        }
      }
      else if (event.deselected.length > 0) {
        // reset cursor
        this.mapElement.nativeElement.style.cursor = '';
        // hide popup
        this.popupElement.nativeElement.style.display = 'none';
      }
    });
    return select;
  }

  interactionStyleFunction(feature: OlFeature) {
    let type = feature.get('type');
    let style;
    if (type != "dock-radius") {
      var color = type == this.bikeStatus.running ? this.colors.black : this.colors.blue
      let text = ""

      if (type == this.bikeStatus.start) {
        text = this.bikeStatus.start
      }
      else if (type == this.bikeStatus.running) {
        text = this.bikeStatus.running
      }
      else if (type == this.bikeStatus.dock) {
        text = this.bikeStatus.dock
      }
      else if (type == this.bikeStatus.parked) {
        text = this.bikeStatus.parked
      }

      style = this.getLayerStyle(color);
      if (feature.get('category') == this.featureCategory.point)
        style.getText().setText(text);
    }
    else
      style = MapExtension.getDockingStationRadiusStyles();

    return style;
  }

  styleFunction(feature: OlFeature) {
    let type = feature.get('type');
    var color = type == this.bikeStatus.running ? this.colors.black : this.colors.blue
    let text = ""

    if (type == this.bikeStatus.start) {
      text = this.bikeStatus.start
    }
    else if (type == this.bikeStatus.running) {
      text = this.bikeStatus.running
    }
    else if (type == this.bikeStatus.dock) {
      text = this.bikeStatus.dock
    }
    else if (type == this.bikeStatus.parked) {
      text = this.bikeStatus.parked
    }

    let style = this.getLayerStyle(color);
    if (feature.get('category') == this.featureCategory.point)
      style.getText().setText(text);

    return style;
  }

  private getLayerStyle(color) {
    var myStyle = new OlStyle({
      image: new OlCircle({
        radius: 5,
        fill: new OlFill({ color: color }),

      }),
      stroke: new OlStroke({
        color: '#04A3E3',
        width: 2
      }),
      text: new OlText({
        font: `bold 11px Roboto, "Helvetica Neue", sans-serif`,
        // offsetX: 10,         
        offsetY: -15, // 0
        textAlign: 'left',
        placement: 'point',
        fill: new OlFill({
          color: '#000'
        }),
        stroke: new OlStroke({
          color: '#FFF',
          width: 2
        })
      })
    })

    return myStyle;
  }

  private getMapPoint(position: any) {
    let point = {
      Longitude: position.Longitude,
      Latitude: position.Latitude,
      Altitude: position.Altitude,
    };
    return point;
  }

  //Define map zoom to the location
  private zoomToExtent(): void {
    if (this.vectorLayer) {
      let extent = this.source.getExtent();
      this.map.getView().fit(extent, { size: this.map.getSize(), maxZoom: 14 });
      this.map.updateSize();
    }
  }

  formatTimeDuration(pulseTime) {

    if (!pulseTime) return;
    let diff = new Date().getTime() - new Date(pulseTime).getTime()

    var diffDays = Math.abs(Math.round(diff / (1000 * 3600 * 24)));
    var diffHours = Math.abs(Math.round(diff / (1000 * 3600)));
    var diffMinutes = Math.abs(Math.round(diff / (1000 * 60)));
    var diffSeconds = Math.abs(Math.round(diff / (1000)));

    if (diffDays > 1) {
      this.pulseTimestamp = `${diffDays} days ago`
    }
    else if (diffHours > 1) {
      if (diffHours >= 24 && diffDays == 1) {
        this.pulseTimestamp = diffDays + " day ago";
      } else {
        this.pulseTimestamp = diffHours + " hours ago";
      }
    }
    else if (diffMinutes > 1) {
      if (diffMinutes >= 60 && diffHours == 1) {
        this.pulseTimestamp = diffHours + " hour ago";
      } else {
        this.pulseTimestamp = diffMinutes + " minutes ago";
      }
    }
    else {
      if (diffSeconds >= 60 && diffMinutes == 1) {
        this.pulseTimestamp = diffMinutes + " minute ago";
      } else {
        this.pulseTimestamp = diffSeconds + " seconds ago";
      }
    }
  }

  getLockStateVal(res) {
    var lockStateVal = "";
    if (res.LockState == LockState.InTransition)
      lockStateVal = "In Transition";
    else if (res.LockState == LockState.UnlockedArrest)
      lockStateVal = "Unlocked";
    else if (res.LockState == LockState.LockedArrest)
      lockStateVal = "Locked";
    return lockStateVal;
  }

  styleDockRadiusFunction(feature: OlFeature, resolution = null) {
    return MapExtension.getDockingStationRadiusStyles();
  }
}
