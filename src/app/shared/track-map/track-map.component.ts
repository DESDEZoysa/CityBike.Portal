import { DockingStation } from "./../../core/models/dock/docking-station";
import { Component, OnInit, ElementRef, ViewChild, Input } from "@angular/core";
import {
  BikesService,
  LoggerService,
  SettingsService,
  AppSettings,
  DockingStationService,
} from "../../services";
import { Router, ActivatedRoute } from "@angular/router";
import { Bike } from "../../core/models";

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
import OlLineString from "ol/geom/linestring";
import OlOverlay from "ol/overlay";
import OlSelect from "ol/interaction/select";
import OlCondition from "ol/events/condition";
import { Subscription } from "rxjs";
import { MapSettingsService } from "../../services/map-settings.service";
import BingMaps from "ol/source/bingmaps";
import { MapTypes } from "../../core/enums/mapTypes";
import OSM from "ol/source/osm";
import { NgxSpinnerService } from "ngx-spinner";
import { ConvertTimePipe } from "../../core/pipes/convert-time.pipe";
import OlControl from "ol/control";
import OlAttribution from "ol/control/attribution";
import * as moment from 'moment';
import { BikeDisableState } from "../../core/enums/bikeDisableState";
import { TranslateService, LangChangeEvent } from "@ngx-translate/core";
import { LocalStorageKeys } from "../../core/constants";

const ALL: string = "all";
const ON_TRIPS: string = "ontrips";
const NOT_ON_TRIPS: string = "notontrips";

@Component({
  selector: "app-track-map",
  templateUrl: "./track-map.component.html",
  styleUrls: ["./track-map.component.scss"],
  providers: [ConvertTimePipe],
})
export class TrackMapComponent implements OnInit {
  @ViewChild("trackmap", { static: true }) mapElement: ElementRef;
  @ViewChild("popup", { static: true }) popupElement: ElementRef;

  @Input() from: any;
  @Input() to: any;
  @Input() isLastKnown: any;

  count = 0;
  resultSet;
  bikes: Bike;
  bikeId: any;
  positionObservationId = 300;

  map: OlMap;
  source: OlXYZ;
  layer: OlTileLayer;
  style: OlStyle;
  popup: OlOverlay;
  onClick: OlSelect;
  lastExtent: any;
  subscription: Subscription;
  scaleMap: boolean = false;
  showlegend = false;
  baseLayer: any;
  cartoLightLayer: any;
  openSeaLayer: any;
  bingLayer: any;
  bingLabelsLayer: any;
  dockLayer: any;
  dockingStations: DockingStation[];
  lastKnownPositionDet: any;
  formattedMiddleTrans: string = "";
  isPositionObsBefore: boolean;
  selectedLanguage: string;

  constructor(
    private bikesService: BikesService,
    private settingsService: SettingsService,
    private mapSettings: MapSettingsService,
    private appSettings: AppSettings,
    private router: Router,
    private route: ActivatedRoute,
    private loggerService: LoggerService,
    private spinner: NgxSpinnerService,
    private convertTime: ConvertTimePipe,
    private stationService: DockingStationService,
    private translate: TranslateService
  ) {
    this.bikeId = route.snapshot.params["id"];

    if (
      this.bikeId == ALL ||
      this.bikeId == ON_TRIPS ||
      this.bikeId == NOT_ON_TRIPS
    ) {
      this.scaleMap = true;
      this.showlegend = true;
    }

    this.mapSettings.start$.subscribe((res) => {
      if (this.map) {
        this.adjustLayers(res);
      }
    });

    this.translate.onLangChange.subscribe((params: LangChangeEvent) => {
      if (this.isPositionObsBefore) {
        this.translate.get("COMMON.CHECKED_IN").subscribe(translatedText => {
          this.formattedMiddleTrans = translatedText;
        });
      }
      else {
        this.translate.get("COMMON.UPDATED").subscribe(translatedText => {
          this.formattedMiddleTrans = translatedText;
        });
      }

      //only refresh map when language changed
      if (this.selectedLanguage && this.isLastKnown) {
        this.cleanMap();
        this.updateLastKnownPosition();
      }
      this.selectedLanguage = params.lang;
    });
  }

