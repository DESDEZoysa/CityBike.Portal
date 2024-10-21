
import { forkJoin as observableForkJoin, Observable } from 'rxjs';
import { StorageService } from './../../services/storage.service';
import { BikeModeFilter } from './../../core/enums/bikeModeFilter';
import { BikeModes } from './../../core/enums/bikeModes';
import { SignalRService } from './../../services/signalr.service';
import { CommonHandler } from './../../core/handlers/common-handler';
import { Component, OnInit, ViewChild, ElementRef, Renderer2 } from '@angular/core';
import { BikesService, LoggerService, SettingsService, AppSettings, DockingStationService, RepairService, IssueService } from "../../services";
import { Router, ActivatedRoute } from "@angular/router";
import "rxjs/add/observable/forkJoin";
import "rxjs/add/observable/interval";
import * as moment from "moment";
import OlMap from "ol/map";
import OlVector from "ol/source/vector";
import OlXYZ from "ol/source/xyz";
import OlTileLayer from "ol/layer/tile";
import OlVectorLayer from "ol/layer/vector";
import OlView from "ol/view";
import OlProj from "ol/proj";
import OlFeature from "ol/feature";
import OlPoint from "ol/geom/point";
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
import PinchZoom from "ol/interaction/pinchzoom";
import { BikeStatusColor } from "../../core/constants/bike-status-color";
import { AddressExtension, DockingStationExtension, MapExtension } from "../../core/extensions";
import { NgxSpinnerService } from "ngx-spinner";
import { StationColors, LocalStorageKeys } from "../../core/constants";
import { BikeDisableState } from "../../core/enums/bikeDisableState";
import { MatDialog } from "@angular/material/dialog";
import { BikeStatus } from "../../core/enums/bikeStatus";
import { LockState } from "../../core/enums/lockState";
import { UserRoles } from "../../core/constants/user-roles";
import { getLocaleDateTimeFormat, Location } from '@angular/common';
import { ReportErrorComponent } from "../../bikes/bike-support/report-error/report-error.component";
import { TranslateService, LangChangeEvent } from "@ngx-translate/core";
import { TranslateMessageTypes } from '../../core/enums/TranslateMessageTypes';
import Geolocation from "ol/geolocation";
import { CommonService } from '../../services/common-service';
import { EventService } from '../../services/events.service';
import { UserService } from '../../services/users.service';
import { WorkshopService } from '../../services/workshop.service';
import { CarBikeDetailsPopupComponent } from '../../shared/car-bike-details-popup/car-bike-details-popup.component';
import { SignalRSubscriber } from '../../core/models/live/signalr-subscriber';
import { WorkshopSelectionPopupComponent } from '../../shared/workshop-selection-popup/workshop-selection-popup.component';
import { DeliverWorkshopPopupComponent } from '../../shared/deliver-workshop-popup/deliver-workshop-popup.component';
import { RepairRegisterPopupComponent } from '../../bikes/bike-support/repair-register-popup/repair-register-popup.component';
import { LiveMapConfirmPopupComponent } from '../../shared/live-map-confirm-popup/live-map-confirm-popup.component';
import { FreeBikePopupComponent } from '../../shared/free-bike-popup/free-bike-popup.component';
import { DockingStation } from '../../core/models';
import { RepairOrdersService } from '../../services/repair-orders.service';
import { ConvertTimePipe } from '../../core/pipes/convert-time.pipe';
import { DashboardBikeFilter } from '../../core/constants/dashboard-filter';
import { DockingPointDisabledReason } from '../../core/enums/dockingPointDisabledReason';
import { DockingPointErrorReportPopupComponent } from '../../shared/docking-point-error-report-popup/docking-point-error-report-popup.component';
import { ConfirmationDpCheckPopupComponent } from '../../shared/confirmation-dp-check-popup/confirmation-dp-check-popup.component';
import { DockingPointDetailsPopupComponent } from '../../shared/docking-point-details-popup/docking-point-details-popup.component';
import { DashboardDPFilter } from '../../core/constants/dashboard-dp-filter';
import { RepairRegisterFormPopupComponent } from '../../bikes/bike-details/repair-register-form-popup/repair-register-form-popup.component';
import { PowerState } from '../../core/enums/powerState';
import { BikesSumOperatonalDialogPopupComponent } from '../../shared/bikes-sum-operatonal-dialog-popup/bikes-sum-operatonal-dialog-popup.component';

@Component({
  selector: 'app-dashboard-filter-map',
  templateUrl: './dashboard-filter-map.component.html',
  styleUrls: ['./dashboard-filter-map.component.scss'],
  providers: [ConvertTimePipe]
})
export class DashboardFilterMapComponent implements OnInit {
  @ViewChild("trackmap", { static: true }) mapElement: ElementRef;
  @ViewChild("popup", { static: true }) popupElement: ElementRef;
  @ViewChild("marker", { static: false }) marker: ElementRef;
  private markertxtsingle: ElementRef;

  map: OlMap;
  //source: OlXYZ;
  layer: OlVectorLayer;
  dockLayer: OlVectorLayer;
  style: OlStyle;
  popup: OlOverlay;
  onClick: OlSelect;
  lastExtent: any;
  scaleMap: boolean = false;
  showlegend = false;
  selectedMap: any;
  isMobile: boolean = false;

  vectorLayers: OlVectorLayer[];
  docks = [];
  source: any;
  filteredBikes: any[];
  loggedInUser: any;
  bikeModeId: any;
  isStreetTeam: boolean;
  isSideNavOpened: boolean;
  count: any;
  bikeId: any;
  isStorage: boolean;
  isTransportation: boolean;
  isPlaceFree: boolean;
  isToWorkshop: any;
  isCarChecking: boolean;
  transportBikes: any;
  isLoading: boolean;
  userRole: any;
  carTranportObj: any;
  isLockState: boolean;
  allWorkshops: any[];
  allNearbyWorkshops: any[];
  bike: any;
  bikeIssues: any[];
  checkedCategories: any[];
  selectedErrorCategories: any;
  repairGroup1: any;
  repairGroup2: any;
  repairgroup3: any;
  disableBike: any;
  otherFell: any;
  otherCritical: any;
  comments: any;
  group1: any;
  group2: any;
  group3: any;
  bikePositions: any;
  isChecking: any;
  isDocked: any;
  isFilterLoading: boolean = false;
  carSource: any;
  geoLayer: any;
  view: any;
  geolocationTimerId: any;
  allUserPositions: any;
  nearByWorkshopTimerId: any;
  isDockViewOpened: boolean;
  dockingStationBikes: any[];
  selectedElem: any;
  allDockingStations: DockingStation[];
  dockingStationName: any;
  numberOfAvailableBikes: any;
  idealBikes: any;
  dockingStationId: any;
  isDockLoading: boolean;
  selectedFeature: any;
  dockSmallLayer: any;
  isFilterMenuOpen: boolean = false;
  checkedWorkshops: any[];
  checkedStorages: any[];
  allFilterBikes: any;
  selectedStorageId: any;
  allStorages: any[];
  isMobileOnly: boolean = false;
  showMapOptions: boolean;
  bikeMap: boolean = true;
  dockMap: boolean = true;
  bikeChangeFilters: any[];
  dsViewLoaded: boolean = false;
  dockingStationStats: any[];
  dsModeId: any;
  statsCount: any;
  dockFilterOptions: any[];
  allActiveDPErrReps: any;
  alldockingStationStats: any;
  allActiveErrorDetails: any;
  userWorkshopId: any;
  isAdmin: boolean;

  @ViewChild("markertxtsingle", { static: false }) set markertxtSingleRef(markertxtsingle: ElementRef) {
    this.markertxtsingle = markertxtsingle;
  }
  private markertxt2single: ElementRef;
  @ViewChild("markertxt2single", { static: false }) set markertxt2SingleReg(markertxt2single: ElementRef) {
    this.markertxt2single = markertxt2single;
  }

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

  constructor(private bikesService: BikesService,
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
    private eventService: EventService, private userService: UserService, private workshopService: WorkshopService,
    private commonService: CommonService, private signalRService: SignalRService,
    private repairOrderService: RepairOrdersService,
    private storageService: StorageService,
    private convertTime: ConvertTimePipe) {
    if (
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      )
    ) {
      this.isMobile = true;
    }

