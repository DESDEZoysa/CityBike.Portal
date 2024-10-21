
import { forkJoin as observableForkJoin, Observable, Subscription } from 'rxjs';
import { DeliverWorkshopPopupComponent } from './../deliver-workshop-popup/deliver-workshop-popup.component';
import { UserService } from './../../services/users.service';
import { CarBikeDetailsPopupComponent } from './../car-bike-details-popup/car-bike-details-popup.component';
import { LiveMapConfirmPopupComponent } from './../live-map-confirm-popup/live-map-confirm-popup.component';
import { SignalRService } from './../../services/signalr.service';
import { SignalRSubscriber } from './../../core/models/live/signalr-subscriber';
import { EventService } from './../../services/events.service';
import { RepairRegisterPopupComponent } from './../../bikes/bike-support/repair-register-popup/repair-register-popup.component';
import { FreeBikePopupComponent } from './../free-bike-popup/free-bike-popup.component';
import { Component, OnInit, ElementRef, ViewChild, Input, OnChanges, OnDestroy, Renderer2 } from "@angular/core";
import { BikesService, LoggerService, SettingsService, AppSettings, DockingStationService, RepairService, IssueService } from "../../services";
import { Router, ActivatedRoute } from "@angular/router";
import { DockingStation } from "../../core/models";
import "rxjs/add/observable/forkJoin";
import "rxjs/add/observable/interval";
import * as moment from "moment";
import OlMap from "ol/map";
import BingMaps from 'ol/source/bingmaps';
import OlVector from "ol/source/vector";
import OlXYZ from "ol/source/xyz";
import OlTileLayer from "ol/layer/tile";
import OlVectorLayer from "ol/layer/vector";
import OlView from "ol/view";
import OlProj from "ol/proj";
import OlFeature from "ol/feature";
import OlLineString from 'ol/geom/linestring';
import OlPoint from "ol/geom/point";
import OlPolygon from 'ol/geom/polygon';
import OlStyle from "ol/style/style";
import OlCircle from "ol/style/circle";
import OlIcon from "ol/style/icon";
import OlText from "ol/style/text";
import OlStroke from "ol/style/stroke";
import OlFill from "ol/style/fill";
import OlOverlay from "ol/overlay";
import OlSelect from "ol/interaction/select";
import OlCondition from "ol/events/condition";
import OlInteraction from "ol/interaction";
import OlControl from "ol/control";
import PinchZoom from "ol/interaction/pinchzoom";
import OlAttribution from "ol/control/attribution";
import OlExtent from "ol/extent";
import { BikeStatusColor } from "../../core/constants/bike-status-color";
import { DockingStationExtension, MapExtension } from "../../core/extensions";
import { PositionRecalculationExtension } from "../../core/extensions/position-recalculation.extension";
import { LiveMap } from "../../core/constants/live-map";
import { NgxSpinnerService } from "ngx-spinner";
import OlCluster from "ol/source/cluster";
import { StationColors, LocalStorageKeys } from "../../core/constants";
import { BikeDisableState } from "../../core/enums/bikeDisableState";
import { MatDialog } from "@angular/material/dialog";
import { MatSidenav } from "@angular/material/sidenav";
import { BikeStatus } from "../../core/enums/bikeStatus";
import { LockState } from "../../core/enums/lockState";
import { UserRoles } from "../../core/constants/user-roles";
const ALL: string = "all";
const ON_TRIPS: string = "ontrips";
const NOT_ON_TRIPS: string = "notontrips";
import { Location } from '@angular/common';
import { ReportErrorComponent } from "../../bikes/bike-support/report-error/report-error.component";
import { TranslateService, LangChangeEvent } from "@ngx-translate/core";
import { TranslateMessageTypes } from '../../core/enums/TranslateMessageTypes';
import Geolocation from "ol/geolocation";
import { WorkshopSelectionPopupComponent } from '../workshop-selection-popup/workshop-selection-popup.component';
import { WorkshopService } from '../../services/workshop.service';
import { CommonHandler } from '../../core/handlers/common-handler';
import { CommonService } from '../../services/common-service';
import { RepairOrdersService } from '../../services/repair-orders.service';
import { ConvertTimePipe } from '../../core/pipes/convert-time.pipe';
import { DockingPointDetailsPopupComponent } from '../docking-point-details-popup/docking-point-details-popup.component';
import { ConfirmationDpCheckPopupComponent } from '../confirmation-dp-check-popup/confirmation-dp-check-popup.component';
import { DockingPointDisabledReason } from '../../core/enums/dockingPointDisabledReason';
import { DockingPointErrorReportPopupComponent } from '../docking-point-error-report-popup/docking-point-error-report-popup.component';
import { RepairRegisterFormPopupComponent } from '../../bikes/bike-details/repair-register-form-popup/repair-register-form-popup.component';
import { RouteService } from '../../services/route.service';
import { RouteStatus } from '../../core/enums/routeStatus';
import { WaypointUpdatePopupComponent } from '../../routes/waypoint-update-popup/waypoint-update-popup.component';
import { PowerState } from '../../core/enums/powerState';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { UserPrivileges } from '../../core/enums/userPrivileges';
import { ZonesService } from '../../services/zones.service';
const PREDICT_HOUR: number = 3;

@Component({
  selector: "app-live-map",
  templateUrl: "./live-map.component.html",
  styleUrls: ["./live-map.component.scss"],
  providers: [ConvertTimePipe]
})
export class LiveMapComponent implements OnInit, OnChanges, OnDestroy {
  @ViewChild("trackmap", { static: true }) mapElement: ElementRef;
  @ViewChild("popup", { static: true }) popupElement: ElementRef;
  @ViewChild("marker", { static: false }) marker: ElementRef;
  private markertxtsingle: ElementRef;
  refreshDock: any;
  undockBikes = [];
  selectedElem: any;
  isLockState: boolean;
  isInProcess: boolean = false;
  takenOutBikes: any[];
  repairGroup1: any;
  repairGroup2: any;
  repairgroup3: any;
  disableBike: any;
  otherFell: any;
  otherCritical: any;
  selectedErrorCategories: any;
  comments: any;
  isDocked: any;
  isChecking: any;
  isTransportation: boolean;
  checkedCategories: any[];
  isPlaceFree: any;
  isTransInProcess: boolean;
  isCarOpened: boolean;
  transportBikes: any[];
  loggedInUser: any;
  carTranportObj: any;
  isDialogOpened: boolean;
  isToWorkshop: any;
  isStorage: any;
  isCarChecking: any;
  allUserPositions: any;
  carSource: any;
  geolocationTimerId: any;
  nearByWorkshopTimerId: any;
  isErrorReported: any;
  bikeIssues: any;
  authToken: any;
  allWorkshops: any;
  allNearbyWorkshops: any[];
  allBikes: any;
  mouseOver: boolean;
  isMouseOverAndDockClicked: boolean;
  dockSmallLayer: any;
  isUserSupport: any;
  selectedStorageId: any;
  isCarInRange: boolean;
  isMobileOnly: boolean = false;
  bikeMap: boolean = true;
  dockMap: boolean = true;
  zoneMap: boolean = false;
  carUser: any;
  dpErrorCategories: any;
  driveTrain: any[];
  light: any[];
  dockingComponents: any[];
  pedalArm: any[];
  seat: any[];
  cables: any[];
  mudguards: any[];
  handlebarComponents: any[];
  pcb: any[];
  brakeSystem: any[];
  wheels: any[];
  otherComponents: any[];
  userWorkshopId: any;
  routePath: any;
  isWaypoint: boolean;
  isRouteStatus: boolean;
  isCompletedOrSkipped: boolean;
  view: OlView;
  nextWaypointId: number = 0;
  enableRoutes: boolean;
  dsLastCheckDetails: any;
  dsLoading: boolean;
  dsDisabled: boolean;
  isDockedDialogOpened: any;
  dsDisabledReason: any;
  userPrivilegeId: any;
  allZones: any;
  preferredZone: any;
  issueDocks: any;

  @ViewChild("markertxtsingle", { static: false }) set markertxtSingleRef(markertxtsingle: ElementRef) {
    this.markertxtsingle = markertxtsingle;
  }
  private markertxt2single: ElementRef;
  @ViewChild("markertxt2single", { static: false }) set markertxt2SingleReg(markertxt2single: ElementRef) {
    this.markertxt2single = markertxt2single;
  }
  @ViewChild("markerside", { static: false }) markerside: ElementRef;
  @ViewChild("drawer", { static: false }) drawer: MatSidenav;
  @Input() from: any;
  @Input() to: any;
  sub: any;

  count = 0;
  resultSet;
  bikes = [];
  updatedBikes = [];
  bikeId: any;
  positionObservationId = 300;
  refreshIntervalId: any;

  map: OlMap;
  //source: OlXYZ;
  layer: OlVectorLayer;
  dockLayer: OlVectorLayer;
  routeLayer: OlVectorLayer;
  dockRadiusLayer: OlVectorLayer;
  bingLabelsLayer: OlTileLayer;
  tileLayer: OlTileLayer;
  wayPointLayer: OlTileLayer;
  zoneLayer: OlVectorLayer;
  style: OlStyle;
  popup: OlOverlay;
  onClick: OlSelect;
  lastExtent: any;
  subscription: Subscription;
  scaleMap: boolean = false;
  showlegend = false;
  selectedMap: any;
  isMobile: boolean = false;

  vectorLayers: OlVectorLayer[];
  docks = [];


  legendItems = LiveMap.legendInfo;
  clusterSource: any;
  distance: any = 70;
  source: any;
  filteredBikes = [];
  geoLayer: OlVectorLayer;
  legendStationItems = LiveMap.stationLegendInfo;
  legendMobile: any[];
  isCluster: boolean = false;
  bikePositions: any[];
  dockingStationBikes: any[];
  dockingStationName: any;
  isOpened: boolean = false;
  dockingStationId: any = null;
  numberOfAvailableBikes: any;
  idealBikes: any;
  promisedBikes: any;
  IsTransportOrderOrRepairExist: boolean = false;
  isServiceOpened: boolean = false;
  bike: any;
  ServiceCompleted: boolean = false;
  bikeMoving: boolean = false;
  isLoading: boolean = false;
  isLooseBike: boolean = false;
  routeId: number = 0;

  errorCategories: any[];
  group1: any[];
  group2: any[];
  group3: any[];
  selectedFeature: any;

  //signalR
  signalList: SignalRSubscriber[] = [];

  //show all radius toggle
  isShowAllRadius: boolean = false;

  //show satelite map toggle
  isSateliteMode: boolean = false;

  //show only with issues (ds/bikes)
  isShowOnlyWithIssues: boolean = false;

  //show map options
  showMapOptions: boolean = false;

  constructor(
    private bikesService: BikesService,
    private settingsService: SettingsService,
    private router: Router,
    private route: ActivatedRoute,
    private loggerService: LoggerService,
    private appSettings: AppSettings,
    private stationService: DockingStationService,
    private spinner: NgxSpinnerService,
    private repairService: RepairService,
    private location: Location,
    private dialog: MatDialog,
    private issueService: IssueService,
    private translate: TranslateService, private renderer: Renderer2,
    private eventService: EventService, private signalRService: SignalRService, private userService: UserService, private workshopService: WorkshopService,
    private commonService: CommonService,
    private repairOrderService: RepairOrdersService,
    private convertTime: ConvertTimePipe,
    public routeService: RouteService,
    public zonesService: ZonesService
  ) {
    if (
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      )
    ) {
      this.isMobile = true;
      this.legendMobile = this.legendItems.concat(this.legendStationItems);
    }