  ngOnInit() {
    this.initializeMap();
    this.getAllDockingStations();
  }

  ngOnChanges() {
    if (!this.isLastKnown && this.from != this.to) {
      this.loadBikePositions();
    } else if (this.isLastKnown) {
      //last known position of the bike
      this.updateLastKnownPosition();
    }
    if (this.count > 0) {
      this.cleanMap();
    }
  }

  initializeMap() {
    let selectedMap = this.mapSettings.getDefaultMap();

    this.source = new OlVector({
      wrapX: false,
    });

    // this.style = this.getMarkerStyle();

    this.layer = new OlVectorLayer({
      style: (f, r) => this.styleFunction(f, r),
      source: this.source,
    });

    this.dockLayer = new OlVectorLayer({
      style: (f, r) => this.styleFunction(f, r),
      source: new OlVector({}),
    });

    // let tileLayer = new OlTileLayer({
    //   source: new OlXYZ({
    //     crossOrigin: null,
    //     url: 'https://cartodb-basemaps-{a-c}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png'
    //   })
    // });

    const osm_layers: any[] = this.getOSMLayers();
    osm_layers.push(this.layer);
    osm_layers.push(this.dockLayer);

    let view = new OlView({
      center: OlProj.fromLonLat(this.appSettings.map_center_position),
      zoom: 15,
    });

    this.map = new OlMap({
      controls: OlControl.defaults().extend([new OlAttribution()]),
      layers: osm_layers,
      view: view,
    });

    // add select interaction for single-click
    this.map.addInteraction(this.getOnClickInteraction());
    // add select interaction for on hover
    this.map.addInteraction(this.getOnHoverInteracion());

    // overlay/popup that will show on mouse hover
    this.popup = new OlOverlay({
      element: this.popupElement.nativeElement,
      offset: [10, 10],
    });

    this.map.addOverlay(this.popup);

    if (this.map) this.adjustLayers(selectedMap);

    this.map.setTarget(this.mapElement.nativeElement);
  }

  getOnClickInteraction(): OlSelect {
    let select = new OlSelect();
    select.on("select", (event) => {
      if (event.selected.length > 0) {
        let features = event.target.getFeatures().getArray();
        let feature = features[0];
        let data = feature.get("data");
        this.router.navigate([`/bikes/${data.BikeId}/details`]);
      }
    });
    return select;
  }

  getOnHoverInteracion(): OlSelect {
    let select = new OlSelect({
      condition: OlCondition.pointerMove,
      style: (f, r) => this.interactionStyleFunction(f, r),
    });
    select.on("select", (event) => {
      if (event.selected.length > 0) {
        let features = event.target.getFeatures().getArray();
        let feature = features[0];
        let data = feature.get("data");
        let type = feature.get("type");
        // show popup
        if (data) {
          // change cursor to pointer
          this.mapElement.nativeElement.style.cursor = "pointer";

          this.popup.setPosition(event.mapBrowserEvent.coordinate);
          this.popupElement.nativeElement.style.display = "";
          let convertType = JSON.parse(localStorage.getItem(LocalStorageKeys.PREFERRED_TIMEZONE));
          if (type == "bike" || type == "lastKnown") {
            let popupElementHTML = `<span>Visual Id:${data.VisualId
              }</span><br/>`;
            if (!convertType) {
              popupElementHTML += `<span>Timestamp:${this.convertTime.transform(data.TimeStamp)}</span><br/>`;
            }
            else if (convertType) {
              if (convertType == "CET")
                popupElementHTML += `<span>Timestamp:${this.convertTime.transform(data.TimeStamp)} ${convertType}</span><br/>`;
              else
                popupElementHTML += `<span>Timestamp:${this.convertTime.transform(data.TimeStamp)}</span><br/>`;
            }
            popupElementHTML += `<span>Longitude:${data.Longitude}</span><br/>
             <span>Latitude :${data.Latitude}</span><br/>
             <span>Altitude :${data.Altitude}</span><br/>`;
            this.popupElement.nativeElement.innerHTML = popupElementHTML;
          } else if (type == "station") {
            // reset cursor
            this.mapElement.nativeElement.style.cursor = "";
            // hide popup
            this.popupElement.nativeElement.style.display = "none";
          }
        }
      } else if (event.deselected.length > 0) {
        // reset cursor
        this.mapElement.nativeElement.style.cursor = "";
        // hide popup
        this.popupElement.nativeElement.style.display = "none";
      }
    });
    return select;
  }