    if (/Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    )) {
      this.isMobileOnly = true;
    }
    this.filteredBikes = [];
    this.dsViewLoaded = false;
    this.bikeModeId = route.snapshot.params['id'];
    this.dsModeId = route.snapshot.params['dsModeId'];

    this.isSideNavOpened = false;
    this.transportBikes = [];
    this.allWorkshops = [];
    this.allNearbyWorkshops = [];
    this.repairGroup1 = [];
    this.repairGroup2 = [];
    this.repairgroup3 = [];
    this.selectedErrorCategories = [];
    this.group1 = [];
    this.group2 = [];
    this.group3 = [];
    this.bikePositions = [];
    this.isFilterLoading = false;
    this.allUserPositions = [];
    this.dockingStationBikes = [];
    this.isDockViewOpened = false;
    this.isDockLoading = false;
    this.checkedWorkshops = [];
    this.checkedStorages = [];

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
  }

  ngOnInit() {
    this.isFilterLoading = true;
    this.signalRService.startConnection();
    //signalR message received
    this.signalRService.signalReceived.subscribe((signal: SignalRSubscriber) => {
      if (signal.id == 450 && !signal.value) {
        this.GetBikePCBOnTakenOut(signal.bike);
      }
    });

    this.arrangeFilterOptions(DashboardBikeFilter);
    this.arrangeDPFilterOptions(DashboardDPFilter);
    this.initializeMap();
    this.loggedInUser = JSON.parse(localStorage.getItem("user_details"));
    this.userRole = this.GetUserRole();
    if (!this.dsModeId) {
      this.CheckForStreetTeamRole(this.userRole);
      if (this.bikeModeId == BikeModeFilter.DisabledOffline)
        this.GetBikesIssueFilterByBikeMode();
      else
        this.GetBikesByBikeMode();

      this.GetBikesInCar();
      this.loadErrorCategories();
      this.loadRepairCategories();

      //get all storages
      this.getAllStorages();
      // get all workshops
      this.GetAllWorkshops();
    }
    else if (this.dsModeId) {
      //get all docking station statistics by ds mode
      this.getDockingStationStatsByDockingStationMode();
    }

    this.translate.onLangChange.subscribe((params: LangChangeEvent) => {
      if (!this.dsModeId) {
        this.translateAllCategories();
        this.translateAllRepairCategories();
      }
      else if (this.dsModeId) {
        if (this.dockingStationStats && this.dockingStationStats.length > 0) {
          this.dockingStationStats.map(ds => ds.DockingPoints.map(dockingPoint => this.translateDPState(dockingPoint, ds)));
        }
      }
    });
    this.getAllDPErrorCategories();
    this.loadRepairRegisterCategories();
    if (this.userRole == UserRoles.STREET_TEAM) {
      this.getUserPrivilegeDetails(this.loggedInUser.UserId);
    }
  }

  getUserPrivilegeDetails(userId) {
    this.userService.getUserPrivilegeByUser(userId).subscribe(res => {
      this.userWorkshopId = res["WorkshopId"];
    }, err => {

    });
  }

  arrangeFilterOptions(dashboardBikeFilters) {
    var arrangedDashboardBikeFilters = [];
    for (var bikeFilter in dashboardBikeFilters) {
      let arrangedDashboardBikeFilter = { value: dashboardBikeFilters[bikeFilter], viewValue: "DASHBOARD." + bikeFilter }
      arrangedDashboardBikeFilters.push(arrangedDashboardBikeFilter);
    }
    if (this.bikeModeId == BikeModes.PriorityBikes) {
      //if the selected bikeMode is priority bike mode, omit "Changed Last Week" option
      arrangedDashboardBikeFilters = arrangedDashboardBikeFilters.filter(x => x.value != 4);
    } else {
      //if the selected bikeMode is not priority bike mode, show all options except value is greater than 4
      arrangedDashboardBikeFilters = arrangedDashboardBikeFilters.filter(x => x.value < 5);
    }
    this.bikeChangeFilters = arrangedDashboardBikeFilters;

  }

  arrangeDPFilterOptions(dashboardDPFilters) {
    var arrangedDashboardDPFilters = [];
    for (var dpFilter in dashboardDPFilters) {
      let arrangedDashboardDPFilter = { value: dashboardDPFilters[dpFilter], viewValue: "DASHBOARD." + dpFilter }
      arrangedDashboardDPFilters.push(arrangedDashboardDPFilter);
    }

    this.dockFilterOptions = arrangedDashboardDPFilters;

  }

  ngOnChanges() {
    if (this.count > 0) {
      // this.cleanMap();
    }
    if (this.layer) {
      this.setCurrentExtent();
    }
  }

  ngOnDestroy() {
    //unsubscribe and close when leaving the page
    this.filteredBikes.forEach(bike => {
      this.signalRService.UnSubscribeConnection(bike.Serial);
    });
    this.signalRService.stopConnection();
    clearInterval(this.geolocationTimerId);
    clearInterval(this.nearByWorkshopTimerId);
  }

  initializeMap() {
    let existsZoomLevel = this.settingsService.getLiveMapZoomLevel();
    let mapZoomLevel = existsZoomLevel ? Number(existsZoomLevel) : 3;

    this.source = new OlVector({});
    this.carSource = new OlVector({});
    this.layer = new OlVectorLayer({
      style: (f, r) => this.styleFunction(f, r),
      source: this.source
    });

    this.geoLayer = new OlVectorLayer({
      // style: (f, r) => this.styleLabelFunction(f, r),
      source: this.carSource
    });

    this.dockLayer = new OlVectorLayer({
      style: (f, r) => this.styleDockFunction(f, r),
      source: new OlVector({})
    });

    this.dockSmallLayer = new OlVectorLayer({
      style: (f, r) => this.styleSmallDockFunction(f, r),
      source: new OlVector({})
    });

    let tileLayer = new OlTileLayer({
      source: new OlXYZ({
        crossOrigin: null,
        url:
          "https://cartodb-basemaps-{a-c}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png"
      })
    });

    this.view = new OlView({
      center: OlProj.fromLonLat(this.appSettings.map_center_position),
      zoom: mapZoomLevel,
      minZoom: 3,
      maxZoom: 22
    });

    this.map = new OlMap({
      interactions: OlInteraction.defaults().extend([new PinchZoom()]),
      layers: [tileLayer, this.dockLayer, this.dockSmallLayer, this.layer, this.geoLayer],
      view: this.view
    });

    this.map.on(
      "singleclick",
      function (event) {
        //if showMapOptions opened close
        if (this.showMapOptions)
          this.showMapOptions = false;

        if (!this.dockingStationId) {
          this.isDockViewOpened = false;
          this.isSideNavOpened = false;
        }
        this.dockingStationId = null;
      }.bind(this));
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

    // if (this.map) this.adjustLayers(this.selectedMap);

    this.map.setTarget(this.mapElement.nativeElement);
    // this.setCurrentExtent(); // temporarily commented
  }

  loadDocks(stations: DockingStation[]) {
    for (let station of stations) {
      this.addDockingStation(station, false);
    }
  }

  // public addDockingStation(
  //   station: DockingStation,
  //   centerToPoint: boolean = true
  // ): void {
  //   let point = [station.Position.Longitude, station.Position.Latitude];
  //   let projectedPoint = OlProj.fromLonLat(point);
  //   station.AddressStr = DockingStationExtension.GetAddress(station.Address);
  //   let areaFeature = this.getDockingStationAreaFeature(station);
  //   let data = areaFeature.get("data");
  //   let tickFeature = this.getTickStationAreaFeature(station);
  //   let tickData = tickFeature.get("data");
  //   let color = MapExtension.getStationFeatureColor(tickData);
  //   let dockSource = this.dockLayer.getSource();
  //   let bikeCount = this.getAvailableBikeCount(data);
  //   let bikeCountSpan;
  //   if (bikeCount > 0) {
  //     bikeCountSpan = `${bikeCount}+`;
  //     color = "rgba(0,128,0,1)";
  //   } else if (bikeCount == 0) {
  //     color = "rgba(0,128,0,1)";
  //     bikeCountSpan =
  //       '<span class="material-icons" style="font-size: 11px;">done</span>';
  //   } else if (bikeCount < 0 && color == StationColors.IDEAL_BIKES) {
  //     bikeCountSpan = `${Math.abs(bikeCount)}-`;
  //     color = StationColors.GREY_BIKES;
  //   } else if (bikeCount < 0 && color == StationColors.MINIMUM_BIKES) {
  //     bikeCountSpan = `${Math.abs(bikeCount)}-`;
  //     color = StationColors.GREY_BIKES;
  //   }

  //   dockSource.addFeature(areaFeature);
  //   this.createMarker(
  //     projectedPoint,
  //     data.TotalNumberOfBikes.toString(),
  //     data.StationStatus,
  //     bikeCountSpan,
  //     color,
  //     station.DockingStationId
  //   );
  //   if (centerToPoint) {
  //     this.map.getView().setCenter(projectedPoint);
  //   }
  // }

  public addDockingStation(
    station: DockingStation,
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
    // this.createMarker(
    //   projectedPoint,
    //   data.TotalNumberOfBikes.toString(),
    //   data.StationStatus,
    //   bikeCountSpan,
    //   color,
    //   station.DockingStationId
    // );
    if (centerToPoint) {
      this.map.getView().setCenter(projectedPoint);
    }
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
      element: elem
    });
    this.map.addOverlay(marker);

    let router = this.router;
    let stationId;
    elem.querySelector("#marker-txt").addEventListener(
      "click",
      function (event) {
        let dockingStationInfo = this.allDockingStations.find(x => x.DockingStationId == dockingStationId);
        this.dockingStationName = dockingStationInfo.Name;
        this.numberOfAvailableBikes = dockingStationInfo.NumberOfAvailableBikes;
        this.idealBikes = dockingStationInfo.IdealNumberOfBikes;
        // this.spinner.show();
        this.isDockLoading = true;
        this.dockingStationBikes = this.filteredBikes.filter(x => x.DockingStationId == dockingStationId);
        this.isDockViewOpened = true;
        this.isSideNavOpened = true;
        this.selectedElem = elem;
        event.preventDefault();
        stationId = elem.querySelector("#docking-station").innerHTML;
        this.dockingStationId = stationId;
        var authToken = JSON.parse(
          localStorage.getItem(LocalStorageKeys.OAUTH_TOKEN)
        );
        this.getDockingStationDetails(stationId, elem);

        if (authToken._claims[0] != UserRoles.CUSTOMER) {
          // this.getDockingStationDetails(stationId, true);
        } else router.navigate([`/dockingStations/${stationId}/dockingpoints`]);
      }.bind(this)
    );
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
        let features = event.target.getFeatures().getArray();
        let feature = features[0];
        let data = feature.get("data");
        let type = feature.get("type");
        if (type == "bike") {
          var authToken = JSON.parse(
            localStorage.getItem(LocalStorageKeys.OAUTH_TOKEN)
          );
          let userRole = authToken._claims[0];
          if (userRole != UserRoles.CUSTOMER) {
            let freeBike = this.filteredBikes.find(x => x.BikeId == parseInt(data.BikeId));
            this.OpenDialogForDockedBike(freeBike.BikeId, freeBike, false);
          }
          else {
            this.router.navigate([`/bikes/${data.BikeId}/details`]);
          }
        }
        else if (type == "dock" || type == "small-dock") {
          let dockingStationInfo = this.allDockingStations.find(x => x.DockingStationId == data["DockingStationId"]);
          this.dockingStationName = dockingStationInfo.Name;
          this.numberOfAvailableBikes = dockingStationInfo.NumberOfAvailableBikes;
          this.idealBikes = dockingStationInfo.IdealNumberOfBikes;
          // this.spinner.show();
          this.isDockLoading = true;
          this.dockingStationBikes = this.filteredBikes.filter(x => x.DockingStationId == data["DockingStationId"]);
          this.isDockViewOpened = true;
          this.isSideNavOpened = true;
          this.selectedElem = data;
          this.dockingStationId = data["DockingStationId"];
          var authToken = JSON.parse(
            localStorage.getItem(LocalStorageKeys.OAUTH_TOKEN)
          );
          this.getDockingStationDetails(this.dockingStationId, data);

          if (authToken._claims[0] != UserRoles.CUSTOMER) {
            // this.getDockingStationDetails(stationId, true);
          } else this.router.navigate([`/dockingStations/${this.dockingStationId}/dockingpoints`]);
        }
      }
    });
    return select;
  }

  getOnHoverInteracion(): OlSelect {

    let select = new OlSelect({
      condition: OlCondition.pointerMove,
      style: (f, r) => this.interactionStyleFunction(f, r)
    });
    select.on('select', (event) => {
      if (event.selected.length > 0) {
        let features = event.target.getFeatures().getArray();
        let feature = features[0];
        let data = feature.get('data');
        let type = feature.get('type');

        // change cursor to pointer
        this.mapElement.nativeElement.style.cursor = 'pointer';
      }
      else if (event.deselected.length > 0) {
        // reset cursor
        this.mapElement.nativeElement.style.cursor = '';
      }
    });
    return select;
  }

  getViewUpdate(res) {
    res["StationStatus"] = this.getDockedBikeStatus(res.DockingStationId);
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
    setTimeout(() => {
      this.markertxtsingle.nativeElement.focus();
      this.markertxt2single.nativeElement.focus();
      // this.markertxtsingle.nativeElement.innerHTML = elem.querySelector(
      //   "#marker-txt"
      // ).innerHTML;
      // this.markertxtsingle.nativeElement.style.backgroundColor = elem.querySelector(
      //   "#marker-txt"
      // ).style.backgroundColor;
      // this.markertxt2single.nativeElement.innerHTML = elem.querySelector("#marker-txt2").innerHTML;
      // this.markertxt2single.nativeElement.style.backgroundColor = elem.querySelector("#marker-txt2").style.backgroundColor;
      // if (this.selectedElem) {
      //   this.selectedElem.querySelector("#marker-txt").innerHTML = this.markertxtsingle.nativeElement.innerHTML;
      //   this.selectedElem.querySelector("#marker-txt").style.backgroundColor = this.markertxtsingle.nativeElement.style.backgroundColor;
      //   this.selectedElem.querySelector("#marker-txt2").innerHTML = this.markertxt2single.nativeElement.innerHTML;
      //   this.selectedElem.querySelector("#marker-txt2").style.backgroundColor = this.markertxt2single.nativeElement.style.backgroundColor;
      // }
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
      this.isDockLoading = false;
    });
  }

  getDockingStationDetails(stationId, dockinstationDet = null): void {
    observableForkJoin(
      this.stationService.getDockingPointsForStation(stationId),
      this.stationService.getUndockedBikesInDockingStation(stationId)
    ).subscribe(
      result => {
        this.dockingStationBikes = [];
        var docPoints = result[0];
        this.dockingStationName = docPoints.Name;
        this.numberOfAvailableBikes = docPoints.NumberOfAvailableBikes;
        this.idealBikes = docPoints.IdealNumberOfBikes;
        var lockedBikes = result[1];
        if (docPoints) {
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
              x.Bike["ChargeLevel"] = x.Bike["CurrentChargeLevel"];
              x.Bike["DockingStationId"] = x.DockingStationId;
              x.Bike["DockingPointId"] = x.DockingPointId;
              x.Bike["IsCharging"] = (x.Bike["PowerState"] == PowerState.ChargingNormal) ? true : false;
              this.dockingStationBikes.push(x.Bike);
            }
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
            x["IsCharging"] = (x["PowerState"] == PowerState.ChargingNormal) ? true : false;
            this.dockingStationBikes.push(x);
          });
        }
        if (dockinstationDet)
          this.getViewUpdate(dockinstationDet);
      },
      error => {
        if (error.status == 403) {
          this.loggerService.showErrorMessage(
            "Don't have permission to obtain data"
          );
        } else {
        }
      }
    );
  }

  getDockingStationAreaFeature(station: DockingStation) {
    let polygonText = station.Geometry;
    polygonText = polygonText.substring(7);
    polygonText = polygonText
      .replace(/\(/g, "[")
      .replace(/\)/g, "]")
      .replace(/\,/g, "],[")
      .replace(/ /g, ",");
    let points = JSON.parse(polygonText);
    let point = [station.Position.Longitude, station.Position.Latitude];
    let polygon = new OlPoint(point);
    polygon.transform("EPSG:4326", "EPSG:3857");
    station.StationStatus = this.getDockedBikeStatus(station.DockingStationId);
    let dockData = station;
    let bikeCount = this.getAvailableBikeCount(dockData);
    dockData["bikeCount"] = bikeCount;
    if (bikeCount < 0) {
      if (dockData.StationStatus == StationColors.AVAILABLE_BIKES)
        dockData["dockIcon"] = "/assets/images/map-icons/black-dock-icon.svg";
      else if (dockData.StationStatus == StationColors.AVAILABLE_WITH_ERRORS)
        dockData["dockIcon"] = "/assets/images/map-icons/yellow-dock-icon.svg";
      else if (dockData.StationStatus == StationColors.AVAILABLE_WITH_DISABLED)
        dockData["dockIcon"] = "/assets/images/map-icons/red-dock-icon.svg";
    }
    else {
      if (dockData.StationStatus == StationColors.AVAILABLE_BIKES)
        dockData["dockIcon"] = "/assets/images/map-icons/black-dock-full-icon.svg";
      else if (dockData.StationStatus == StationColors.AVAILABLE_WITH_ERRORS)
        dockData["dockIcon"] = "/assets/images/map-icons/yellow-dock-full-icon.svg";
      else if (dockData.StationStatus == StationColors.AVAILABLE_WITH_DISABLED)
        dockData["dockIcon"] = "/assets/images/map-icons/red-dock-full-icon.svg";
    }

    this.generateSmallSquareCount(dockData, station);

    let feature = new OlFeature({
      name: dockData["TotalNumberOfBikes"].toString(),
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

  getSmallDockStationAreaFeature(station: DockingStation) {
    let color = MapExtension.getStationFeatureColor(station);
    let dockData = station;
    let point = [station.Position.Longitude, station.Position.Latitude];
    let bikeCount = this.getAvailableBikeCount(dockData);
    dockData["bikeCount"] = bikeCount;
    if (bikeCount > 0) {
      return;
      // dockData["bikeCountSpan"] = `${bikeCount}+`;
      // dockData["tickColor"] = "rgba(0,128,0,1)";
      // dockData["smallIcon"] = "/assets/images/map-icons/small-green-square.svg";
    } else if (bikeCount == 0) {
      return;
      // dockData["tickColor"] = "rgba(0,128,0,1)";
      // dockData["bikeCountSpan"] = "";
      // dockData["smallIcon"] = "/assets/images/map-icons/small-green-tick-square.svg";
    } else if (bikeCount < 0) {
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

  getAvailableBikeCount(data) {
    return data.NumberOfAvailableBikes == data.NumberOfPriorityReservations
      ? 0 : data.NumberOfAvailableBikes - data.NumberOfPriorityReservations;
    // : data.NumberOfAvailableBikes > data.NumberOfPriorityReservations
    //   ? data.NumberOfAvailableBikes - data.NumberOfPriorityReservations
    //   : data.NumberOfAvailableBikes - data.NumberOfPriorityReservations;
  }

  getDockedBikeStatus(dockingStationId) {
    let filteredBikes = this.filteredBikes.filter(
      x => x.DockingStationId == dockingStationId
    );
    let status = StationColors.AVAILABLE_BIKES;
    for (let bike in filteredBikes) {
      if (filteredBikes[bike].Disabled) {
        if (filteredBikes[bike].DisabledReason == BikeDisableState.CheckedNeedFix
          || (filteredBikes[bike].DisableState && filteredBikes[bike].DisableState == BikeDisableState.CheckedNeedFix)) {
          status = StationColors.CHECKED_NEEDS_REPAIR_BIKES;
          break;
        } else if ((filteredBikes[bike].DisabledReason && filteredBikes[bike].DisabledReason != BikeDisableState.WithStreetTeam)
          || (filteredBikes[bike].DisableState && filteredBikes[bike].DisableState != BikeDisableState.WithStreetTeam)) {
          status = StationColors.AVAILABLE_WITH_DISABLED;
          break;
        }
        else if (filteredBikes[bike].DisabledReason == BikeDisableState.WithStreetTeam
          || (filteredBikes[bike].DisableState && filteredBikes[bike].DisableState == BikeDisableState.WithStreetTeam))
          status = StationColors.AVAILABLE_BIKES;
      } else if (
        !filteredBikes[bike].Disabled &&
        filteredBikes[bike].Resolved != 0
      ) {
        status = StationColors.AVAILABLE_WITH_ERRORS;
      }
    }
    return status;
  }

  GoToDockingStationDet() {
    this.router.navigate([`/dockingStations/${this.dockingStationId}/dockingpoints`]);
  }
  private AddCarFeature() {
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

      var userCoordinateString = localStorage.getItem("currentCoordinates");
      var userCoordinates = userCoordinateString ? userCoordinateString.split(",") : [];

      //additional check to remove existing when returns to page to avoid several intervals running
      if (this.nearByWorkshopTimerId)
        clearInterval(this.nearByWorkshopTimerId);

      let geoCoordinates = OlProj.transform(userCoordinates, "EPSG:3857", "EPSG:4326");
      let positionDTO = { "Latitude": geoCoordinates[0], "Longitude": geoCoordinates[1] };
      this.GetAllNearByWorkshops(positionDTO);

      let positionFeature = new OlFeature({
        name: this.loggedInUser.UserId.toString(),
        data: { 'user': this.loggedInUser, 'Latitude': userCoordinates[0], 'Longitude': userCoordinates[1], 'numberOfBikes': this.transportBikes.length },
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
                  Longitude: (coordinates) ? coordinates[1] : null,
                  Latitude: (coordinates) ? coordinates[0] : null,
                  Altitude: (altitude) ? altitude : 0
                },
                Speed: (speed) ? speed : 0,
                Quality: (accuracy) ? accuracy : 0,
                Heading: (heading) ? heading : 0
              };
              this.AddUserPosition(userPosition);
            }
            else {
              let userPosition = {
                Timestamp: new Date(),
                Position: {
                  Longitude: (coordinates) ? coordinates[1] : null,
                  Latitude: (coordinates) ? coordinates[0] : null,
                  Altitude: (altitude) ? altitude : 0
                },
                Speed: (speed) ? speed : 0,
                Quality: (accuracy) ? accuracy : null,
                Heading: (heading) ? heading : 0,
                LastUpdated: new Date(isLoggedInUserExist["Timestamp"])
              };
              this.UpdateUserPosition(userPosition);
            }
          }, 60000);
        }
        //set geolocation coordinates start
        positionFeature.setGeometry(coordinates ? new OlPoint(coordinates) : null);
        positionFeature.set('data', { 'user': this.loggedInUser, 'Latitude': coordinates[0], 'Longitude': coordinates[1], 'numberOfBikes': this.transportBikes.length });
        let style = positionFeature.getStyle();
        // style.getText().setText(this.transportBikes.length.toString());
        //auto center only at once
        let currentCoordinates = localStorage.getItem("currentCoordinates");
        if (currentCoordinates == null) {
          this.view.setCenter(coordinates);
        }
        localStorage.setItem("currentCoordinates", coordinates);

        let geoCoordinates = OlProj.transform(coordinates, "EPSG:3857", "EPSG:4326");
        if (!this.nearByWorkshopTimerId) {
          this.nearByWorkshopTimerId = setInterval(() => {
            let positionDTO = { "Latitude": geoCoordinates[0], "Longitude": geoCoordinates[1] }
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
        //view.setCenter(currentPosition);
      }
      positionFeature.setId(this.loggedInUser.UserId);
      this.carSource.addFeature(positionFeature);
    }
  }

  GetBikesByBikeMode() {
    observableForkJoin(
      this.stationService.getDockingStations(false),
      this.bikesService.GetBikesFilterByBikeModeId(this.bikeModeId),
      this.issueService.getAllActiveErrorReports()
    ).subscribe(res => {
      this.allDockingStations = res[0];
      let filteredBikes = res[1];
      filteredBikes.map(x => {
        x["IsCharging"] = (x["PowerState"] == PowerState.ChargingNormal) ? true : false;
        return x;
      });
      this.filteredBikes = filteredBikes;
      this.allFilterBikes = filteredBikes;
      this.allActiveErrorDetails = res[2];
      var filteredCarBikes = [];
      if (this.bikeModeId == BikeModes.BikeInCar) {
        this.filteredBikes.forEach(bike => {
          var existBike = this.transportBikes.find(x => x.BikeId == bike.BikeId);
          if (existBike) {
            filteredCarBikes.push(bike);
          }
        });
        this.filteredBikes = filteredCarBikes;
      }
      this.filteredBikes.forEach(filteredBike => {
        filteredBike["BikeStatus"] = CommonHandler.getBikeStatus(filteredBike, filteredBike.DockingStationId, filteredBike.DockingPointId);
      });
      this.filteredBikes.map(bike => {
        bike["activeBikeIssues"] = this.allActiveErrorDetails ? this.allActiveErrorDetails
          .filter(x => x.BikeId == bike.BikeId).slice(0, 3) : [];
        return;
      });
      let dockedBikes = this.filteredBikes.filter(x => x.DockingStationId);
      let filteredDockingStationList = this.allDockingStations.filter(i => dockedBikes.findIndex(x => x.DockingStationId == i.DockingStationId) >= 0);
      this.loadDocks(filteredDockingStationList);
      if (this.bikeModeId == BikeModes.BikeInCar)
        this.AddCarFeature();
      else
        this.AddFilteredBikes();
      this.isFilterLoading = false;
    }, err => {
      this.isFilterLoading = false;
    });
  }

  GetBikesIssueFilterByBikeMode() {
    observableForkJoin(
      this.stationService.getDockingStations(false),
      this.bikesService.GetBikesIssueFilterByBikeMode(this.bikeModeId),
      this.issueService.getAllActiveErrorReports()
    ).subscribe(res => {
      this.allDockingStations = res[0];
      this.filteredBikes = res[1];
      this.allActiveErrorDetails = res[2];
      this.filteredBikes.forEach(filteredBike => {
        filteredBike["BikeStatus"] = CommonHandler.getBikeStatus(filteredBike, filteredBike.DockingStationId, filteredBike.DockingPointId);
      });
      this.filteredBikes.map(bike => {
        bike["activeBikeIssues"] = this.allActiveErrorDetails ? this.allActiveErrorDetails
          .filter(x => x.BikeId == bike.BikeId).slice(0, 3) : [];
        return;
      });
      let dockedBikes = this.filteredBikes.filter(x => x.DockingStationId);
      let filteredDockingStationList = this.allDockingStations.filter(i => dockedBikes.findIndex(x => x.DockingStationId == i.DockingStationId) >= 0);
      this.loadDocks(filteredDockingStationList);
      this.AddFilteredBikes();
      this.isFilterLoading = false;
    }, err => {
      this.isFilterLoading = false;
    });
  }

  AddFilteredBikes() {
    for (let filteredBike of this.filteredBikes) {
      if (!filteredBike.Position) continue;

      if (filteredBike.DockingPointId == null &&
        (filteredBike.DisabledReason != BikeDisableState.Missing
          && filteredBike.DisabledReason != BikeDisableState.RepairFinished)) {
        if (
          (filteredBike.DisabledReason != BikeDisableState.InWorkshop ||
            (filteredBike.DisabledReason == BikeDisableState.InWorkshop && BikeModes.DisabledInWorkshop == this.bikeModeId)
          ) &&
          (filteredBike.DisabledReason != BikeDisableState.ToWorkshop || (filteredBike.DisabledReason == BikeDisableState.ToWorkshop &&
            (BikeModes.DisabledToWorkshop == this.bikeModeId || BikeModeFilter.BikeInCar == this.bikeModeId)))
          &&
          (filteredBike.DisabledReason != BikeDisableState.InStorage ||
            (filteredBike.DisabledReason == BikeDisableState.InStorage && BikeModes.DisabledInStorage == this.bikeModeId))
          &&
          (filteredBike.DisabledReason != BikeDisableState.Moving ||
            (filteredBike.DisabledReason == BikeDisableState.Moving && BikeModes.DisabledMoving == this.bikeModeId))) {
          if (!this.formatTimeDuration(filteredBike.LatestPulse, 30) && !this.checkForPositionUpdate(filteredBike))
            continue;
          this.AddFilteredBike(filteredBike);
        }
      }
    }
  }

  AddFilteredBike(bike) {
    let points = [];
    let color = CommonHandler.getBikeStatusColor(bike);
    let pointFeature = new OlFeature({
      geometry: new OlPoint(
        OlProj.transform(
          [bike["Position"]["Longitude"] + 0.0000085, bike["Position"]["Latitude"] + 0.0000085],
          "EPSG:4326",
          "EPSG:3857"
        )
      ),
      name: bike.VisualId.toString(),
      data: this.getMapPoint(bike, bike.VisualId, bike.BikeId),
      color: color,
      type: "bike",
      session: bike.SessionId != null,
      inSession: bike.InSession
    });

    pointFeature.setId(bike.BikeId);

    var f2 = this.source.getFeatureById(bike.BikeId);
    if (f2)
      this.source.removeFeature(f2);
    this.source.addFeature(pointFeature);

    points.push([bike["Position"]["Longitude"], bike["Position"]["Latitude"]]);

    this.fitToLastExtent();
    this.count++;
  }

  cleanMap() {
    this.source.clear(true);
    this.dockLayer.getSource().clear(true);
    this.dockSmallLayer.getSource().clear(true);
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

  formatServiceTimeDuration(timestamp) {
    return this.commonService.formatServiceTimeDuration(timestamp);
  }

  formatReportErrorTimeDurationCount(timestamp) {
    return this.commonService.formatReportErrorTimeDurationCount(timestamp);
  }

  formatReportErrorTimeDuration(timestamp) {
    return this.commonService.formatReportErrorTimeDuration(timestamp);
  }


  fitToLastExtent(): void {
    this.lastExtent = this.settingsService.getLastBikeMapExtent();
    if (this.lastExtent != null) {
      this.map.getView().fit(this.lastExtent, { constrainResolution: false });
    } else {
      this.zoomToExtent();
    }
  }

  setCurrentExtent() {
    let extent = this.map.getView().calculateExtent(this.map.getSize());
    this.settingsService.setLiveMapZoomLevel(this.map.getView().getZoom());
    this.settingsService.setLastBikeMapExtent(extent);
  }

  //Define map zoom to the location
  private zoomToExtent(): void {
    if (this.layer) {
      let extent = this.layer.getSource().getExtent();
      this.map.getView().fit(extent, { size: this.map.getSize(), maxZoom: 5 });
    }
  }

  styleCache: any = {};
  styleFunction(feature: OlFeature, resolution) {
    let session = feature.get("session");
    let inSession = feature.get("inSession");
    let style;
    style = this.getLayerStyle(false, session, feature.get("color"), inSession);
    style.getText().setText(resolution < 19 ? feature.get("name") : "");
    if (resolution > 19) {
      style.getImage().setScale(0.7);
    }
    return style;
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

  interactionStyleFunction(feature: OlFeature, resolution) {

    let type = feature.get('type');
    let session = feature.get("session");
    let inSession = feature.get("inSession");
    let style;
    if (type == "bike") {
      style = this.getLayerStyle(true, session, feature.get('color'), inSession);
      style.getText().setText(resolution < 19 ? feature.get('name') : '');
    }
    else if (type == "dock") {
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
    if (resolution > 19) {
      style.getImage().setScale(0.7);
      style.getText().setScale(0.7);
      style.getText().setOffsetY(2);
      if (type == "small-dock") {
        style.getImage().anchor_ = [1.485, 1.485];
        style.getText().setOffsetX(10.785);
        style.getText().setOffsetY(-10.785);
        // style.getText().setText("");
      }
    }
    return style;
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
        rotation: -1.6
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

  private GetUserRole() {
    var authToken = JSON.parse(
      localStorage.getItem(LocalStorageKeys.OAUTH_TOKEN)
    );
    return authToken._claims[0];
  }

  private CheckForStreetTeamRole(userRole: any) {
    this.isAdmin = false;
    if (userRole == UserRoles.CUSTOMER_SERVICE || userRole == UserRoles.STREET_TEAM)
      this.isStreetTeam = true;
    else {
      this.isStreetTeam = false;
      if (userRole == UserRoles.ADMIN)
        this.isAdmin = true;
    }
  }

  //handle undock bikes when taken out
  GetBikePCBOnTakenOut(signalRBike) {
    let filteredBike = this.filteredBikes.find(x => x.Serial == signalRBike.serial);
    if (filteredBike) {
      if (filteredBike["isTransChecked"]) {
        this.StopPassiveSession(filteredBike.BikeId);
        this.bikeId = filteredBike.BikeId;
        this.CreateTransportOrder(filteredBike);
        filteredBike.Disabled = true;
        filteredBike.DisableState = BikeDisableState.Moving;
        filteredBike.DisabledReason = BikeDisableState.Moving;
        filteredBike["BikeStatus"] = CommonHandler.getBikeStatus(filteredBike, filteredBike.DockingStationId, filteredBike.DockingPointId);
        if (!filteredBike["isDPHWIDReceived"]) {
          filteredBike["isDPHWIDReceived"] = true;
          if (this.transportBikes.length == 0)
            this.AddBikeToCar(filteredBike);
          else
            this.UpdateBikesInCar(filteredBike);
        }
      }
      this.dockingStationBikes = this.dockingStationBikes.filter(x => x.BikeId != filteredBike.BikeId);
      setTimeout(() => {
        this.RefreshFilteredBikes(filteredBike);
        this.GetDockingStationDetailsById(filteredBike.DockingStationId);
      }, 2000);
    }
  }

  NavigateBackToDashboard() {
    var dashboard_token = localStorage.getItem(LocalStorageKeys.DASHBOARD_TOKEN);
    if (!dashboard_token)
      this.router.navigate([`/dashboard`]);
    else
      this.router.navigateByUrl('dashboard?token=' + dashboard_token);
  }

  OpenBikeDetails(bike) {
    if (this.userRole != UserRoles.CUSTOMER) {
      if (bike.BikeStatus == BikeStatus.DisableToWorkshop || bike.BikeStatus == BikeStatus.DisabledWithMoving)
        this.OpenCarViewBikeDetails(bike);
      else
        this.OpenDialogForDockedBike(bike.BikeId, bike, false);
    }
    else
      this.router.navigate([`/bikes/${bike.BikeId}/details`]);
  }

  OpenCarViewBikeDetails(carBike) {
    this.isCarChecking = false;
    this.bikeId = carBike.BikeId;
    this.isStorage = false;
    this.isTransportation = false;
    this.isPlaceFree = false;
    const dialogRef = this.dialog.open(CarBikeDetailsPopupComponent, {
      width: '500px',
      height: '700px',
      data: { bikeId: carBike.BikeId, carBike: carBike, userId: this.loggedInUser.UserId }
    });
    dialogRef.afterClosed().subscribe(result => {
      this.isFilterLoading = true;
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
        }
        else if (this.isTransportation && result.bike.DockingPointId) {
          this.RequestTransport(result.bike);
          this.isTransportation = false;
        }
        else if (this.isTransportation && !result.bike.DockingPointId) {
          this.StopPassiveSession(result.bike.BikeId);
          this.bikeId = result.bike.BikeId;
          this.CreateTransportOrder(result.bike);
          result.bike["BikeStatus"] = BikeStatus.DisabledWithMoving;
          result.bike["DisabledReason"] = BikeDisableState.Moving;
          let filteredBike = this.filteredBikes.find(x => x.Serial == result.bike.Serial);
          if (this.transportBikes.length == 0)
            this.AddBikeToCar(filteredBike);
          else
            this.UpdateBikesInCar(filteredBike);
          setTimeout(() => this.RefreshFilteredBikes(result.bike), 5000);
        }
        else if (this.isToWorkshop) {
          this.HandToWorkShop(result.bike);
        }
        else if (this.isStorage) {
          var bikeStateChangeDTO = { Disabled: true, DisabledReason: BikeDisableState.InStorage };
          this.bikesService.enableDisableBike(this.bikeId, bikeStateChangeDTO)
            .subscribe(data => {
              this.HandToStorage(result.bike, this.selectedStorageId);
            }, err => {
              this.isFilterLoading = false;
            });
        }
        else if (this.isCarChecking) {
          this.isSideNavOpened = true;
          result.bike["BikeStatus"] = BikeStatus.DisabledWithTesting;
          this.CheckBike(result.bike);
          this.isFilterLoading = false;
        }
      }
      else
        this.isFilterLoading = false;
    });
  }

  OpenDialogForDockedBike(selectedBikeId: number, freeBike: any, isChecking = false): void {
    const dialogRef = this.dialog.open(FreeBikePopupComponent, {
      width: '500px',
      height: '700px',
      data: {
        'group1': this.group1, 'group2': this.group2, 'group3': this.group3,
        'sessionId': freeBike.SessionId, bikeId: selectedBikeId, freeBike: freeBike, isDocked: true, isChecking: isChecking, userId: this.loggedInUser.UserId, userRole: this.userRole
      },
      disableClose: true
    });
    dialogRef.afterClosed().subscribe(result => {
      this.isFilterLoading = true;
      if (result != null) {
        this.isTransportation = result.isTransportation;
        this.isPlaceFree = result.isPlaceFree;
        this.isDocked = result.isDocked;
        this.isChecking = result.isChecking;
        // if isErrorReported flag is false executed below code
        if (!this.isPlaceFree) {
          if (this.isTransportation && result.bike.DockingPointId) {
            this.RequestTransport(result.bike);
            this.isTransportation = false;
          }
          else if (this.isTransportation && !result.bike.DockingPointId) {
            this.StopPassiveSession(result.bike.BikeId);
            this.bikeId = result.bike.BikeId;
            this.CreateTransportOrder(result.bike);
            result.bike["BikeStatus"] = BikeStatus.DisabledWithMoving;
            result.bike["DisabledReason"] = BikeDisableState.Moving;
            let filteredBike = this.filteredBikes.find(x => x.Serial == result.bike.Serial);
            if (this.transportBikes.length == 0)
              this.AddBikeToCar(filteredBike);
            else
              this.UpdateBikesInCar(filteredBike);
            setTimeout(() => this.RefreshFilteredBikes(result.bike), 5000);
          }
          else {
            this.isSideNavOpened = true;
            this.isDockViewOpened = false;
            result.bike["BikeStatus"] = BikeStatus.DisabledWithTesting;
            this.CheckBike(result.bike);
            this.isFilterLoading = false;
          }
        }
        else {
          this.selectedFeature.getFeatures().clear();
          this.HandoverBike(result.bike);
        }
      }
      else {
        this.isFilterLoading = false;
        this.selectedFeature.getFeatures().clear();
      }
    });
  }

  RequestTransport(bike) {
    this.signalRService.SubscribeConnection(bike.Serial);
    bike["isTransChecked"] = true;
    if (this.filteredBikes.length > 0) {
      var index = this.filteredBikes.findIndex(x => x.BikeId == bike.BikeId);
      this.filteredBikes[index] = bike;
    }
    this.bikeId = bike.BikeId;
    if (bike.BikeStatus == (BikeStatus.DockedWithError || BikeStatus.DockedWithNoError)
      || BikeStatus.DisabledWithTesting || BikeStatus.DisabledWithMoving || BikeStatus.Disabled) {
      this.DockedBikeFlow(bike);
    } else if (bike.BikeStatus == (BikeStatus.LockedWithError || BikeStatus.LockedWithNoError)
      || BikeStatus.DisabledWithTesting || BikeStatus.DisabledWithMoving || BikeStatus.Disabled) {
      this.LockedBikeFlow(bike);
    }
  }

  private LockedBikeFlow(bike: any) {
    this.bikesService.sendUnLockCommand(bike.BikeId).subscribe(
      res => {
      },
      error => {
        this.bikesService.sendUndockCommand(bike.BikeId).subscribe(
          res => {
          },
          err => {
            this.loggerService.showErrorMessage(this.commonService.TranslateMessage(TranslateMessageTypes.UndockAndUnlockFail));
          }
        );
      }
    );
  }

  private DockedBikeFlow(bike: any) {
    this.bikesService.sendUndockCommand(bike.BikeId).subscribe(
      res => {
      },
      error => {
        this.bikesService.sendUnLockCommand(bike.BikeId).subscribe(
          res => {
          },
          err => {
            this.loggerService.showErrorMessage(this.commonService.TranslateMessage(TranslateMessageTypes.UndockAndUnlockFail));
          }
        );
      }
    );
  }

  StopPassiveSession(bikeId) {
    this.bikesService.sendStopPassiveSessionCommand(bikeId).subscribe(res => {

    }, err => {

    });
  }

  CreateTransportOrder(bike) {
    var bikeStateChangeDTO = { Disabled: true, DisabledReason: BikeDisableState.Moving };
    this.DisableBike(bikeStateChangeDTO);
  }

  DisableBike(bikeStateChangeDTO) {
    this.bikesService.enableDisableBike(this.bikeId, bikeStateChangeDTO)
      .subscribe(data => {
        this.isLoading = false;
      }, error => {
        this.loggerService.showErrorMessage(error.error.Message);
        this.isLoading = false;
      });
  }

  AddBikeToCar(bike) {
    if (this.userRole && this.userRole == UserRoles.STREET_TEAM) {
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
    if (this.userRole && this.userRole == UserRoles.STREET_TEAM) {
      this.transportBikes.push(bike);
      this.carTranportObj["Bikes"] = JSON.stringify(this.transportBikes);
      this.bikesService.UpdateBikeTransport(this.loggedInUser.UserId, this.carTranportObj).subscribe(res => {
        let bikeFeature = this.source.getFeatureById(bike.BikeId);
        if (bikeFeature)
          this.source.removeFeature(bikeFeature);
      });
    }
  }

  UpdateBikeTransport() {
    if (this.userRole && this.userRole == UserRoles.STREET_TEAM) {
      this.carTranportObj["Bikes"] = JSON.stringify(this.transportBikes);
      this.bikesService.UpdateBikeTransport(this.loggedInUser.UserId, this.carTranportObj).subscribe(res => {
      });
    }
  }

  GetBikesInCar() {
    this.bikesService.getBikeTransportByUserId(this.loggedInUser.UserId).subscribe(res => {
      if (res) {
        this.carTranportObj = res;
        this.transportBikes = (res.Bikes) ? JSON.parse(res.Bikes) : [];
        this.refreshCarBikes();
      }
    });
  }

  refreshCarBikes() {
    let isChanged = false;
    this.transportBikes.forEach(tranBike => {
      if (!tranBike) {
        this.transportBikes = this.transportBikes.filter(x => x != null);
        isChanged = true;
      }
    });
    if (isChanged)
      this.UpdateBikeTransport();
  }

  HandoverBike(bike) {
    // remove from car view when place free
    if (this.carTranportObj) {
      this.transportBikes = this.transportBikes.filter(y => y.BikeId != bike.BikeId);
      // this.UpdateBikeTransport();
    }
    if (bike.LockState == LockState.LockedArrest)
      this.UnLockBike();
    var bikeStateChangeDTO = { Disabled: false, DisabledReason: null };
    this.DisableBike(bikeStateChangeDTO);
    this.RefreshFilteredBikes(bike);
  }

  UnLockBike() {
    this.bikesService.sendUnLockCommand(this.bikeId).subscribe(res => {
      this.isLockState = false;
    }, err => {
      this.loggerService.showErrorMessage(this.commonService.TranslateMessage(TranslateMessageTypes.UnlockFail));
    })
  }

  LockBike() {
    this.bikesService.sendLockCommand(this.bikeId).subscribe(res => {
      // this.loggerService.showSuccessfulMessage(this.commonService.TranslateMessage(TranslateMessageTypes.LockSuccess));
      this.isLockState = true;
    }, err => {
      this.loggerService.showErrorMessage(this.commonService.TranslateMessage(TranslateMessageTypes.LockFail));
    })
  }

  HandToWorkShop(transportBike) {
    this.isFilterLoading = true;
    const dialogWorkshop = this.dialog.open(WorkshopSelectionPopupComponent, {
      width: '400px',
      height: '250px',
      data: { allWorkshops: this.allWorkshops, allNearbyWorkshops: this.allNearbyWorkshops, bikeId: transportBike.BikeId, bike: transportBike, userName: this.loggedInUser.FirstName },
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
            this.RefreshFilteredBikes(transportBike);
            this.filteredBikes = this.filteredBikes.filter(x => x.BikeId != transportBike.BikeId);
          });
        });
      }
    });
  }

  handleTransportBike(bike) {
    let filteredBike = this.filteredBikes.find(x => x.Serial == bike.Serial);
    if (filteredBike) {
      this.bikeId = filteredBike.BikeId;
      this.CreateTransportOrder(filteredBike);
      filteredBike.Disabled = true;
      filteredBike.DisableState = BikeDisableState.Moving;
      filteredBike.DisabledReason = BikeDisableState.Moving;
      filteredBike["BikeStatus"] = CommonHandler.getBikeStatus(filteredBike, filteredBike.DockingStationId, filteredBike.DockingPointId);
      if (this.transportBikes.length == 0)
        this.AddBikeToCar(filteredBike);
      else
        this.UpdateBikesInCar(filteredBike);
      this.dockingStationBikes = this.dockingStationBikes.filter(x => x.BikeId != filteredBike.BikeId);
      setTimeout(() => {
        this.RefreshFilteredBikes(filteredBike);
      }, 2000);
    }
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
    this.RefreshFilteredBikes(transportBike);
  }

  UpdateBikeWorkshop(bikeId, workshopId) {
    let workshopDet = { "BikeId": bikeId, "WorkshopId": workshopId };
    this.bikesService.UpdateBikeWorkshop(workshopDet).subscribe(res => {
    });
  }

  updateBikeStorage(bikeId, storageId) {
    let storageDet = { "BikeId": bikeId, "StorageId": storageId };
    this.bikesService.updateBikeStorage(storageDet).subscribe(res => {
    });
  }

  GetRegisteredIssuesPerBikeId(bikeId) {
    this.bikeIssues = [];
    this.issueService.GetAllErrorReportsPerBike(bikeId).subscribe(result => {
      this.bikeIssues = result.errorReportGroupedDTOs;
      this.bikeIssues = this.bikeIssues.filter(i => i.IsCompleted == false);
      this.formatErrorCategories();
      this.isLoading = false;
    },
      () => {
        this.isLoading = false;
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
        if (reportedDate.isSameOrAfter(startOfToday,'day')) {
          x.ReportedDateFormatted = `Today ${moment(x.ReportedDate).format("HH:mm")}`;
        } else if (reportedDate.isSameOrAfter(startOfYesterday,'day') && reportedDate.isBefore(startOfToday)) {
          x.ReportedDateFormatted = `Yesterday ${moment(x.ReportedDate).format("HH:mm")}`;
        } else
          x.ReportedDateFormatted = `Last ${moment(x.ReportedDate).format("dddd HH:mm")}`;
      }
      else
        x.ReportedDateFormatted = moment(x.ReportedDate).format("MMM Do HH:mm");
      x.ReportedUser = this.commonService.mapReportedUser(x);
    });
  }

  CheckBike(bike) {
    this.isLoading = true;
    this.bike = bike;
    this.bikeId = bike.BikeId;
    this.GetRegisteredIssuesPerBikeId(this.bikeId);
    //reset values before new check
    if (this.bike.LockState == LockState.LockedArrest)
      this.isLockState = true;
    else if (this.bike.LockState == LockState.UnlockedArrest)
      this.isLockState = false;
    this.GetBikeServiceByBikeId();
  }

  SetBikeToAvailableFree() {

    this.isLoading = true;
    this.bikeId = this.bike.BikeId;

    //resolve issues of the bike
    if (this.bike.Resolved > 0)
      this.ResolveIssuePerBike(this.bikeId);

    //bike service details create or update
    var bikeServiceDTO = { NumberOfChecks: this.bike.NumberOfChecks, BikeId: this.bikeId }
    this.CreateOrUpdateBikeService(bikeServiceDTO);

    //reset unsuccessful session count when check completed
    this.resetUndockFailureCountByBike();

    //added this flag to handle auto refresh of bike details
    this.checkedCategories = [];
    //confirm bike is okay when ok button pressed
    this.confirmBikeIsOkay();

    if (this.carTranportObj) {
      this.transportBikes = this.transportBikes.filter(y => y.BikeId != this.bike.BikeId);
      this.UpdateBikeTransport();
    }
    this.RefreshFilteredBikes(this.bike);
  }

  confirmBikeIsOkay() {
    const dialogRe = this.dialog.open(LiveMapConfirmPopupComponent, {
      width: '500px',
      height: '700px',
      data: { bikeId: this.bike.BikeId, bike: this.bike, isBikeOkay: true, userName: this.loggedInUser.FirstName, isShouldBeChecked: false }
    });

    dialogRe.afterClosed().subscribe(result => {
      this.isSideNavOpened = false;
    });
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
      var bikeStateChangeDTO = { Disabled: true, DisabledReason: BikeDisableState.Testing };
      this.DisableBike(bikeStateChangeDTO);
    }, err => {
      this.loggerService.showErrorMessage(this.commonService.TranslateMessage(TranslateMessageTypes.BikeServiceGetError));
      this.isLoading = false;
    })
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

  CreateOrUpdateBikeService(serviceDTO) {
    this.bikesService.CreateOrUpdateBikeService(this.bikeId, serviceDTO)
      .subscribe(data => {
        this.loggerService.showSuccessfulMessage(this.commonService.TranslateMessage(TranslateMessageTypes.BikeServiceAddSuccess));
      }, error => {
        this.loggerService.showErrorMessage(this.commonService.TranslateMessage(TranslateMessageTypes.BikeServiceAddFail));
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
      if (res) {
        if (!res.isGoBack) {
          if (!isBikeOkay) {
            const dialogRe = this.dialog.open(LiveMapConfirmPopupComponent, {
              width: '500px',
              height: '700px',
              data: { bikeId: this.bike.BikeId, bike: this.bike, isBikeOkay: isBikeOkay, userName: this.loggedInUser.FirstName, isShouldBeChecked: false }
            });

            dialogRe.afterClosed().subscribe(confirmResponse => {
              if (confirmResponse && confirmResponse.isPlaceInCar) {
                this.CreateErrorReport(errorRes.errorReport);
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
                //added this flag to handle auto refresh of bike details
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

                setTimeout(() => {
                  this.RefreshFilteredBikes(this.bike);
                }, 1500);
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
      this.isSideNavOpened = false;
    });
    this.clearRepairErrorCategories();
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
        if (!this.bike.DisableState)
          this.bike.DisableState = this.bike.DisabledReason;
        if (this.bike.DisableState != BikeDisableState.Moving) {
          // this.CreateRepairReport(this.bike, false, result, errorRes);
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
        const dialogRe = this.dialog.open(LiveMapConfirmPopupComponent, {
          width: '500px',
          height: '700px',
          data: { bikeId: this.bike.BikeId, bike: this.bike, isBikeOkay: true, userName: this.loggedInUser.FirstName, isBikeNeedsRepair: true }
        });

        dialogRe.afterClosed().subscribe(result => {
          //added this flag to handle auto refresh of bike details
          this.bike.Disabled = false;
          this.bike.DisableState = null
          this.bike["BikeStatus"] = BikeStatus.LooseBikeWithError;
          let bikeStateChangeDTO = { Disabled: false, DisabledReason: null };
          this.DisableBike(bikeStateChangeDTO);

          //bike service details create or update
          var bikeServiceDTO = { NumberOfChecks: this.bike.NumberOfChecks, BikeId: this.bikeId }
          this.CreateOrUpdateBikeService(bikeServiceDTO);

          setTimeout(() => {
            this.RefreshFilteredBikes(this.bike);
          }, 1500);
        });

      }
      else if (confirmResponse && !confirmResponse.isPlaceInCar && confirmResponse.isKeepInUse) {
        this.confirmBikeShouldBeChecked();
      }
      this.isSideNavOpened = false;
    });
  }

  confirmMovingErrorReport(isBikeOkay, errorRes) {
    const dialogRe = this.dialog.open(LiveMapConfirmPopupComponent, {
      width: '500px',
      height: '700px',
      data: { bikeId: this.bike.BikeId, bike: this.bike, isBikeOkay: isBikeOkay, userName: this.loggedInUser.FirstName, isShouldBeChecked: false }
    });

    dialogRe.afterClosed().subscribe(confirmResponse => {
      this.CreateErrorReport(errorRes.errorReport);
      if (confirmResponse && confirmResponse.isPlaceInCar) {
        this.bike.Disabled = true;
        this.bike.DisableState = BikeDisableState.ToWorkshop;
        this.bike["BikeStatus"] = BikeStatus.DisableToWorkshop;
        var bikeStateChangeDTO = { Disabled: true, DisabledReason: BikeDisableState.ToWorkshop };
        //added this flag to handle auto refresh of bike details
        this.DisableBike(bikeStateChangeDTO);

        this.transportBikes = this.transportBikes.filter(x => x.BikeId != this.bike.BikeId);
        this.UpdateBikesInCar(this.bike);
      }
      else if (confirmResponse && !confirmResponse.isPlaceInCar && !confirmResponse.isKeepInUse) {
        const dialogRe = this.dialog.open(LiveMapConfirmPopupComponent, {
          width: '500px',
          height: '700px',
          data: { bikeId: this.bike.BikeId, bike: this.bike, isBikeOkay: true, userName: this.loggedInUser.FirstName, isBikeNeedsRepair: true }
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

        });
      }
      else if (confirmResponse && !confirmResponse.isPlaceInCar && confirmResponse.isKeepInUse) {
        this.confirmBikeShouldBeChecked();
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
      //added this flag to handle auto refresh of bike details
      this.bike.Disabled = false;
      this.bike.DisableState = null
      this.bike["BikeStatus"] = BikeStatus.LooseBikeWithError;
      let bikeStateChangeDTO = { Disabled: false, DisabledReason: null };
      this.DisableBike(bikeStateChangeDTO);

      //bike service details create or update
      var bikeServiceDTO = { NumberOfChecks: this.bike.NumberOfChecks, BikeId: this.bikeId }
      this.CreateOrUpdateBikeService(bikeServiceDTO);

      setTimeout(() => {
        this.RefreshFilteredBikes(this.bike);
      }, 1500);
    });
  }

  confirmBikePlaceHere() {
    const dialogRe = this.dialog.open(LiveMapConfirmPopupComponent, {
      width: '500px',
      height: '700px',
      data: { bikeId: this.bike.BikeId, bike: this.bike, isBikeOkay: true, userName: this.loggedInUser.FirstName, isBikeNeedsRepair: true }
    });

    dialogRe.afterClosed().subscribe(result => {

    });
  }

  CreateRepairReportForMoving(bike, isBikeOkay = false, result = null, errorRes = null) {
    const dialogRef = this.dialog.open(RepairRegisterPopupComponent, {
      disableClose: true,
      width: '1100px',
      height: '830px',
      data: { 'group1': this.repairGroup1, 'group2': this.repairGroup2, 'group3': this.repairgroup3, 'bike': this.bike, 'bikeId': bike.BikeId, 'isBikeOkay': isBikeOkay, "checkedCategories": this.checkedCategories }
    });

    dialogRef.afterClosed().subscribe(res => {
      if (res) {
        if (!res.isGoBack) {
          if (!isBikeOkay) {
            const dialogRe = this.dialog.open(LiveMapConfirmPopupComponent, {
              width: '500px',
              height: '700px',
              data: { bikeId: this.bike.BikeId, bike: this.bike, isBikeOkay: isBikeOkay, userName: this.loggedInUser.FirstName, isShouldBeChecked: false }
            });

            dialogRe.afterClosed().subscribe(confirmResponse => {
              if (confirmResponse && confirmResponse.isPlaceInCar) {
                this.CreateErrorReport(errorRes.errorReport);
                this.bike.Disabled = true;
                this.bike.DisableState = BikeDisableState.ToWorkshop;
                this.bike["BikeStatus"] = BikeStatus.DisableToWorkshop;
                var bikeStateChangeDTO = { Disabled: true, DisabledReason: BikeDisableState.ToWorkshop };
                //added this flag to handle auto refresh of bike details
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

  clearRepairErrorCategories() {
    this.repairGroup1.map(x => this.resetRepairCategories(x));
    this.repairGroup2.map(x => this.resetRepairCategories(x));
    this.repairgroup3.map(x => this.resetRepairCategories(x));
  }

  resetRepairCategories(repairCat) {
    if (repairCat.hasOwnProperty("Result"))
      repairCat.Result = false;
  }

  clearSelectedErrorCategories() {
    this.group1.map(x => this.resetSubCategories(x));
    this.group2.map(x => this.resetSubCategories(x));
    this.group3.map(x => this.resetSubCategories(x));
  }

  resetSubCategories(parent) {
    let subCategory = parent.SubCategory;
    for (let i = 0; i < subCategory.length; i++) {
      if (subCategory[i].hasOwnProperty("Result"))
        subCategory[i].Result = false;
    }
  }

  CreateErrorReport(errorReportObj) {
    this.issueService.CreateErrorReport(errorReportObj).subscribe(data => {
      // this.loggerService.showSuccessfulMessage(this.commonService.TranslateMessage(TranslateMessageTypes.ErrorReportedSuccess));
    }, error => {
      this.loggerService.showErrorMessage(this.commonService.TranslateMessage(TranslateMessageTypes.ErrorReportedFail));
    });
  }

  RepairRequiredForBike() {
    // this.isLoading = true;
    this.bikeId = this.bike.BikeId;
    // this.isLoading = false;
    this.bike.BikeStatus = BikeStatus.DisableToWorkshop;
    // var bikeStateChangeDTO = { Disabled: true, DisabledReason: BikeDisableState.ToWorkshop };
    //added this flag to handle auto refresh of bike details
    // this.DisableBike(bikeStateChangeDTO);
    this.selectedErrorCategories = [];
    this.checkedCategories = [];
    this.disableBike = false;
    this.otherCritical = false;
    this.otherFell = false;
    this.comments = null;
    this.CreateReportError();
    this.RefreshFilteredBikes(this.bike, this.bikeModeId == BikeModes.BikeInCar);
    this.isSideNavOpened = false;
  }

  CreateTransportationOrderForRepairRequired(result) {
    // if (result != null && !result.PickedDate) {
    //   this.ExistingTransportationPickedUp(result, BikeDisableState.ToWorkshop);
    // } else if (result == null) {
    //   this.CreateTransportationAndPick(result, BikeDisableState.ToWorkshop);
    // }
    var bikeStateChangeDTO = { Disabled: true, DisabledReason: BikeDisableState.ToWorkshop };
    //added this flag to handle auto refresh of bike details
    this.DisableBike(bikeStateChangeDTO);
    this.StopPassiveSession(this.bike.BikeId);
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

  translateRepairCategories(repairCat) {
    let tranlationLabel = "REPAIR_REPORT." + repairCat.TranslationName;
    this.translate.get(tranlationLabel).subscribe(name => {
      repairCat.DisplayName = (name != tranlationLabel) ? name : repairCat.Name;
    });
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

  CancelCheck() {
    //adding undocked bikes to list temporarily
    this.bike.Disabled = false;
    this.bike.DisableState = null;
    this.bike["BikeStatus"] = CommonHandler.getBikeStatus(this.bike, this.bike.DockingStationId, this.bike.DockingPointId);
    this.isSideNavOpened = false;
    this.RefreshFilteredBikes(this.bike);
  }

  RefreshFilteredBikes(bike, isInCar = false) {
    if ((this.bikeModeId != BikeModes.All || this.bikeModeId != BikeModes.BikeWithMinorIssues)
      && (this.bikeModeId != CommonHandler.GetBikeModeByBike(bike))) {
      if (!isInCar)
        this.filteredBikes = this.filteredBikes.filter(x => x.BikeId != bike.BikeId);
    }
    else {
      if (this.filteredBikes.length > 0) {
        var index = this.filteredBikes.findIndex(x => x.BikeId == bike.BikeId);
        this.filteredBikes[index] = bike;
      }
    }
    this.isFilterLoading = false;
    var f2 = this.source.getFeatureById(bike.BikeId);
    if (f2)
      this.source.removeFeature(f2);
    this.map.getOverlays().clear();
    this.cleanMap();
    if (!isInCar) {
      if (this.bikeModeId == BikeModeFilter.DisabledOffline)
        this.GetBikesIssueFilterByBikeMode();
      else
        this.GetBikesByBikeMode();
    }
    this.GetBikesInCar();
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

  GetAllUserPositions() {
    this.userService.getAllUserPositions().subscribe(res => {
      if (res) {
        this.allUserPositions = res;
      }
    });
  }

  AddUserPosition(userPosition) {
    this.userService.AddUserPosition(userPosition).subscribe(res => {
      this.GetAllUserPositions();
    });
  }

  calculateTripDuration(sessionStartTime) {
    let now = moment().utc();
    let start = moment(sessionStartTime);
    let d = now.diff(start);
    return moment.utc(d).format("HH:mm");
  }

  UpdateUserPosition(userPosition) {
    this.userService.UpdateUserPosition(userPosition).subscribe(res => {
      this.GetAllUserPositionsUpdate();
    });
  }

  GetAllUserPositionsUpdate() {
    this.userService.getAllUserPositions().subscribe(res => {
      if (res) {
        this.allUserPositions = res;
      }
    });
  }

  GetDockingStationDetailsById(stationId: any) {
    this.stationService.getDockingPointsForStation(stationId).subscribe(res => {
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
      });
    }, err => {

    });
  }

  getDockedBikeStatusById(res) {
    let status = StationColors.AVAILABLE_BIKES;
    if (this.dockingStationBikes.length == 0) {
      for (let dockingPoint in res["DockingPoints"]) {
        let bike = res["DockingPoints"][dockingPoint]["Bike"];
        if (bike != null) {
          // if (!bike.Position) continue;
          if (bike.Disabled) {
            if (bike.DisabledReason == BikeDisableState.CheckedNeedFix
              || (bike.DisableState && bike.DisableState == BikeDisableState.CheckedNeedFix)) {
              status = StationColors.CHECKED_NEEDS_REPAIR_BIKES;
              break;
            } else if ((bike.DisabledReason && bike.DisabledReason != BikeDisableState.WithStreetTeam)
              || (bike.DisableState && bike.DisableState != BikeDisableState.WithStreetTeam)) {
              status = StationColors.AVAILABLE_WITH_DISABLED;
              break;
            }
            else if (bike.DisabledReason == BikeDisableState.WithStreetTeam
              || (bike.DisableState && bike.DisableState == BikeDisableState.WithStreetTeam))
              status = StationColors.AVAILABLE_BIKES;
          } else if (!bike.Disabled && bike.Resolved != 0) {
            status = StationColors.AVAILABLE_WITH_ERRORS;
          }
        }
      }
    }
    else {
      for (let bikeIndex in this.dockingStationBikes) {
        let bike = this.dockingStationBikes[bikeIndex];
        if (bike != null) {
          // if (!bike.Position) continue;
          if (bike.Disabled) {
            status = StationColors.AVAILABLE_WITH_DISABLED;
            break;
          }
          else if (!bike.Disabled && bike.Resolved != 0) {
            status = StationColors.AVAILABLE_WITH_ERRORS;
          }
        }
      }
    }
    return status;
  }

  onFilterMenu() {
    this.isFilterMenuOpen = !this.isFilterMenuOpen;
  }

  onChange($event, workshop) {
    this.filteredBikes = this.allFilterBikes;
    if ($event.checked) {
      this.checkedWorkshops.push({ "WorkshopId": workshop.Id, "WorkshopName": workshop.Name });
    }
    else {
      this.checkedWorkshops = this.checkedWorkshops.filter(x => x.WorkshopId != workshop.Id);
    }
    let filterBikes = this.filteredBikes.map(x => this.mapWorkshopBikes(x));
    filterBikes = filterBikes.filter(function (el) {
      return el != null;
    });
    if (this.checkedWorkshops.length > 0 || (this.checkedWorkshops.length == 0 && filterBikes.length > 0))
      this.filteredBikes = filterBikes;
  }

  mapWorkshopBikes(bike) {
    if (this.checkedWorkshops.filter(x => x.WorkshopName == bike.WorkshopName).length > 0)
      return bike;
  }

  getAllStorages() {
    this.allStorages = [];
    this.storageService.getAllStorages().subscribe(res => {
      if (res) {
        this.allStorages = res;
      }
    });
  }

  onBikeChangeFilter(event) {
    switch (event.value) {
      case DashboardBikeFilter.FREE_STANDING: {
        this.filteredBikes = this.allFilterBikes.filter(e => e.DockingPointId == null);
        break;
      }
      case DashboardBikeFilter.DOCKED: {
        this.filteredBikes = this.allFilterBikes.filter(e => e.DockingPointId != null);
        break;
      }
      case DashboardBikeFilter.CHANGED_LASTWEEK: {
        let now = moment.utc();
        this.filteredBikes = this.allFilterBikes.filter(e => moment(now).diff(e.LastDisabledDate, 'days') <= 7);
        break;
      }
      case DashboardBikeFilter.CHECKED_NEED_REPAIR: {
        this.filteredBikes = this.allFilterBikes.filter(e => e.BikeModeId == BikeModes.DisabledCheckedNeedsRepair);
        break;
      }
      case DashboardBikeFilter.MUST_BE_CHECKED: {
        this.filteredBikes = this.allFilterBikes.filter(e => e.BikeModeId == BikeModes.DisabledCheckRequired);
        break;
      }
      case DashboardBikeFilter.SHOULD_BE_CHECKED: {
        this.filteredBikes = this.allFilterBikes.filter(e => !e.Disabled && e.Resolved > 0);
        break;
      }
      default: { // for CheckRequiredBikeFilter.ALL
        this.filteredBikes = this.allFilterBikes;
        break;
      }
    }
  }

  onStorageChange($event, storage) {
    this.filteredBikes = this.allFilterBikes;
    if ($event.checked) {
      this.checkedStorages.push({ "StorageId": storage.Id, "StorageName": storage.Name });
    }
    else {
      this.checkedStorages = this.checkedStorages.filter(x => x.StorageId != storage.Id);
    }
    let filterBikes = this.filteredBikes.map(x => this.mapStorageBikes(x));
    filterBikes = filterBikes.filter(function (el) {
      return el != null;
    });
    if (this.checkedStorages.length > 0 || (this.checkedStorages.length == 0 && filterBikes.length > 0))
      this.filteredBikes = filterBikes;
  }

  mapStorageBikes(bike) {
    if (this.checkedStorages.filter(x => x.StorageName == bike.StorageName).length > 0)
      return bike;
  }

  openFilterOptions() {
    this.showMapOptions = !this.showMapOptions;
  }

  changeMap($event, type) {
    this.adjustLayers({ 'bike': this.bikeMap, 'dock': this.dockMap });
  }

  private adjustLayers(name) {
    if (!name) return;

    if (name.bike && !name.dock) {
      this.layer.setVisible(true);
      this.dockLayer.setVisible(false);
      this.dockSmallLayer.setVisible(false);
    } else if (name.dock && !name.bike) {
      this.dockLayer.setVisible(true);
      this.dockSmallLayer.setVisible(true);
      this.layer.setVisible(false);
    } else if (name.bike && name.dock) {
      this.dockLayer.setVisible(true);
      this.dockSmallLayer.setVisible(true);
      this.layer.setVisible(true);
    } else {
      this.dockLayer.setVisible(false);
      this.layer.setVisible(false);
      this.dockSmallLayer.setVisible(false);
    }
  }

  closeDockView() {
    this.isDockViewOpened = false;
    this.isSideNavOpened = false;
    this.selectedFeature.getFeatures().clear();
  }

  getDockingStationStatsByDockingStationMode() {
    if (this.dsModeId)
      this.dsViewLoaded = true;
    else
      this.dsViewLoaded = false;
    this.isFilterLoading = true;
    observableForkJoin(
      this.stationService.getDockingStations(false),
      this.stationService.getDockingStationStatsByDockingStationMode(this.dsModeId),
      this.issueService.getAllActiveDockingPointErrorReports()
    ).subscribe(result => {
      this.allDockingStations = result[0];
      this.dockingStationStats = result[1];
      this.alldockingStationStats = result[1];
      this.allActiveDPErrReps = result[2];
      this.mapDockingPointData();
    }, err => {
      this.loggerService.showErrorMessage("Unexpected error occurred while loading docking station statistics");
      this.isFilterLoading = false;
    });
  }

  private mapDockingPointData() {
    if (this.dockingStationStats) {
      this.dockingStationStats.map(x => {
        x.DockingPoints = x.DockingPoints.filter(dp => !dp.IsDeleted);
        return;
      });
      this.statsCount = this.dockingStationStats.map(x => x.DockingPoints).reduce((prev, cur) => prev + cur.length, 0);
      this.dockingStationStats.map(ds => ds.DockingPoints.map(dockingPoint => this.translateDPState(dockingPoint, ds)));

      //map DP error reports
      this.dockingStationStats.map(x => {
        if (x.DockingPoints) {
          x.DockingPoints.map(dp => {
            let errorReport = this.allActiveDPErrReps.find(err => err.DockingPointId == dp.DockingPointId);
            dp["errorReport"] = errorReport;
          });
          return;
        }
        return;
      });

      //Include docking station address
      this.dockingStationStats.forEach((item) => {
        item.dockingStationAddress = AddressExtension.GetShortAddressStr(this.allDockingStations.find(x => x.DockingStationId == item.DockingStationId).Address);
      });

      this.isFilterLoading = false;
      this.isFilterLoading = false;
      let filteredDockingStationList = this.allDockingStations.filter(i => this.dockingStationStats.findIndex(x => x.DockingStationId == i.DockingStationId) >= 0);
      this.cleanMap();
      this.loadDocks(filteredDockingStationList);
    }
  }

  translateDPState(dockingPoint, dockingStation) {
    let translateLabel = "";
    if (dockingPoint.DPDisabledReason != DockingPointDisabledReason.OutOfService) {
      if (dockingPoint.DPDisabledReason == DockingPointDisabledReason.ShouldBeChecked)
        translateLabel = "DASHBOARD.DP_SHOULD_BE_CHECKED";
      else if (dockingPoint.DPDisabledReason == DockingPointDisabledReason.CheckRequired)
        translateLabel = "DASHBOARD.DP_CHECK_REQUIRED";
      this.translate.get(translateLabel).subscribe(translatedText => {
        dockingPoint.DisplayText = translatedText;
      });
    }
    else
      dockingPoint.DisplayText = dockingStation.DisabledReason;
  }

  openDockingPointDetails(dsDetails: any, dsName: any) {
    const dialogOpenDPRef = this.dialog.open(DockingPointDetailsPopupComponent, {
      width: '500px',
      height: '700px',
      data: {
        "dockingStationName": dsName,
        "dpVisualId": dsDetails["VisualId"],
        "dpId": dsDetails["DockingPointId"],
        "dpDisabled": dsDetails["DPDisabled"],
        "dpDisabledReason": dsDetails["DPDisabledReason"],
        "dpErrorCategories": this.dpErrorCategories,
        "isBikeExist": (dsDetails["Bike"]) ? true : false,
        "isDashboardFilter": true
      }
    });

    dialogOpenDPRef.afterClosed().subscribe(result => {
      if (result && result["IsDPOkay"]) {
        const dialogConfirmRef = this.dialog.open(ConfirmationDpCheckPopupComponent, {
          disableClose: true,
          width: '500px',
          height: '300px',
          data: {
            "dpVisualId": dsDetails["VisualId"]
          }
        });
      }
      else if (result && result["IsDPRepairRequired"]) {
        const dialogDPErrorReportRef = this.dialog.open(DockingPointErrorReportPopupComponent, {
          disableClose: true,
          width: '500px',
          maxHeight: '90vh',
          data: {
            "dpVisualId": dsDetails["VisualId"],
            "dpErrorCategories": this.dpErrorCategories
          }
        });
        dialogDPErrorReportRef.afterClosed().subscribe(result => {
          if (result) {
            let dpErrorReportDto = result["dpErrorReportDto"];
            dpErrorReportDto["DockingStationId"] = dsDetails["DockingStationId"];
            dpErrorReportDto["DockingPointId"] = dsDetails["DockingPointId"];
            this.createDPIssue(dpErrorReportDto, dsDetails["VisualId"]);
          }
        });
      }
      else if (result && result["IsDPRepaired"]) {
        this.enableDockingPoint(dsDetails["VisualId"]);
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
    this.issueService.createDPIssue(dpErrorReportDto).subscribe(res => {
      if (res) {
        this.getDockingStationStatsByDockingStationMode();
      }
    }, err => { });
  }

  enableDockingPoint(dpVisualId: any) {
    this.getDockingStationStatsByDockingStationMode();
  }

  onDockingStationFilter(event: any) {
    let dockingStationStats = [];
    this.alldockingStationStats.forEach(val => dockingStationStats.push(Object.assign({}, val)));
    if (event.value == DashboardDPFilter.ALL)
      this.dockingStationStats = dockingStationStats;
    else if (event.value == DashboardDPFilter.SHOULD_BE_CHECKED_DP) {
      let filteredDPStats = [];
      dockingStationStats.forEach(stat => {
        let isExist = stat.DockingPoints.some(dp => dp.DPDisabledReason == DockingPointDisabledReason.ShouldBeChecked);
        if (isExist) {
          stat.DockingPoints = stat.DockingPoints.filter(dp => dp.DPDisabledReason == DockingPointDisabledReason.ShouldBeChecked);
          filteredDPStats.push(stat);
        }
      });
      this.dockingStationStats = filteredDPStats;
    }
    else if (event.value == DashboardDPFilter.CHECKED_AND_DISABLED_DP) {
      let filteredDPStats = [];
      dockingStationStats.forEach(stat => {
        let isExist = stat.DockingPoints.some(dp => dp.DPDisabledReason == DockingPointDisabledReason.CheckRequired);
        if (isExist) {
          stat.DockingPoints = stat.DockingPoints.filter(dp => dp.DPDisabledReason == DockingPointDisabledReason.CheckRequired);
          filteredDPStats.push(stat);
        }
      });
      this.dockingStationStats = filteredDPStats;
    }
    this.mapDockingPointData();
  }

  openDockingStationDetails(dockingStationId: any) {
    let authToken = JSON.parse(localStorage.getItem(LocalStorageKeys.OAUTH_TOKEN));
    if (authToken._claims) {
      let userRole = authToken._claims[0];
      if (userRole == UserRoles.STREET_TEAM)
        this.router.navigateByUrl('dockingStations/live;general=1;stationId=' + dockingStationId);
      else
        this.router.navigate([`/dockingStations/${dockingStationId}/dockingpoints`]);
    }
  }

  resetUndockFailureCountByBike() {
    this.bikesService.resetUndockFailureCountByBike(this.bikeId)
      .subscribe(data => {
      }, error => {
      });
  }


  openRepairRegistrationPopup() {
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
        'userWorkshopId': this.userWorkshopId
      },
      autoFocus: false
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        //added this flag to handle auto refresh of bike details
        this.bike.Disabled = true;
        this.bike.DisableState = BikeDisableState.RepairFinished;
        this.bike["BikeStatus"] = BikeStatus.RepairFinished;
        let bikeStateChangeDTO = { Disabled: true, DisabledReason: BikeDisableState.RepairFinished };
        this.DisableBike(bikeStateChangeDTO);

        //bike service details create or update
        var bikeServiceDTO = { NumberOfChecks: this.bike.NumberOfChecks, BikeId: this.bikeId }
        this.CreateOrUpdateBikeService(bikeServiceDTO);

        this.ResolveIssuePerBike(this.bikeId);
        this.clearWorkshopRepairCategories();
        this.isSideNavOpened = false;
      }
      else {
        this.clearWorkshopRepairCategories();
        this.isSideNavOpened = false;
      }
    });
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

  openAvgSumOperationalBikes() {
    const dialogRef = this.dialog.open(BikesSumOperatonalDialogPopupComponent, {
      width: '700px',
      height: '750px',
      data: { dashboardCategory: this.bikeModeId }
    });
    dialogRef.afterClosed().subscribe(result => {

    });
  }

}