    if (/Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    )) {
      this.isMobileOnly = true;
    }

    this.authToken = JSON.parse(
      localStorage.getItem(LocalStorageKeys.OAUTH_TOKEN)
    );
    this.isUserSupport = this.authToken._claims[0] == UserRoles.CUSTOMER_SERVICE;
    this.mouseOver = false;
    this.scaleMap = true;
    this.group1 = [];
    this.group2 = [];
    this.group3 = [];
    this.repairGroup1 = [];
    this.repairGroup2 = [];
    this.repairgroup3 = [];
    this.dockingStationBikes = [];
    this.transportBikes = [];
    this.allUserPositions = [];
    this.undockBikes = [];
    this.allWorkshops = [];

    this.driveTrain = [];
    this.light = [];
    this.dockingComponents = [];
    this.pedalArm = [];
    this.seat = [];
    this.cables = [];
    this.mudguards = [];
    this.handlebarComponents = [];
    this.pcb = [];
    this.brakeSystem = [];
    this.wheels = [];
    this.otherComponents = [];
    this.allZones = [];
  }

  ngOnInit() {
    //get user info
    this.loggedInUser = JSON.parse(localStorage.getItem("user_details"));
    if (!this.loggedInUser) {
      setTimeout(() => {
        this.loggedInUser = JSON.parse(localStorage.getItem("user_details"));
        this.loadDefaultData();
      }, 800);
    }
    else
      this.loadDefaultData();
  }

  getUserPrivilegeDetails(userId) {
    this.userService.getUserPrivilegeByUser(userId).subscribe(res => {
      this.userWorkshopId = res?.["WorkshopId"];
      this.userPrivilegeId = res?.["PrivilegeId"];

    }, err => {

    });
  }


  private loadDefaultData() {
    this.preferredZone = JSON.parse(localStorage.getItem(LocalStorageKeys.PREFERRED_TIMEZONE));
    // get bikes in car
    this.GetBikesInCar();
    // get all workshops
    this.GetAllWorkshops();
    // get all user positions
    this.GetAllUserPositions();

    //get all zones data
    this.getAllFilteredLatestZoneBikeDemandInfo();

    this.signalRService.startConnection();
    //signalR message received
    this.signalRService.signalReceived.subscribe((signal: SignalRSubscriber) => {
      if (signal.id == 450 && signal.value) {
        //remove from undockBikes list
        this.undockBikes = this.undockBikes.filter(x => x.Serial != signal.serial);
        // needed sometimes when docked from car view
        let isInTransport = false;
        if (this.carTranportObj) {
          let isTransportExist = this.transportBikes.find(y => y.Serial == signal.serial);
          if (isTransportExist)
            isInTransport = true;
          this.transportBikes = this.transportBikes.filter(y => y.Serial != signal.serial);
          this.UpdateBikeTransport();
        }
        var takenOut = this.takenOutBikes.find(x => x.Serial == signal.serial);
        var dockedOut = this.dockingStationBikes.find(x => x.Serial == signal.serial);
        if (takenOut) {
          this.TakenOutBikeInit(signal, isInTransport, takenOut);
        }
        else if (dockedOut) {
          this.DockedBikeInit(signal, isInTransport, dockedOut);
        }
      }

      //handle button switch when undock bikes taken out
      else if (signal.id == 450 && !signal.value) {
        this.GetBikePCBOnTakenOut(signal.bike);
      }
    });
    this.renderer.addClass(document.body, 'bike-map');
    //store undocked/unlocked bikes temporarily
    this.takenOutBikes = [];
    this.isDocked = false;
    this.isChecking = false;
    //check for query params
    let general: string = this.route.snapshot.paramMap.get('general');
    let servicePanel: string = this.route.snapshot.paramMap.get('services');
    let carPanel: string = this.route.snapshot.paramMap.get('car');
    let stationId: string = this.route.snapshot.paramMap.get('stationId');
    let bikeId: string = this.route.snapshot.paramMap.get('bikeId');
    this.routeId = +this.route.snapshot.paramMap.get('routeId');
    this.isLoading = false;
    this.isOpened = general == "1" ? true : false;
    this.isServiceOpened = servicePanel == "1" ? true : false;
    this.isCarOpened = carPanel == "1" ? true : false;
    if (stationId && stationId != "null")
      this.dockingStationId = parseInt(stationId);
    else if (stationId == "null")
      this.isLooseBike = true;
    if ((this.isOpened || this.isServiceOpened) && this.dockingStationId) {
      this.getDockingStationDetails(this.dockingStationId, false);
    }
    if (bikeId) {
      this.bikeId = bikeId;
      observableForkJoin(
        [this.bikesService.getBikeDetails(this.bikeId),
        this.bikesService.getBikeServiceByBikeId(this.bikeId)]
      ).subscribe(result => {
        this.bike = result[0];
        var bikeSession = result[1];
        this.bike.CurrentChargeLevel = this.bike.ChargeLevel;
        if (bikeSession) {
          this.bike.CheckDate = bikeSession.CheckDate;
          this.bike.NumberOfChecks = bikeSession.NumberOfChecks;
          this.bike.ServiceId = bikeSession.Id;
        }
        else {
          this.bike.CheckDate = null;
          this.bike.NumberOfChecks = 0;
        }
      }, error => {
        this.loggerService.showErrorMessage("Error while getting bike details");
      });
    }
    this.loadErrorCategories();
    this.loadRepairCategories();
    this.getAllDPErrorCategories();
    this.translate.onLangChange.subscribe((params: LangChangeEvent) => {
      this.translateAllCategories();
      this.translateAllRepairCategories();
    });
    this.initializeMap();
    this.loadRepairRegisterCategories();

    if (this.authToken && this.authToken._claims[0] == UserRoles.STREET_TEAM) {
      this.getUserPrivilegeDetails(this.loggedInUser.UserId);
    }

    //set route enabled flag
    this.enableRoutes = this.appSettings.enable_insight;
  }

  private DockedBikeInit(signal: SignalRSubscriber, isInTransport: boolean, dockedOut: any) {
    if (signal.bike.disabledReason != BikeDisableState.InWorkshop && signal.bike.disabledReason != BikeDisableState.ToWorkshop && signal.bike.disabledReason != BikeDisableState.CheckRequired) {
      //resolved all the issues for check and dock bikes (excluding moving bikes)
      if (!isInTransport && signal.bike.resolved > 0) {
        this.ResolveIssuePerBike(dockedOut.BikeId);
        signal.bike.resolved = 0;
        signal.bike["HasCriticalIssue"] = false;
        dockedOut["ReportedDate"] = new Date(new Date().toUTCString());
      }

      //bike service details create or update
      if (!isInTransport && !dockedOut.NumberOfChecks)
        dockedOut["NumberOfChecks"] = 0;
      var bikeServiceDTO = { NumberOfChecks: dockedOut.NumberOfChecks, BikeId: dockedOut.BikeId };
      if (!isInTransport) {
        this.CreateOrUpdateBikeServiceForDocked(bikeServiceDTO, true, dockedOut);
        dockedOut["isDPHWIDReceived"] = true;

        //reset unsuccessful session count when check completed
        this.resetUndockFailureCountByBike();
      }
      else {
        setTimeout(() => this.GetDockingStationDetailsByIdAtDocked(this.dockingStationId, dockedOut), 5000);
        dockedOut["isDPHWIDReceived"] = false;
      }

      if (!dockedOut["PreviousBikeStatus"]) {
        if (signal.bike.resolved == 0)
          dockedOut["BikeStatus"] = BikeStatus.DockedWithNoError;
        else
          dockedOut["BikeStatus"] = BikeStatus.DockedWithError;
      }
      else if (dockedOut["PreviousBikeStatus"] == dockedOut["BikeStatus"]) {
        if (signal.bike.resolved == 0)
          dockedOut["BikeStatus"] = BikeStatus.DockedWithNoError;
        else
          dockedOut["BikeStatus"] = BikeStatus.DockedWithError;
      }
      else if (dockedOut["PreviousBikeStatus"]) {

        if (!dockedOut["isCancelled"]) {
          dockedOut["BikeStatus"] = dockedOut["PreviousBikeStatus"];
        }
        else {
          if (signal.bike.resolved == 0)
            dockedOut["BikeStatus"] = BikeStatus.DockedWithNoError;
          else
            dockedOut["BikeStatus"] = BikeStatus.DockedWithError;
        }
      }
      if (!isInTransport)
        dockedOut["CheckDate"] = new Date(new Date().toUTCString());
    }
    else {
      if (signal.bike.disabledReason == BikeDisableState.ToWorkshop)
        dockedOut["BikeStatus"] = BikeStatus.Disabled;
      else if (signal.bike.disabledReason == BikeDisableState.InWorkshop)
        dockedOut["BikeStatus"] = BikeStatus.Disabled;
      else if (signal.bike.disabledReason == BikeDisableState.CheckRequired)
        dockedOut["BikeStatus"] = BikeStatus.Disabled;
    }
    dockedOut["isTakenOut"] = false;
    dockedOut["isCheckCompleted"] = false;
    dockedOut['isCancelled'] = false;
    dockedOut["isUndocking"] = false;
    dockedOut["isChecked"] = false;
    dockedOut["isTransTakenOut"] = false;
    dockedOut["isTransUndocking"] = false;
    dockedOut["isTransChecked"] = false;
    dockedOut["retryTime"] = 0;
    var index = this.dockingStationBikes.findIndex(x => x.Serial == signal.serial);
    this.dockingStationBikes[index] = dockedOut;
    this.isTransInProcess = false;
  }

  private TakenOutBikeInit(signal: SignalRSubscriber, isInTransport: boolean, takenOut: any) {
    if (signal.bike.disabledReason != BikeDisableState.InWorkshop && signal.bike.disabledReason != BikeDisableState.ToWorkshop && signal.bike.disabledReason != BikeDisableState.CheckRequired) {
      //resolved all the issues for check and dock bikes (excluding moving bikes)
      if (!isInTransport && signal.bike.resolved > 0) {
        this.ResolveIssuePerBike(takenOut.BikeId);
        signal.bike.resolved = 0;
        signal.bike["HasCriticalIssue"] = false;
        takenOut["ReportedDate"] = new Date(new Date().toUTCString());
      }
      //bike service details create or update
      if (!isInTransport && !takenOut.NumberOfChecks)
        takenOut["NumberOfChecks"] = 0;
      var bikeServiceDTO = { NumberOfChecks: takenOut.NumberOfChecks, BikeId: takenOut.BikeId };
      if (!isInTransport && !takenOut["isDPHWIDReceived"]) {
        this.CreateOrUpdateBikeServiceForDocked(bikeServiceDTO, false, takenOut);
        takenOut["isDPHWIDReceived"] = true;

        //reset unsuccessful session count when check completed
        this.resetUndockFailureCountByBike();
      }
      else {
        setTimeout(() => this.GetDockingStationDetailsByIdAtTakenOutDocked(this.dockingStationId, takenOut), 5000);
        takenOut["isDPHWIDReceived"] = false;
      }
      if (!takenOut["PreviousBikeStatus"]) {
        if (signal.bike.resolved == 0)
          takenOut["BikeStatus"] = BikeStatus.DockedWithNoError;
        else
          takenOut["BikeStatus"] = BikeStatus.DockedWithError;
      }
      else if (takenOut["PreviousBikeStatus"] == takenOut["BikeStatus"]) {
        if (signal.bike.resolved == 0)
          takenOut["BikeStatus"] = BikeStatus.DockedWithNoError;
        else
          takenOut["BikeStatus"] = BikeStatus.DockedWithError;
      }
      else if (takenOut["PreviousBikeStatus"]) {
        //new addition added to this to make bike check required when docked with issues
        if (takenOut["DisableState"] == BikeDisableState.Moving || takenOut["DisableState"] == BikeDisableState.Testing ||
          takenOut["DisableState"] == BikeDisableState.InWorkshop) {
          takenOut["BikeStatus"] = BikeStatus.Disabled;
        }
        else {
          if (!takenOut["isCancelRedocked"]) {
            if (!takenOut["isCancelled"])
              takenOut["BikeStatus"] = takenOut["PreviousBikeStatus"];
            else {
              if (signal.bike.resolved == 0)
                takenOut["BikeStatus"] = BikeStatus.DockedWithNoError;
              else
                takenOut["BikeStatus"] = BikeStatus.DockedWithError;
            }
            takenOut["isCancelRedocked"] = true;
          }
        }
      }
      if (!isInTransport)
        takenOut["CheckDate"] = new Date(new Date().toUTCString());
    }
    else {
      if (signal.bike.disabledReason == BikeDisableState.ToWorkshop)
        takenOut["BikeStatus"] = BikeStatus.Disabled;
      else if (signal.bike.disabledReason == BikeDisableState.InWorkshop)
        takenOut["BikeStatus"] = BikeStatus.Disabled;
      else if (signal.bike.disabledReason == BikeDisableState.CheckRequired)
        takenOut["BikeStatus"] = BikeStatus.Disabled;
    }
    takenOut["isTakenOut"] = false;
    takenOut["isCheckCompleted"] = false;
    takenOut['isCancelled'] = false;
    takenOut["isUndocking"] = false;
    takenOut["isChecked"] = false;
    takenOut["isTransTakenOut"] = false;
    takenOut["isTransUndocking"] = false;
    takenOut["isTransChecked"] = false;
    takenOut["retryTime"] = 0;
    var index = this.takenOutBikes.findIndex(x => x.Serial == signal.serial);
    this.takenOutBikes[index] = takenOut;
    this.isTransInProcess = false;
    //remove dockingpoint from main list to show only in takenOutBikes list (for temporary purpose)
    this.dockingStationBikes = this.dockingStationBikes.filter(x => x.DockingPointId != takenOut["DockingPointId"]);
  }

  ngAfterViewInit() {
    if (this.dockingStationId) {
      // temporarily commented until test get success with new flow
      // this.GetDockingStationDetailsById(this.dockingStationId);
    }
  }

  //reload essential bike details
  RefreshDetails() {
    this.getDockingStationDetails(this.dockingStationId, false);
    this.getBikeDetails();
  }


  ngOnChanges() {
    if (this.count > 0) {
      // this.cleanMap();
    }
    if (this.layer) {
      this.setCurrentExtent();
    }
  }


  getDockingStations() {
    if (!this.isLoading)
      this.spinner.show();

    let observableReqs = null;
    if (this.routeId) {
      observableReqs = observableForkJoin([
        this.stationService.getDockingStationsByArea(true),
        this.bikesService.getBikes(),
        this.routeService.getRouteDataById(this.routeId)
      ]);
    }
    else {
      observableReqs = observableForkJoin([
        this.stationService.getDockingStationsByArea(true),
        this.bikesService.getBikes()
      ]);
    }
    observableReqs.subscribe(
      data => {
        this.docks = data[0];
        this.allBikes = data[1];
        this.loadBikePositions();

        //routepath load
        if (this.routeId)
          this.routePath = data[2];
        if (this.routePath)
          this.routePath.Waypoints = this.routePath.Waypoints.sort((a, b) => (a.Order > b.Order) ? 1 : -1);
        this.loadRoutePaths();

        this.refreshIntervalId = setInterval(
          () => this.RefreshMapWithContent(),
          90000
        );
      },
      error => {
        this.loggerService.showErrorMessage(error);
      }
    );
  }

  getDockingStationsRefresh() {
    if (!this.isOpened)
      this.isWaypoint = false;
    if (!this.isLoading)
      this.spinner.show();

    let timeZone = "UTC";
    if (this.preferredZone == "CET")
      timeZone = "CET";

    let observableReqs = null;
    if (this.routeId) {
      observableReqs = observableForkJoin([
        this.stationService.getDockingStationsByArea(true),
        this.bikesService.getBikes(),
        this.userService.getAllUserPositions(),
        this.zonesService.getFilteredLatestZoneBikeDemandInfo(timeZone),
        this.routeService.getRouteDataById(this.routeId)
      ]);
    }
    else {
      observableReqs = observableForkJoin([
        this.stationService.getDockingStationsByArea(true),
        this.bikesService.getBikes(),
        this.userService.getAllUserPositions(),
        this.zonesService.getFilteredLatestZoneBikeDemandInfo(timeZone)
      ]);
    }
    observableReqs.subscribe(
      data => {
        this.docks = data[0];
        this.allBikes = data[1];
        this.loadBikePositions();

        this.allUserPositions = data[2];
        this.loadCars(this.allUserPositions);

        if (data[3]) {
          let zoneData = this.getMappedZoneData(data[3]);
          this.allZones = zoneData;
          this.loadZones(zoneData);
        }

        if (this.routeId)
          this.routePath = data[4];
        if (this.routePath)
          this.routePath.Waypoints = this.routePath.Waypoints.sort((a, b) => (a.Order > b.Order) ? 1 : -1);
        this.loadRoutePaths();
      },
      error => {
        this.loggerService.showErrorMessage(error);
      }
    );
  }

  initializeMap() {
    let existsZoomLevel = this.settingsService.getLiveMapZoomLevel();
    let mapZoomLevel = existsZoomLevel ? Number(existsZoomLevel) : 16;

    this.source = new OlVector({});
    this.carSource = new OlVector({});
    this.clusterSource = new OlCluster({
      distance: this.distance,
      source: this.source
    });

    this.layer = new OlVectorLayer({
      style: (f, r) => this.styleFunction(f, r),
      source: this.source
    });

    this.dockLayer = new OlVectorLayer({
      style: (f, r) => this.styleDockFunction(f, r),
      source: new OlVector({})
    });

    this.routeLayer = new OlVectorLayer({
      style: (f, r) => this.routeStyleFunction(f, r),
      source: new OlVector({})
    });

    this.dockSmallLayer = new OlVectorLayer({
      style: (f, r) => this.styleSmallDockFunction(f, r),
      source: new OlVector({})
    });

    this.wayPointLayer = new OlVectorLayer({
      style: (f, r) => this.wayPointStyleFunction(f, r),
      source: new OlVector({})
    });

    this.dockRadiusLayer = new OlVectorLayer({
      style: (f, r) => this.styleDockRadiusFunction(f, this.dockingStationId, r),
      source: new OlVector({})
    });

    this.geoLayer = new OlVectorLayer({
      // style: (f, r) => this.styleLabelFunction(f, r),
      source: this.carSource
    });

    this.zoneLayer = new OlVectorLayer({
      style: (f, r) => this.styleZoneFunction(f, r),
      source: new OlVector({})
    });

    this.tileLayer = new OlTileLayer({
      source: new OlXYZ({
        crossOrigin: null,
        url:
          "https://cartodb-basemaps-{a-c}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png",
        attributions: "© OpenStreetMap"
      })
    });

    this.bingLabelsLayer = new OlTileLayer({
      visible: false,
      source: new BingMaps({
        key: this.appSettings.bing_map_key,
        imagerySet: 'AerialWithLabels'
      })
    });

    //default disable satelite view
    this.bingLabelsLayer.setVisible(false);

    this.view = new OlView({
      center: OlProj.fromLonLat(this.appSettings.map_center_position),
      zoom: mapZoomLevel,
      minZoom: 3,
      maxZoom: 22
    });

    this.map = new OlMap({
      interactions: OlInteraction.defaults().extend([new PinchZoom()]),
      controls: OlControl.defaults().extend([new OlAttribution()]),
      layers: [this.tileLayer, this.bingLabelsLayer, this.zoneLayer, this.routeLayer, this.wayPointLayer,
      this.dockLayer, this.dockSmallLayer, this.dockRadiusLayer, this.layer, this.geoLayer],
      view: this.view
    });


    let markerSource = this.geoLayer.getSource();
    var authToken = JSON.parse(
      localStorage.getItem(LocalStorageKeys.OAUTH_TOKEN)
    );
    if (authToken._claims[0] == UserRoles.STREET_TEAM) {
      let geolocation = new Geolocation({
        // enableHighAccuracy must be set to true to have the heading value.
        trackingOptions: {
          enableHighAccuracy: true
        },
        tracking: true,
        projection: this.view.getProjection()
      });

      // var loggedInUser = JSON.parse(localStorage.getItem("user_details"));
      var userCoordinateString = localStorage.getItem("currentCoordinates");
      var userCoordinates = userCoordinateString ? userCoordinateString.split(",") : [];

      //additional check to remove existing when returns to page to avoid several intervals running
      if (this.nearByWorkshopTimerId)
        clearInterval(this.nearByWorkshopTimerId);

      let geoCoordinates = OlProj.transform(userCoordinates, "EPSG:3857", "EPSG:4326");
      let positionDTO = { "Latitude": geoCoordinates[1], "Longitude": geoCoordinates[0] }
      this.GetAllNearByWorkshops(positionDTO);

      let positionFeature = new OlFeature({
        name: this.loggedInUser.UserId.toString(),
        data: { 'user': this.loggedInUser, 'Latitude': userCoordinates[1], 'Longitude': userCoordinates[0], 'numberOfBikes': this.transportBikes.length },
        // color: color,
        type: "car"
      });
      positionFeature.setStyle(this.getGeoLayerStyle());


      geolocation.on('change', function () {
        let coordinates = geolocation.getPosition();
        let accuracy = geolocation.getAccuracy();
        let altitude = geolocation.getAltitude();
        let heading = geolocation.getHeading() || 0;
        let speed = geolocation.getSpeed() || 0;

        //wait for 1 minutes and save/update user geo positions to table
        if (!this.geolocationTimerId) {
          this.geolocationTimerId = setInterval(() => {
            let isLoggedInUserExist = this.allUserPositions.find(x => x.UserId == this.loggedInUser.UserId);
            if (!isLoggedInUserExist) {
              let userPosition = {
                Timestamp: new Date(),
                Position: {
                  Longitude: (coordinates) ? coordinates[0] : null,
                  Latitude: (coordinates) ? coordinates[1] : null,
                  Altitude: (altitude) ? altitude : 0
                },
                Speed: (speed) ? speed : 0,
                Quality: (accuracy) ? accuracy : 0,
                Heading: (heading) ? heading : 0
              }
              this.AddUserPosition(userPosition);
            }
            else {
              let userPosition = {
                Timestamp: new Date(),
                Position: {
                  Longitude: (coordinates) ? coordinates[0] : null,
                  Latitude: (coordinates) ? coordinates[1] : null,
                  Altitude: (altitude) ? altitude : 0
                },
                Speed: (speed) ? speed : 0,
                Quality: (accuracy) ? accuracy : null,
                Heading: (heading) ? heading : 0,
                LastUpdated: new Date(isLoggedInUserExist["Timestamp"])
              }
              this.UpdateUserPosition(userPosition);
            }
          }, 60000);
        }
        //set geolocation coordinates start
        positionFeature.setGeometry(coordinates ? new OlPoint(coordinates) : null);
        positionFeature.set('data', { 'user': this.loggedInUser, 'Latitude': coordinates[1], 'Longitude': coordinates[0], 'numberOfBikes': this.transportBikes.length });
        let style = positionFeature.getStyle();
        style.getText().setText(this.transportBikes.length.toString());
        //auto center only at once
        let currentCoordinates = localStorage.getItem("currentCoordinates");
        if (currentCoordinates == null && !this.routeId) {
          this.view.setCenter(coordinates);
        }
        localStorage.setItem("currentCoordinates", coordinates);

        let geoCoordinates = OlProj.transform(coordinates, "EPSG:3857", "EPSG:4326");
        //console.log(geoCoordinates);
        if (!this.nearByWorkshopTimerId) {
          this.nearByWorkshopTimerId = setInterval(() => {
            let positionDTO = { "Latitude": geoCoordinates[1], "Longitude": geoCoordinates[0] }
            this.GetAllNearByWorkshops(positionDTO);
          }, 300000);
        }
        //set geolocation coordinates end
      }.bind(this));


      //check if currentCoordinates are set to local storage or not
      let currentCoordinates = localStorage.getItem("currentCoordinates");
      if (currentCoordinates != null) {
        var currentPosition = currentCoordinates.split(",").map(function (x) {
          return parseFloat(x);
        });
        positionFeature.setGeometry(new OlPoint(currentPosition));
        //add center to current position
        if (!this.routeId) {
          this.map.getView().setCenter(currentPosition);
        }
      }
      positionFeature.setId(this.loggedInUser.UserId);

      //only show street team car if user privilege is not individual
      setInterval(() => {
        if (!this.userPrivilegeId || (this.userPrivilegeId && this.userPrivilegeId != UserPrivileges.Individual)) {
          this.carSource.addFeature(positionFeature);
        }
      }, 5000);
    }

    // add select interaction for single-click
    this.map.addInteraction(this.getOnClickInteraction());
    // add select interaction for on hover
    this.map.addInteraction(this.getOnHoverInteracion());

    // overlay/popup that will show on mouse hover
    this.popup = new OlOverlay({
      element: this.popupElement.nativeElement,
      offset: [10, 10]
    });

    this.map.addOverlay(this.popup);

    if (this.map)
      this.adjustLayers({ 'bike': this.bikeMap, 'dock': this.dockMap, 'zone': this.zoneMap });

    this.map.setTarget(this.mapElement.nativeElement);

    this.map.on(
      "singleclick",
      function (event) {
        //if showMapOptions opened close
        if (this.showMapOptions)
          this.showMapOptions = false;

        if (this.mouseOver && !this.isMouseOverAndDockClicked) {
          // this.mouseOver = false;
          this.isMouseOverAndDockClicked = true;
          return;
        }
        else if (this.mouseOver && this.isMouseOverAndDockClicked) {
          this.isMouseOverAndDockClicked = false;
          return;
        }

        if (!this.isCluster) {
          //this.isServiceOpened = false;
          this.isOpened = false;
          // this.isCarOpened = false;

          // remove radius from map
          if (!this.isShowAllRadius) {
            let dockRadiusFeature = this.dockRadiusLayer.getSource().getFeatures().find(x => x.getId() == this.dockingStationId);
            if (dockRadiusFeature)
              dockRadiusFeature.setStyle(null);
          }

          //When dock view closed refresh map to keep it upto date
          if (this.dockingStationId)
            this.RefreshMapWithContent();
          if (!this.mouseOver)
            this.dockingStationId = null;
          //construct url and pass it to change
          if (this.routeId) {
            const url = this
              .router
              .createUrlTree([{ routeId: this.routeId }], { relativeTo: this.route })
              .toString();
            this.location.go(url);
          } else {
            const url = this
              .router
              .createUrlTree([], { relativeTo: this.route })
              .toString();
            this.location.go(url.split(";")[0]);
          }
          this.isTransInProcess = false;
        }
        // need to remove the element pointer when clicked on map
        //this.selectedElem = null;
        //reset isCluster boolean to set marker when click on map other than bikes or stations
        this.isCluster = false;
      }.bind(this)
    );
    this.getDockingStations();
  }

  //Loose bike popup
  OpenDialog(selectedBikeId: number, freeBike: any, isChecking = false): void {
    this.isDialogOpened = true;
    this.dockingStationBikes = [];
    this.bikeId = selectedBikeId;
    this.checkForWaypointOnDSOrBikes();
    var authToken = JSON.parse(
      localStorage.getItem(LocalStorageKeys.OAUTH_TOKEN)
    );
    let userRole = authToken._claims[0];
    const dialogRef = this.dialog.open(FreeBikePopupComponent, {
      width: '500px',
      height: '700px',
      data: {
        'group1': this.group1, 'group2': this.group2, 'group3': this.group3,
        'sessionId': freeBike.SessionId, bikeId: selectedBikeId, freeBike: freeBike, isDocked: false, isChecking: isChecking, userId: this.loggedInUser.UserId, userRole: userRole,
        routeId: this.routeId, isWaypoint: this.isWaypoint, isRouteStatus: this.isRouteStatus, isCompletedOrSkipped: this.isCompletedOrSkipped
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result != null) {
        this.isPlaceFree = result.isPlaceFree;
        if (!this.isPlaceFree) {
          result.bike.Disabled = true;
          result.bike["DisableState"] = BikeDisableState.Testing;
          result.bike["CurrentChargeLevel"] = result.bike.ChargeLevel;
          result.bike["BikeStatus"] = CommonHandler.getBikeStatus(result.bike, result.bike.DockingStationId, result.bike.DockingPointId);
          this.isDocked = result.isDocked;
          this.isChecking = result.isChecking;
          this.CheckLooseBike(result.bike);
          this.selectedFeature.getFeatures().clear();
        }
        else {
          this.bikeId = result.bike.BikeId;
          this.HandoverBike(result.bike);
          this.selectedFeature.getFeatures().clear();
          this.RefreshMapWithContent();
          this.isDialogOpened = false;
        }
      }
      else {
        this.selectedFeature.getFeatures().clear();
        this.RefreshMapWithContent();
        this.isDialogOpened = false;
        this.GetBikesInCar();
      }
    });
  }

  //Docked bikes and moving bikes popup
  OpenDialogForDockedBike(selectedBikeId: number, freeBike: any, isChecking = false): void {
    this.isDockedDialogOpened = true;
    var authToken = JSON.parse(
      localStorage.getItem(LocalStorageKeys.OAUTH_TOKEN)
    );
    let userRole = authToken._claims[0];
    if (userRole != UserRoles.CUSTOMER) {
      freeBike["ChargeLevel"] = freeBike.CurrentChargeLevel;
      const dialogRef = this.dialog.open(FreeBikePopupComponent, {
        width: '500px',
        height: '700px',
        data: {
          'group1': this.group1, 'group2': this.group2, 'group3': this.group3,
          'sessionId': freeBike.SessionId, bikeId: selectedBikeId, freeBike: freeBike, isDocked: true, isChecking: isChecking, userId: this.loggedInUser.UserId, userRole: userRole
        },
        disableClose: true
      });
      dialogRef.afterClosed().subscribe(result => {
        if (result != null) {
          result.bike["CurrentChargeLevel"] = result.bike.ChargeLevel;
          this.isDocked = result.isDocked;
          this.isChecking = result.isChecking;
          this.isTransportation = result.isTransportation;
          this.isPlaceFree = result.isPlaceFree;
          let isBothDisabled = result.isBothDisabled;
          if (isBothDisabled) {
            this.disableDockingPointAfterDPStuck(result.DockingPointId);
            this.disableBikeAfterDPStuck(selectedBikeId);
          }
          else {
            //isErrorReported flag is used to handle functions which are done support personal
            this.isErrorReported = result.isErrorReported;
            //check whether isErrorReported flag is true or not
            if (!this.isErrorReported) {
              // if isErrorReported flag is false executed below code
              if (!this.isPlaceFree) {
                if (!this.isDocked || (this.isDocked && !this.isTransportation)) {
                  this.CheckLooseBike(result.bike);
                  this.bike.isTransChecked = false;
                }
                else if (this.isDocked && this.isChecking && this.isTransportation) {

                  this.StopPassiveSession(result.bike.BikeId);
                  this.CreateTransportOrder(result.bike);
                  result.bike.Disabled = true;
                  result.bike.DisableState = BikeDisableState.Moving;
                  result.bike["BikeStatus"] = CommonHandler.getBikeStatus(result.bike, result.bike.DockingStationId, result.bike.DockingPointId);
                  if (this.transportBikes.length == 0)
                    this.AddBikeToCar(result.bike);
                  else
                    this.UpdateBikesInCar(result.bike);
                  //set transportation flags to enable correct view after transportation with test or moving bikes
                  this.bike.isTransChecked = true;
                  this.bike.isCheckCompleted = false;
                  this.bike.isTransUndocking = false;
                  this.bike.isTransTakenOut = true;
                  this.bike.isChecked = false;
                  this.bike.isUndocking = false;

                }
                //set docked bike transportation function
                else if (this.isDocked && !this.isChecking && this.isTransportation) {
                  this.RequestTransport(result.bike);
                  this.isTransportation = false;
                }
              }
              else {
                this.HandoverBike(result.bike);
              }
            }
            else {
              if (this.isErrorReported && !result.bike["Disabled"]) {
                if (this.dockingStationBikes.find(x => x.BikeId == result.bike.BikeId))
                  this.dockingStationBikes.find(x => x.BikeId == result.bike.BikeId).BikeStatus = BikeStatus.DockedWithError;
                if (this.takenOutBikes.find(x => x.BikeId == result.bike.BikeId))
                  this.takenOutBikes.find(x => x.BikeId == result.bike.BikeId).BikeStatus = BikeStatus.DockedWithError;
              }
              else if (this.isErrorReported && result.bike["Disabled"]) {
                if (this.dockingStationBikes.find(x => x.BikeId == result.bike.BikeId))
                  this.dockingStationBikes.find(x => x.BikeId == result.bike.BikeId).BikeStatus = BikeStatus.Disabled;
                if (this.takenOutBikes.find(x => x.BikeId == result.bike.BikeId))
                  this.takenOutBikes.find(x => x.BikeId == result.bike.BikeId).BikeStatus = BikeStatus.Disabled;
              }
            }
          }
        }
      });
    }
    else {
      this.router.navigate([`/bikes/${freeBike.BikeId}/details`]);
    }
  }

  disableDockingPointAfterDPStuck(dockingPointId: any) {
    let dpTakenOutindex = this.takenOutBikes.findIndex(x => x.DockingPointId == dockingPointId);
    let dpDockBikeindex = this.dockingStationBikes.findIndex(x => x.DockingPointId == dockingPointId);
    if (dpTakenOutindex != -1) {
      var takenOut = this.takenOutBikes.find(x => x.DockingPointId == dockingPointId);
      takenOut["DPDisabled"] = true;
      takenOut["DPDisabledReason"] = DockingPointDisabledReason.CheckRequired;
      this.takenOutBikes[dpTakenOutindex] = takenOut;
    }
    if (dpDockBikeindex != -1) {
      var dockedOut = this.dockingStationBikes.find(x => x.DockingPointId == dockingPointId);
      dockedOut["DPDisabled"] = true;
      dockedOut["DPDisabledReason"] = DockingPointDisabledReason.CheckRequired;
      this.dockingStationBikes[dpDockBikeindex] = dockedOut;
    }
  }

  disableBikeAfterDPStuck(bikeId: any) {
    let takenOutIndex = this.takenOutBikes.findIndex(x => x.BikeId == bikeId);
    let dockBikeIndex = this.dockingStationBikes.findIndex(x => x.BikeId == bikeId);
    if (takenOutIndex != -1) {
      var takenOut = this.takenOutBikes.find(x => x.BikeId == bikeId);
      takenOut["Disabled"] = true;
      takenOut["DisableState"] = BikeDisableState.CheckedNeedFix;
      takenOut["BikeStatus"] = BikeStatus.DisabledCheckedNeedRepair;
      this.takenOutBikes[takenOutIndex] = takenOut;
    }
    if (dockBikeIndex != -1) {
      var dockedOut = this.dockingStationBikes.find(x => x.BikeId == bikeId);
      dockedOut["Disabled"] = true;
      dockedOut["DisableState"] = BikeDisableState.CheckedNeedFix;
      dockedOut["BikeStatus"] = BikeStatus.DisabledCheckedNeedRepair;
      this.dockingStationBikes[dockBikeIndex] = dockedOut;
    }
  }

  OpenCarViewBikeDetails(carBike) {
    this.dockingStationBikes = [];
    this.bikeId = carBike.BikeId;
    this.isCarChecking = false;
    this.isStorage = false;
    this.isTransportation = false;
    this.isPlaceFree = false;
    const dialogRef = this.dialog.open(CarBikeDetailsPopupComponent, {
      width: '500px',
      height: '700px',
      data: { bikeId: carBike.BikeId, carBike: carBike, userId: this.loggedInUser.UserId }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        result.bike["CurrentChargeLevel"] = result.bike.ChargeLevel;
        this.isPlaceFree = result.isPlaceFree;
        this.isTransportation = result.isTransportation;
        this.isToWorkshop = result.isToWorkshop;
        this.isStorage = result.isStorage;
        this.selectedStorageId = result.selectedStorageId;
        this.isCarChecking = result.isChecking;
        if (this.isPlaceFree) {
          this.HandoverBike(result.bike);
          this.selectedFeature.getFeatures().clear();
          this.RefreshMapWithContent();
        }
        else if (this.isTransportation) {
          this.RequestTransport(result.bike);
          this.isTransportation = false;
        }
        else if (this.isToWorkshop) {
          this.HandToWorkShop(result.bike);
        }
        else if (this.isStorage) {
          var bikeStateChangeDTO = { Disabled: true, DisabledReason: BikeDisableState.InStorage };
          this.bikesService.enableDisableBike(this.bikeId, bikeStateChangeDTO)
            .subscribe(data => {
              this.HandToStorage(result.bike, this.selectedStorageId);
            });
        }
        else if (this.isCarChecking) {
          this.isCarOpened = false;
          this.CheckBike(result.bike);
        }
      }
    });
  }

  getOnClickInteraction(): OlSelect {
    let select = new OlSelect({
      condition: OlCondition.click,
      style: (f, r) => this.interactionStyleFunction(f, r),
      hitTolerance: 10,
      stopEvent: true
    });
    this.selectedFeature = select;
    select.on("select", event => {
      if (event.selected.length > 0) {
        let parentfeatures = event.target.getFeatures().getArray();
        // check if there are multiple features
        let features = parentfeatures[0].get("features");
        if (features && features.length == 1) {
          let feature = features[0];
          let data = feature.get("data");
          let type = feature.get("type");
          var authToken = JSON.parse(
            localStorage.getItem(LocalStorageKeys.OAUTH_TOKEN)
          );
          let userRole = authToken._claims[0];
          if (type == "bike") {
            if (userRole != UserRoles.CUSTOMER) {
              var freeBike = this.bikes.find(x => x.BikeId == parseInt(data.BikeId));
              freeBike["BikeStatus"] = CommonHandler.getBikeStatus(freeBike, null, null);
              this.isOpened = false;
              this.OpenDialog(freeBike.BikeId, freeBike);
            }
            else {
              this.router.navigate([`/bikes/${data.BikeId}/details`]);
            }
          } else if (type == "dock" || type == "small-dock") {
            this.mouseOver = true;
            this.router.navigate([
              `/dockingStations/${data.DockingStationId}/dockingpoints`
            ]);
          }
          else if (type == "car") {

          }
        }
        //check the features is undefined
        else if (!features) {
          var authToken = JSON.parse(
            localStorage.getItem(LocalStorageKeys.OAUTH_TOKEN)
          );
          let feature = parentfeatures[0];
          let selectData = feature.get("data");
          let type = feature.get("type");
          if (type == "bike") {
            let userRole = authToken._claims[0];
            if (userRole != UserRoles.CUSTOMER) {
              var freeBike = this.bikes.find(x => x.BikeId == parseInt(selectData.BikeId));
              freeBike["BikeStatus"] = CommonHandler.getBikeStatus(freeBike, null, null);
              this.OpenDialog(freeBike.BikeId, freeBike);
            }
            else {
              this.router.navigate([`/bikes/${selectData.BikeId}/details`]);
            }
          } else if (type == "dock" || type == "small-dock") {
            this.spinner.show();
            this.mouseOver = true;
            this.selectedElem = selectData;
            this.markertxtsingle.nativeElement.innerHTML = selectData.NumberOfAvailableBikes.toString();
            this.markertxtsingle.nativeElement.style.backgroundColor = selectData.StationStatus;

            //skip small square for >= promised number
            if (selectData["bikeCount"] < 0) {
              this.markertxt2single.nativeElement.innerHTML = selectData["bikeCountSpan"];
              this.markertxt2single.nativeElement.style.background = selectData["smallIcon"];
            }
            else {
              this.markertxt2single.nativeElement.innerHTML = null;
              this.markertxt2single.nativeElement.style.backgroundColor = null;
            }

            let stationId = selectData["DockingStationId"];
            var authToken = JSON.parse(
              localStorage.getItem(LocalStorageKeys.OAUTH_TOKEN)
            );
            // this.getDockingStationDetails(stationId, true);

            if (authToken._claims[0] != UserRoles.CUSTOMER) {
              this.getDockingStationDetails(stationId, true);
            } else {
              this.router.navigate([`/dockingStations/${stationId}/dockingpoints`]);
            }

            //if switching between stations remove existing and add new radius
            let dockingRadiusFeatures = this.dockRadiusLayer.getSource().getFeatures();
            if (this.dockingStationId) {
              let dockRadiusFeatureOld = dockingRadiusFeatures.find(x => x.getId() == this.dockingStationId);
              dockRadiusFeatureOld.setStyle(null);
            }
            setTimeout(() => {
              let dockRadiusFeatureNew = dockingRadiusFeatures.find(x => x.getId() == stationId);
              dockRadiusFeatureNew.setStyle(this.styleDockRadiusFunction(feature, stationId)[0]);
            }, 1000);
          }
          else if (type == "car") {
            this.selectedFeature.getFeatures().clear();
            if (selectData.user.hasOwnProperty('Name')) {
              selectData.user["FirstName"] = selectData.user.Name;
              this.carUser = selectData.user;
            }
            else
              this.carUser = this.loggedInUser;

            this.bikesService.getBikeTransportByUserId(this.carUser.UserId).subscribe(res => {
              if (res) {
                this.carTranportObj = res;
                this.transportBikes = JSON.parse(res.Bikes);
              }
              else
                this.transportBikes = [];
              this.isCarOpened = true;
              this.isOpened = false;
              this.isServiceOpened = false;

              //construct url and pass it to change
              if (this.routeId) {
                const url = this
                  .router
                  .createUrlTree([{ car: 1, userId: this.carUser.UserId, routeId: this.routeId }], { relativeTo: this.route })
                  .toString();
                this.location.go(url);
              } else {
                const url = this
                  .router
                  .createUrlTree([{ car: 1, userId: this.carUser.UserId }], { relativeTo: this.route })
                  .toString();
                this.location.go(url);
              }
              //set isCluster to override the trigger of singleclick function
              // this.isCluster = true;
            }, err => {
              if (err.status == 400 || err.status == 500) {
                this.loggerService.showErrorMessage("Error while retrieve car details");
              }
            });
          }
          else if (type == "waypoint") {
            if (!selectData["completedDate"]) {
              this.selectedFeature.getFeatures().clear();
              const dialogAddWaypoint = this.dialog.open(WaypointUpdatePopupComponent, {
                width: '400px',
                data: {
                  "isWorkshopOrStorage": true,
                  "workshopId": selectData["workshopId"],
                  "storageId": selectData["storageId"],
                  "userId": this.loggedInUser.UserId
                },
                disableClose: true
              });

              dialogAddWaypoint.afterClosed().subscribe(result => {
                if (result) {
                  //refocus to next waypoint
                  let waypointId = 0;
                  if (selectData["workshopId"]) {
                    waypointId = +selectData["workshopId"];
                  }
                  else if (selectData["storageId"]) {
                    waypointId = +selectData["storageId"];
                  }
                  this.nextWaypointId = waypointId;
                  this.focusNextWaypoint(waypointId);
                }
              });
            }
          }
        } else {
          //set isCluster to override the trigger of singleclick function
          this.isCluster = true;
        }
      }
      else if (event.deselected.length > 0) {
        this.mouseOver = false;
      }
    });
    return select;
  }

  getOnHoverInteracion(): OlSelect {
    let select = new OlSelect({
      condition: OlCondition.pointerMove,
      hitTolerance: 10,
      style: (f, r) => this.interactionStyleFunction(f, r)
    });
    select.on("select", event => {
      const resolution = this.map.getView().getResolution();
      if (event.selected.length > 0) {
        let parentfeatures = event.target.getFeatures().getArray();
        // check if there are multiple features
        let features = parentfeatures[0].get("features");
        if (!features)
          features = [parentfeatures[0]];
        if (features && features.length == 1) {
          let feature = features[0];
          let data = feature.get("data");
          let type = feature.get("type");

          // change cursor to pointer
          this.mapElement.nativeElement.style.cursor = "pointer";

          // show popup
          if (data) {
            let textColor = "white";
            let color = "Red";
            if (type == "bike") {
              // this.popup.setPosition(event.mapBrowserEvent.coordinate);
              // this.popupElement.nativeElement.style.display = "";
              // this.popupElement.nativeElement.innerHTML = `<div style="background:${color};color:${textColor}"><span>Visual Id:${data.VisualId}</span><br/>
              //  <span>Longitude:${data.Longitude}</span><br/>
              //  <span>Latitude :${data.Latitude}</span><br/>
              //  <span>Altitude :${data.Altitude}</span><br/></div>`;
            } else if (type == "dock" || type == "small-dock") {
              this.mouseOver = true;
            }
            else if (type == "car") {

            }
            else if (type == "zone") {
              color = "white";
              textColor = "#666666";
              if (resolution && resolution > 12) {
                // reset cursor
                this.mapElement.nativeElement.style.cursor = "";
                // hide popup
                this.popupElement.nativeElement.style.display = "none";
              }
              else {
                this.popup.setPosition(data.center);
                this.popup.setOffset([-100, 35]);
                this.popupElement.nativeElement.style.display = "";
                this.popupElement.nativeElement.innerHTML =
                  `<div style="background:${color};color:${textColor}"><span>bikes in zone now (expected in 3 hours)</span><br/>`;
              }
            }
          }
        } else if (features) {
          let textColor = "white";
          let color = "Red";
          let popupHtml = `<div style="background:${color};color:${textColor}">`;
          for (let feature of features) {
            let data = feature.get("data");
            let type = feature.get("type");

            // change cursor to pointer
            this.mapElement.nativeElement.style.cursor = "pointer";

            // show popup
            if (data) {
              if (type == "bike") {
                // popupHtml += `<span>Visual Id:${data.VisualId}</span><br/>`;
              } else if (type == "dock" || type == "small-dock") {
                this.mouseOver = true;
              }
              else if (type == "zone") {
                color = "white";
                textColor = "#666666";
                if (resolution && resolution > 12) {
                  // reset cursor
                  this.mapElement.nativeElement.style.cursor = "";
                  // hide popup
                  this.popupElement.nativeElement.style.display = "none";
                }
                else {
                  this.popup.setPosition(data.center);
                  this.popup.setOffset([-100, 35]);
                  this.popupElement.nativeElement.style.display = "";
                  this.popupElement.nativeElement.innerHTML =
                    `<div style="background:${color};color:${textColor}"><span>bikes in zone now (expected in 3 hours)</span><br/>`;
                }
              }
            }
          }
          //set isCluster to override the trigger of singleclick function
          this.isCluster = true;
        } else {
          let textColor = "white";
          let color = "Red";
          let popupHtml = `<div style="background:${color};color:${textColor}">`;
          let feature = parentfeatures[0];
          let data = feature.get("data");
          let type = feature.get("type");

          // change cursor to pointer
          this.mapElement.nativeElement.style.cursor = "pointer";

          // show popup
          if (data) {
            if (type == "bike") {
              // popupHtml += `<span>Visual Id:${data.VisualId}</span><br/>`;
            } else if (type == "dock" || type == "small-dock") {
              this.mouseOver = true;
            }
            else if (type == "car") {
              // popupHtml += `<span>Name:Ranso</span><br/>`;
            }
            else if (type == "zone") {
              color = "white";
              textColor = "#666666";
              if (resolution && resolution > 12) {
                // reset cursor
                this.mapElement.nativeElement.style.cursor = "";
                // hide popup
                this.popupElement.nativeElement.style.display = "none";
              }
              else {
                this.popup.setPosition(data.center);
                this.popup.setOffset([-100, 35]);
                this.popupElement.nativeElement.style.display = "";
                this.popupElement.nativeElement.innerHTML =
                  `<div style="background:${color};color:${textColor}"><span>bikes in zone now (expected in 3 hours)</span><br/>`;
              }
            }
          }
        }
      } else if (event.deselected.length > 0) {
        // reset cursor
        this.mapElement.nativeElement.style.cursor = "";
        this.mouseOver = false;
        // hide popup
        this.popupElement.nativeElement.style.display = "none";
      }
    });
    return select;
  }

  createMarker(pos, txt, color1, txt2, color2, dockingStationId) {
    let elem = this.marker.nativeElement.cloneNode(true);
    elem.querySelector("#marker-txt").innerHTML = txt;
    elem.querySelector("#docking-station").innerHTML = dockingStationId;
    elem.querySelector("#marker-txt").style.backgroundColor = color1;
    elem.querySelector("#marker-txt2").innerHTML = txt2;
    elem.querySelector("#marker-txt2").style.backgroundColor = color2;

    var marker = new OlOverlay({
      position: pos,
      positioning: "center-center",
      element: elem,
      stopEvent: false
    });
    this.map.addOverlay(marker);

    let router = this.router;
    let stationId;
    elem.querySelector("#marker-txt").addEventListener(
      "click",
      function (event) {
        this.spinner.show();
        this.selectedElem = elem;
        event.preventDefault();
        this.isOpened = false;
        this.markertxtsingle.nativeElement.innerHTML = elem.querySelector(
          "#marker-txt"
        ).innerHTML;
        this.markertxtsingle.nativeElement.style.backgroundColor = elem.querySelector(
          "#marker-txt"
        ).style.backgroundColor;
        this.markertxt2single.nativeElement.innerHTML = elem.querySelector("#marker-txt2").innerHTML;
        this.markertxt2single.nativeElement.style.backgroundColor = elem.querySelector("#marker-txt2").style.backgroundColor;
        stationId = elem.querySelector("#docking-station").innerHTML;
        var authToken = JSON.parse(
          localStorage.getItem(LocalStorageKeys.OAUTH_TOKEN)
        );
        // this.getDockingStationDetails(stationId, true);

        if (authToken._claims[0] != UserRoles.CUSTOMER) {
          this.getDockingStationDetails(stationId, true);
        } else {
          router.navigate([`/dockingStations/${stationId}/dockingpoints`]);
        }
      }.bind(this)
    );
    elem.querySelector("#marker-txt").addEventListener(
      "mouseover",
      function (event) {
        this.mouseOver = true;
      }.bind(this)
    );
    elem.querySelector("#marker-txt").addEventListener(
      "mouseout",
      function (event) {
        if (!this.selectedElem)
          this.mouseOver = false;
      }.bind(this)
    );
  }

  getDockingStationDetails(stationId, isDockingStation): void {
    observableForkJoin([
      this.stationService.getDockingPointsForStation(stationId),
      this.stationService.getUndockedBikesInDockingStation(stationId)
    ]).subscribe(
      result => {
        this.dockingStationBikes.forEach(bike => {
          if (bike.IsBikeDockedOrLocked && !this.takenOutBikes.find(x => x.BikeId == bike.BikeId)
            && bike.DisableState != BikeDisableState.RepairFinished) {
            this.takenOutBikes.push(bike);
          }
          else {
            var index = this.takenOutBikes.findIndex(x => x.BikeId == bike.BikeId);
            this.takenOutBikes[index] = bike;
          }
        });

        var docPoints = result[0];
        var lockedBikes = result[1];

        //Section DS/Bikes with issues start
        //This section is used to map and filter docking station and bikes with issues
        if (this.isShowOnlyWithIssues) {
          let dsDetails = result[0];
          dsDetails["DockingPoints"] = dsDetails.DockingPoints.filter(d => d.DPDisabled
            || (!d.DPDisabled && d.Bike && d.Bike.Disabled));
          docPoints = dsDetails;
          lockedBikes = result[1].filter(b => b.Disabled);
        }
        //Section DS/Bikes with issues end

        this.dockingStationBikes = [];
        this.dockingStationName = docPoints.Name;
        this.dsDisabled = docPoints.Disabled;
        this.dsDisabledReason = docPoints.DisabledReason;
        this.numberOfAvailableBikes = docPoints.NumberOfAvailableBikes;
        this.idealBikes = docPoints.IdealNumberOfBikes;
        this.promisedBikes = docPoints.NumberOfPriorityReservations;
        if (docPoints.LastCheckedDate)
          this.dsLastCheckDetails = `${this.formatReportErrorTimeDuration(docPoints.LastCheckedDate)} - ${docPoints.LastCheckedPerson}`;
        else
          this.dsLastCheckDetails = `${this.formatReportErrorTimeDuration(docPoints.LastCheckedDate)}`;
        if (docPoints && docPoints.DockingPoints) {
          //order by dp visual ID
          docPoints.DockingPoints.sort((a, b) => (a.VisualId > b.VisualId) ? 1 : -1);
          docPoints.DockingPoints.forEach(x => {
            if (x.Bike) {
              x.Bike["BikeStatus"] = CommonHandler.getBikeStatus(x.Bike, x.DockingStationId, x.DockingPointId);
              x.Bike["isTakenOut"] = false;
              x.Bike["isCheckCompleted"] = false;
              x.Bike['isCancelled'] = false;
              x.Bike["isUndocking"] = false;
              x.Bike["isChecked"] = false;
              x.Bike["isTransTakenOut"] = false;
              x.Bike["isTransUndocking"] = false;
              x.Bike["isTransChecked"] = false;
              x.Bike["retryTime"] = 0;
              x.Bike["CheckDate"] = x.Bike["ServiceCheckDate"];
              x.Bike["DockingStationId"] = x.DockingStationId;
              x.Bike["DockingPointId"] = x.DockingPointId;
              x.Bike["IsBikeDockedOrLocked"] = true;
              x.Bike["DPVisualId"] = x.VisualId;
              x.Bike["DPDisabled"] = x.DPDisabled;
              x.Bike["DPDisabledReason"] = x.DPDisabledReason;
              x.Bike["HardwareId"] = x.HardwareId;
              x.Bike["IsCharging"] = (x.Bike["PowerState"] == PowerState.ChargingNormal) ? true : false;
              this.takenOutBikes = this.takenOutBikes.filter(y => y.BikeId != x.Bike.BikeId);
              // this.dockingStationBikes.push(x.Bike);
            }
            else {
              x.Bike = {};
              x.Bike["IsBikeDockedOrLocked"] = false;
              x.Bike["DPVisualId"] = x.VisualId;
              x.Bike["DPDisabled"] = x.DPDisabled;
              x.Bike["DPDisabledReason"] = x.DPDisabledReason;
              x.Bike["HardwareId"] = x.HardwareId;
              x.Bike["DockingPointId"] = x.DockingPointId;
              x.Bike["DockingStationId"] = x.DockingStationId;
              x.Bike["IsCharging"] = false;
            }
            this.dockingStationBikes.push(x.Bike);
          });
        }
        if (lockedBikes) {
          lockedBikes.forEach(x => {
            x["CurrentChargeLevel"] = x.ChargeLevel;
            x["BikeStatus"] = CommonHandler.getBikeStatus(x, x.DockingStationId);
            x["isTakenOut"] = false;
            x["isCheckCompleted"] = false;
            x['isCancelled'] = false;
            x["isUndocking"] = false;
            x["isChecked"] = false;
            x["retryTime"] = 0;
            x["isTransTakenOut"] = false;
            x["isTransUndocking"] = false;
            x["isTransChecked"] = false;
            x["CheckDate"] = x["ServiceCheckDate"];
            x["IsBikeDockedOrLocked"] = true;
            x["DPVisualId"] = null;
            x["DPDisabled"] = false;
            x["DPDisabledReason"] = null;
            x["IsCharging"] = (x["PowerState"] == PowerState.ChargingNormal) ? true : false;
            this.takenOutBikes = this.takenOutBikes.filter(y => y.BikeId != x.BikeId);
            this.dockingStationBikes.push(x);
          });
        }
        if (this.dockingStationId !== stationId) {
          // this.drawer.toggle();
          this.spinner.hide();
          this.isOpened = true;
          this.isCarOpened = false;
          this.takenOutBikes = [];
          this.isDocked = false;
          this.isChecking = false;
          //construct url and pass it to change
          if (this.routeId) {
            const url = this
              .router
              .createUrlTree([{ general: 1, stationId: stationId, routeId: this.routeId }], { relativeTo: this.route })
              .toString();
            this.location.go(url);
          } else {
            const url = this
              .router
              .createUrlTree([{ general: 1, stationId: stationId }], { relativeTo: this.route })
              .toString();
            this.location.go(url);
          }
          this.dockingStationId = stationId;
        } else {
          if (this.ServiceCompleted) {
            this.isOpened = true;
            this.isCarOpened = false;
            this.isServiceOpened = false;
            this.ServiceCompleted = false;
          }
          this.spinner.hide();
        }
        this.checkForWaypointOnDSOrBikes();
        this.GetDockingStationDetailsById(this.dockingStationId);

      },
      error => {
        this.isWaypoint = false;
        if (error.status == 403) {
          this.loggerService.showErrorMessage(
            "Don't have permission to obtain data"
          );
        } else {
          // this.loggerService.showErrorMessage(error);
          this.isInProcess = false;
        }
      }
    );
  }

  ResetCheckAndTransportValues(bike) {
    bike["isTakenOut"] = false;
    bike["isCheckCompleted"] = false;
    bike["isUndocking"] = false;
    bike["isChecked"] = false;
    bike["isTransUndocking"] = false;
    bike["isTransUndocking"] = false;
    bike["isTransChecked"] = false;
    bike["retryTime"] = 0;
  }

  //get bike details by Id
  getBikeDetails() {
    if (this.bikeId)
      this.bikesService.getBikeDetails(this.bikeId).subscribe(res => {
        this.bike = res;
        this.bike.CurrentChargeLevel = res.ChargeLevel;
      }, err => {
        this.loggerService.showErrorMessage("Error while getting bike details");
      });
  }

  CheckBike(bike) {
    this.isLoading = true;
    bike["isCancelled"] = false;
    this.bike = bike;
    this.bikeId = bike.BikeId;
    this.GetRegisteredIssuesPerBikeId(this.bikeId);
    //reset values before new check
    if (this.bike.LockState == LockState.LockedArrest)
      this.isLockState = true;
    else if (this.bike.LockState == LockState.UnlockedArrest)
      this.isLockState = false;
    this.ServiceCompleted = false;
    this.isLooseBike = false;
    this.RedirectToNewLocation();
    this.GetBikeServiceByBikeId();
  }

  RequestCheckBike(bike) {
    bike["PreviousBikeStatus"] = bike["BikeStatus"];
    this.ResetCheckAndTransportValues(bike);
    this.signalRService.SubscribeConnection(bike.Serial);
    bike["isChecked"] = true;
    this.isTransInProcess = true;
    this.bike = bike;
    this.bikeId = bike.BikeId;
    //reset values before new check
    this.ServiceCompleted = false;
    this.isLooseBike = false;

    if (bike.BikeStatus == BikeStatus.DockedWithError ||
      bike.BikeStatus == BikeStatus.DockedWithNoError ||
      bike.BikeStatus == BikeStatus.DisabledWithTesting ||
      bike.BikeStatus == BikeStatus.DisabledWithMoving ||
      bike.BikeStatus == BikeStatus.DisabledWithMoving ||
      (bike.DockingPointId && bike.BikeStatus == BikeStatus.DisabledCheckedNeedRepair) ||
      (bike.DockingPointId && bike.BikeStatus == BikeStatus.DisabledWithStreetTeam) ||
      bike.BikeStatus == BikeStatus.Disabled) {
      this.bikesService.sendUndockCommand(bike.BikeId).subscribe(
        res => {
          this.GetBikePCB(bike);
        },
        error => {
          this.bikesService.sendUnLockCommand(bike.BikeId).subscribe(
            res => {
              this.GetBikePCB(bike);
            },
            err => {
              this.loggerService.showErrorMessage(this.commonService.TranslateMessage(TranslateMessageTypes.UndockAndUnlockFail));
              this.isLoading = false;
            }
          );
        }
      );
    } else if (bike.BikeStatus == BikeStatus.LockedWithError ||
      bike.BikeStatus == BikeStatus.LockedWithNoError ||
      bike.BikeStatus == BikeStatus.DisabledWithTesting ||
      bike.BikeStatus == BikeStatus.DisabledWithMoving ||
      (bike.BikeStatus == BikeStatus.DisabledLoose && bike.LockState == LockState.LockedArrest) ||
      (!bike.DockingPointId && bike.BikeStatus == BikeStatus.DisabledCheckedNeedRepair) ||
      (!bike.DockingPointId && bike.BikeStatus == BikeStatus.DisabledWithStreetTeam) ||
      bike.BikeStatus == BikeStatus.Disabled) {
      this.bikesService.sendUnLockCommand(bike.BikeId).subscribe(
        res => {
          this.GetBikePCB(bike);
        },
        error => {
          this.bikesService.sendUndockCommand(bike.BikeId).subscribe(
            res => {
              this.GetBikePCB(bike);
            },
            err => {
              this.loggerService.showErrorMessage(this.commonService.TranslateMessage(TranslateMessageTypes.UndockAndUnlockFail));
              this.isLoading = false;
            }
          );
        }
      );
    }
    else if (bike.BikeStatus == BikeStatus.LooseBikeWithError ||
      bike.BikeStatus == BikeStatus.LooseBikeWithNoError ||
      bike.BikeStatus == BikeStatus.DisabledWithTesting ||
      bike.BikeStatus == BikeStatus.DisabledWithMoving ||
      bike.BikeStatus == BikeStatus.DisabledLoose ||
      bike.BikeStatus == BikeStatus.DisabledCheckedNeedRepair ||
      bike.BikeStatus == BikeStatus.Disabled) {
      bike.Disabled = true;
      bike.DisableState = BikeDisableState.Testing;
      bike["BikeStatus"] = CommonHandler.getBikeStatus(bike, bike.DockingStationId, bike.DockingPointId);
      bike["isTakenOut"] = true;
      bike["isUndocking"] = true;
      this.takenOutBikes = this.takenOutBikes.filter(x => x.BikeId != this.bike.BikeId);
      this.dockingStationBikes = this.dockingStationBikes.filter(x => x.BikeId != this.bike.BikeId);
      if (!this.takenOutBikes.find(x => x.BikeId == bike.BikeId)) {
        this.takenOutBikes.push(this.bike);
      }
      else {
        var index = this.takenOutBikes.findIndex(x => x.BikeId == bike.BikeId);
        this.takenOutBikes[index] = bike;
      }
      var bikeStateChangeDTO = { Disabled: true, DisabledReason: BikeDisableState.Testing };
      this.DisableBike(bikeStateChangeDTO);
      this.isTransInProcess = false;
      //this.GetBikePCB(bike);
    }
  }

  CheckLooseBike(bike) {
    this.isLoading = true;
    this.bike = bike;
    this.bikeId = bike.BikeId;
    this.RedirectToNewLocation();
    this.GetBikeServiceByBikeId();
    this.isLooseBike = true;
    this.ServiceCompleted = false;
    // get bike issues
    this.GetRegisteredIssuesPerBikeId(this.bikeId);
  }

  GetBikePCB(bike, isTransport = false) {
    if (!isTransport) {
      bike["isUndocking"] = true;
      bike["retryTime"] = 10;
      this.bikesService.getBikePCB(bike.BikeId)
        .subscribe(data => {
          var isStatus = this.formatDpHwIDValues(data);
          bike["isTakenOut"] = isStatus;
          if (!isStatus) {
            this.undockBikes.push(bike);
          }
          if (isStatus)
            this.isTransInProcess = false;
        }, error => {
          bike["isUndocking"] = false;
          bike["isTakenOut"] = false;
          bike["isChecked"] = false;
          this.undockBikes.push(bike);

          this.loggerService.showErrorMessage(error);
        });
    }
    else {
      bike["isTransUndocking"] = true;
      bike["retryTime"] = 10;
      this.bikesService.getBikePCB(bike.BikeId)
        .subscribe(data => {
          var isStatus = this.formatDpHwIDValues(data);
          bike["isTransTakenOut"] = isStatus;
          if (!isStatus) {
            this.undockBikes.push(bike);
          }
          else {
            this.StopPassiveSession(bike.BikeId);
            this.isDocked = true;
            if (bike.DisableState == BikeDisableState.Testing) {
              //bike service details create or update
              var bikeServiceDTO = { NumberOfChecks: 0, BikeId: bike.BikeId }
              this.CreateOrUpdateBikeService(bikeServiceDTO);

              //reset unsuccessful session count when check completed
              this.resetUndockFailureCountByBike();
            }
            this.CreateTransportOrder(bike);
            bike.Disabled = true;
            bike.DisableState = BikeDisableState.Moving;
            bike["BikeStatus"] = CommonHandler.getBikeStatus(bike, bike.DockingStationId, bike.DockingPointId);
            if (this.transportBikes.length == 0)
              this.AddBikeToCar(bike);
            else
              this.UpdateBikesInCar(bike);
            this.isTransInProcess = false;
          }
        }, error => {
          bike["isTransUndocking"] = false;
          bike["isTransTakenOut"] = false;
          bike["isTransChecked"] = false;
          this.undockBikes.push(bike);
          this.isTransInProcess = false;

          this.loggerService.showErrorMessage(error);
        });
    }
  }

  GetBikePCBInterval() {
    this.undockBikes.forEach(undockBike => {
      if (undockBike && undockBike.retryTime < 50) {
        this.bikesService.getBikePCB(undockBike.BikeId)
          .subscribe(data => {
            var isStatus = this.formatDpHwIDValues(data);
            if (!undockBike.isTransUndocking && (this.dockingStationBikes.find(x => x.BikeId == undockBike.BikeId)
              || this.takenOutBikes.find(x => x.BikeId == undockBike.BikeId))) {
              if (this.dockingStationBikes.length > 0 && this.dockingStationBikes.find(x => x.BikeId == undockBike.BikeId))
                this.dockingStationBikes.find(x => x.BikeId == undockBike.BikeId).isTakenOut = isStatus;
              if (this.takenOutBikes.length > 0 && this.takenOutBikes.find(x => x.BikeId == undockBike.BikeId))
                this.takenOutBikes.find(x => x.BikeId == undockBike.BikeId).isTakenOut = isStatus;
            }
            else if (undockBike.isTransUndocking && (this.dockingStationBikes.find(x => x.BikeId == undockBike.BikeId)
              || this.takenOutBikes.find(x => x.BikeId == undockBike.BikeId))) {
              if (this.dockingStationBikes.length > 0 && this.dockingStationBikes.find(x => x.BikeId == undockBike.BikeId))
                this.dockingStationBikes.find(x => x.BikeId == undockBike.BikeId).isTransTakenOut = isStatus;
              if (this.takenOutBikes.length > 0 && this.takenOutBikes.find(x => x.BikeId == undockBike.BikeId))
                this.takenOutBikes.find(x => x.BikeId == undockBike.BikeId).isTransTakenOut = isStatus;
            }
            if (!isStatus && this.dockingStationBikes.find(x => x.BikeId == undockBike.BikeId)) {
              this.dockingStationBikes.find(x => x.BikeId == undockBike.BikeId).retryTime += 10;
            }
            else if (isStatus) {
              if (undockBike.isTransUndocking) {
                this.isDocked = true;
                this.StopPassiveSession(undockBike.BikeId);
                this.CreateTransportOrder(undockBike);
                undockBike.Disabled = true;
                undockBike.DisableState = BikeDisableState.Moving;
                undockBike["BikeStatus"] = CommonHandler.getBikeStatus(undockBike, undockBike.DockingStationId, undockBike.DockingPointId);
                if (this.transportBikes.length == 0)
                  this.AddBikeToCar(undockBike);
                else
                  this.UpdateBikesInCar(undockBike);
              }
              else {
                this.isTransInProcess = false;
              }
              this.undockBikes = this.undockBikes.filter(x => x.BikeId != undockBike.BikeId);
            }

          }, error => {

          });
      }
      else if (undockBike && undockBike.retryTime >= 50) {
        if (!undockBike.isTransUndocking) {
          this.dockingStationBikes.find(x => x.BikeId == undockBike.BikeId).isChecked = false;
          this.dockingStationBikes.find(x => x.BikeId == undockBike.BikeId).isTakenOut = false;
        }
        else if (undockBike.isTransUndocking) {
          this.dockingStationBikes.find(x => x.BikeId == undockBike.BikeId).isTransChecked = false;
          this.dockingStationBikes.find(x => x.BikeId == undockBike.BikeId).isTransTakenOut = false;
        }
        this.dockingStationBikes.find(x => x.BikeId == undockBike.BikeId).retryTime += 10;
        this.undockBikes = this.undockBikes.filter(x => x.BikeId != undockBike.BikeId);
      }
    });

  }

  //handle undock bikes when taken out
  GetBikePCBOnTakenOut(signalRBike) {
    let undockBike = this.undockBikes.find(x => x.Serial == signalRBike.serial);
    if (undockBike) {
      if (!undockBike.isTransUndocking && (this.dockingStationBikes.find(x => x.BikeId == undockBike.BikeId)
        || this.takenOutBikes.find(x => x.BikeId == undockBike.BikeId))) {
        if (this.dockingStationBikes.length > 0 && this.dockingStationBikes.find(x => x.BikeId == undockBike.BikeId))
          this.dockingStationBikes.find(x => x.BikeId == undockBike.BikeId).isTakenOut = true;
        if (this.takenOutBikes.length > 0 && this.takenOutBikes.find(x => x.BikeId == undockBike.BikeId))
          this.takenOutBikes.find(x => x.BikeId == undockBike.BikeId).isTakenOut = true;
      }
      else if (undockBike.isTransUndocking && (this.dockingStationBikes.find(x => x.BikeId == undockBike.BikeId)
        || this.takenOutBikes.find(x => x.BikeId == undockBike.BikeId))) {
        if (this.dockingStationBikes.length > 0 && this.dockingStationBikes.find(x => x.BikeId == undockBike.BikeId))
          this.dockingStationBikes.find(x => x.BikeId == undockBike.BikeId).isTransTakenOut = true;
        if (this.takenOutBikes.length > 0 && this.takenOutBikes.find(x => x.BikeId == undockBike.BikeId))
          this.takenOutBikes.find(x => x.BikeId == undockBike.BikeId).isTransTakenOut = true;
      }

      if (undockBike.isTransUndocking) {
        this.isDocked = true;
        this.StopPassiveSession(undockBike.BikeId);
        this.CreateTransportOrder(undockBike);
        undockBike.Disabled = true;
        undockBike.DisableState = BikeDisableState.Moving;
        undockBike["BikeStatus"] = CommonHandler.getBikeStatus(undockBike, undockBike.DockingStationId, undockBike.DockingPointId);
        if (this.transportBikes.length == 0)
          this.AddBikeToCar(undockBike);
        else
          this.UpdateBikesInCar(undockBike);
      }
      else {
        undockBike["PreviousBikeStatus"] = null;
        undockBike.Disabled = true;
        undockBike.DisableState = BikeDisableState.Testing;
        undockBike["BikeStatus"] = CommonHandler.getBikeStatus(undockBike, undockBike.DockingStationId, undockBike.DockingPointId);
        this.takenOutBikes = this.takenOutBikes.filter(x => x.BikeId != this.bike.BikeId);
        undockBike["isCheckCompleted"] = true;
        undockBike.Disabled = false;
        if (!this.dockingStationBikes.find(x => x.BikeId == undockBike.BikeId)) {
          this.dockingStationBikes.push(this.bike);
        }
        else {
          var index = this.dockingStationBikes.findIndex(x => x.BikeId == undockBike.BikeId);
          this.dockingStationBikes[index] = undockBike;
        }
        this.isTransInProcess = false;
        var bikeStateChangeDTO = { Disabled: true, DisabledReason: BikeDisableState.Testing };
        this.DisableBike(bikeStateChangeDTO);
      }
      this.undockBikes = this.undockBikes.filter(x => x.BikeId != undockBike.BikeId);
    }
  }


  formatDpHwIDValues(observations) {
    let currentObservation = false;
    observations.forEach((observation) => {
      if (observation['Value'] != null) {
        // let currentType = this.observationTypes.filter(e => e.id == observation['Id']);
        if (observation['Id'] == 450) {
          currentObservation = (observation['Value'] == "") ? true : false;
          return;
        }
      }
    });
    return currentObservation;
  }


  CancelCheck() {
    if (!this.isCarChecking) {
      if (!this.isLooseBike) {
        // temporarily commented until test get success with new flow
        // this.isServiceOpened = false;
        // this.isOpened = true;
        //construct url and pass it to change
        if (this.routeId) {
          const url = this
            .router
            .createUrlTree([{ general: 1, stationId: this.dockingStationId, routeId: this.routeId }], { relativeTo: this.route })
            .toString();
          this.location.go(url);
        } else {
          const url = this
            .router
            .createUrlTree([{ general: 1, stationId: this.dockingStationId }], { relativeTo: this.route })
            .toString();
          this.location.go(url);
        }
        // temporarily commented until test get success with new flow
        // this.getDockingStationDetails(this.dockingStationId, false);
        //added this flag to handle auto refresh of bike details
        this.ServiceCompleted = true;
        this.isLoading = true;
      }
      else {
        this.isServiceOpened = false;
        if (this.isDocked) {
          //we should set isLooseBike flag to false to refresh interruption for moving bikes
          this.isLooseBike = false;
          if (this.routeId) {
            const url = this
              .router
              .createUrlTree([{ general: 1, stationId: this.dockingStationId, routeId: this.routeId }], { relativeTo: this.route })
              .toString();
            this.location.go(url);
          } else {
            const url = this
              .router
              .createUrlTree([{ general: 1, stationId: this.dockingStationId }], { relativeTo: this.route })
              .toString();
            this.location.go(url);
          }
          this.OpenDialogForDockedBike(this.bikeId, this.bike, this.isChecking);
        }
        else {
          //construct url and pass it to change
          if (this.routeId) {
            const url = this
              .router
              .createUrlTree([{ routeId: this.routeId }], { relativeTo: this.route })
              .toString();
            this.location.go(url);
          } else {
            //construct url and pass it to change
            const url = this
              .router
              .createUrlTree([{}], { relativeTo: this.route })
              .toString();
            this.location.go(url);
          }
          this.isDocked = false;
          this.OpenDialog(this.bikeId, this.bike, true);
        }
        // temporarily commented until test get success with new flow
        // this.RefreshMapWithContent();

        //added this flag to handle auto refresh of bike details
        this.ServiceCompleted = true;
      }
    }
    else {
      this.isServiceOpened = false;
      this.isCarOpened = true;
      this.isCarChecking = false;
      if (this.routeId) {
        const url = this
          .router
          .createUrlTree([{ car: 1, userId: this.loggedInUser.UserId, routeId: this.routeId }], { relativeTo: this.route })
          .toString();
        this.location.go(url);
      } else {
        //construct url and pass it to change
        const url = this
          .router
          .createUrlTree([{ car: 1, userId: this.loggedInUser.UserId }], { relativeTo: this.route })
          .toString();
        this.location.go(url);
      }
    }
    //adding undocked bikes to list temporarily
    this.bike["PreviousBikeStatus"] = this.bike["BikeStatus"];
    this.bike.Disabled = true;
    this.bike.DisableState = BikeDisableState.Testing;
    this.bike.isCheckCompleted = true;
    this.bike["isCancelled"] = true;
    this.bike["BikeStatus"] = CommonHandler.getBikeStatus(this.bike, this.bike.DockingStationId, this.bike.DockingPointId);
    this.dockingStationBikes = this.dockingStationBikes.filter(x => x.BikeId != this.bike.BikeId);
    if (!this.takenOutBikes.find(x => x.BikeId == this.bike.BikeId)) {
      this.takenOutBikes.push(this.bike);
    }
    else {
      var index = this.takenOutBikes.findIndex(x => x.BikeId == this.bike.BikeId);
      this.takenOutBikes[index] = this.bike;
    }

    // added this to handle cancel disable logic
    if (!this.isLooseBike) {
      this.isServiceOpened = false;
      this.isOpened = true;
      this.isCarOpened = false;
    }
    this.isLoading = false;
  }

  GetDockingStationDetailsById(stationId: any) {
    this.isInProcess = true;
    this.stationService.getDockingPointsForStation(stationId).subscribe(res => {

      //Section DS/Bikes with issues start
      //This section is used to map and filter docking station and bikes with issues
      if (this.isShowOnlyWithIssues) {
        let dsDetails = res;
        dsDetails["DockingPoints"] = dsDetails.DockingPoints.filter(d => d.DPDisabled
          || (!d.DPDisabled && d.Bike && d.Bike.Disabled));
        res = dsDetails;
        if (!res["Disabled"]) {
          res.TotalNumberOfBikes = this.dockingStationBikes.length + this.takenOutBikes.length;
        }
      }
      //Section DS/Bikes with issues end

      res["StationStatus"] = this.getDockedBikeStatusById(res);
      let color = MapExtension.getStationFeatureColor(res);
      let bikeCount = this.getAvailableBikeCount(res);
      let bikeCountSpan;
      if (bikeCount > 0) {
        bikeCountSpan = `${bikeCount}+`;
        color = "rgba(0,128,0,1)";
      } else if (bikeCount == 0) {
        color = "rgba(0,128,0,1)";
        bikeCountSpan =
          '<span class="material-icons" style="font-size: 11px;">done</span>';
      } else if (bikeCount < 0) {
        bikeCountSpan = `${Math.abs(bikeCount)}-`;
        color = StationColors.GREY_BIKES;
      }

      if (res.DockingPoints) {
        res.DockingPoints.forEach((dockingPoint) => {
          if (dockingPoint && dockingPoint.Bike != null && this.dockingStationBikes) {
            this.dockingStationBikes.find(x => x.BikeId == dockingPoint.Bike.BikeId).BikeStatus
              = CommonHandler.getBikeStatus(dockingPoint.Bike, stationId, dockingPoint.DockingPointId);
          }
        });
      }

      res["TotalNumberOfPoints"] = bikeCountSpan;
      if (res["Disabled"]) {
        res.TotalNumberOfBikes = "-";
        res["StationStatus"] = StationColors.DISABLED_WITHOUT_BIKES;
      }

      //check docking point disabled status and set station status
      if (res.DockingPoints) {
        let isDPNeedsRepair = res.DockingPoints.some(x => x && x.DPDisabled && x.DPDisabledReason == DockingPointDisabledReason.CheckRequired);
        if (isDPNeedsRepair)
          res["StationStatus"] = StationColors.CHECKED_NEEDS_REPAIR_BIKES;
      }



      setTimeout(() => {
        this.markertxtsingle.nativeElement.focus();
        this.markertxt2single.nativeElement.focus();
        this.markertxtsingle.nativeElement.innerHTML = res.TotalNumberOfBikes.toString();
        this.markertxtsingle.nativeElement.style.backgroundColor = res.StationStatus;

        //skip small square for >= promised number
        if (!res["Disabled"]) {
          if (bikeCount < 0) {
            this.markertxt2single.nativeElement.innerHTML = bikeCountSpan;
            this.markertxt2single.nativeElement.style.backgroundColor = color;
          }
          else {
            this.markertxt2single.nativeElement.innerHTML = null;
            this.markertxt2single.nativeElement.style.backgroundColor = null;
          }
        } else {
          this.markertxt2single.nativeElement.innerHTML = null;
          this.markertxt2single.nativeElement.style.backgroundColor = null;
        }

        if (this.selectedElem) {
          /* assigning isInProcess false after updating service panel docking station icon and map docking station 
             to enable auto refresh based on intervals
          */
          this.isInProcess = false;
        }
        else {
          /* assigning isInProcess false when page reload happens,
             as once page reload happens element pointer gets cleared
             due to that we can only do full map refresh to update with latest values.
          */
          this.isInProcess = false;
          this.RefreshMapWithContent();
        }
      }, 100);
    }, err => {

    });
  }

  GetDockingStationDetailsByIdAtDocked(stationId: any, bike) {
    this.isInProcess = true;
    this.stationService.getDockingPointsForStation(stationId).subscribe(res => {
      //Section DS/Bikes with issues start
      //This section is used to map and filter docking station and bikes with issues
      if (this.isShowOnlyWithIssues) {
        let dsDetails = res;
        dsDetails["DockingPoints"] = dsDetails.DockingPoints.filter(d => d.DPDisabled
          || (!d.DPDisabled && d.Bike && d.Bike.Disabled));
        res = dsDetails;
        if (!res["Disabled"]) {
          res.TotalNumberOfBikes = this.dockingStationBikes.length + this.takenOutBikes.length;
        }
      }
      //Section DS/Bikes with issues end

      res["StationStatus"] = this.getDockedBikeStatusById(res);
      let color = MapExtension.getStationFeatureColor(res);
      let bikeCount = this.getAvailableBikeCount(res);
      let bikeCountSpan;
      if (bikeCount > 0) {
        bikeCountSpan = `${bikeCount}+`;
        color = "rgba(0,128,0,1)";
      } else if (bikeCount == 0) {
        color = "rgba(0,128,0,1)";
        bikeCountSpan =
          '<span class="material-icons" style="font-size: 11px;">done</span>';
      } else if (bikeCount < 0) {
        bikeCountSpan = `${Math.abs(bikeCount)}-`;
        color = StationColors.GREY_BIKES;
      }

      res["TotalNumberOfPoints"] = bikeCountSpan;
      if (res["Disabled"]) {
        res.TotalNumberOfBikes = "-";
        res["StationStatus"] = StationColors.DISABLED_WITHOUT_BIKES;
      }
      setTimeout(() => {
        this.markertxtsingle.nativeElement.focus();
        this.markertxt2single.nativeElement.focus();

        this.markertxtsingle.nativeElement.innerHTML = res.TotalNumberOfBikes.toString();
        this.markertxtsingle.nativeElement.style.backgroundColor = res.StationStatus;
        //skip small square for >= promised number
        if (bikeCount < 0) {
          this.markertxt2single.nativeElement.innerHTML = bikeCountSpan;
          this.markertxt2single.nativeElement.style.backgroundColor = color;
        }
        else {
          this.markertxt2single.nativeElement.innerHTML = null;
          this.markertxt2single.nativeElement.style.backgroundColor = null;
        }

        if (this.selectedElem) {
          /* assigning isInProcess false after updating service panel docking station icon and map docking station 
             to enable auto refresh based on intervals
          */
          this.isInProcess = false;
        }
        else {
          /* assigning isInProcess false when page reload happens,
             as once page reload happens element pointer gets cleared
             due to that we can only do full map refresh to update with latest values.
          */
          this.isInProcess = false;
          this.RefreshMapWithContent();
        }
      });
    }, err => {

    });
  }

  GetDockingStationDetailsByIdAtTakenOutDocked(stationId: any, bike) {
    this.isInProcess = true;
    this.stationService.getDockingPointsForStation(stationId).subscribe(res => {
      //Section DS/Bikes with issues start
      //This section is used to map and filter docking station and bikes with issues
      if (this.isShowOnlyWithIssues) {
        let dsDetails = res;
        dsDetails["DockingPoints"] = dsDetails.DockingPoints.filter(d => d.DPDisabled
          || (!d.DPDisabled && d.Bike && d.Bike.Disabled));
        res = dsDetails;
        if (!res["Disabled"]) {
          res.TotalNumberOfBikes = this.dockingStationBikes.length + this.takenOutBikes.length;
        }
      }
      //Section DS/Bikes with issues end

      res["StationStatus"] = this.getDockedBikeStatusById(res);
      let color = MapExtension.getStationFeatureColor(res);
      let bikeCount = this.getAvailableBikeCount(res);
      let bikeCountSpan;
      if (bikeCount > 0) {
        bikeCountSpan = `${bikeCount}+`;
        color = "rgba(0,128,0,1)";
      } else if (bikeCount == 0) {
        color = "rgba(0,128,0,1)";
        bikeCountSpan =
          '<span class="material-icons" style="font-size: 11px;">done</span>';
      } else if (bikeCount < 0) {
        bikeCountSpan = `${Math.abs(bikeCount)}-`;
        color = StationColors.GREY_BIKES;
      }

      res["TotalNumberOfPoints"] = bikeCountSpan;
      if (res["Disabled"]) {
        res.TotalNumberOfBikes = "-";
        res["StationStatus"] = StationColors.DISABLED_WITHOUT_BIKES;
      }
      setTimeout(() => {
        this.markertxtsingle.nativeElement.focus();
        this.markertxt2single.nativeElement.focus();

        this.markertxtsingle.nativeElement.innerHTML = res.TotalNumberOfBikes.toString();
        this.markertxtsingle.nativeElement.style.backgroundColor = res.StationStatus;

        //skip small square for >= promised number
        if (bikeCount < 0) {
          this.markertxt2single.nativeElement.innerHTML = bikeCountSpan;
          this.markertxt2single.nativeElement.style.backgroundColor = color;
        }
        else {
          this.markertxt2single.nativeElement.innerHTML = null;
          this.markertxt2single.nativeElement.style.backgroundColor = null;
        }

        if (this.selectedElem) {
          /* assigning isInProcess false after updating service panel docking station icon and map docking station 
             to enable auto refresh based on intervals
          */
          this.isInProcess = false;
        }
        else {
          /* assigning isInProcess false when page reload happens,
             as once page reload happens element pointer gets cleared
             due to that we can only do full map refresh to update with latest values.
          */
          this.isInProcess = false;
          this.RefreshMapWithContent();
        }
      });
    }, err => {

    });
  }


  RefreshMapWithContent() {
    if (!this.isInProcess) {
      this.map.getOverlays().getArray().slice(0).forEach(function (overlay) {
        this.map.removeOverlay(overlay);
      }.bind(this));
      this.cleanMap();
      this.popup = new OlOverlay({
        element: this.popupElement.nativeElement,
        offset: [10, 10]
      });
      this.map.addOverlay(this.popup);
      this.getDockingStationsRefresh();
      this.setCurrentExtent();
      //auto center to car at refresh
      let currentCoordinates = localStorage.getItem("currentCoordinates");
      if (currentCoordinates != null) {
        var currentPosition = currentCoordinates.split(",").map(function (x) {
          return parseFloat(x);
        });
        if (!this.routeId) {
          //add center to current position
          this.map.getView().setCenter(currentPosition);
        }
      }
      /*
        remove value assigned to selectedElem,as after map refresh
        the pointer with docking station get removed
      */
      this.selectedElem = null;
    }
  }

  getDockedBikeStatusById(res) {
    let status = StationColors.AVAILABLE_BIKES;
    if (this.dockingStationBikes.length == 0) {
      for (let dockingPoint in res["DockingPoints"]) {
        let bike = res["DockingPoints"][dockingPoint]["Bike"];
        if (bike != null) {
          // if (!bike.Position) continue;
          if (bike.Disabled) {
            if (bike.DisableState == BikeDisableState.CheckedNeedFix
              || (bike.DisabledReason && bike.DisabledReason == BikeDisableState.CheckedNeedFix)) {
              status = StationColors.CHECKED_NEEDS_REPAIR_BIKES;
              break;
            } else if ((bike.DisableState && bike.DisableState != BikeDisableState.WithStreetTeam)
              || (bike.DisabledReason && bike.DisabledReason != BikeDisableState.WithStreetTeam)) {
              status = StationColors.AVAILABLE_WITH_DISABLED;
              break;
            }
            else if (bike.DisableState == BikeDisableState.WithStreetTeam
              || (bike.DisabledReason && bike.DisabledReason == BikeDisableState.WithStreetTeam))
              status = StationColors.AVAILABLE_BIKES;
          }
          else if (!bike.Disabled && bike.Resolved != 0) {
            status = StationColors.AVAILABLE_WITH_ERRORS;
          }
        }
      }
    }
    else {
      for (let bikeIndex in this.dockingStationBikes) {
        let bike = this.dockingStationBikes[bikeIndex];
        if (bike != null && bike.BikeId) {
          // if (!bike.Position) continue;
          if (bike.Disabled) {
            if (bike.Disabled) {
              if (bike.DisableState == BikeDisableState.CheckedNeedFix
                || (bike.DisabledReason && bike.DisabledReason == BikeDisableState.CheckedNeedFix)) {
                status = StationColors.CHECKED_NEEDS_REPAIR_BIKES;
                break;
              } else if ((bike.DisableState && bike.DisableState != BikeDisableState.WithStreetTeam)
                || (bike.DisabledReason && bike.DisabledReason != BikeDisableState.WithStreetTeam)) {
                status = StationColors.AVAILABLE_WITH_DISABLED;
                break;
              }
              else if (bike.DisableState == BikeDisableState.WithStreetTeam
                || (bike.DisabledReason && bike.DisabledReason == BikeDisableState.WithStreetTeam))
                status = StationColors.AVAILABLE_BIKES;
            }
          }
          else if (!bike.Disabled && bike.Resolved != 0) {
            status = StationColors.AVAILABLE_WITH_ERRORS;
          }
        }
      }
    }
    return status;
  }

  SetBikeToAvailableFree() {
    if (this.isDocked) {
      this.bike.isCancelled = false;
    }

    this.isLoading = true;
    this.bikeId = this.bike.BikeId;

    //adding undocked bikes to temporary list
    this.bike["PreviousBikeStatus"] = null;
    this.bike.Disabled = true;
    this.bike.DisableState = BikeDisableState.Testing;
    this.bike["isCheckCompleted"] = true;
    this.bike["DPDisabled"] = false;
    this.bike["DPDisabledReason"] = null;
    this.bike["BikeStatus"] = CommonHandler.getBikeStatus(this.bike, this.bike.DockingStationId, this.bike.DockingPointId);
    this.dockingStationBikes = this.dockingStationBikes.filter(x => x.BikeId != this.bike.BikeId);
    if (!this.takenOutBikes.find(x => x.BikeId == this.bike.BikeId)) {
      this.takenOutBikes.push(this.bike);
    }
    else {
      var index = this.takenOutBikes.findIndex(x => x.BikeId == this.bike.BikeId);
      this.takenOutBikes[index] = this.bike;
    }

    //resolve issues of the bike
    if (this.bike.Resolved > 0) {
      this.bike["HasCriticalIssue"] = false;
      this.ResolveIssuePerBike(this.bikeId);
    }

    if (this.dockingStationId) {
      //construct url and pass it to change
      if (this.routeId) {
        const url = this
          .router
          .createUrlTree([{ general: 1, stationId: this.dockingStationId, routeId: this.routeId }], { relativeTo: this.route })
          .toString();
        this.location.go(url);
      } else {
        const url = this
          .router
          .createUrlTree([{ general: 1, stationId: this.dockingStationId }], { relativeTo: this.route })
          .toString();
        this.location.go(url);
      }
      // temporarily commented until test get success with new flow
      //var bikeStateChangeDTO = { Disabled: false, DisabledReason: null };
      // this.DisableBike(bikeStateChangeDTO);
      this.getDockingStationDetails(this.dockingStationId, false);
    }
    else {
      //when set bike is okay for loose bikes
      //construct url and pass it to change
      if (this.routeId) {
        const url = this
          .router
          .createUrlTree([{ routeId: this.routeId }], { relativeTo: this.route })
          .toString();
        this.location.go(url);
      } else {
        const url = this
          .router
          .createUrlTree([], { relativeTo: this.route })
          .toString();
        this.location.go(url);
      }
      this.isOpened = false;
      this.isServiceOpened = false;
      this.isLoading = false;
      this.RefreshMapWithContent();
    }

    //bike service details create or update
    var bikeServiceDTO = { NumberOfChecks: this.bike.NumberOfChecks, BikeId: this.bikeId }
    this.CreateOrUpdateBikeService(bikeServiceDTO);

    //reset unsuccessful session count when check completed
    this.resetUndockFailureCountByBike();

    //added this flag to handle auto refresh of bike details
    this.ServiceCompleted = true;
    this.checkedCategories = [];
    //confirm bike is okay when ok button pressed
    this.confirmBikeIsOkay();

    if (this.isCarChecking) {
      this.transportBikes = this.transportBikes.filter(y => y.BikeId != this.bike.BikeId);
      this.UpdateBikeTransport();
      this.isCarChecking = false;
    }
  }

  confirmBikeIsOkay() {
    const dialogRe = this.dialog.open(LiveMapConfirmPopupComponent, {
      width: '500px',
      height: '700px',
      data: { bikeId: this.bike.BikeId, bike: this.bike, isBikeOkay: true, userName: this.loggedInUser.FirstName, isShouldBeChecked: false }
    });

    dialogRe.afterClosed().subscribe(result => {
      if (this.enableRoutes) {
        let details = `Bike ${this.bike["VisualId"]} checked and okay for rental`;
        this.createWayPointAction(details);
      }
    });
  }

  confirmBikeShouldBeChecked() {
    const dialogRe = this.dialog.open(LiveMapConfirmPopupComponent, {
      width: '500px',
      height: '700px',
      data: { bikeId: this.bike.BikeId, bike: this.bike, isBikeOkay: true, userName: this.loggedInUser.FirstName, isShouldBeChecked: true }
    });

    dialogRe.afterClosed().subscribe(result => {
      if (this.dockingStationId) {
        if (this.routeId) {
          const url = this
            .router
            .createUrlTree([{ general: 1, stationId: this.dockingStationId, routeId: this.routeId }], { relativeTo: this.route })
            .toString();
          this.location.go(url);
        } else {
          const url = this
            .router
            .createUrlTree([{ general: 1, stationId: this.dockingStationId }], { relativeTo: this.route })
            .toString();
          this.location.go(url);
        }
      }
      else {
        if (this.routeId) {
          const url = this
            .router
            .createUrlTree([{ routeId: this.routeId }], { relativeTo: this.route })
            .toString();
          this.location.go(url);
        } else {
          const url = this
            .router
            .createUrlTree([], { relativeTo: this.route })
            .toString();
          this.location.go(url);
        }
        this.isServiceOpened = false;
      }
      //added this flag to handle auto refresh of bike details
      this.ServiceCompleted = true;
      this.bike.isCheckCompleted = true;
      this.bike.isCancelled = false;
      this.bike.Disabled = false;
      this.bike.DisableState = null;
      this.bike["BikeStatus"] = BikeStatus.LooseBikeWithError;
      let bikeStateChangeDTO = { Disabled: false, DisabledReason: null };
      this.DisableBike(bikeStateChangeDTO);

      //bike service details create or update
      var bikeServiceDTO = { NumberOfChecks: this.bike.NumberOfChecks, BikeId: this.bikeId }
      this.CreateOrUpdateBikeService(bikeServiceDTO);

      //remove bike from list after checked now is pressed
      this.dockingStationBikes = this.dockingStationBikes.filter(x => x.BikeId != this.bikeId);
      this.takenOutBikes = this.takenOutBikes.filter(x => x.BikeId != this.bikeId);

      if (this.enableRoutes) {
        //creation waypoint action
        let details = `Bike ${this.bike["VisualId"]} checked and okay for rental with minor issues`;
        this.createWayPointAction(details);
      }

      //instant refresh
      this.RefreshMapWithContent();
    });
  }

  confirmBikePlaceHere() {
    const dialogRe = this.dialog.open(LiveMapConfirmPopupComponent, {
      width: '500px',
      height: '700px',
      data: { bikeId: this.bike.BikeId, bike: this.bike, isBikeOkay: true, userName: this.loggedInUser.FirstName, isBikeNeedsRepair: true }
    });

    dialogRe.afterClosed().subscribe(result => {
      if (this.dockingStationId) {
        if (this.routeId) {
          const url = this
            .router
            .createUrlTree([{ general: 1, stationId: this.dockingStationId, routeId: this.routeId }], { relativeTo: this.route })
            .toString();
          this.location.go(url);
        } else {
          const url = this
            .router
            .createUrlTree([{ general: 1, stationId: this.dockingStationId }], { relativeTo: this.route })
            .toString();
          this.location.go(url);
        }
        this.isServiceOpened = false;
        this.isOpened = true;
      }
      else {
        if (this.routeId) {
          const url = this
            .router
            .createUrlTree([{ routeId: this.routeId }], { relativeTo: this.route })
            .toString();
          this.location.go(url);
        } else {
          const url = this
            .router
            .createUrlTree([], { relativeTo: this.route })
            .toString();
          this.location.go(url);
        }
        this.isServiceOpened = false;
      }
      //added this flag to handle auto refresh of bike details
      this.ServiceCompleted = true;
      this.bike.isCheckCompleted = true;
      this.bike.isCancelled = false;
      this.bike.Disabled = true;
      this.bike.DisableState = BikeDisableState.CheckedNeedFix;
      this.bike["BikeStatus"] = BikeStatus.DisabledCheckedNeedRepair;
      let bikeStateChangeDTO = { Disabled: true, DisabledReason: BikeDisableState.CheckedNeedFix };
      this.DisableBike(bikeStateChangeDTO);

      //bike service details create or update
      var bikeServiceDTO = { NumberOfChecks: this.bike.NumberOfChecks, BikeId: this.bikeId }
      this.CreateOrUpdateBikeService(bikeServiceDTO);

      //reset unsuccessful session count when check completed
      //this.resetUndockFailureCountByBike();

      if (!this.isDockedDialogOpened) {
        //remove bike from list after checked now is pressed
        this.dockingStationBikes = this.dockingStationBikes.filter(x => x.BikeId != this.bikeId);
        this.takenOutBikes = this.takenOutBikes.filter(x => x.BikeId != this.bikeId);
      }
      else {
        this.bike["isCheckCompleted"] = false;
        if (this.dockingStationBikes.find(x => x.BikeId == this.bike.BikeId)) {
          var index = this.dockingStationBikes.findIndex(x => x.BikeId == this.bike.BikeId);
          this.dockingStationBikes[index] = this.bike;
        }
        if (this.takenOutBikes.find(x => x.BikeId == this.bike.BikeId)) {
          var index = this.takenOutBikes.findIndex(x => x.BikeId == this.bike.BikeId);
          this.takenOutBikes[index] = this.bike;
        }

        let dpErrorReportDto = {
          "ErrorCategoryIds": [2],
          "Comments": this.comments
        };
        dpErrorReportDto["DockingStationId"] = this.bike["DockingStationId"];
        dpErrorReportDto["DockingPointId"] = this.bike["DockingPointId"];
        this.createDPIssue(dpErrorReportDto, this.bike["DPVisualId"]);
        this.GetDockingStationDetailsById(this.dockingStationId);

        this.isDockedDialogOpened = false;
      }

      if (this.enableRoutes) {
        //creation waypoint action
        let details = `Bike ${this.bike["VisualId"]} checked, repair required and parked for pickup`;
        this.createWayPointAction(details);
      }

      //instant refresh
      this.RefreshMapWithContent();
    });
  }

  LockBike() {
    this.bikesService.sendLockCommand(this.bikeId).subscribe(res => {
      // this.loggerService.showSuccessfulMessage(this.commonService.TranslateMessage(TranslateMessageTypes.LockSuccess));
      this.isLockState = true;
    }, err => {
      this.loggerService.showErrorMessage(this.commonService.TranslateMessage(TranslateMessageTypes.LockFail));
    })
  }

  UnLockBike() {
    this.bikesService.sendUnLockCommand(this.bikeId).subscribe(res => {
      // this.loggerService.showSuccessfulMessage(this.commonService.TranslateMessage(TranslateMessageTypes.UnlockSuccess));
      this.isLockState = false;
    }, err => {
      this.loggerService.showErrorMessage(this.commonService.TranslateMessage(TranslateMessageTypes.UnlockFail));
    })
  }

  RedirectToNewLocation() {
    this.isServiceOpened = true;
    this.isOpened = false;
    //construct url and pass it to change
    if (this.routeId) {
      const url = this
        .router
        .createUrlTree([{ services: 1, stationId: this.dockingStationId, bikeId: this.bikeId, routeId: this.routeId }], { relativeTo: this.route })
        .toString();
      this.location.go(url);
    } else {
      const url = this
        .router
        .createUrlTree([{ services: 1, stationId: this.dockingStationId, bikeId: this.bikeId }], { relativeTo: this.route })
        .toString();
      this.location.go(url);
    }
  }




  RepairRequiredForBike() {
    this.isLoading = true;
    this.bikeId = this.bike.BikeId;
    this.bike.Resolved = (this.bike.Resolved) ? this.bike.Resolved++ : 1;
    this.selectedErrorCategories = [];
    this.checkedCategories = [];
    this.disableBike = false;
    this.otherCritical = false;
    this.otherFell = false;
    this.comments = null;
    this.CreateReportError();
  }

  CreateTransportationOrderForRepairRequired(result) {

    var bikeStateChangeDTO = { Disabled: true, DisabledReason: BikeDisableState.ToWorkshop };
    if (this.dockingStationId) {
      if (this.routeId) {
        const url = this
          .router
          .createUrlTree([{ general: 1, stationId: this.dockingStationId, routeId: this.routeId }], { relativeTo: this.route })
          .toString();
        this.location.go(url);
      } else {
        const url = this
          .router
          .createUrlTree([{ general: 1, stationId: this.dockingStationId }], { relativeTo: this.route })
          .toString();
        this.location.go(url);
      }
    }
    else {
      if (this.routeId) {
        const url = this
          .router
          .createUrlTree([{ general: 1, stationId: this.dockingStationId, routeId: this.routeId }], { relativeTo: this.route })
          .toString();
        this.location.go(url);
      } else {
        const url = this
          .router
          .createUrlTree([{ general: 1, stationId: this.dockingStationId }], { relativeTo: this.route })
          .toString();
        this.location.go(url);
      }
    }
    //added this flag to handle auto refresh of bike details
    this.ServiceCompleted = true;
    this.DisableBike(bikeStateChangeDTO);

    //adding undocked bikes to list temporarily
    this.dockingStationBikes = this.dockingStationBikes.filter(x => x.BikeId != this.bike.BikeId);
    this.bike["PreviousBikeStatus"] = this.bike["BikeStatus"];
    this.bike.Disabled = true;
    this.bike.DisableState = BikeDisableState.ToWorkshop;
    this.bike.isCheckCompleted = true;
    this.bike.isCancelled = false;
    this.bike["BikeStatus"] = CommonHandler.getBikeStatus(this.bike, this.bike.DockingStationId, this.bike.DockingPointId);
    // if (!this.takenOutBikes.find(x => x.BikeId == this.bike.BikeId)) {
    //   this.takenOutBikes.push(this.bike);
    // }
    // else {
    //   var index = this.takenOutBikes.findIndex(x => x.BikeId == this.bike.BikeId);
    //   this.takenOutBikes[index] = this.bike;
    // }
    //remove bikes taken to car
    this.takenOutBikes = this.takenOutBikes.filter(x => x.BikeId != this.bike.BikeId);
    this.StopPassiveSession(this.bike.BikeId);
  }

  UndockOrUnlockBike(bike) {
    this.bikeId = bike.BikeId;
    bike.Disabled = true;
    bike.DisableState = BikeDisableState.Moving;
    bike["BikeStatus"] = CommonHandler.getBikeStatus(bike, bike.DockingStationId, bike.DockingPointId);
    this.CreateTransportOrder(bike);
    bike.Disabled = true;
    bike.DisableState = BikeDisableState.Moving;
    bike["BikeStatus"] = CommonHandler.getBikeStatus(bike, bike.DockingStationId, bike.DockingPointId);
    if (this.transportBikes.length == 0)
      this.AddBikeToCar(bike);
    else
      this.UpdateBikesInCar(bike);
  }

  RequestTransport(bike) {
    this.ResetCheckAndTransportValues(bike);
    this.signalRService.SubscribeConnection(bike.Serial);
    bike["isTransChecked"] = true;
    this.isTransInProcess = true;
    this.bikeId = bike.BikeId;
    if (bike.BikeStatus == BikeStatus.DockedWithError ||
      bike.BikeStatus == BikeStatus.DockedWithNoError ||
      bike.BikeStatus == BikeStatus.DisabledWithTesting ||
      bike.BikeStatus == BikeStatus.DisabledWithMoving ||
      bike.BikeStatus == BikeStatus.Disabled) {
      this.bikesService.sendUndockCommand(bike.BikeId).subscribe(
        res => {
          this.GetBikePCB(bike, true);
        },
        error => {
          this.bikesService.sendUnLockCommand(bike.BikeId).subscribe(
            res => {
              this.GetBikePCB(bike, true);
            },
            err => {
              this.loggerService.showErrorMessage(this.commonService.TranslateMessage(TranslateMessageTypes.UndockAndUnlockFail));
              this.GetBikePCB(bike, true);
            }
          );
        }
      );
    } else if (bike.BikeStatus == BikeStatus.LockedWithError ||
      bike.BikeStatus == BikeStatus.LockedWithNoError ||
      bike.BikeStatus == BikeStatus.DisabledWithTesting ||
      bike.BikeStatus == BikeStatus.DisabledWithMoving ||
      (bike.BikeStatus == BikeStatus.DisabledLoose && bike.LockState == LockState.LockedArrest) ||
      bike.BikeStatus == BikeStatus.Disabled) {
      this.bikesService.sendUnLockCommand(bike.BikeId).subscribe(
        res => {
          this.GetBikePCB(bike, true);
        },
        error => {
          this.bikesService.sendUndockCommand(bike.BikeId).subscribe(
            res => {
              this.GetBikePCB(bike, true);
            },
            err => {
              this.loggerService.showErrorMessage(this.commonService.TranslateMessage(TranslateMessageTypes.UndockAndUnlockFail));
              this.GetBikePCB(bike, true);
            }
          );
        }
      );
    }
    else if (bike.BikeStatus == BikeStatus.LooseBikeWithError ||
      bike.BikeStatus == BikeStatus.LooseBikeWithNoError ||
      bike.BikeStatus == BikeStatus.DisabledWithTesting ||
      bike.BikeStatus == BikeStatus.DisabledWithMoving ||
      bike.BikeStatus == BikeStatus.DisabledLoose ||
      bike.BikeStatus == BikeStatus.Disabled) {
      bike.Disabled = true;
      bike.DisableState = BikeDisableState.Moving;
      bike["BikeStatus"] = CommonHandler.getBikeStatus(bike, bike.DockingStationId, bike.DockingPointId);
      bike["isTakenOut"] = true;
      bike["isUndocking"] = true;
      this.takenOutBikes = this.takenOutBikes.filter(x => x.BikeId != this.bike.BikeId);
      this.dockingStationBikes = this.dockingStationBikes.filter(x => x.BikeId != this.bike.BikeId);
      if (!this.takenOutBikes.find(x => x.BikeId == bike.BikeId)) {
        this.takenOutBikes.push(this.bike);
      }
      else {
        var index = this.takenOutBikes.findIndex(x => x.BikeId == bike.BikeId);
        this.takenOutBikes[index] = bike;
      }
      var bikeStateChangeDTO = { Disabled: true, DisabledReason: BikeDisableState.Moving };
      this.DisableBike(bikeStateChangeDTO);
      this.isTransInProcess = false;
      // this.GetBikePCB(bike, true);
      bike.Disabled = true;
      bike.DisableState = BikeDisableState.Moving;
      bike["BikeStatus"] = CommonHandler.getBikeStatus(bike, bike.DockingStationId, bike.DockingPointId);
      if (this.transportBikes.length == 0)
        this.AddBikeToCar(bike);
      else
        this.UpdateBikesInCar(bike);
    }
  }

  CreateTransportOrder(bike) {
    bike["PreviousBikeStatus"] = bike["BikeStatus"];
    //reset to null so when docked bike it will check for issues that not resolved
    if (bike["PreviousBikeStatus"] == BikeStatus.DisabledWithTesting || bike["PreviousBikeStatus"] == BikeStatus.DockedWithNoError)
      bike["PreviousBikeStatus"] = null;
    var bikeStateChangeDTO = { Disabled: true, DisabledReason: BikeDisableState.Moving };
    this.bikeMoving = true;
    this.DisableBike(bikeStateChangeDTO);
    if (this.isDocked && this.isChecking && this.isTransportation) {
      //set transportation flags to enable correct view after transportation with test or moving bikes
      bike.isTransChecked = true;
      bike.isCheckCompleted = false;
      bike.isTransUndocking = true;
      bike.isTransTakenOut = true;
      bike.isChecked = false;
      bike.isUndocking = false;
      this.isTransportation = false;
    }
    //adding undocked bikes to list temporarily
    this.dockingStationBikes = this.dockingStationBikes.filter(x => x.BikeId != bike.BikeId);
    bike.Disabled = true;
    bike.DisableState = BikeDisableState.Moving;
    bike["BikeStatus"] = CommonHandler.getBikeStatus(bike, bike.DockingStationId, bike.DockingPointId);
    // if (!this.takenOutBikes.find(x => x.BikeId == bike.BikeId)) {
    //   this.takenOutBikes.push(bike);
    // }
    // else {
    //   var index = this.takenOutBikes.findIndex(x => x.BikeId == bike.BikeId);
    //   this.takenOutBikes[index] = bike;
    // }

    //remove bikes after moving
    this.takenOutBikes = this.takenOutBikes.filter(x => x.BikeId != bike.BikeId);
  }

  DisableBike(bikeStateChangeDTO, isCancel = false) {
    this.bikesService.enableDisableBike(this.bikeId, bikeStateChangeDTO)
      .subscribe(data => {
        // if (bikeStateChangeDTO.Disabled)
        //   this.loggerService.showSuccessfulMessage(this.commonService.TranslateMessage(TranslateMessageTypes.Disable) + this.GetDisableReason(bikeStateChangeDTO.DisabledReason));
        // else
        //   this.loggerService.showSuccessfulMessage(this.commonService.TranslateMessage(TranslateMessageTypes.Enable));
        //only reload bike details when one of the following condition true
        if ((this.ServiceCompleted || this.bikeMoving) && !this.isLooseBike) {
          this.isLoading = false;
          // enabling transportation click
          this.isTransInProcess = false;
          //check if this condition met for loose bikes from check flow and ToWorkshop
          if (this.isDocked && !this.isDialogOpened) {
            this.RefreshDetails();
            this.isDocked = false;
          }
          else {
            //construct url and pass it to change
            if (this.routeId) {
              const url = this
                .router
                .createUrlTree([{ routeId: this.routeId }], { relativeTo: this.route })
                .toString();
              this.location.go(url);
            } else {
              const url = this
                .router
                .createUrlTree([], { relativeTo: this.route })
                .toString();
              this.location.go(url);
            }
            this.isOpened = false;
            this.isServiceOpened = false;
            this.isDialogOpened = false;
            this.RefreshMapWithContent();
          }
          this.bikeMoving = false;
        }
        else if ((this.ServiceCompleted || this.bikeMoving) && this.isLooseBike && !this.isDocked) {
          //construct url and pass it to change
          if (this.routeId) {
            const url = this
              .router
              .createUrlTree([{ routeId: this.routeId }], { relativeTo: this.route })
              .toString();
            this.location.go(url);
          } else {
            const url = this
              .router
              .createUrlTree([], { relativeTo: this.route })
              .toString();
            this.location.go(url);
          }
          this.isOpened = false;
          this.isServiceOpened = false;
          this.isLoading = false;
          this.RefreshMapWithContent();
        }
        if (bikeStateChangeDTO.DisabledReason == BikeDisableState.Testing)
          this.isLoading = false;
        // added this to handle cancel disable logic
        if (isCancel) {
          if (!this.isLooseBike) {
            this.isServiceOpened = false;
            this.isOpened = true;
            this.isCarOpened = false;
          }
          this.isLoading = false;
        }
      }, error => {
        this.loggerService.showErrorMessage(error.error.Message);
        this.isLoading = false;
      });
  }

  StopPassiveSession(bikeId) {
    this.bikesService.sendStopPassiveSessionCommand(bikeId).subscribe(res => {

    }, err => {

    });
  }

  GetDisableReason(disabledReason) {
    var disableReasonText = "";
    switch (disabledReason) {
      case BikeDisableState.Moving:
        disableReasonText = "Moving"
        break;
      case BikeDisableState.Testing:
        disableReasonText = "Testing"
        break;
      case BikeDisableState.ToWorkshop:
        disableReasonText = "Repair required"
        break;
      default:
        break;
    }
    return disableReasonText;
  }

  GoToDockingStationDet() {
    this.router.navigate([`/dockingStations/${this.dockingStationId}/dockingpoints`]);
  }

  GetBikeServiceByBikeId() {
    this.bikesService.getBikeServiceByBikeId(this.bikeId).subscribe(res => {
      if (res) {
        this.bike.CheckDate = res.CheckDate;
        this.bike.NumberOfChecks = res.NumberOfChecks;
        this.bike.ServiceId = res.Id;
      }
      else {
        this.bike.CheckDate = null;
        this.bike.NumberOfChecks = 0;
      }
      if (this.isLooseBike) {
        var bikeStateChangeDTO = { Disabled: true, DisabledReason: BikeDisableState.Testing };
        this.DisableBike(bikeStateChangeDTO);
      }
      else
        this.isLoading = false;
    }, err => {
      this.loggerService.showErrorMessage(this.commonService.TranslateMessage(TranslateMessageTypes.BikeServiceGetError));
      this.isLoading = false;
    })
  }

  CreateOrUpdateBikeService(serviceDTO) {
    this.bikesService.CreateOrUpdateBikeService(this.bikeId, serviceDTO)
      .subscribe(data => {
        this.loggerService.showSuccessfulMessage(this.commonService.TranslateMessage(TranslateMessageTypes.BikeServiceAddSuccess));
      }, error => {
        this.loggerService.showErrorMessage(this.commonService.TranslateMessage(TranslateMessageTypes.BikeServiceAddFail));
      });
  }

  CreateOrUpdateBikeServiceForDocked(serviceDTO, isExistBike = false, bike) {
    // isExistBike is default false and this property is used when bike not undocked properly.
    this.bikesService.CreateOrUpdateBikeService(this.bikeId, serviceDTO)
      .subscribe(data => {
        if (isExistBike)
          setTimeout(() => this.GetDockingStationDetailsByIdAtDocked(this.dockingStationId, bike), 5000);
        else
          setTimeout(() => this.GetDockingStationDetailsByIdAtTakenOutDocked(this.dockingStationId, bike), 5000);
        // this.loggerService.showSuccessfulMessage(this.commonService.TranslateMessage(TranslateMessageTypes.BikeServiceAddSuccess));
      }, error => {
        // this.loggerService.showErrorMessage(this.commonService.TranslateMessage(TranslateMessageTypes.BikeServiceAddFail));
      });
  }

  getAvailableBikeCount(data) {
    return data.NumberOfAvailableBikes == data.NumberOfPriorityReservations
      ? 0 : data.NumberOfAvailableBikes - data.NumberOfPriorityReservations;
    // : data.NumberOfAvailableBikes > data.NumberOfPriorityReservations
    //   ? data.NumberOfAvailableBikes - data.NumberOfPriorityReservations
    //   : data.NumberOfAvailableBikes - data.NumberOfPriorityReservations;
  }

  styleCache: any = {};
  styleFunction(feature: OlFeature, resolution) {
    let style;
    style = this.getLayerStyle(false, feature.get("session"), feature.get("color"), feature.get("inSession"));
    style.getText().setText(resolution < 19 ? feature.get("name") : "");
    if (resolution > 19) {
      style.getImage().setScale(0.7);
    }
    return style;
  }

  // Layer styles
  interactionStyleFunction(feature: OlFeature, resolution) {
    let style;
    let type;
    let features = feature.get("features");
    if (features && features.length > 1) {
      if (features.length > 1) {
        let colorsGroup = [];
        this.GetGroupedColorForBikes(features, colorsGroup);
        let maxObj = CommonHandler.GetMaxObject(colorsGroup, "count");
        style = MapExtension.getClusterNumberStyle(
          maxObj.feature.get("color"),
          true
        );
        style.getText().setText(features.length.toString());
        colorsGroup = [];
      }
    } else if (features) {
      let feature = features[0];
      type = feature.get("type");
      let session = feature.get("session");
      let inSession = feature.get("inSession");
      if (type == "bike") {
        style = this.getLayerStyle(true, session, feature.get("color"), inSession);
        style.getText().setText(resolution < 19 ? feature.get("name") : "");
        // return style;
      } else if (type == "dock") {
        let data = feature.get("data");
        let styles = MapExtension.getLargeDockingStationStyles(
          true,
          data,
          this.isMobileOnly
        );

        let text = "";
        text = MapExtension.getFeatureName(feature);
        styles[1].getText().setText(text);
        style = styles[1];
      }
      else if (type == "small-dock") {
        let data = feature.get("data");
        let styles = MapExtension.getSmallDockingStationsStyles(
          true,
          data,
          this.isMobileOnly
        );

        let text = "";
        text = MapExtension.getFeatureName(feature);
        styles[1].getText().setText(text);
        style = styles[1];
      }
      else if (type == "dock-radius") {
        let styles = MapExtension.getDockingStationRadiusStyles();
        style = styles[0];
      }
    } else {
      type = feature.get("type");
      let session = feature.get("session");
      let inSession = feature.get("inSession");
      if (type == "bike") {
        style = this.getLayerStyle(true, session, feature.get("color"), inSession);
        style.getText().setText(resolution < 19 ? feature.get("name") : "");
        // return style;
      } else if (type == "dock") {
        let data = feature.get("data");
        let styles = MapExtension.getLargeDockingStationStyles(
          true,
          data,
          this.isMobileOnly
        );
        let text = "";
        text = MapExtension.getFeatureName(feature);
        styles[1].getText().setText(text);
        style = styles[1];
      }
      else if (type == "small-dock") {
        let data = feature.get("data");
        let styles = MapExtension.getSmallDockingStationsStyles(
          true,
          data,
          this.isMobileOnly
        );

        let text = "";
        text = MapExtension.getFeatureName(feature);
        styles[1].getText().setText(text);
        style = styles[1];
      }
      else if (type == "dock-radius") {
        let styles = MapExtension.getDockingStationRadiusStyles();
        style = styles[0];
      }
      else if (type == "route") {
        let styles = this.routeStyleFunction(feature, resolution);
        style = styles;
      }
      else if (type == "waypoint") {
        let styles = this.wayPointStyleFunction(feature, resolution);
        style = styles;
      }
      else if (type = "zone") {
        style = this.styleZoneFunction(feature, resolution);
      }
    }
    if (type != "dock-radius" && resolution > 19) {
      if (type != "route" && type != "zone") {
        style.getImage().setScale(0.7);
        style.getText().setScale(0.7);
        style.getText().setOffsetY(2);
      }
      if (type == "small-dock") {
        style.getImage().anchor_ = [1.485, 1.485];
        style.getText().setOffsetX(10.785);
        style.getText().setOffsetY(-10.785);
        // style.getText().setText("");
      }
      else if (type == "route") {
        style[1].getImage().setScale(0.7);
      }
    }

    return style;
  }

  private GetGroupedColorForBikes(features: any, colorsGroup: any[]) {
    features.forEach(feat => {
      if (colorsGroup.length == 0) {
        let obj = { "feature": feat, "count": 1 };
        colorsGroup.push(obj);
      }
      else {
        let isExist = colorsGroup.find(x => x.feature.get('color') == feat.get('color'));
        if (isExist) {
          let count = isExist.count + 1;
          let index = colorsGroup.findIndex(x => x.feature.get('color') == feat.get('color'));
          let obj = { "feature": isExist.feature, "count": count };
          colorsGroup[index] = obj;
        }
        else {
          let obj = { "feature": feat, "count": 1 };
          colorsGroup.push(obj);
        }
      }
    });
  }

  loadDocks(stations: any) {
    for (let station of stations) {
      this.addDockingStation(station, false);
    }

    //when dock view opened directly
    if (this.dockingStationId) {
      setTimeout(() => {
        let dockRadiusFeature = this.dockRadiusLayer.getSource().getFeatures().find(x => x.getId() == this.dockingStationId);
        dockRadiusFeature.setStyle(this.styleDockRadiusFunction(null, this.dockingStationId)[0]);
      }, 1000);
    }
  }

  loadCars(cars) {
    for (let car of cars) {
      if (car["Position"] && car.PrivilegeId != UserPrivileges.Individual)
        this.addCar(car);
    }
  }

  public addCar(car: any): void {
    this.isCarInRange = false;
    if (car.UserId != this.loggedInUser.UserId) {
      let numberOfBikes = JSON.parse(car.TransportBikes).length;

      let positionFeature = new OlFeature({
        geometry: new OlPoint([car["Position"]["Longitude"], car["Position"]["Latitude"]]
        ),
        name: car.UserId.toString(),
        data: { 'user': car, 'Latitude': car["Position"]["Latitude"], 'Longitude': car["Position"]["Longitude"], "numberOfBikes": numberOfBikes },
        type: "car"
      });
      positionFeature.setId(car.UserId);
      if (this.formatTimeRangeDuration(car.Timestamp, 0, 15)) {
        positionFeature.setStyle([this.getGeoOtherLayerStyle(), this.getCarNameStyle()]);
        this.isCarInRange = true;
      }
      else if (this.formatTimeRangeDuration(car.Timestamp, 15, 60)) {
        positionFeature.setStyle([this.getOtherStyle(), this.getCarNameStyle()]);
        this.isCarInRange = true;
      }

      if (this.isCarInRange) {
        let style = positionFeature.getStyle()[0];
        let carNameStyle = positionFeature.getStyle()[1];
        if (style) {
          style.getText().setText(numberOfBikes.toString());
          carNameStyle.getText().setText(car.Name);
          this.carSource.addFeature(positionFeature);
        }
      }
    }
  }

  loadZones(zones) {
    for (let zone of zones) {
      this.addZone(zone);
    }
  }

  public addZone(zone: any): void {
    let zoneSource = this.zoneLayer.getSource();
    let polygonText = zone.geometry;
    polygonText = polygonText.substring(7);
    polygonText = polygonText.replace(/\(/g, '[').replace(/\)/g, ']').replace(/\,/g, '],[').replace(/ /g, ',');
    let points = JSON.parse(polygonText) as number[][];
    let coordinates = []
    coordinates.push(points);

    let transformedCenterCoordinates = [];
    if (zone.center?.latitude && zone.center?.longitude) {
      transformedCenterCoordinates = OlProj.transform([zone.center.longitude, zone.center.latitude], 'EPSG:4326', 'EPSG:3857');
    }
    let data = {
      center: transformedCenterCoordinates,
      demandText: `${zone.totalBikes} (${zone.predictedBike})`,
      zoneData: zone
    }

    let feature = new OlFeature({
      name: zone.name,
      geometry: new OlPolygon(coordinates).transform('EPSG:4326', 'EPSG:3857'),
      type: "zone",
      data: data
    });
    feature.setId(zone.id);
    zoneSource.addFeature(feature);
  }

  styleDockRadiusFunction(feature: OlFeature, dockingStationId, resolution = null) {
    return (feature) ?
      (
        (dockingStationId == feature.getId()) ?
          MapExtension.getDockingStationRadiusStyles() :
          null
      ) : MapExtension.getDockingStationRadiusStyles();
  }

  styleDockFunction(feature: OlFeature, resolution) {
    let data = feature.get("data");
    //let color = MapExtension.getStationTickFeatureColor(data);
    let styles = MapExtension.getLargeDockingStationStyles(
      false,
      data,
      this.isMobileOnly
    );
    let text = "";
    // if (resolution < 19) {
    text = MapExtension.getFeatureName(feature);
    // };
    styles[1].getText().setText(text);
    if (resolution > 19) {
      styles[1].getImage().setScale(0.7);
      styles[1].getText().setScale(0.7);
      styles[1].getText().setOffsetY(2);
    }
    return styles;
  }

  styleSmallDockFunction(feature: OlFeature, resolution) {
    let data = feature.get("data");
    //let color = MapExtension.getStationTickFeatureColor(data);
    let styles = MapExtension.getSmallDockingStationsStyles(
      false,
      data,
      this.isMobileOnly
    );
    let text = "";
    // if (resolution < 19) {
    text = MapExtension.getFeatureName(feature);
    // };
    styles[1].getText().setText(text);
    if (resolution > 19) {
      styles[1].getImage().setScale(0.7);
      styles[1].getImage().anchor_ = [1.485, 1.485];
      // styles[1].getText().setText("");
      styles[1].getText().setScale(0.7);
      styles[1].getText().setOffsetX(10.785);
      styles[1].getText().setOffsetY(-10.785);
    }
    return styles;
  }

  styleLabelFunction(feature: OlFeature, resolution) {
    let data = feature.get("data");

    let color = MapExtension.getStationFeatureColor(data);
    let styles = MapExtension.getTickStationsStyles(false, color);
    let text = "";
    if (resolution < 19) {
      text = MapExtension.getFeatureName(feature);
    }
    styles[1].getText().setText(text);
    return styles;
  }

  styleZoneFunction(feature: OlFeature, resolution: any) {
    let center = [0, 0];
    let featureData = feature.get("data");
    let demandText = featureData["demandText"];

    if (featureData.center.length > 0) {
      center = featureData.center;
    } else {
      let geometry = feature.getGeometry()?.getExtent();
      if (geometry)
        center = OlExtent.getCenter(geometry);
    }

    return [new OlStyle({
      stroke: new OlStroke({
        color: '#3399CC',
        width: 2
      }),
      fill: new OlFill({
        color: 'rgba(0, 0, 255, 0.1)',
      }),
    }),
    new OlStyle({
      geometry: new OlPoint(center),
      text: new OlText({
        text: (resolution < 12) ? MapExtension.getFeatureName(feature) : '',
        font: `11px Roboto, "Helvetica Neue", sans-serif`,
        offsetX: 2,
        scale: 1.5,
        offsetY: 2,
        textAlign: 'center',
        placement: 'point',
        fill: new OlFill({
          color: '#3399CC'
        })
      })
    }),
    new OlStyle({
      geometry: new OlPoint(center),
      text: new OlText({
        text: (resolution < 12) ? demandText : '',
        font: `9px Roboto, "Helvetica Neue", sans-serif`,
        offsetX: -3,
        offsetY: 24, // 0
        textAlign: "center",
        scale: 1.5,
        placement: "point",
        fill: new OlFill({
          color: "#666666"
        })
      })
    })];
  }

  getDockingStationAreaFeature(station: any) {
    let point = [station.Position.Longitude, station.Position.Latitude];
    let polygon = new OlPoint(point);
    let totalBikesCount;
    let dockData = station;
    let bikeCount = this.getAvailableBikeCount(dockData);
    polygon.transform("EPSG:4326", "EPSG:3857");
    if (station.Disabled) {
      totalBikesCount = "-";
      station.StationStatus = StationColors.DISABLED_WITHOUT_BIKES;
    } else {
      totalBikesCount = dockData["TotalNumberOfBikes"].toString();
      station.StationStatus = this.getDockedBikeStatus(station.DockingStationId);
      if (this.isShowOnlyWithIssues) {
        totalBikesCount = this.allBikes
          .filter(x => x.DockingStationId == station.DockingStationId && x.Disabled).length.toString();
      }
    }

    //check docking point disabled status and set station status
    if (station.DockingPoints) {
      let isDPNeedsRepair = station.DockingPoints.some(x => x && x.DPDisabled && x.DPDisabledReason == DockingPointDisabledReason.CheckRequired);
      if (isDPNeedsRepair)
        station.StationStatus = StationColors.CHECKED_NEEDS_REPAIR_BIKES;
    }

    dockData["bikeCount"] = bikeCount;
    if (bikeCount < 0) {
      if (dockData.StationStatus == StationColors.AVAILABLE_BIKES)
        dockData["dockIcon"] = "/assets/images/map-icons/black-dock-icon.svg";
      else if (dockData.StationStatus == StationColors.AVAILABLE_WITH_ERRORS)
        dockData["dockIcon"] = "/assets/images/map-icons/yellow-dock-icon.svg";
      else if (dockData.StationStatus == StationColors.AVAILABLE_WITH_DISABLED)
        dockData["dockIcon"] = "/assets/images/map-icons/red-dock-icon.svg";
      else if (dockData.StationStatus == StationColors.DISABLED_WITHOUT_BIKES)
        dockData["dockIcon"] = "/assets/images/map-icons/grey-disabled-zero-bikes-icon.svg";
      else if (dockData.StationStatus == StationColors.CHECKED_NEEDS_REPAIR_BIKES)
        dockData["dockIcon"] = "/assets/images/map-icons/purple-disabled-ds.svg";
    }
    else {
      if (dockData.StationStatus == StationColors.AVAILABLE_BIKES)
        dockData["dockIcon"] = "/assets/images/map-icons/black-dock-full-icon.svg";
      else if (dockData.StationStatus == StationColors.AVAILABLE_WITH_ERRORS)
        dockData["dockIcon"] = "/assets/images/map-icons/yellow-dock-full-icon.svg";
      else if (dockData.StationStatus == StationColors.AVAILABLE_WITH_DISABLED)
        dockData["dockIcon"] = "/assets/images/map-icons/red-dock-full-icon.svg";
      else if (dockData.StationStatus == StationColors.DISABLED_WITHOUT_BIKES)
        dockData["dockIcon"] = "/assets/images/map-icons/grey-disabled-zero-bikes-icon.svg";
      else if (dockData.StationStatus == StationColors.CHECKED_NEEDS_REPAIR_BIKES)
        dockData["dockIcon"] = "/assets/images/map-icons/purple-disabled-ds.svg";
    }
    this.generateSmallSquareCount(dockData, station);

    let feature = new OlFeature({
      name: totalBikesCount,
      geometry: polygon,
      data: dockData,
      type: "dock"
    });

    feature.setId(dockData.DockingStationId);
    return feature;
  }

  private generateSmallSquareCount(dockData: DockingStation, station: DockingStation) {
    let bikeCount = this.getAvailableBikeCount(dockData);
    let color = MapExtension.getStationFeatureColor(station);
    dockData["bikeCount"] = bikeCount;
    if (!station.Disabled) {
      if (bikeCount > 0) {
        dockData["bikeCountSpan"] = `${bikeCount}+`;
        dockData["tickColor"] = "rgba(0,128,0,1)";
        dockData["smallIcon"] = "/assets/images/map-icons/small-green-square.svg";
      } else if (bikeCount == 0) {
        dockData["tickColor"] = "rgba(0,128,0,1)";
        dockData["bikeCountSpan"] = "";
        dockData["smallIcon"] = "/assets/images/map-icons/small-green-tick-square.svg";
      } else if (bikeCount < 0) {
        dockData["bikeCountSpan"] = `${Math.abs(bikeCount)}-`;
        dockData["smallIcon"] = "/assets/images/map-icons/small-grey-square.svg";
      }
    }
  }

  getSmallDockStationAreaFeature(station: DockingStation) {
    let color = MapExtension.getStationFeatureColor(station);
    let dockData = station;
    let point = [station.Position.Longitude, station.Position.Latitude];
    let bikeCount = this.getAvailableBikeCount(dockData);
    dockData["bikeCount"] = bikeCount;
    if (bikeCount > 0) {
      return;
    } else if (bikeCount == 0) {
      return;
    } else if (bikeCount < 0) {
      if (station.Disabled) {
        return;
      }
      dockData["bikeCountSpan"] = `${Math.abs(bikeCount)}-`;
      dockData["smallIcon"] = "/assets/images/map-icons/small-grey-square.svg";
    } else if (bikeCount < 0) {
      if (station.Disabled) {
        return;
      }
      dockData["bikeCountSpan"] = `${Math.abs(bikeCount)}-`;
      dockData["smallIcon"] = "/assets/images/map-icons/small-grey-square.svg";
    }

    let feature = new OlFeature({
      name: dockData["bikeCountSpan"],
      geometry: new OlPoint(OlProj.transform(point, "EPSG:4326", "EPSG:3857")),
      data: dockData,
      type: "small-dock"
    });

    feature.setId(station.DockingStationId);
    return feature;
  }

  getDockingStationRadiusFeature(station: DockingStation) {
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

  getDockedBikeStatus(dockingStationId) {
    let filteredBikes = this.filteredBikes.filter(
      x => x.DockingStationId == dockingStationId
    );
    let status = StationColors.AVAILABLE_BIKES;
    for (let bike in filteredBikes) {
      if (filteredBikes[bike]["Bike"].Disabled) {
        if (filteredBikes[bike]["Bike"].DisabledReason == BikeDisableState.CheckedNeedFix
          || (filteredBikes[bike]["Bike"].DisableState && filteredBikes[bike]["Bike"].DisableState == BikeDisableState.CheckedNeedFix)) {
          status = StationColors.CHECKED_NEEDS_REPAIR_BIKES;
          break;
        } else if ((filteredBikes[bike]["Bike"].DisabledReason && filteredBikes[bike]["Bike"].DisabledReason != BikeDisableState.WithStreetTeam)
          || (filteredBikes[bike]["Bike"].DisableState && filteredBikes[bike]["Bike"].DisableState != BikeDisableState.WithStreetTeam)) {
          status = StationColors.AVAILABLE_WITH_DISABLED;
          break;
        } else if (filteredBikes[bike]["Bike"].DisabledReason == BikeDisableState.WithStreetTeam
          || (filteredBikes[bike]["Bike"].DisableState && filteredBikes[bike]["Bike"].DisableState == BikeDisableState.WithStreetTeam))
          status = StationColors.AVAILABLE_BIKES;
      } else if (
        !filteredBikes[bike]["Bike"].Disabled &&
        filteredBikes[bike]["Bike"].Resolved != 0
      ) {
        status = StationColors.AVAILABLE_WITH_ERRORS;
      }
    }
    return status;
  }

  public addDockingStation(
    station: any,
    centerToPoint: boolean = true
  ): void {
    let point = [station.Position.Longitude, station.Position.Latitude];
    let projectedPoint = OlProj.fromLonLat(point);
    station.AddressStr = DockingStationExtension.GetAddress(station.Address);
    let areaFeature = this.getDockingStationAreaFeature(station);
    let tickFeature = this.getSmallDockStationAreaFeature(station);
    let dockSource = this.dockLayer.getSource();
    let docksmallSource = this.dockSmallLayer.getSource();


    dockSource.addFeature(areaFeature);
    if (tickFeature)
      docksmallSource.addFeature(tickFeature);

    // Draw docking station radius
    let dockRadiusFeature = this.dockRadiusLayer.getSource();
    let lineFeature = this.getDockingStationRadiusFeature(station);
    if (this.isShowAllRadius)
      lineFeature.setStyle(MapExtension.getDockingStationRadiusStyles()[0]);
    dockRadiusFeature.addFeature(lineFeature);

    if (centerToPoint && !this.routeId) {
      this.map.getView().setCenter(projectedPoint);
    }
  }

  loadBikePositions() {
    //Get all bike details
    this.bikesService.getBikesFilteredByArea().subscribe(
      data => {
        this.bikes = data;
        this.updatedBikes = [];
        this.filteredBikes = [];
        this.bikePositions = [];
        this.bikePositionUpdate(data);
        this.getIssueDocksAndBikes();
        if (!this.isShowOnlyWithIssues)
          this.loadDocks(this.docks);
        else {
          this.loadDocks(this.issueDocks);
          this.updatedBikes = this.updatedBikes.filter(x => x.Disabled);
        }
        this.RefreshCarBikes();
        for (let bike of this.updatedBikes) {
          if (!bike.Position) continue;

          //check if bike docking station is null and disabled reason not equal to in storage or InWorkshop or ToWorkshop or repair finished
          if (bike.DockingStationId == null &&
            (bike.DisabledReason != BikeDisableState.InStorage && bike.DisabledReason != BikeDisableState.Missing
              && bike.DisabledReason != BikeDisableState.InWorkshop
              && bike.DisabledReason != BikeDisableState.ToWorkshop
              && bike.DisabledReason != BikeDisableState.RepairFinished
              && bike.DisabledReason != BikeDisableState.Moving)) {
            if (!this.formatTimeDuration(bike.LatestPulse, 30) && !this.checkForPositionUpdate(bike))
              continue;
            if (bike.DisabledReason == BikeDisableState.WithStreetTeam && !bike.InSession)
              continue;
            this.updatePositionsOnMap(bike.Position, false, bike);
          }
        }
        this.spinner.hide();
      },
      error => {
        this.loggerService.showErrorMessage("Getting bike details failed!");
        this.spinner.hide();
      }
    );
  }

  getIssueDocksAndBikes() {
    if (this.docks) {
      const issueDocksMap = new Map();

      //Preprocess disabled docking points
      this.docks.forEach(ds => {
        const disabledDockingPoints = ds.DockingPoints.filter(dp => dp?.DPDisabled);
        if (disabledDockingPoints.length > 0) {
          issueDocksMap.set(ds.DockingStationId, {
            ...ds,
            DockingPoints: disabledDockingPoints
          });
        }
      });

      // Preprocess bikes into a Map grouped by DockingStationId
      const issueBikesMap = new Map();
      this.filteredBikes.forEach(bike => {
        if (bike.Bike.Disabled) {
          const stationId = bike.Bike.DockingStationId;
          if (!issueBikesMap.has(stationId)) {
            issueBikesMap.set(stationId, []);
          }
          issueBikesMap.get(stationId).push(bike);
        }
      });

      // Combine data from issueDocksMap and bikesMap
      issueBikesMap.forEach((bikes, stationId) => {
        let dsObj = issueDocksMap.get(stationId);
        if (!dsObj) {
          dsObj = {
            ...this.docks.find(ds => ds.DockingStationId === stationId),
            DockingPoints: []
          };
          issueDocksMap.set(stationId, dsObj);
        }
        bikes.forEach(bike => {
          if (bike.Bike.DockingPointId) {
            const dockingPointObj = dsObj.DockingPoints.find(dp => dp.DockingPointId === bike.Bike.DockingPointId);
            if (!dockingPointObj) {
              const dockingPoint = this.docks
                .find(ds => ds.DockingStationId === stationId)
                .DockingPoints.find(dp => dp.DockingPointId === bike.Bike.DockingPointId);
              if (dockingPoint) {
                dsObj.DockingPoints.push(dockingPoint);
              }
            }
          }
        });
      });

      //Convert Map back to array
      this.issueDocks = Array.from(issueDocksMap.values());

      this.issueDocks.forEach(ds => {
        ds.DockingPoints.sort((a, b) => a.VisualId - b.VisualId);
      });

      this.issueDocks.sort((a, b) => a.DockingStationId - b.DockingStationId);

    }
  }

  checkForPositionUpdate(bike) {
    // bikePositions array is to keep the bikePositions with the timestamp
    if (this.bikePositions.length == 0) {
      let bikeObj = {};
      bikeObj["BikeId"] = bike.BikeId;
      bikeObj["LastPosition"] = moment()
        .utc()
        .format("YYYY-MM-DDTHH:mm:ssZ");
      this.bikePositions.push(bikeObj);
      return true;
    } else if (this.bikePositions.length > 0) {
      // check if bikeId is already in the list
      let bikePosition = this.bikePositions.find(x => x.BikeId == bike.BikeId);
      if (bikePosition) {
        //check the position timestamps validity
        return this.formatTimeDuration(bikePosition.LastPosition, 180);
      } else {
        let bikeObj = {};
        bikeObj["BikeId"] = bike.BikeId;
        bikeObj["LastPosition"] = moment()
          .utc()
          .format("YYYY-MM-DDTHH:mm:ssZ");
        this.bikePositions.push(bikeObj);
        return true;
      }
    }
  }

  formatTimeDuration(timeStamp, duration) {
    if (timeStamp !== null) {
      var ts = new Date().getTime() - new Date(timeStamp).getTime();
      var diffMinutes = Math.abs(Math.round(ts / (1000 * 60)));
      if (diffMinutes <= duration) return true;
    }
    return false;
  }

  formatTimeRangeDuration(timeStamp, durationStart, durationEnd) {
    if (timeStamp !== null) {
      var ts = new Date().getTime() - new Date(timeStamp).getTime();
      var diffMinutes = Math.abs(Math.round(ts / (1000 * 60)));
      if (diffMinutes > durationStart && diffMinutes <= durationEnd)
        return true;
    }
    return false;
  }

  formatServiceTimeDuration(timeStamp) {
    if (timeStamp && timeStamp !== null && timeStamp != "") {
      var ts = new Date().getTime() - new Date(timeStamp).getTime();

      var diffDays = Math.abs(Math.round(ts / (1000 * 3600 * 24)));
      var diffHours = Math.abs(Math.round(ts / (1000 * 3600)));
      var diffMinutes = Math.abs(Math.round(ts / (1000 * 60)));
      var diffSeconds = Math.abs(Math.round(ts / (1000)));

      // if (diffDays > 1) {
      return diffDays + this.commonService.TranslateMessage(TranslateMessageTypes.DaysAgo)
      // }
      // else if (diffHours > 1) {
      //   if (diffHours >= 24 && diffDays == 1) {
      //     return diffDays + " day ago";
      //   } else {
      //     return diffHours + " hours ago";
      //   }
      // }
      // else if (diffMinutes > 1) {
      //   if (diffMinutes >= 60 && diffHours == 1) {
      //     return diffHours + " hour ago";
      //   } else {
      //     return diffMinutes + " minutes ago";
      //   }
      // }
      // else {
      //   if (diffSeconds >= 60 && diffMinutes == 1) {
      //     return diffMinutes + " minute ago";
      //   } else {
      //     return diffSeconds + " seconds ago";
      //   }
      // }
    } else {
      return this.commonService.TranslateMessage(TranslateMessageTypes.Never);
    }
  }

  formatServiceTimeDurationCount(timeStamp) {
    if (timeStamp && timeStamp !== null && timeStamp != "") {
      var ts = new Date().getTime() - new Date(timeStamp).getTime();

      var diffDays = Math.abs(Math.round(ts / (1000 * 3600 * 24)));
      var diffHours = Math.abs(Math.round(ts / (1000 * 3600)));
      var diffMinutes = Math.abs(Math.round(ts / (1000 * 60)));
      var diffSeconds = Math.abs(Math.round(ts / (1000)));

      // if (diffDays > 1) {
      return diffDays;
      // }
      // else if (diffHours > 1) {
      //   if (diffHours >= 24 && diffDays == 1) {
      //     return diffDays + " day ago";
      //   } else {
      //     return diffHours + " hours ago";
      //   }
      // }
      // else if (diffMinutes > 1) {
      //   if (diffMinutes >= 60 && diffHours == 1) {
      //     return diffHours + " hour ago";
      //   } else {
      //     return diffMinutes + " minutes ago";
      //   }
      // }
      // else {
      //   if (diffSeconds >= 60 && diffMinutes == 1) {
      //     return diffMinutes + " minute ago";
      //   } else {
      //     return diffSeconds + " seconds ago";
      //   }
      // }
    } else {
      return 0;
    }
  }

  formatReportErrorTimeDurationCount(timeStamp) {
    if (timeStamp && timeStamp !== null && timeStamp != "") {
      var ts = new Date().getTime() - new Date(timeStamp).getTime();

      var diffDays = Math.abs(Math.round(ts / (1000 * 3600 * 24)));
      var diffHours = Math.abs(Math.round(ts / (1000 * 3600)));
      var diffMinutes = Math.abs(Math.round(ts / (1000 * 60)));
      var diffSeconds = Math.abs(Math.round(ts / (1000)));

      // if (diffDays > 1) {
      return diffDays;
      // }
      // else if (diffHours > 1) {
      //   if (diffHours >= 24 && diffDays == 1) {
      //     return diffDays + " day ago";
      //   } else {
      //     return diffHours + " hours ago";
      //   }
      // }
      // else if (diffMinutes > 1) {
      //   if (diffMinutes >= 60 && diffHours == 1) {
      //     return diffHours + " hour ago";
      //   } else {
      //     return diffMinutes + " minutes ago";
      //   }
      // }
      // else {
      //   if (diffSeconds >= 60 && diffMinutes == 1) {
      //     return diffMinutes + " minute ago";
      //   } else {
      //     return diffSeconds + " seconds ago";
      //   }
      // }
    } else {
      return 0;
    }
  }

  formatReportErrorTimeDuration(timeStamp) {
    if (timeStamp && timeStamp !== null && timeStamp != "") {
      var ts = new Date().getTime() - new Date(timeStamp).getTime();

      var diffDays = Math.abs(Math.round(ts / (1000 * 3600 * 24)));
      var diffHours = Math.abs(Math.round(ts / (1000 * 3600)));
      var diffMinutes = Math.abs(Math.round(ts / (1000 * 60)));
      var diffSeconds = Math.abs(Math.round(ts / (1000)));

      // if (diffDays > 1) {
      return diffDays + this.commonService.TranslateMessage(TranslateMessageTypes.DaysAgo)
      // }
      // else if (diffHours > 1) {
      //   if (diffHours >= 24 && diffDays == 1) {
      //     return diffDays + " day ago";
      //   } else {
      //     return diffHours + " hours ago";
      //   }
      // }
      // else if (diffMinutes > 1) {
      //   if (diffMinutes >= 60 && diffHours == 1) {
      //     return diffHours + " hour ago";
      //   } else {
      //     return diffMinutes + " minutes ago";
      //   }
      // }
      // else {
      //   if (diffSeconds >= 60 && diffMinutes == 1) {
      //     return diffMinutes + " minute ago";
      //   } else {
      //     return diffSeconds + " seconds ago";
      //   }
      // }
    } else {
      return this.commonService.TranslateMessage(TranslateMessageTypes.Never);
    }
  }

  updatePositionsOnMap(data: any[], isObservation: boolean, bike: any) {
    let isBikeIntransport = false;
    if (this.transportBikes && this.transportBikes.length > 0) {
      isBikeIntransport = this.transportBikes.find(x => x && x.BikeId == bike.BikeId);
    }
    if (!isBikeIntransport) {
      let points = [];
      let color = this.getBikeStatusColor(bike);
      //let bikeSource = this.layer.getSource();

      //Create from bike posisiton
      if (!isObservation) {
        let pointFeature = new OlFeature({
          geometry: new OlPoint(
            OlProj.transform(
              [data["Longitude"] + 0.0000085, data["Latitude"] + 0.0000085],
              "EPSG:4326",
              "EPSG:3857"
            )
          ),
          name: bike.VisualId.toString(),
          data: this.getMapPoint(data, bike.VisualId, bike.BikeId),
          color: color,
          type: "bike",
          session: bike.SessionId != null,
          inSession: bike.InSession
        });
        //pointFeature.setStyle(this.setMarkerStyle(BikeId));

        pointFeature.setId(bike.BikeId);
        this.source.addFeature(pointFeature);

        points.push([data["Longitude"], data["Latitude"]]);
      }

      //Create from bike observations
      // let index = 0;
      // for (let position of data) {
      //   let pointFeature = new OlFeature({
      //     geometry: new OlPoint(
      //       OlProj.transform(
      //         [position.Value.Longitude, position.Value.Latitude],
      //         "EPSG:4326",
      //         "EPSG:3857"
      //       )
      //     ),
      //     name: index == data.length - 1 ? bike.BikeId.toString() : "",
      //     data: this.getMapPoint(position.Value, bike.VisualId, bike.BikeId),
      //     type: "bike",
      //     session: bike.CurrentSessionId != null
      //   });
      //   points.push([position.Value.Longitude, position.Value.Latitude]);

      //   pointFeature.setId(bike.BikeId);
      //   this.source.addFeature(pointFeature);
      //   index++;
      // }
      if (!this.routeId) {
        this.fitToLastExtent();
      }
      this.count++;
    }
  }

  //Define map zoom to the location
  private zoomToExtent(): void {
    // if (this.layer) {
    //   let extent = this.layer.getSource().getExtent();
    //   this.map.getView().fit(extent, { size: this.map.getSize(), maxZoom: 18 });
    // }
  }

  getMapPoint(position: any, visualId, bikeId) {
    let point = {
      Longitude: position.Longitude,
      Latitude: position.Latitude,
      Altitude: position.Altitude,
      VisualId: visualId.toString(),
      BikeId: bikeId.toString()
    };
    return point;
  }

  private getLayerStyle(
    highlighted = false,
    isRunning = false,
    color,
    inSession = false
  ): OlStyle {
    let featureColor = '#FFFFFF';
    let featureFillColor = highlighted ? color : color;
    let imageRadius =
      highlighted && isRunning
        ? 6
        : highlighted && !isRunning
          ? 8
          : !highlighted && isRunning
            ? 5
            : 6;
    let strokeWidth =
      highlighted && isRunning
        ? 2
        : highlighted && !isRunning
          ? 3
          : !highlighted && isRunning
            ? 3
            : 2;
    let scaleImg = highlighted ? 2 : 1.5;

    if (this.isMobileOnly)
      scaleImg = highlighted ? 1.5 : 1;

    // increase size of red color bikes
    if (!this.isMobileOnly) {
      if (color == BikeStatusColor.RED && !isRunning && !inSession) {
        if (!highlighted) {
          imageRadius = 8;
          strokeWidth = 1;
        }
        else {
          imageRadius = 9;
          strokeWidth = 2;
        }
      }
    }
    let style = null;
    if (!isRunning && !inSession) {
      if (featureFillColor == BikeStatusColor.GRAY || featureFillColor == BikeStatusColor.PINK) {
        let bikeIcon = '/assets/images/map-icons/bike-street-team-circle-md.svg';
        if (featureFillColor == BikeStatusColor.PINK)
          bikeIcon = '/assets/images/map-icons/bike-on-loan-md.svg';
        style = new OlStyle({
          image: new OlIcon({
            anchor: [0.5, 0.5],
            anchorXUnits: 'fraction',
            anchorYUnits: 'fraction',
            src: bikeIcon,
            scale: scaleImg,
            fill: new OlFill({
              color: featureFillColor
            }),
            stroke: new OlStroke({
              color: featureColor,
              width: strokeWidth
            })
          }),
          stroke: new OlStroke({
            color: featureColor,
            width: strokeWidth
          }),
          text: new OlText({
            font: `bold 11px Roboto, "Helvetica Neue", sans-serif`,
            // offsetX: 10,
            offsetY: -15, // 0
            textAlign: "left",
            placement: "point",
            fill: new OlFill({
              color: "#000"
            }),
            stroke: new OlStroke({
              color: "#FFF",
              width: 2
            })
          })
        });
      }
      else {
        style = new OlStyle({
          image: new OlCircle({
            radius: imageRadius,
            fill: new OlFill({
              color: featureFillColor
            }),
            stroke: new OlStroke({
              color: featureColor,
              width: strokeWidth
            })
          }),
          stroke: new OlStroke({
            color: featureColor,
            width: strokeWidth
          }),
          text: new OlText({
            font: `bold 11px Roboto, "Helvetica Neue", sans-serif`,
            // offsetX: 10,
            offsetY: -15, // 0
            textAlign: "left",
            placement: "point",
            fill: new OlFill({
              color: "#000"
            }),
            stroke: new OlStroke({
              color: "#FFF",
              width: 2
            })
          })
        });
      }
    }
    else if (!isRunning && inSession) {
      if (featureFillColor == BikeStatusColor.GRAY || featureFillColor == BikeStatusColor.PINK) {
        let bikeIcon = '/assets/images/map-icons/bike-street-team-circle-md.svg';
        if (featureFillColor == BikeStatusColor.PINK)
          bikeIcon = '/assets/images/map-icons/bike-on-loan-md.svg';
        style = new OlStyle({
          image: new OlIcon({
            anchor: [0.5, 0.5],
            anchorXUnits: 'fraction',
            anchorYUnits: 'fraction',
            src: bikeIcon,
            scale: scaleImg,
            fill: new OlFill({
              color: featureFillColor
            }),
            stroke: new OlStroke({
              color: featureColor,
              width: strokeWidth
            })
          }),
          stroke: new OlStroke({
            color: featureColor,
            width: strokeWidth
          }),
          text: new OlText({
            font: `bold 11px Roboto, "Helvetica Neue", sans-serif`,
            // offsetX: 10,
            offsetY: -15, // 0
            textAlign: "left",
            placement: "point",
            fill: new OlFill({
              color: "#000"
            }),
            stroke: new OlStroke({
              color: "#FFF",
              width: 2
            })
          })
        });
      }
      else {
        style = new OlStyle({
          image: new OlCircle({
            radius: imageRadius,
            fill: new OlFill({
              color: 'white'
            }),
            stroke: new OlStroke({
              color: 'black',
              width: strokeWidth
            })
          }),
          stroke: new OlStroke({
            color: 'black',
            width: strokeWidth
          }),
          text: new OlText({
            font: `bold 11px Roboto, "Helvetica Neue", sans-serif`,
            // offsetX: 10,
            offsetY: -15, // 0
            textAlign: "left",
            placement: "point",
            fill: new OlFill({
              color: "#000"
            }),
            stroke: new OlStroke({
              color: "#FFF",
              width: 2
            })
          })
        });
      }
    }
    else if (isRunning) {
      style = new OlStyle({
        image: new OlIcon({
          anchor: [0.5, 0.5],
          anchorXUnits: 'fraction',
          anchorYUnits: 'fraction',
          src: '/assets/images/map-icons/bike-session.svg',
          scale: scaleImg,
          fill: new OlFill({
            color: featureFillColor
          }),
          stroke: new OlStroke({
            color: featureColor,
            width: strokeWidth
          })
        }),
        stroke: new OlStroke({
          color: featureColor,
          width: strokeWidth
        }),
        text: new OlText({
          font: `bold 11px Roboto, "Helvetica Neue", sans-serif`,
          // offsetX: 10,
          offsetY: -15, // 0
          textAlign: "left",
          placement: "point",
          fill: new OlFill({
            color: "#000"
          }),
          stroke: new OlStroke({
            color: "#FFF",
            width: 2
          })
        })
      });
    }
    return style;
  }

  getGeoLayerStyle() {
    let style = new OlStyle({
      image: new OlIcon(({
        anchor: [0.5, 0.5],
        anchorXUnits: 'fraction',
        anchorYUnits: 'fraction',
        src: '/assets/images/map-icons/green-car.svg',
        rotateWithView: true,
        rotation: -1.6,
        scale: (this.isMobileOnly) ? 0.8 : 1
      })),
      text: new OlText({
        font: `bold 15px Roboto, "Helvetica Neue", sans-serif`,
        offsetX: -3,
        offsetY: 5, // 0
        textAlign: "center",
        placement: "point",
        fill: new OlFill({
          color: "#FFF"
        })
      })
    });
    return style;
  }

  getGeoOtherLayerStyle() {
    let style = new OlStyle({
      image: new OlIcon(({
        anchor: [0.5, 0.5],
        anchorXUnits: 'fraction',
        anchorYUnits: 'fraction',
        src: '/assets/images/map-icons/sky-blue-car.svg',
        rotateWithView: true,
        // rotation: -1.6
        scale: (this.isMobileOnly) ? 0.8 : 1
      })),
      text: new OlText({
        font: `bold 15px Roboto, "Helvetica Neue", sans-serif`,
        offsetX: -5,
        offsetY: -2, // 0
        textAlign: "center",
        placement: "point",
        fill: new OlFill({
          color: "#FFF"
        })
      })
    });
    return style;
  }

  getCarNameStyle() {
    let style = new OlStyle({
      text: new OlText({
        font: `bold 13px Roboto, "Helvetica Neue", sans-serif`,
        offsetX: -3,
        offsetY: 23, // 0
        textAlign: "center",
        placement: "point",
        fill: new OlFill({
          color: "#666666"
        }),
        stroke: new OlStroke({
          color: "#FFF",
          width: 1
        })
      })
    });
    return style;
  }

  getOtherStyle() {
    let style = new OlStyle({
      image: new OlIcon(({
        anchor: [0.5, 0.5],
        anchorXUnits: 'fraction',
        anchorYUnits: 'fraction',
        src: '/assets/images/map-icons/sky-blue-trans-car.svg',
        rotateWithView: true,
        // rotation: -1.6
        scale: (this.isMobileOnly) ? 0.8 : 1
      })),
      text: new OlText({
        font: `bold 15px Roboto, "Helvetica Neue", sans-serif`,
        offsetX: -5,
        offsetY: -2, // 0
        textAlign: "center",
        placement: "point",
        fill: new OlFill({
          color: "#FFF"
        })
      })
    });
    return style;
  }

  getBikeStatusColor(bike) {
    let color = "";
    // this logic is same as bike page color scheme
    if (bike.Disabled &&
      ((bike.DisableState && bike.DisableState != BikeDisableState.CheckedNeedFix
        && bike.DisableState != BikeDisableState.WithStreetTeam &&
        bike.DisableState != BikeDisableState.OnLoan) ||
        (bike.DisabledReason && bike.DisabledReason != BikeDisableState.CheckedNeedFix
          && bike.DisabledReason != BikeDisableState.WithStreetTeam &&
          bike.DisabledReason != BikeDisableState.OnLoan))) {
      color = BikeStatusColor.RED;
    }
    else if (bike.Disabled &&
      ((bike.DisableState && bike.DisableState == BikeDisableState.CheckedNeedFix) ||
        (bike.DisabledReason && bike.DisabledReason == BikeDisableState.CheckedNeedFix))) {
      color = BikeStatusColor.PURPLE;
    }
    else if (bike.Disabled &&
      ((bike.DisableState && bike.DisableState == BikeDisableState.WithStreetTeam) ||
        (bike.DisabledReason && bike.DisabledReason == BikeDisableState.WithStreetTeam))) {
      color = BikeStatusColor.GRAY;
    }
    else if (bike.Disabled &&
      ((bike.DisableState && bike.DisableState == BikeDisableState.OnLoan) ||
        (bike.DisabledReason && bike.DisabledReason == BikeDisableState.OnLoan))) {
      color = BikeStatusColor.PINK;
    }
    else if (bike.Resolved != 0) {
      color = BikeStatusColor.AMBER;
    }
    else {
      if (bike.CurrentSessionId) {
        color = BikeStatusColor.GREEN;
      } else {
        color = BikeStatusColor.BLACK;
      }
    }
    return color;
  }

  cleanMap() {
    if (this.selectedFeature && this.dockingStationId) {
      this.selectedFeature.getFeatures().clear();
    }
    this.source.clear(true);
    this.dockLayer.getSource().clear(true);
    this.dockSmallLayer.getSource().clear(true);
    this.dockRadiusLayer.getSource().clear(true);
    this.routeLayer.getSource().clear(true);
    this.wayPointLayer.getSource().clear(true);
    this.zoneLayer.getSource().clear(true);
    for (let car of this.geoLayer.getSource().getFeatures()) {
      let data = car.get("data");
      let user = data["user"];
      if (user.UserId != this.loggedInUser.UserId) {
        var f2 = this.carSource.getFeatureById(user.UserId);
        if (f2) this.carSource.removeFeature(f2);
      }
    }
  }

  fitToLastExtent(): void {
    this.lastExtent = this.settingsService.getLastBikeMapExtent();
    if (this.lastExtent != null) {
      this.map.getView().fit(this.lastExtent, { constrainResolution: false });
    } else {
      this.zoomToExtent();
    }
  }

  ngOnDestroy() {
    this.renderer.removeClass(document.body, 'bike-map');
    if (this.sub) this.sub.unsubscribe();

    clearInterval(this.refreshIntervalId);
    // clearInterval(this.refreshDock);
    clearInterval(this.geolocationTimerId);
    clearInterval(this.nearByWorkshopTimerId);
    this.setCurrentExtent();
    this.settingsService.showMapOptions(false);

    //unsubscribe and close when leaving the page
    this.dockingStationBikes.forEach(bike => {
      this.signalRService.UnSubscribeConnection(bike.Serial);
    });
    this.takenOutBikes.forEach(bike => {
      this.signalRService.UnSubscribeConnection(bike.Serial);
    });
    this.signalRService.stopConnection();
  }

  setCurrentExtent() {
    // let extent = this.map.previousExtent_;
    let extent = this.map.getView().calculateExtent(this.map.getSize());
    this.settingsService.setLiveMapZoomLevel(this.map.getView().getZoom());
    this.settingsService.setLastBikeMapExtent(extent);
  }

  bikeLiveUpdate(data) {
    if (data.DockingStationId == null) {
      var color = this.getBikeStatusColor(data);
      let pointFeature = new OlFeature({
        geometry: new OlPoint(
          OlProj.transform(
            [data.Position.Longitude, data.Position.Latitude],
            "EPSG:4326",
            "EPSG:3857"
          )
        ),
        name: data.BikeId.toString(),
        data: this.getMapPoint(data.Position, data.VisualId, data.BikeId),
        color: color,
        type: "bike",
        session: data.SessionId != null
      });
      pointFeature.setId(data.BikeId);
      var f2 = this.source.getFeatureById(data.BikeId);
      if (f2) this.source.removeFeature(f2);

      this.source.addFeature(pointFeature);
    }
  }

  dockingStationLiveUpdate(data) {
    let dockSource = this.dockLayer.getSource();
    var f = dockSource.getFeatureById(data.DockingStationId);

    if (f) {
      dockSource.removeFeature(f);
    }
    this.addDockingStation(data, false);
  }

  private adjustLayers(name) {
    if (!name) return;

    if (name.bike && !name.dock && !name.zone) {
      this.layer.setVisible(true);
      this.dockLayer.setVisible(false);
      this.dockSmallLayer.setVisible(false);
      this.dockRadiusLayer.setVisible(false);
      this.zoneLayer.setVisible(false);
    } else if (name.dock && !name.bike && !name.zone) {
      this.dockLayer.setVisible(true);
      this.dockSmallLayer.setVisible(true);
      this.dockRadiusLayer.setVisible(true);
      this.layer.setVisible(false);
      this.zoneLayer.setVisible(false);
    } else if (name.zone && !name.bike && !name.dock) {
      this.zoneLayer.setVisible(true);
      this.layer.setVisible(false);
      this.dockLayer.setVisible(false);
      this.dockSmallLayer.setVisible(false);
      this.dockRadiusLayer.setVisible(false);
    } else if (name.bike && name.dock && !name.zone) {
      this.dockLayer.setVisible(true);
      this.dockSmallLayer.setVisible(true);
      this.dockRadiusLayer.setVisible(true);
      this.layer.setVisible(true);
      this.zoneLayer.setVisible(false);
    } else if (!name.bike && name.dock && name.zone) {
      this.dockLayer.setVisible(true);
      this.dockSmallLayer.setVisible(true);
      this.dockRadiusLayer.setVisible(true);
      this.zoneLayer.setVisible(true);
      this.layer.setVisible(false);
    } else if (name.bike && name.zone && !name.dock) {
      this.layer.setVisible(true);
      this.zoneLayer.setVisible(true);
      this.dockLayer.setVisible(false);
      this.dockSmallLayer.setVisible(false);
      this.dockRadiusLayer.setVisible(false);
    } else if (name.bike && name.dock & name.zone) {
      this.dockLayer.setVisible(true);
      this.dockSmallLayer.setVisible(true);
      this.dockRadiusLayer.setVisible(true);
      this.layer.setVisible(true);
      this.zoneLayer.setVisible(true);
    } else {
      this.dockLayer.setVisible(false);
      this.layer.setVisible(false);
      this.dockSmallLayer.setVisible(false);
      this.dockRadiusLayer.setVisible(false);
      this.zoneLayer.setVisible(false);
    }
  }

  private bikePositionUpdate(data) {
    var grpBikesArray = PositionRecalculationExtension.getBikesGroupArray(data);
    let degree = 0;
    for (let grp of grpBikesArray) {
      degree = 0;
      for (let item of grp) {
        if (!item.Position) {
          if (item.DockingStationId) {
            let dockBikePosition = {
              DockingStationId: item.DockingStationId,
              Bike: item
            };

            this.filteredBikes.push(dockBikePosition);
            this.updatedBikes.push(item);
          }
          continue;
        }
        let degreeDivider = 360 / grp.length;

        if (!item.DockingStationId) {
          this.updatedBikes.push(item);
        } else {
          var doc = this.docks.find(
            a => a.DockingStationId == item.DockingStationId
          );
          if (doc) {
            if (!doc.Position) continue;
            var pos = PositionRecalculationExtension.calculatePositionFromPoint(
              doc.Position.Latitude,
              doc.Position.Longitude,
              degree
            );
            item.Position.Latitude = pos.Latitude;
            item.Position.Longitude = pos.Longitude;
            item.Position.Altitude = pos.Altitude;

            let dockBikePosition = {
              DockingStationId: item.DockingStationId,
              Bike: item
            };

            this.filteredBikes.push(dockBikePosition);
            this.updatedBikes.push(item);
          }
        }
        degree = degree + degreeDivider;
      }
    }
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

  loadRepairCategories() {
    this.repairService.GetRepairCategories().subscribe(data => {
      this.repairGroup1 = data.group1;
      this.repairGroup2 = data.group2;
      this.repairgroup3 = data.group3;
      this.translateAllRepairCategories();
    }, error => {
      this.loggerService.showErrorMessage(error);
    });
  }

  translateRepairCategories(repairCat) {
    let tranlationLabel = "REPAIR_REPORT." + repairCat.TranslationName;
    this.translate.get(tranlationLabel).subscribe(name => {
      repairCat.DisplayName = (name != tranlationLabel) ? name : repairCat.Name;
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

  translateAllRepairCategories() {
    this.repairGroup1.map(x => this.translateRepairCategories(x));
    this.repairGroup2.map(x => this.translateRepairCategories(x));
    this.repairgroup3.map(x => this.translateRepairCategories(x));
  }

  clearRepairErrorCategories() {
    this.repairGroup1.map(x => this.resetRepairCategories(x));
    this.repairGroup2.map(x => this.resetRepairCategories(x));
    this.repairgroup3.map(x => this.resetRepairCategories(x));
  }

  resetRepairCategories(repairCat) {
    if (repairCat.hasOwnProperty("Result"))
      repairCat.Result = false;
  }

  CreateReportError(result = null) {
    const dialogRef = this.dialog.open(ReportErrorComponent, {
      width: '1100px',
      height: '800px',
      data: {
        'group1': this.group1, 'group2': this.group2, 'group3': this.group3, 'bikeId': this.bikeId, 'bike': this.bike,
        'sessionId': this.bike.SessionId, 'bikeLocked': false,
        'isRepairRequired': true, "disableBike": this.disableBike,
        "otherFell": this.otherFell, "otherCritical": this.otherCritical, "comments": this.comments, "selectedErrorCategories": this.selectedErrorCategories
      }
    });

    dialogRef.afterClosed().subscribe(errorRes => {
      if (errorRes) {
        if (this.bike.DisableState != BikeDisableState.Moving) {
          //this.CreateRepairReport(this.bike, false, result, errorRes);
          this.confirmRepairErrorReport(result, false, errorRes);
        }
        else {
          //this.CreateRepairReportForMoving(this.bike, false, result, errorRes);
          this.confirmMovingErrorReport(false, errorRes);
        }
      }
      else
        this.isLoading = false;
    });
    this.clearSelectedErrorCategories();
  }

  confirmRepairErrorReport(result, isBikeOkay, errorRes) {
    const dialogRe = this.dialog.open(LiveMapConfirmPopupComponent, {
      width: '500px',
      height: '700px',
      data: { bikeId: this.bike.BikeId, bike: this.bike, isBikeOkay: isBikeOkay, userName: this.loggedInUser.FirstName, isBikeDisabled: errorRes["IsBikeDisabled"], isShouldBeChecked: true }
    });

    dialogRe.afterClosed().subscribe(confirmResponse => {
      this.isDocked = true;
      this.CreateErrorReport(errorRes.errorReport);
      if (confirmResponse && confirmResponse.isPlaceInCar) {
        this.CreateTransportationOrderForRepairRequired(result);
        this.bike.Disabled = true;
        this.bike.DisableState = BikeDisableState.ToWorkshop;
        this.bike["BikeStatus"] = BikeStatus.DisableToWorkshop;
        if (this.transportBikes.length == 0)
          this.AddBikeToCar(this.bike);
        else
          this.UpdateBikesInCar(this.bike);
      }
      else if (confirmResponse && !confirmResponse.isPlaceInCar && !confirmResponse.isKeepInUse) {
        this.confirmBikePlaceHere();
      }
      else if (confirmResponse && !confirmResponse.isPlaceInCar && confirmResponse.isKeepInUse) {
        this.confirmBikeShouldBeChecked();
      }
    });
  }

  confirmMovingErrorReport(isBikeOkay, errorRes) {
    const dialogRe = this.dialog.open(LiveMapConfirmPopupComponent, {
      width: '500px',
      height: '700px',
      data: { bikeId: this.bike.BikeId, bike: this.bike, isBikeOkay: isBikeOkay, userName: this.loggedInUser.FirstName, isShouldBeChecked: false }
    });

    dialogRe.afterClosed().subscribe(confirmResponse => {
      //construct url and pass it to change
      if (this.routeId) {
        const url = this
          .router
          .createUrlTree([{ routeId: this.routeId }], { relativeTo: this.route })
          .toString();
        this.location.go(url);
      } else {
        const url = this
          .router
          .createUrlTree([], { relativeTo: this.route })
          .toString();
        this.location.go(url);
      }
      this.isOpened = false;
      this.isServiceOpened = false;
      this.isLoading = false;
      this.CreateErrorReport(errorRes.errorReport);
      if (confirmResponse && confirmResponse.isPlaceInCar) {
        this.isDocked = true;
        this.bike.Disabled = true;
        this.bike.DisableState = BikeDisableState.ToWorkshop;
        this.bike["BikeStatus"] = BikeStatus.DisableToWorkshop;

        //when set bike is okay for loose bikes
        var bikeStateChangeDTO = { Disabled: true, DisabledReason: BikeDisableState.ToWorkshop };
        this.DisableBike(bikeStateChangeDTO);
        this.transportBikes = this.transportBikes.filter(x => x.BikeId != this.bike.BikeId);
        this.UpdateBikesInCar(this.bike);
        setTimeout(() => {
          this.RefreshMapWithContent();
        }, 1000);
      }
      else if (confirmResponse && !confirmResponse.isPlaceInCar && !confirmResponse.isKeepInUse) {
        const dialogRe = this.dialog.open(LiveMapConfirmPopupComponent, {
          width: '500px',
          height: '700px',
          data: {
            bikeId: this.bike.BikeId, bike: this.bike, isBikeOkay: true, userName: this.loggedInUser.FirstName,
            isBikeNeedsRepair: true
          }
        });

        dialogRe.afterClosed().subscribe(result => {
          this.bike.Disabled = true;
          this.bike.DisableState = BikeDisableState.CheckedNeedFix;
          this.bike["BikeStatus"] = BikeStatus.DisabledCheckedNeedRepair;
          var bikeStateChangeDTO = { Disabled: true, DisabledReason: BikeDisableState.CheckedNeedFix };
          this.DisableBike(bikeStateChangeDTO);
          //bike service details create or update
          var bikeServiceDTO = { NumberOfChecks: this.bike.NumberOfChecks, BikeId: this.bikeId }
          this.CreateOrUpdateBikeService(bikeServiceDTO);


          //remove bike from list after checked now is pressed
          this.dockingStationBikes = this.dockingStationBikes.filter(x => x.BikeId != this.bikeId);
          this.takenOutBikes = this.takenOutBikes.filter(x => x.BikeId != this.bikeId);
        });
        setTimeout(() => {
          this.RefreshMapWithContent();
        }, 1000);
      }
      else if (confirmResponse && !confirmResponse.isPlaceInCar && confirmResponse.isKeepInUse) {
        this.confirmBikeShouldBeChecked();
      }
    });
  }

  CreateRepairReport(bike, isBikeOkay = false, result = null, errorRes = null) {
    const dialogRef = this.dialog.open(RepairRegisterPopupComponent, {
      disableClose: true,
      width: '1100px',
      height: '830px',
      data: { 'group1': this.repairGroup1, 'group2': this.repairGroup2, 'group3': this.repairgroup3, 'bike': this.bike, 'bikeId': bike.BikeId, 'isBikeOkay': isBikeOkay, "checkedCategories": this.checkedCategories }
    });

    dialogRef.afterClosed().subscribe(res => {
      //we should set isLooseBike flag to false to refresh interruption for moving bikes
      this.isLooseBike = false;
      if (res) {
        if (!res.isGoBack) {
          if (!isBikeOkay) {
            const dialogRe = this.dialog.open(LiveMapConfirmPopupComponent, {
              width: '500px',
              height: '700px',
              data: { bikeId: this.bike.BikeId, bike: this.bike, isBikeOkay: isBikeOkay, userName: this.loggedInUser.FirstName, isShouldBeChecked: false }
            });

            dialogRe.afterClosed().subscribe(confirmResponse => {
              this.isDocked = true;
              this.CreateErrorReport(errorRes.errorReport);
              if (confirmResponse && confirmResponse.isPlaceInCar) {
                this.CreateTransportationOrderForRepairRequired(result);
                this.bike.Disabled = true;
                this.bike.DisableState = BikeDisableState.ToWorkshop;
                this.bike["BikeStatus"] = BikeStatus.DisableToWorkshop;
                if (this.transportBikes.length == 0)
                  this.AddBikeToCar(this.bike);
                else
                  this.UpdateBikesInCar(this.bike);
              }
              else if (confirmResponse && !confirmResponse.isPlaceInCar) {
                if (this.dockingStationId) {
                  if (this.routeId) {
                    const url = this
                      .router
                      .createUrlTree([{ general: 1, stationId: this.dockingStationId, routeId: this.routeId }], { relativeTo: this.route })
                      .toString();
                    this.location.go(url);
                  } else {
                    const url = this
                      .router
                      .createUrlTree([{ general: 1, stationId: this.dockingStationId }], { relativeTo: this.route })
                      .toString();
                    this.location.go(url);
                  }
                }
                else {
                  if (this.routeId) {
                    const url = this
                      .router
                      .createUrlTree([{ routeId: this.routeId }], { relativeTo: this.route })
                      .toString();
                    this.location.go(url);
                  } else {
                    const url = this
                      .router
                      .createUrlTree([], { relativeTo: this.route })
                      .toString();
                    this.location.go(url);
                  }
                  this.isServiceOpened = false;
                }
                //added this flag to handle auto refresh of bike details
                this.ServiceCompleted = true;
                this.bike.isCheckCompleted = true;
                this.bike.isCancelled = false;
                this.bike.Disabled = true;
                this.bike.DisableState = BikeDisableState.CheckedNeedFix;
                this.bike["BikeStatus"] = BikeStatus.DisabledCheckedNeedRepair;
                let bikeStateChangeDTO = { Disabled: true, DisabledReason: BikeDisableState.CheckedNeedFix };
                this.DisableBike(bikeStateChangeDTO);

                //bike service details create or update
                var bikeServiceDTO = { NumberOfChecks: this.bike.NumberOfChecks, BikeId: this.bikeId }
                this.CreateOrUpdateBikeService(bikeServiceDTO);

                //reset unsuccessful session count when check completed
                //this.resetUndockFailureCountByBike();

                //remove bike from list after checked now is pressed
                this.dockingStationBikes = this.dockingStationBikes.filter(x => x.BikeId != this.bikeId);
                this.takenOutBikes = this.takenOutBikes.filter(x => x.BikeId != this.bikeId);

                //instant refresh
                this.RefreshMapWithContent();
              }
            });
          }
          else {
            const dialogRe = this.dialog.open(LiveMapConfirmPopupComponent, {
              width: '500px',
              height: '700px',
              data: { bikeId: this.bike.BikeId, bike: this.bike, isBikeOkay: isBikeOkay, userName: this.loggedInUser.FirstName, isShouldBeChecked: false }
            });

            dialogRe.afterClosed().subscribe(result => {

            });
          }
        }
        else {
          if (!isBikeOkay) {
            this.selectedErrorCategories = errorRes.selectedErrorCategories;
            // this.checkedCategories = errorRes.checkedCategories;
            this.disableBike = errorRes.disableBike;
            this.otherFell = errorRes.otherFell;
            this.otherCritical = errorRes.otherCritical;
            this.comments = errorRes.comments;
            this.repairGroup1 = res.repairGroup1;
            this.repairGroup2 = res.repairGroup2;
            this.repairgroup3 = res.repairGroup3;
            this.CreateReportError(result);
          }
        }
      }
      else {
        if (!isBikeOkay) {
          this.selectedErrorCategories = errorRes.selectedErrorCategories;
          this.checkedCategories = errorRes.checkedCategories;
          this.disableBike = errorRes.disableBike;
          this.otherFell = errorRes.otherFell;
          this.otherCritical = errorRes.otherCritical;
          this.comments = errorRes.comments;
          this.CreateReportError(result);
        }
      }
    });
    this.clearRepairErrorCategories();
  }


  CreateRepairReportForMoving(bike, isBikeOkay = false, result = null, errorRes = null) {
    const dialogRef = this.dialog.open(RepairRegisterPopupComponent, {
      disableClose: true,
      width: '1100px',
      height: '830px',
      data: { 'group1': this.repairGroup1, 'group2': this.repairGroup2, 'group3': this.repairgroup3, 'bike': this.bike, 'bikeId': bike.BikeId, 'isBikeOkay': isBikeOkay, "checkedCategories": this.checkedCategories }
    });

    dialogRef.afterClosed().subscribe(res => {
      //we should set isLooseBike flag to false to refresh interruption for moving bikes
      this.isLooseBike = false;
      if (res) {
        if (!res.isGoBack) {
          if (!isBikeOkay) {
            const dialogRe = this.dialog.open(LiveMapConfirmPopupComponent, {
              width: '500px',
              height: '700px',
              data: { bikeId: this.bike.BikeId, bike: this.bike, isBikeOkay: isBikeOkay, userName: this.loggedInUser.FirstName, isShouldBeChecked: false }
            });

            dialogRe.afterClosed().subscribe(confirmResponse => {
              //construct url and pass it to change
              if (this.routeId) {
                const url = this
                  .router
                  .createUrlTree([{ routeId: this.routeId }], { relativeTo: this.route })
                  .toString();
                this.location.go(url);
              } else {
                const url = this
                  .router
                  .createUrlTree([], { relativeTo: this.route })
                  .toString();
                this.location.go(url);
              }
              this.isOpened = false;
              this.isServiceOpened = false;
              this.isLoading = false;
              if (confirmResponse && confirmResponse.isPlaceInCar) {
                this.isDocked = true;
                this.CreateErrorReport(errorRes.errorReport);
                this.bike.Disabled = true;
                this.bike.DisableState = BikeDisableState.ToWorkshop;
                this.bike["BikeStatus"] = BikeStatus.DisableToWorkshop;

                //when set bike is okay for loose bikes
                var bikeStateChangeDTO = { Disabled: true, DisabledReason: BikeDisableState.ToWorkshop };
                this.DisableBike(bikeStateChangeDTO);
                this.transportBikes = this.transportBikes.filter(x => x.BikeId != this.bike.BikeId);
                this.UpdateBikesInCar(this.bike);
              }
              else if (confirmResponse && !confirmResponse.isPlaceInCar) {
                this.bike.Disabled = true;
                this.bike.DisableState = BikeDisableState.CheckedNeedFix;
                this.bike["BikeStatus"] = BikeStatus.DisabledCheckedNeedRepair;
                var bikeStateChangeDTO = { Disabled: true, DisabledReason: BikeDisableState.CheckedNeedFix };
                this.DisableBike(bikeStateChangeDTO);
                //bike service details create or update
                var bikeServiceDTO = { NumberOfChecks: this.bike.NumberOfChecks, BikeId: this.bikeId }
                this.CreateOrUpdateBikeService(bikeServiceDTO);

                //reset unsuccessful session count when check completed
                //this.resetUndockFailureCountByBike();

                //remove bike from list after checked now is pressed
                this.dockingStationBikes = this.dockingStationBikes.filter(x => x.BikeId != this.bikeId);
                this.takenOutBikes = this.takenOutBikes.filter(x => x.BikeId != this.bikeId);

              }
              setTimeout(() => {
                this.RefreshMapWithContent();
              }, 1000);
            });
          }
          else {
            const dialogRe = this.dialog.open(LiveMapConfirmPopupComponent, {
              width: '500px',
              height: '700px',
              data: { bikeId: this.bike.BikeId, bike: this.bike, isBikeOkay: isBikeOkay, userName: this.loggedInUser.FirstName, isShouldBeChecked: false }
            });

            dialogRe.afterClosed().subscribe(result => {

            });
          }
        }
        else {
          if (!isBikeOkay) {
            this.selectedErrorCategories = errorRes.selectedErrorCategories;
            // this.checkedCategories = errorRes.checkedCategories;
            this.disableBike = errorRes.disableBike;
            this.otherFell = errorRes.otherFell;
            this.otherCritical = errorRes.otherCritical;
            this.comments = errorRes.comments;
            this.repairGroup1 = res.repairGroup1;
            this.repairGroup2 = res.repairGroup2;
            this.repairgroup3 = res.repairGroup3;
            this.CreateReportError(result);
          }
        }
      }
      else {
        if (!isBikeOkay) {
          this.selectedErrorCategories = errorRes.selectedErrorCategories;
          // this.checkedCategories = errorRes.checkedCategories;
          this.disableBike = errorRes.disableBike;
          this.otherFell = errorRes.otherFell;
          this.otherCritical = errorRes.otherCritical;
          this.comments = errorRes.comments;
          this.CreateReportError(result);
        }
      }
    });
    this.clearRepairErrorCategories();
  }

  CreateErrorReport(errorReportObj) {
    this.issueService.CreateErrorReport(errorReportObj).subscribe(data => {
      // this.loggerService.showSuccessfulMessage(this.commonService.TranslateMessage(TranslateMessageTypes.ErrorReportedSuccess));
    }, error => {
      this.loggerService.showErrorMessage(this.commonService.TranslateMessage(TranslateMessageTypes.ErrorReportedFail));
    });
  }

  HandoverBike(bike) {
    // remove from car view when place free
    if (this.carTranportObj) {
      this.transportBikes = this.transportBikes.filter(y => y.BikeId != bike.BikeId);
      this.UpdateBikeTransport();
    }
    //adding undocked bikes to list temporarily
    bike["PreviousBikeStatus"] = bike["BikeStatus"];
    bike.Disabled = false;
    bike.DisableState = null;
    bike.isCheckCompleted = false;
    bike.isUndocking = true;
    bike.isTakenOut = true;
    bike.isChecked = true;
    bike.isPlaceFree = true;
    if (bike.LockState == LockState.LockedArrest)
      this.UnLockBike();
    bike["BikeStatus"] = CommonHandler.getBikeStatus(bike, bike.DockingStationId, bike.DockingPointId);
    if (this.dockingStationBikes.length == 0) {
      bike.Resolved = 0;

      if (this.takenOutBikes.find(x => x.BikeId == bike.BikeId)) {
        //remove the bike from takenOutBikes array when it free stands
        var index = this.takenOutBikes.findIndex(x => x.BikeId == bike.BikeId);
        this.takenOutBikes.splice(index, 1);
      }

      var bikeStateChangeDTO = { Disabled: false, DisabledReason: null };
      this.DisableBike(bikeStateChangeDTO);
    }
    else {
      var index = this.dockingStationBikes.findIndex(x => x.BikeId == bike.BikeId);
      this.dockingStationBikes[index] = bike;

      //remove the bike from takenOutBikes array when it free stands
      var takenOutBikeIndex = this.takenOutBikes.findIndex(x => x.BikeId == bike.BikeId);
      this.takenOutBikes.splice(takenOutBikeIndex, 1);

      //set bike free standing if there are other docked bikes
      var bikeStateChangeDTO = { Disabled: false, DisabledReason: null };
      this.DisableBike(bikeStateChangeDTO);
    }
  }

  ResolveIssuePerBike(bikeId) {
    this.issueService.ResolveIssuePerBike(bikeId).subscribe(result => {
      if (result > 0) {
        // this.loggerService.showSuccessfulMessage("Issue resolved sucessfully.");
      } else {
        // this.loggerService.showErrorMessage("Issue resolving failed");
      }
    });
  }

  HandToWorkShop(transportBike) {

    const dialogWorkshop = this.dialog.open(WorkshopSelectionPopupComponent, {
      width: '400px',
      height: '250px',
      data: {
        allWorkshops: this.allWorkshops,
        allNearbyWorkshops: this.allNearbyWorkshops,
        bikeId: transportBike.BikeId,
        bike: transportBike,
        userName: this.loggedInUser.FirstName
      },
      disableClose: true
    });

    dialogWorkshop.afterClosed().subscribe(wsre => {
      if (wsre) {
        const dialogRe = this.dialog.open(DeliverWorkshopPopupComponent, {
          width: '400px',
          height: '250px',
          data: { bikeId: transportBike.BikeId, bike: transportBike, userName: this.loggedInUser.FirstName }
        });

        dialogRe.afterClosed().subscribe(re => {
          this.transportBikes = this.transportBikes.filter(x => x.BikeId != transportBike.BikeId);
          this.carTranportObj["Bikes"] = JSON.stringify(this.transportBikes);
          this.bikesService.UpdateBikeTransport(this.loggedInUser.UserId, this.carTranportObj).subscribe(res => {
            // this.AcknowledgeTransportAndCreateRepair(transportBike.BikeId);
            this.CreateRepairOrder(transportBike.BikeId);
            this.UpdateBikeWorkshop(transportBike.BikeId, wsre.selectedWorkshopId);
            //update undock command history with workshop Id and bike disabled state
            this.updateUndockCommandHistory(transportBike.BikeId, BikeDisableState.InWorkshop, wsre.selectedWorkshopId, true);
          });
        });
      }
    });
  }

  CreateRepairOrder(bikeId) {
    this.repairOrderService.createRepairOrder(bikeId).subscribe(result => {
    });
  }

  HandToStorage(transportBike, selectedStorageId = 0) {
    this.transportBikes = this.transportBikes.filter(x => x.BikeId != transportBike.BikeId);
    this.carTranportObj["Bikes"] = JSON.stringify(this.transportBikes);
    this.bikesService.UpdateBikeTransport(this.loggedInUser.UserId, this.carTranportObj).subscribe(res => {
      if (selectedStorageId > 0)
        this.updateBikeStorage(this.bikeId, selectedStorageId);
    });
  }

  AddBikeToCar(bike) {
    if (this.authToken && this.authToken._claims[0] == UserRoles.STREET_TEAM) {
      this.transportBikes.push(bike);
      let carDTO = {
        UserId: this.loggedInUser.UserId,
        Bikes: JSON.stringify(this.transportBikes)
      }
      this.bikesService.AddBikeToCar(this.loggedInUser.UserId, carDTO).subscribe(res => {
        this.GetBikesInCar();
        let bikeFeature = this.source.getFeatureById(bike.BikeId);
        if (bikeFeature)
          this.source.removeFeature(bikeFeature);
      });
    }
  }

  UpdateBikesInCar(bike) {
    if (this.authToken && this.authToken._claims[0] == UserRoles.STREET_TEAM) {
      this.transportBikes.push(bike);
      this.carTranportObj["Bikes"] = JSON.stringify(this.transportBikes);
      this.bikesService.UpdateBikeTransport(this.loggedInUser.UserId, this.carTranportObj).subscribe(res => {
        let carFeature = this.carSource.getFeatureById(this.loggedInUser.UserId);
        if (carFeature) {
          let style = carFeature.getStyle();
          style.getText().setText(this.transportBikes.length.toString());
          carFeature.setStyle(style);
        }
        let bikeFeature = this.source.getFeatureById(bike.BikeId);
        if (bikeFeature)
          this.source.removeFeature(bikeFeature);
      });
    }
  }

  UpdateBikeTransport() {
    if (this.authToken && this.authToken._claims[0] == UserRoles.STREET_TEAM) {
      this.carTranportObj["Bikes"] = JSON.stringify(this.transportBikes);
      this.bikesService.UpdateBikeTransport(this.loggedInUser.UserId, this.carTranportObj).subscribe(res => {
        let carFeature = this.carSource.getFeatureById(this.loggedInUser.UserId);
        if (carFeature) {
          let style = carFeature.getStyle();
          style.getText().setText(this.transportBikes.length.toString());
          carFeature.setStyle(style);
        }
      });
    }
  }

  GetBikesInCar() {
    this.bikesService.getBikeTransportByUserId(this.loggedInUser.UserId).subscribe(res => {
      if (res) {
        this.carTranportObj = res;
        this.transportBikes = (res.Bikes) ? JSON.parse(res.Bikes) : [];
        let carFeature = this.carSource.getFeatureById(this.loggedInUser.UserId);
        if (carFeature) {
          let style = carFeature.getStyle();
          style.getText().setText(this.transportBikes.length.toString());
          carFeature.setStyle(style);
        }
      }
    });
  }

  GetAllUserPositions() {
    this.userService.getAllUserPositions().subscribe(res => {
      if (res) {
        this.allUserPositions = res;
        this.loadCars(this.allUserPositions);
        let carUserId: string = this.route.snapshot.paramMap.get('userId');
        if (carUserId && carUserId != "null") {
          this.carUser = this.allUserPositions.filter(x => x.UserId == parseInt(carUserId))[0];
          this.carUser["FirstName"] = this.carUser["Name"];
        }
      }
    });
  }

  GetAllUserPositionsUpdate() {
    this.userService.getAllUserPositions().subscribe(res => {
      if (res) {
        this.allUserPositions = res;
      }
    });
  }

  AddUserPosition(userPosition) {
    this.userService.AddUserPosition(userPosition).subscribe(res => {
      this.GetAllUserPositionsUpdate();
    });
  }

  UpdateUserPosition(userPosition) {
    this.userService.UpdateUserPosition(userPosition).subscribe(res => {
      this.GetAllUserPositionsUpdate();
    });
  }

  CloseCarView() {
    this.isCarOpened = false;
    if (this.routeId) {
      const url = this
        .router
        .createUrlTree([{ routeId: this.routeId }], { relativeTo: this.route })
        .toString();
      this.location.go(url);
    } else {
      const url = this
        .router
        .createUrlTree([], { relativeTo: this.route })
        .toString();
      this.location.go(url.split(";")[0]);
    }
  }

  GetRegisteredIssuesPerBikeId(bikeId) {
    this.bikeIssues = [];
    this.issueService.GetAllErrorReportsPerBike(bikeId).subscribe(result => {
      this.bikeIssues = result.errorReportGroupedDTOs;
      this.bikeIssues = this.bikeIssues.filter(i => i.IsCompleted == false);
      // this.errorReports = result.errorReportResponseDTOs;
      this.formatErrorCategories();
    },
      () => {
      }
    );
  }

  formatErrorCategories() {
    this.bikeIssues.forEach(x => {
      let errorText = "";
      x.ErrorCategories.forEach(errorCat => {
        let errorcategory = "REPORT_ERROR." + errorCat.Name.toUpperCase();
        this.translate.get(errorcategory).subscribe(name => {
          errorCat.DisplayText = name;
        });
        errorText += errorCat.DisplayText + ",";
      });
      x.ErrorCategoriesText = errorText.substr(0, errorText.length - 1);
      // x.ReportedDateFormatted = moment(x.ReportedDate).format("DD.MM.YYYY");
      x.ReportedDate = this.convertTime.transform(x.ReportedDate);
      let reportedDate = moment(x.ReportedDate);
      let now = moment(this.convertTime.transform(moment().utc().format()));
      let diff = now.diff(reportedDate);

      let startOfToday = moment().utc().startOf('day');
      let startOfYesterday = moment().utc().subtract(1, 'day').startOf('day');
      let durationInDays = moment.duration(diff).asDays();

      if (durationInDays < 8) {
        if (reportedDate.isSameOrAfter(startOfToday, 'day')) {
          x.ReportedDateFormatted = `Today ${moment(x.ReportedDate).format("HH:mm")}`;
        } else if (reportedDate.isSameOrAfter(startOfYesterday, 'day') && reportedDate.isBefore(startOfToday)) {
          x.ReportedDateFormatted = `Yesterday ${moment(x.ReportedDate).format("HH:mm")}`;
        } else
          x.ReportedDateFormatted = `Last ${moment(x.ReportedDate).format("dddd HH:mm")}`;
      }
      else
        x.ReportedDateFormatted = moment(x.ReportedDate).format("MMM Do HH:mm");
      x.ReportedUser = this.commonService.mapReportedUser(x);
    });
  }

  GetAllWorkshops() {
    this.allWorkshops = [];
    this.workshopService.GetAllWorkshops().subscribe(res => {
      if (res) {
        this.allWorkshops = res;
      }
    });
  }

  GetAllNearByWorkshops(details) {
    this.allNearbyWorkshops = [];
    this.workshopService.GetAllWorkshopsByUserPosition(details).subscribe(res => {
      if (res) {
        this.allNearbyWorkshops = res;
      }
    });
  }

  UpdateBikeWorkshop(bikeId, workshopId) {
    let workshopDet = { "BikeId": bikeId, "WorkshopId": workshopId };
    this.bikesService.UpdateBikeWorkshop(workshopDet).subscribe(res => {
    });
  }

  private RefreshCarBikes() {
    if (this.carTranportObj) {
      let isChanged = false;
      this.transportBikes.forEach(tranBike => {
        if (tranBike) {
          var existBike = this.allBikes.find(x => x.BikeId == tranBike["BikeId"]);
          if (existBike) {
            if (existBike["DisabledReason"] != BikeDisableState.ToWorkshop &&
              existBike["DisabledReason"] != BikeDisableState.Moving) {
              this.transportBikes = this.transportBikes.filter(x => x.BikeId != existBike["BikeId"]);
              isChanged = true;
            }
          }
        }
        else {
          this.transportBikes = this.transportBikes.filter(x => x != null);
          isChanged = true;
        }
      });
      if (isChanged)
        this.UpdateBikeTransport();
    }
  }

  updateBikeStorage(bikeId, storageId) {
    let storageDet = { "BikeId": bikeId, "StorageId": storageId };
    this.bikesService.updateBikeStorage(storageDet).subscribe(res => {
      //update undock command history with storage Id and bike disabled state
      this.updateUndockCommandHistory(bikeId, BikeDisableState.InStorage, storageId);
    });
  }

  showAllDockRadius() {
    let dockRadiusFeatures = this.dockRadiusLayer.getSource().getFeatures();
    if (this.isShowAllRadius) {
      for (let index in dockRadiusFeatures) {
        dockRadiusFeatures[index].setStyle(MapExtension.getDockingStationRadiusStyles()[0]);
      }
    }
    else {
      for (let index in dockRadiusFeatures) {
        if (this.dockingStationId == dockRadiusFeatures[index].getId())
          continue;
        dockRadiusFeatures[index].setStyle(null);
      }
    }
    setTimeout(() => { }, 1000);
  }

  showOnlyWithIssues() {
    this.RefreshMapWithContent();
    this.loadBikePositions();
    if (!this.isShowOnlyWithIssues) {
      this.bikeMap = true;
      this.dockMap = true;
      this.zoneMap = false;
      this.adjustLayers({ bike : true, dock: true, zone: false});
    }
  }

  openFilterOptions() {
    this.showMapOptions = !this.showMapOptions;
  }

  changeMap($event, type) {
    this.adjustLayers({ 'bike': this.bikeMap, 'dock': this.dockMap, 'zone': this.zoneMap });
  }

  showSateliteMode() {
    if (this.isSateliteMode) {
      this.bingLabelsLayer.setVisible(true);
      this.tileLayer.setVisible(false);
    }
    else {
      this.bingLabelsLayer.setVisible(false);
      this.tileLayer.setVisible(true);
    }
  }

  closeDockView() {
    this.isOpened = false;
    this.mouseOver = false;

    // remove radius from map
    if (!this.isShowAllRadius) {
      let dockRadiusFeature = this.dockRadiusLayer.getSource().getFeatures().find(x => x.getId() == this.dockingStationId);
      if (dockRadiusFeature)
        dockRadiusFeature.setStyle(null);
    }

    //When dock view closed refresh map to keep it upto date
    if (this.dockingStationId)
      this.RefreshMapWithContent();

    if (!this.mouseOver)
      this.dockingStationId = null;

    //construct url and pass it to change
    if (this.routeId) {
      const url = this
        .router
        .createUrlTree([{ routeId: this.routeId }], { relativeTo: this.route })
        .toString();
      this.location.go(url);
    } else {
      const url = this
        .router
        .createUrlTree([], { relativeTo: this.route })
        .toString();
      this.location.go(url.split(";")[0]);
    }
  }

  openDockingPointDetailsPopup(dockingStationBike: any) {
    let dpErrorCategories = [...this.dpErrorCategories];
    const dialogOpenDPRef = this.dialog.open(DockingPointDetailsPopupComponent, {
      width: '500px',
      height: '700px',
      data: {
        "dockingStationName": this.dockingStationName,
        "dpVisualId": dockingStationBike["DPVisualId"],
        "dpId": dockingStationBike["DockingPointId"],
        "dpDisabled": dockingStationBike["DPDisabled"],
        "dpDisabledReason": dockingStationBike["DPDisabledReason"],
        "dpErrorCategories": dpErrorCategories,
        "isBikeExist": (dockingStationBike["BikeId"]) ? true : false
      }
    });
    dialogOpenDPRef.afterClosed().subscribe(result => {
      if (result && result["IsDPOkay"]) {
        const dialogConfirmRef = this.dialog.open(ConfirmationDpCheckPopupComponent, {
          disableClose: true,
          width: '500px',
          height: '300px',
          data: {
            "dpVisualId": dockingStationBike["DPVisualId"]
          }
        });
        dialogConfirmRef.afterClosed().subscribe(isConfirmed => {
          if (isConfirmed) {
            var dpStateChangeDTO = { DPisabled: false, DPDisabledReason: null };
            this.stationService.enableDisableDockingPoint(
              dockingStationBike["DockingStationId"],
              dockingStationBike["DockingPointId"],
              dpStateChangeDTO).
              subscribe(res => {
                if (res) {
                  let dpTakenOutindex = this.takenOutBikes.findIndex(x => x.DPVisualId == dockingStationBike["DPVisualId"]);
                  let dpDockBikeindex = this.dockingStationBikes.findIndex(x => x.DPVisualId == dockingStationBike["DPVisualId"]);
                  if (dpTakenOutindex != -1) {
                    var takenOut = this.takenOutBikes.find(x => x.DPVisualId == dockingStationBike["DPVisualId"]);
                    takenOut["DPDisabled"] = false;
                    takenOut["DPDisabledReason"] = null;
                    this.takenOutBikes[dpTakenOutindex] = takenOut;
                  }
                  if (dpDockBikeindex != -1) {
                    var dockedOut = this.dockingStationBikes.find(x => x.DPVisualId == dockingStationBike["DPVisualId"]);
                    dockedOut["DPDisabled"] = false;
                    dockedOut["DPDisabledReason"] = null;
                    this.dockingStationBikes[dpDockBikeindex] = dockedOut;
                  }
                }
              }, err => {
                this.loggerService.showErrorMessage("Error while getting docking point details");
              });
          }
        });
      }
      else if (result && result["IsDPRepairRequired"]) {
        let dpErrorCategories = [...this.dpErrorCategories];
        const dialogDPErrorReportRef = this.dialog.open(DockingPointErrorReportPopupComponent, {
          disableClose: true,
          width: '500px',
          maxHeight: '90vh',
          data: {
            "dpVisualId": dockingStationBike["DPVisualId"],
            "dpErrorCategories": dpErrorCategories
          }
        });
        dialogDPErrorReportRef.afterClosed().subscribe(result => {
          if (result) {
            let dpErrorReportDto = result["dpErrorReportDto"];
            dpErrorReportDto["DockingStationId"] = dockingStationBike["DockingStationId"];
            dpErrorReportDto["DockingPointId"] = dockingStationBike["DockingPointId"];
            this.createDPIssue(dpErrorReportDto, dockingStationBike["DPVisualId"]);
            setTimeout(() => {
              this.markertxtsingle.nativeElement.focus();
              this.markertxtsingle.nativeElement.style.backgroundColor = StationColors.CHECKED_NEEDS_REPAIR_BIKES;
            }, 500);

            if (this.enableRoutes) {
              //creation waypoint action
              let details = `Docking point ${dockingStationBike["DPVisualId"]} checked and needs repair`;
              this.createWayPointAction(details);
            }
          }
        });
      }
      else if (result && result["IsDPRepaired"]) {
        this.enableDockingPoint(dockingStationBike["DPVisualId"]);
        if (this.enableRoutes) {
          //creation waypoint action
          let details = `Docking point ${dockingStationBike["DPVisualId"]} repaired and okay for docking bikes`;
          this.createWayPointAction(details);
        }
      }
    });
  }

  getAllDPErrorCategories() {
    this.issueService.getAllDockingPointErrorCategories().subscribe(res => {
      this.mapDPErrorCategories(res);
    });
  }

  mapDPErrorCategories(data) {
    data.map(function (dpErrorCategory) {
      return dpErrorCategory.Name = "LIVE_MAP.ACTIVE_DOCKING_POINT_ISSUE_REPORT." + dpErrorCategory.Name.toUpperCase();
    });
    this.dpErrorCategories = data;
  }

  createDPIssue(dpErrorReportDto: any, dpVisualId: any) {
    this.spinner.show("dp-spinner");
    this.issueService.createDPIssue(dpErrorReportDto).subscribe(res => {
      if (res) {
        let dpTakenOutindex = this.takenOutBikes.findIndex(x => x.DPVisualId == dpVisualId);
        let dpDockBikeindex = this.dockingStationBikes.findIndex(x => x.DPVisualId == dpVisualId);
        if (dpTakenOutindex != -1) {
          var takenOut = this.takenOutBikes.find(x => x.DPVisualId == dpVisualId);
          takenOut["DPDisabled"] = true;
          takenOut["DPDisabledReason"] = DockingPointDisabledReason.CheckRequired;
          this.takenOutBikes[dpTakenOutindex] = takenOut;
        }
        if (dpDockBikeindex != -1) {
          var dockedOut = this.dockingStationBikes.find(x => x.DPVisualId == dpVisualId);
          dockedOut["DPDisabled"] = true;
          dockedOut["DPDisabledReason"] = DockingPointDisabledReason.CheckRequired;
          this.dockingStationBikes[dpDockBikeindex] = dockedOut;
        }
      }
      this.spinner.hide("dp-spinner");
    }, err => {
      this.spinner.hide("dp-spinner");
    });
  }

  enableDockingPoint(dpVisualId: any) {
    let dpTakenOutindex = this.takenOutBikes.findIndex(x => x.DPVisualId == dpVisualId);
    let dpDockBikeindex = this.dockingStationBikes.findIndex(x => x.DPVisualId == dpVisualId);
    if (dpTakenOutindex != -1) {
      var takenOut = this.takenOutBikes.find(x => x.DPVisualId == dpVisualId);
      takenOut["DPDisabled"] = false;
      takenOut["DPDisabledReason"] = null;
      this.takenOutBikes[dpTakenOutindex] = takenOut;
    }
    if (dpDockBikeindex != -1) {
      var dockedOut = this.dockingStationBikes.find(x => x.DPVisualId == dpVisualId);
      dockedOut["DPDisabled"] = false;
      dockedOut["DPDisabledReason"] = null;
      this.dockingStationBikes[dpDockBikeindex] = dockedOut;
    }
  }

  updateUndockCommandHistory(bikeId, disabledState, bikeStoreId, isWorkshop = false) {
    let cmdHistoryDet: any;
    if (!isWorkshop)
      cmdHistoryDet = { BikeId: bikeId, DisabledState: disabledState, StorageId: bikeStoreId };
    else
      cmdHistoryDet = { BikeId: bikeId, DisabledState: disabledState, WorkshopId: bikeStoreId };
    this.bikesService.updateUndockCommandHistory(cmdHistoryDet).subscribe(res => {
    }, err => {

    });
  }

  resetUndockFailureCountByBike() {
    this.bikesService.resetUndockFailureCountByBike(this.bikeId)
      .subscribe(data => {
      }, error => {
      });
  }

  openRepairRegistrationPopup() {
    if (this.userWorkshopId) {
      const dialogRef = this.dialog.open(RepairRegisterFormPopupComponent, {
        width: '1000px',
        height: '2000px',
        data: {
          'driveTrain': this.driveTrain,
          'light': this.light,
          'dockingComponents': this.dockingComponents,
          'pedalArm': this.pedalArm,
          'seat': this.seat,
          'cables': this.cables,
          'mudguards': this.mudguards,
          'handlebarComponents': this.handlebarComponents,
          'pcb': this.pcb,
          'brakeSystem': this.brakeSystem,
          'wheels': this.wheels,
          'otherComponents': this.otherComponents,
          'bike': this.bike,
          'bikeId': this.bike.BikeId,
          'isStreetTeam': true,
          'userWorkshopId': this.userWorkshopId,
          'isStreetTeamMap': true
        },
        autoFocus: false
      });
      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          var dialogMsg = "LIVE_MAP.MESSAGES.BIKE_IS_FULLY_OK_OR_NOT";
          const dialogRef = this.dialog.open(ConfirmDialogComponent, {
            width: '415px',
            data: { message: dialogMsg, okayText: "Yes", cancelText: "No" }
          });
          dialogRef.afterClosed().subscribe(confirmRes => {
            if (confirmRes) {
              this.isDocked = true;
              if (this.dockingStationId) {
                if (this.routeId) {
                  const url = this
                    .router
                    .createUrlTree([{ general: 1, stationId: this.dockingStationId, routeId: this.routeId }], { relativeTo: this.route })
                    .toString();
                  this.location.go(url);
                } else {
                  const url = this
                    .router
                    .createUrlTree([{ general: 1, stationId: this.dockingStationId }], { relativeTo: this.route })
                    .toString();
                  this.location.go(url);
                }
              }
              else {
                if (this.routeId) {
                  const url = this
                    .router
                    .createUrlTree([{ routeId: this.routeId }], { relativeTo: this.route })
                    .toString();
                  this.location.go(url);
                } else {
                  const url = this
                    .router
                    .createUrlTree([], { relativeTo: this.route })
                    .toString();
                  this.location.go(url);
                }
                this.isServiceOpened = false;
              }

              //added this flag to handle auto refresh of bike details
              this.ServiceCompleted = true;
              this.bike.isCheckCompleted = true;
              this.bike.isCancelled = false;
              this.bike.Disabled = true;
              this.bike.DisableState = BikeDisableState.RepairFinished;
              this.bike["BikeStatus"] = BikeStatus.RepairFinished;
              let bikeStateChangeDTO = { Disabled: true, DisabledReason: BikeDisableState.RepairFinished };
              this.DisableBike(bikeStateChangeDTO);

              //bike service details create or update
              var bikeServiceDTO = { NumberOfChecks: this.bike.NumberOfChecks, BikeId: this.bikeId }
              this.CreateOrUpdateBikeService(bikeServiceDTO);

              if (this.bike.Resolved > 0) {
                this.ResolveIssuePerBike(this.bikeId);
                this.bikeIssues = [];
              }

              if (this.enableRoutes) {
                //creation waypoint action
                let details = `Bike ${this.bike["VisualId"]} repaired in street and ready for rental after distribution`;
                this.createWayPointAction(details);
              }
            }
            else {
              this.RepairRequiredForBike();
            }
            this.clearWorkshopRepairCategories();
          });
        }
        else {
          this.clearWorkshopRepairCategories();
        }
      });
    }
    else {
      this.loggerService.showWarningMessage("Please set user privilege before proceeding with repair registration");
    }
  }

  loadRepairRegisterCategories() {
    this.repairService.GetAllWorkshopCategories().subscribe(data => {
      this.driveTrain = data.driveTrain;
      this.light = data.light;
      this.dockingComponents = data.dockingComponents;
      this.pedalArm = data.pedalArm;
      this.seat = data.seat;
      this.cables = data.cables;
      this.mudguards = data.mudguards;
      this.handlebarComponents = data.handlebarComponents;
      this.pcb = data.pcb;
      this.brakeSystem = data.brakeSystem;
      this.wheels = data.wheels;
      this.otherComponents = data.otherComponents;
    }, error => {
      this.loggerService.showErrorMessage(error);
    });
  }

  clearWorkshopRepairCategories() {
    this.driveTrain.map(x => this.resetWorkshopRepairCategories(x));
    this.light.map(x => this.resetWorkshopRepairCategories(x));
    this.dockingComponents.map(x => this.resetWorkshopRepairCategories(x));
    this.pedalArm.map(x => this.resetWorkshopRepairCategories(x));
    this.seat.map(x => this.resetWorkshopRepairCategories(x));
    this.cables.map(x => this.resetWorkshopRepairCategories(x));
    this.mudguards.map(x => this.resetWorkshopRepairCategories(x));
    this.handlebarComponents.map(x => this.resetWorkshopRepairCategories(x));
    this.pcb.map(x => this.resetWorkshopRepairCategories(x));
    this.brakeSystem.map(x => this.resetWorkshopRepairCategories(x));
    this.wheels.map(x => this.resetWorkshopRepairCategories(x));
    this.otherComponents.map(x => this.resetWorkshopRepairCategories(x));
  }

  resetWorkshopRepairCategories(data) {
    data.Result = false;
    data.selectedVariant = null
    return;
  }

  private routeStyleFunction(feature: OlFeature, resolution) {
    const geometry = feature.getGeometry();
    const mid = geometry.getCoordinateAt(0.5);
    const styles = [
      // linestring
      new OlStyle({
        stroke: new OlStroke({
          //color: '#ffcc33',
          color: '#6236BA',
          width: 3
        }),
      }),
    ];

    geometry.forEachSegment((start, end) => {
      const dx = end[0] - start[0];
      const dy = end[1] - start[1];
      const rotation = Math.atan2(dy, dx);
      // arrows
      styles.push(
        new OlStyle({
          geometry: new OlPoint(mid),
          image: new OlIcon({
            src: '/assets/images/map-icons/right-arrow-purple.svg',
            anchor: [0.5, 0.5],
            rotateWithView: true,
            rotation: -rotation
          }),
        })
      );
    });

    return styles;
  };

  private loadRoutePaths() {
    let storageAndWorkshopPoints = [];
    let positions = this.routePath?.Waypoints?.flatMap(wp => {
      if (wp?.Position && wp?.Position?.Longitude && wp?.Position?.Latitude) {
        if (wp?.StorageId || wp?.WorkshopId) {
          storageAndWorkshopPoints.push(wp);
        }
        return [wp.Position];
      }
      else {
        return []; // skip waypoints with positions
      }
    });

    if (positions?.length >= 2) { //draw route path with two or more waypoints
      let routePoints: number[][] = positions.map(pos => {
        return [pos.Longitude, pos.Latitude];
      });
      this.createRouteFeature(routePoints);
    }
    if (storageAndWorkshopPoints) {
      this.createWaypointFeature(storageAndWorkshopPoints);
    }
  }

  private createRouteFeature(routePoints: number[][]) {
    let routeLayerSource = this.routeLayer.getSource();
    let j
    for (j = 0; j < routePoints.length - 1; j++) {
      //data: property can be added route feature
      let routeFeature = new OlFeature({
        name: this.routeId,
        geometry: new OlLineString([routePoints[j], routePoints[j + 1]]).transform('EPSG:4326', 'EPSG:3857'),
        type: "route"
      });
      routeLayerSource.addFeature(routeFeature);
    }

    if (this.nextWaypointId == 0) {
      //forcus street route in the map
      let coordinates = []
      coordinates.push(routePoints);
      let polygon = new OlPolygon(coordinates).transform('EPSG:4326', 'EPSG:3857');
      this.view.fit(polygon, { duration: 5 });

    } else {
      this.focusNextWaypoint(this.nextWaypointId);
    }
  }

  private createWaypointFeature(waypoint: any) {
    let wayPointLayerSource = this.wayPointLayer.getSource();

    waypoint?.forEach(wp => {
      let wayPointIcon = "";
      let wayPointName = ""
      let wayPointId = ""
      if (wp?.StorageId) {
        if (wp?.CompletedDate && !wp?.IsSkipped)
          wayPointIcon = "/assets/images/insight-icons/storage-completed.svg";
        else if (wp?.CompletedDate && wp?.IsSkipped)
          wayPointIcon = "/assets/images/insight-icons/storage-skip.svg";
        else
          wayPointIcon = "/assets/images/insight-icons/storage-default.svg";
        wayPointName = wp.StorageName;
        wayPointId = `s-${wp?.StorageId}`;
      }
      else if (wp?.WorkshopId) {
        if (wp?.CompletedDate && !wp?.IsSkipped)
          wayPointIcon = "/assets/images/insight-icons/workshop-completed.svg";
        else if (wp?.CompletedDate && wp?.IsSkipped)
          wayPointIcon = "/assets/images/insight-icons/workshop-skip.svg";
        else
          wayPointIcon = "/assets/images/insight-icons/workshop-default.svg";
        wayPointName = wp.WorkshopName;
        wayPointId = `w-${wp?.WorkshopId}`;
      }
      let data = {
        "waypointIcon": wayPointIcon,
        "workshopId": wp.WorkshopId,
        "storageId": wp.StorageId,
        "completedDate": wp.CompletedDate
      }
      let wayPointFeature = new OlFeature({
        name: wayPointName,
        geometry: new OlPoint([wp.Position.Longitude, wp.Position.Latitude]).transform('EPSG:4326', 'EPSG:3857'),
        data: data,
        type: "waypoint"
      });
      wayPointFeature.setId(wayPointId);
      wayPointLayerSource.addFeature(wayPointFeature);
    });
  }

  createWayPointAction(details: any) {

    if (this.dockingStationId)
      this.bikeId = null;

    let waypointActionObj = {
      "AssignedOn": this.loggedInUser.UserId,
      "DockingStationId": this.dockingStationId,
      "BikeId": this.bikeId,
      "WorkshopId": null,
      "StorageId": null,
      "Details": details
    }
    this.routeService.createWaypointAction(waypointActionObj).subscribe(res => {

    }, err => {

    });
  }

  private wayPointStyleFunction(feature: OlFeature, resolution) {
    let data = feature.get("data");
    let styles = new OlStyle({
      image: new OlIcon(({
        src: data["waypointIcon"],
        rotation: 0,
        rotateWithView: true,
        scale: 1.2
      })),
      text: new OlText({
        font: `bold 11px Roboto, "Helvetica Neue", sans-serif`,
        offsetX: 18, //0
        offsetY: -15, // 0
        textAlign: 'left',
        placement: 'point',
        fill: new OlFill({
          color: "#000"
        }),
        stroke: new OlStroke({
          color: "#FFF",
          width: 2
        })
      })
    });
    styles.getText().setText(resolution < 19 ? feature.get("name") : "");
    if (resolution > 19) {
      styles.getImage().setScale(0.7);
    }
    return styles;
  };

  checkForWaypointOnDSOrBikes() {
    this.isWaypoint = false;
    this.isCompletedOrSkipped = false;
    this.isRouteStatus = false;
    if (this.routePath) {
      if (this.dockingStationId)
        this.bikeId = null;
      if (this.routePath.Status == RouteStatus.Ongoing)
        this.isRouteStatus = true;
      let waypoints = this.routePath?.Waypoints.filter(w => (w.DockingStationId && w.DockingStationId == this.dockingStationId) ||
        (w.BikeId && w.BikeId == this.bikeId));
      if (waypoints.length > 0) {
        this.isWaypoint = true;
        if (waypoints.some(wx => !wx.CompletedDate))
          this.isCompletedOrSkipped = false;
        else if (waypoints.some(wx => wx.CompletedDate))
          this.isCompletedOrSkipped = true;
      }
    }
    else if (this.routeId) {
      //this code is only executed when page refreshed with dock view from route map
      setTimeout(() => this.checkForWaypointOnDSOrBikes(), 700);
    }
  }

  updateWaypoint(isSkipped) {
    const dialogAddWaypoint = this.dialog.open(WaypointUpdatePopupComponent, {
      width: '400px',
      // disableClose: true
    });

    dialogAddWaypoint.afterClosed().subscribe(result => {
      if (result) {
        if (this.dockingStationId)
          this.bikeId = null;
        let waypointUpdateObj = {
          "AssignedOn": this.loggedInUser.UserId,
          "DockingStationId": this.dockingStationId,
          "BikeId": this.bikeId,
          "IsSkipped": isSkipped,
          "Comment": result["comment"]
        };
        this.routeService.updateWaypointByAssignedOn(waypointUpdateObj).subscribe(res => {
          const url = this
            .router
            .createUrlTree([{ routeId: this.routeId }], { relativeTo: this.route })
            .toString();
          this.location.go(url);
          this.isOpened = false;

          if (res) {
            //refocus to next waypoint
            let waypointId = 0;
            if (this.bikeId) {
              waypointId = this.bikeId;
            }
            else if (this.dockingStationId) {
              waypointId = this.dockingStationId;
            }
            this.nextWaypointId = waypointId;
            this.focusNextWaypoint(waypointId);
          }
        }, err => {
          if (isSkipped)
            this.loggerService.showErrorMessage("Error while skipping waypoint");
          else
            this.loggerService.showErrorMessage("Error while completing waypoint");
        });
      }
    });

  }

  addWaypoint() {
    if (this.dockingStationId)
      this.bikeId = null;
    let waypointDto = {
      "RouteId": this.routeId,
      "DockingStationId": this.dockingStationId,
      "BikeId": this.bikeId
    };
    this.routeService.addWaypoint(this.routeId, waypointDto).subscribe(res => {
      this.RefreshMapWithContent();
      setTimeout(() => {
        this.isWaypoint = true;
        this.isCompletedOrSkipped = false;
      }, 1000);
    }, err => {
      this.loggerService.showErrorMessage("Error while adding waypoint to the ongoing route");
    });
  }

  private focusNextWaypoint(waypointId: number): void {
    if (waypointId == 0)
      return;
    //get route index
    let currentWaypoint = this.routePath?.Waypoints?.find((w) => w.DockingStationId === waypointId || w.BikeId === waypointId || w.WorkshopId === waypointId || w.StorageId === waypointId);
    if (currentWaypoint) {
      let nextWaypoint = this.routePath?.Waypoints?.find((w) => w.Order > currentWaypoint.Order && w.CompletedDate == null);
      if (nextWaypoint) {
        let nextPosition = [nextWaypoint?.Position?.Longitude, nextWaypoint?.Position?.Latitude];
        let projectedPoint = new OlPoint(nextPosition).transform('EPSG:4326', 'EPSG:3857');
        this.view.setCenter(projectedPoint.getCoordinates());
        this.scaleUpNextWaypoint(nextWaypoint);
      }
    }
  }

  private scaleUpNextWaypoint(nextWaypoint: any) {
    if (nextWaypoint?.BikeId) {
      let bikeFeatuere = this.source.getFeatureById(nextWaypoint.BikeId);
      if (bikeFeatuere) {
        let style = this.styleFunction(bikeFeatuere, 10);
        style.getImage().setScale(2);
        style.getText().setText(bikeFeatuere.get("name"));
        bikeFeatuere.setStyle(style);
      }

    }
    else if (nextWaypoint?.DockingStationId) {
      let dockSource = this.dockLayer.getSource();
      let dockFeaure = dockSource.getFeatureById(nextWaypoint.DockingStationId);
      if (dockFeaure) {
        let data = dockFeaure.get("data");
        let styles = MapExtension.getLargeDockingStationStyles(true, data, this.isMobileOnly);
        styles[1].getImage().setScale(2);
        let text = "";
        text = MapExtension.getFeatureName(dockFeaure);
        styles[1].getText().setText(text);
        dockFeaure.setStyle(styles);
      }
    }
    else if (nextWaypoint?.StorageId) {
      let wayPointLayerSource = this.wayPointLayer.getSource();
      let storageFeature = wayPointLayerSource.getFeatureById(`s-${nextWaypoint.StorageId}`);
      if (storageFeature) {
        let style = this.wayPointStyleFunction(storageFeature, 10);
        style.getImage().setScale(2);
        storageFeature.setStyle(style);
      }
    }
    else if (nextWaypoint?.WorkshopId) {
      let wayPointLayerSource = this.wayPointLayer.getSource();
      let workshopFeature = wayPointLayerSource.getFeatureById(`w-${nextWaypoint.WorkshopId}`);
      if (workshopFeature) {
        let style = this.wayPointStyleFunction(workshopFeature, 10);
        style.getImage().setScale(2);
        workshopFeature.setStyle(style);
      }
    }
  }

  checkDock() {
    this.dsLoading = true;
    this.spinner.show();
    this.stationService.checkDockingStation(this.dockingStationId).subscribe(res => {
      this.loggerService.showSuccessfulMessage("Docking station has been successfully checked");
      let checkedUser = `${this.loggedInUser["FirstName"]} ${this.loggedInUser["LastName"]}`;
      this.dsLastCheckDetails = `${this.formatReportErrorTimeDuration(res["LastCheckedDate"])} - ${checkedUser}`;
      this.spinner.hide();
      this.dsLoading = false;
    }, err => {
      this.loggerService.showErrorMessage("Error while checking docking station");
      this.spinner.hide();
      this.dsLoading = false;
    });
  }

  getAllFilteredLatestZoneBikeDemandInfo() {
    let timeZone = "UTC";
    if (this.preferredZone == "CET")
      timeZone = "CET";
    this.allZones = [];
    this.zonesService.getFilteredLatestZoneBikeDemandInfo(timeZone).subscribe(data => {
      if (data) {
        let zoneData = this.getMappedZoneData(data);
        this.allZones = zoneData;
        this.loadZones(zoneData);
      }
    }, error => {

    });
  }

  getMappedZoneData(data: any) {
    return data.map(zone => {
      const predictionForHour = zone.demandPredictions?.find(prediction => prediction.hour === PREDICT_HOUR);
      return {
        id: zone.id,
        serial: zone.serial,
        name: zone.name,
        geometry: zone.geometry,
        colour: zone.colour,
        center: zone.center,
        totalBikes: zone.totalBikes,
        predictedBike: predictionForHour ? predictionForHour.predictedBike : 0
      };
    });
  }


}