  styleFunction(feature: OlFeature, resolution) {
    let style;
    let type = feature.get("type");
    if (type == "bike") {
      style = this.getLayerStyle(false);
    } else if (type == "station") {
      style = this.getDockLayerStyle(false);
    }
    style.getText().setText(resolution < 19 ? feature.get("name") : "");
    return style;
  }

  interactionStyleFunction(feature: OlFeature, resolution) {
    let style;
    let type = feature.get("type");
    if (type == "bike") {
      style = this.getLayerStyle(true);
    } else if (type == "station") {
      style = this.getDockLayerStyle(true);
    }
    style.getText().setText(resolution < 19 ? feature.get("name") : "");
    return style;
  }

  loadBikePositions() {
    this.spinner.show();
    this.scaleMap = false;

    this.bikesService
      .getBikePositionDetails(
        this.bikeId,
        this.positionObservationId,
        this.from,
        this.to
      )
      .subscribe(
        (data) => {
          this.resultSet = data;
          //If no observations, them take last known location from bike details
          if (data["Observations"] != null && data["Observations"].length > 0) {
            this.updatePositionsOnMap(
              data["Observations"],
              data["BikeDetails"].VisualId,
              true,
              data["BikeDetails"]
            );
            this.spinner.hide();
          } else {
            //commented because timestamp for last position is not the last pulse time in DB
            //this.updatePositionsOnMap(data["BikeDetails"].Position, data["BikeDetails"].VisualId, false, data["BikeDetails"]);
            this.loggerService.showWarningMessage(
              "Position details not found for given time period."
            );
            this.spinner.hide();
          }
        },
        (error) => {
          this.loggerService.showErrorMessage(
            "Error while getting bike position details."
          );
          this.spinner.hide();
        }
      );
  }

  updatePositionsOnMap(
    data: any[],
    visualId: string,
    isObservation: boolean,
    bike: any
  ) {
    let points = [];
    //Create from bike posisiton
    if (!isObservation) {
      let pointFeature = new OlFeature({
        geometry: new OlPoint(
          OlProj.transform(
            [data["Longitude"], data["Latitude"]],
            "EPSG:4326",
            "EPSG:3857"
          )
        ),
        name: visualId.toString(),
        data: this.getMapPoint(data, visualId, bike.BikeId, bike.LatestPulse),
        type: "bike",
      });
      this.source.addFeature(pointFeature);

      points.push([data["Longitude"], data["Latitude"]]);
    }

    //Create from bike observations
    let index = 0;
    for (let position of data) {
      let pointFeature = new OlFeature({
        geometry: new OlPoint(
          OlProj.transform(
            [position.Value.Longitude, position.Value.Latitude],
            "EPSG:4326",
            "EPSG:3857"
          )
        ),
        name: index == data.length - 1 ? visualId.toString() : "",
        data: this.getMapPoint(
          position.Value,
          visualId,
          bike.BikeId,
          position.Timestamp
        ),
        type: "bike",
      });
      points.push([position.Value.Longitude, position.Value.Latitude]);
      this.source.addFeature(pointFeature);
      index++;
    }

    // Draw line
    let lineFeature = new OlFeature({
      geometry: new OlLineString(points).transform("EPSG:4326", "EPSG:3857"),
      // data: {
      //   VisualId: visualId.toString()
      // }
      type: "bike",
    });
    this.source.addFeature(lineFeature);

    //Set zoom level based on content loading
    if (
      this.bikeId == ALL ||
      this.bikeId == ON_TRIPS ||
      this.bikeId == NOT_ON_TRIPS
    ) {
      this.fitToLastExtent();
    } else {
      this.zoomToExtent();
    }

    this.map.updateSize();
    this.count++;
  }

  //Define map zoom to the location
  private zoomToExtent(): void {
    if (this.layer) {
      let extent = this.source.getExtent();
      this.map.getView().fit(extent, { size: this.map.getSize(), maxZoom: 18 });
    }
  }

  getMapPoint(position: any, visualId, bikeId, TimeStamp) {
    let point = {
      Longitude: position.Longitude,
      Latitude: position.Latitude,
      Altitude: position.Altitude,
      VisualId: visualId.toString(),
      BikeId: bikeId,
      TimeStamp: TimeStamp,
    };
    return point;
  }

  private getLayerStyle(highlighted = false): OlStyle {
    let featureColor = highlighted ? "#FF2C00" : "#04A3E3";
    let featureFillColor = highlighted ? "transparent" : [255, 255, 255, 1];
    let imageRadius = highlighted ? 8 : 5;
    let strokeWidth = highlighted ? 2 : 1.5;

    let style = new OlStyle({
      image: new OlCircle({
        radius: imageRadius,
        fill: new OlFill({
          color: featureFillColor,
        }),
        stroke: new OlStroke({
          color: featureColor,
          width: strokeWidth,
        }),
      }),
      stroke: new OlStroke({
        color: featureColor,
        width: strokeWidth,
      }),
      text: new OlText({
        font: `bold 11px Roboto, "Helvetica Neue", sans-serif`,
        // offsetX: 10,
        offsetY: -15, // 0
        textAlign: "left",
        placement: "point",
        fill: new OlFill({
          color: "#000",
        }),
        stroke: new OlStroke({
          color: "#FFF",
          width: 4,
        }),
      }),
    });
    return style;
  }

  private getDockLayerStyle(highlighted = false): OlStyle {
    let style = new OlStyle({
      image: new OlIcon({
        src: "/assets/images/map-icons/ds-bike-track.svg",
        scale: highlighted ? 1.2 : 1,
      }),
      stroke: new OlStroke({
        color: "#00AA50",
        width: 1,
      }),
      text: new OlText({
        font: `bold 11px Roboto, "Helvetica Neue", sans-serif`,
        // offsetX: 10,
        offsetY: -15, // 0
        textAlign: "left",
        placement: "point",
        fill: new OlFill({
          color: "#000",
        }),
        stroke: new OlStroke({
          color: "#FFF",
          width: 4,
        }),
      }),
    });
    return style;
  }

  cleanMap() {
    let features = this.source.getFeatures();
    if (features.length != 0) {
      features.forEach((feature) => {
        this.source.removeFeature(feature);
      });
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

  public getOSMLayers(): any[] {
    let layers = [];
    this.cartoLightLayer = new OlTileLayer({
      source: new OlXYZ({
        crossOrigin: null,
        // url: 'http://{a-c}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
        url: "https://cartodb-basemaps-{a-c}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png",
        attributions: "© OpenStreetMap",
      }),
    });
    this.baseLayer = new OlTileLayer({
      source: new OSM({
        attributions: "© OpenStreetMap",
      }),
    });

    this.bingLayer = new OlTileLayer({
      visible: false,
      source: new BingMaps({
        key: this.appSettings.bing_map_key,
        imagerySet: "Aerial",
      }),
    });
    this.bingLabelsLayer = new OlTileLayer({
      visible: false,
      source: new BingMaps({
        key: this.appSettings.bing_map_key,
        imagerySet: "AerialWithLabels",
      }),
    });
    layers.push(this.cartoLightLayer);
    layers.push(this.baseLayer);
    layers.push(this.bingLayer);
    layers.push(this.bingLabelsLayer);

    return layers;
  }

  public adjustLayers(name) {
    if (name == MapTypes.mapColorGray) {
      this.baseLayer.setVisible(false);
      this.cartoLightLayer.setVisible(true);
      this.bingLayer.setVisible(false);
      this.bingLabelsLayer.setVisible(false);
    } else if (name == MapTypes.mapSatellite) {
      this.baseLayer.setVisible(false);
      this.cartoLightLayer.setVisible(false);
      this.bingLayer.setVisible(true);
      this.bingLabelsLayer.setVisible(false);
    } else if (name == MapTypes.mapSatelliteWithNames) {
      this.baseLayer.setVisible(false);
      this.cartoLightLayer.setVisible(false);
      this.bingLayer.setVisible(false);
      this.bingLabelsLayer.setVisible(true);
    } else if (name == MapTypes.mapColor) {
      this.baseLayer.setVisible(true);
      this.cartoLightLayer.setVisible(false);
      this.bingLayer.setVisible(false);
      this.bingLabelsLayer.setVisible(false);
    }
  }

  getAllDockingStations() {
    this.stationService.getDockingStationsByArea(false).subscribe(
      (result) => {
        this.dockingStations = result;
        this.updateDockingStationMap();
      },
      (err) => {
        this.loggerService.showErrorMessage(
          "Error while loading docking stations"
        );
      }
    );
  }

  updateDockingStationMap() {
    for (let station of this.dockingStations) {
      this.addDockingStation(station);
    }
  }

  public addDockingStation(station: DockingStation): void {
    let polygonText = station.Geometry;
    polygonText = polygonText.substring(7);
    polygonText = polygonText
      .replace(/\(/g, "[")
      .replace(/\)/g, "]")
      .replace(/\,/g, "],[")
      .replace(/ /g, ",");
    let points = JSON.parse(polygonText);
    let pointFeature = new OlFeature({
      name: station["Name"].toString(),
      geometry: new OlPoint(
        OlProj.transform(
          [station["Position"]["Longitude"], station["Position"]["Latitude"]],
          "EPSG:4326",
          "EPSG:3857"
        )
      ),
      type: "station",
    });
    let dockSource = this.dockLayer.getSource();
    dockSource.addFeature(pointFeature);

    // Draw docking station radius
    let lineFeature = new OlFeature({
      geometry: new OlLineString(points).transform("EPSG:4326", "EPSG:3857"),
      type: "station",
    });
    dockSource.addFeature(lineFeature);
  }

  updateLastKnownPosition() {
    this.spinner.show();
    this.scaleMap = false;

    let currentObservations = { ObservationIds: [300] };
    this.bikesService
      .getLastKnownObservation(this.bikeId, currentObservations)
      .subscribe(
        (data) => {
          let coordinates;
          let positionObs = data["CurrentObservations"];
          if (positionObs && positionObs[0]["Observations"]) {
            let coordinatesText = positionObs[0]["Observations"][0]["Value"];
            if (coordinatesText) {
              coordinates = coordinatesText.split(",");
              data["BikeDetails"]["Latitude"] = parseFloat(coordinates[0]);
              data["BikeDetails"]["Longitude"] = parseFloat(coordinates[1]);
              data["BikeDetails"]["Altitude"] = parseFloat(coordinates[2]);

              data["PositionObs"] = [
                {
                  Value: {
                    Latitude: parseFloat(coordinates[0]),
                    Longitude: parseFloat(coordinates[1]),
                    Altitude: parseFloat(coordinates[2]),
                  },
                  Timestamp: this.convertTime.transform(
                    positionObs[0]["Observations"][0]["Timestamp"]
                  ),
                },
              ];
              this.lastKnownPositionDet = data;
              let bikeDetails = this.lastKnownPositionDet["BikeDetails"];
              this.updateLastKnownPositionOnMap(
                this.lastKnownPositionDet["PositionObs"],
                bikeDetails["VisualId"],
                bikeDetails
              );
            }
          }
          this.spinner.hide();
        },
        (error) => {
          this.loggerService.showErrorMessage(
            "Error while getting last known bike position details."
          );
          this.spinner.hide();
        }
      );
  }

  updateLastKnownPositionOnMap(data: any[], visualId: string, bike: any) {
    for (let position of data) {
      //by default set visual Id when no position received
      let formattedBikeText = visualId.toString();

      //format position received timestamp with visual ID when available
      let formattedLastPositionOn = "";
      this.formattedMiddleTrans = "";
      this.isPositionObsBefore = false;
      let lastKnownPositionDate = position.Timestamp;
      if (bike["Disabled"] &&
        (
          bike["DisabledReason"] == BikeDisableState.InWorkshop ||
          bike["DisabledReason"] == BikeDisableState.InStorage
        )
      ) {
        if (bike["LastDisabledDate"]) {
          let disabledDateFormatted = moment(this.convertTime.transform(bike["LastDisabledDate"]));
          let positionDateFormatted = moment(this.convertTime.transform(position.Timestamp));
          this.isPositionObsBefore = positionDateFormatted.isBefore(disabledDateFormatted);
          if (this.isPositionObsBefore) {
            formattedLastPositionOn = this.formatBikePositionReportedDate(disabledDateFormatted);
            lastKnownPositionDate = bike["LastDisabledDate"];
          }
          else
          formattedLastPositionOn = this.formatBikePositionReportedDate(moment(this.convertTime.transform(position.Timestamp)));
        }
        else
          formattedLastPositionOn = this.formatBikePositionReportedDate(moment(this.convertTime.transform(position.Timestamp)));

        this.translate.get("COMMON.CHECKED_IN").subscribe(translatedText => {
          this.formattedMiddleTrans = translatedText;
        });
      }
      else {
        formattedLastPositionOn = this.formatBikePositionReportedDate(moment(this.convertTime.transform(position.Timestamp)));
        this.translate.get("COMMON.UPDATED").subscribe(translatedText => {
          this.formattedMiddleTrans = translatedText;
        });
      }

      if (formattedLastPositionOn)
        formattedBikeText = `${formattedBikeText} ${this.formattedMiddleTrans} ${formattedLastPositionOn}`;

      let pointFeature = new OlFeature({
        geometry: new OlPoint(
          OlProj.transform(
            [position.Value.Longitude, position.Value.Latitude],
            "EPSG:4326",
            "EPSG:3857"
          )
        ),
        name: formattedBikeText,
        data: this.getMapPoint(
          position.Value,
          visualId,
          bike.BikeId,
          lastKnownPositionDate
        ),
        type: "bike",
      });
      this.source.addFeature(pointFeature);
    }

    //Set zoom level based on content loading
    if (
      this.bikeId == ALL ||
      this.bikeId == ON_TRIPS ||
      this.bikeId == NOT_ON_TRIPS
    ) {
      this.fitToLastExtent();
    } else {
      this.zoomToExtent();
    }

    this.map.updateSize();
    this.count++;
  }

  formatBikePositionReportedDate(lastPositionOn) {
    let convertType = JSON.parse(localStorage.getItem(LocalStorageKeys.PREFERRED_TIMEZONE));
    let formattedLastPositionOn = moment(lastPositionOn).utc().format("MMM Do HH:mm");
    let now = moment(this.convertTime.transform(moment().utc().format()));
    let dateDifference = now.diff(lastPositionOn);

    let startOfToday = moment().utc().startOf('day');
    let startOfYesterday = moment().utc().subtract(1, 'day').startOf('day');
    let durationInDays = moment.duration(dateDifference).asDays();

    if (durationInDays < 8) {
      if (lastPositionOn.isSameOrAfter(startOfToday,'day')) {
        formattedLastPositionOn = `Today ${moment(lastPositionOn).utc().format("HH:mm")}`;
      } else if (lastPositionOn.isSameOrAfter(startOfYesterday,'day') && lastPositionOn.isBefore(startOfToday)) {
        formattedLastPositionOn = `Yesterday ${moment(lastPositionOn).utc().format("HH:mm")}`;
      } else
      formattedLastPositionOn = `Last ${moment(lastPositionOn).utc().format("dddd HH:mm")}`;
    }

    if (convertType == "CET") {
      formattedLastPositionOn = moment(lastPositionOn).format("MMM Do HH:mm");
      now = moment(this.convertTime.transform(moment().tz("Europe/Berlin").format()));
      dateDifference = now.diff(lastPositionOn);
      durationInDays = moment.duration(dateDifference).asDays();

      if (durationInDays < 8) {
        if (lastPositionOn.isSameOrAfter(startOfToday,'day')) {
          formattedLastPositionOn = `Today ${moment(lastPositionOn).format("HH:mm")}`;
        } else if (lastPositionOn.isSameOrAfter(startOfYesterday,'day') && lastPositionOn.isBefore(startOfToday)) {
          formattedLastPositionOn = `Yesterday ${moment(lastPositionOn).format("HH:mm")}`;
        } else
          formattedLastPositionOn = `Last ${moment(lastPositionOn).format("dddd HH:mm")}`;
      }
    }
    return formattedLastPositionOn;
  }
}
