import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';

import { DockingStation } from '../../core/models';
import { DockingStationExtension, MapExtension } from '../../core/extensions';

// openlayers depedencies
import OlMap from 'ol/map';
import BingMaps from 'ol/source/bingmaps';
import OlTileLayer from 'ol/layer/tile';
import OlVector from 'ol/source/vector';
import OlVectorLayer from 'ol/layer/vector';
import OlView from 'ol/view';
import OlProj from 'ol/proj';
import OlFeature from 'ol/feature';
import OlPoint from 'ol/geom/point';
import OlPolygon from 'ol/geom/polygon';
import OlOverlay from 'ol/overlay';
import OlSelect from 'ol/interaction/select';
import OlCondition from 'ol/events/condition';
import { SettingsService, AppSettings, LoggerService } from '../../services';
import OlControl from "ol/control";
import OlAttribution from "ol/control/attribution";
@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements OnInit {
  @ViewChild('map', { static: true }) mapElement: ElementRef;
  @ViewChild('popup', { static: true }) popupElement: ElementRef;

  map: OlMap;
  source: OlVector;
  layer: OlVectorLayer;
  popup: OlOverlay;
  onClick: OlSelect;
  lastExtent: any;
  dockingStationId: any;
  colors = [{ "color": "#5677FC", "description": "Bikes Available", "languageKey": "DOCKING_STATION.BIKES_AVAILABLE" },
  { "color": "#F5A623", "description": "Points Available", "languageKey": "DOCKING_STATION.POINTS_AVAILABLE" },
  { "color": "#259B23", "description": "Bikes & Points Available", "languageKey": "DOCKING_STATION.BIKES_&_POINTS_AVAILABLE" },
  { "color": "#484848", "description": "Full", "languageKey": "DOCKING_STATION.FULL" },

  ];

  //show satelite mode map toggle
  isSateliteMode: boolean = false;
  tileLayer: OlTileLayer;
  bingLabelsLayer: OlTileLayer;

  constructor(
    private router: Router,
    private settingsService: SettingsService,
    private appSettings: AppSettings,
    private loggerService: LoggerService,
  ) {
    this.dockingStationId = this.router.url.split('/')[2];
  }

  ngOnInit() {

    this.initializeMap();

  }

  initializeMap() {

    // vecor source that hold the features
    this.source = new OlVector({
      wrapX: false
    });

    // layer that contains the vector source
    this.layer = new OlVectorLayer({
      // style: style,
      style: (f, r) => this.styleFunction(f, r),
      source: this.source
    });

    // map layer
    this.tileLayer = MapExtension.getOSMTileLayer();

    this.bingLabelsLayer = new OlTileLayer({
      visible: false,
      source: new BingMaps({
        key: this.appSettings.bing_map_key,
        imagerySet: 'AerialWithLabels'
      })
    });

    //default disable satelite view
    this.bingLabelsLayer.setVisible(false);

    // map view
    let view = new OlView({
      center: OlProj.fromLonLat(this.appSettings.map_center_position),
      zoom: 15,
    });

    // create map instance
    this.map = new OlMap({
      controls: OlControl.defaults().extend([new OlAttribution()]),
      layers: [this.tileLayer, this.bingLabelsLayer, this.layer],
      view: view
    });

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

    this.map.setTarget(this.mapElement.nativeElement);
  }

  // Interactions

  // Single click
  getOnClickInteraction(): OlSelect {
    let select = new OlSelect();
    select.on('select', (event) => {
      if (event.selected.length > 0) {
        let features = event.target.getFeatures().getArray();
        let feature = features[0];
        let data: DockingStation = feature.get('data');
        this.router.navigate([`/dockingStations/${data.DockingStationId}/dockingpoints`])
      }
    });
    return select;
  }

  // Mouse hover
  getOnHoverInteracion(): OlSelect {
    let select = new OlSelect({
      condition: OlCondition.pointerMove,
      style: (f, r) => this.interactionStyleFunction(f, r)
    });
    select.on('select', (event) => {
      if (event.selected.length > 0) {
        let features = event.target.getFeatures().getArray();
        let feature = features[0];
        let data: DockingStation = feature.get('data');

        // change cursor to pointer
        this.mapElement.nativeElement.style.cursor = 'pointer';

        // show popup
        this.popup.setPosition(event.mapBrowserEvent.coordinate);
        this.popupElement.nativeElement.style.display = '';
        this.popupElement.nativeElement.innerHTML =
          `<span>${data.Name}</span><br/>
           <span>${data.AddressStr}</span>
          `;
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

  styleFunction(feature: OlFeature, resolution) {
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

  interactionStyleFunction(feature: OlFeature, resolution) {
    let data = {};
    data["StationStatus"] = "#FF2C00";
    let styles = MapExtension.getDockingStationsStyles(true);
    let text = '';
    if (resolution < 19) {
      text = MapExtension.getFeatureName(feature);
    };
    styles[1].getText().setText(text);
    return styles;
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
      data: station
    });

    feature.setId(station.DockingStationId);
    return feature;
  }

  public addDockingStation(station: DockingStation, centerToPoint: boolean = true): void {

    let point = [station.Position.Longitude, station.Position.Latitude];
    let projectedPoint = OlProj.fromLonLat(point);

    station.AddressStr = DockingStationExtension.GetAddress(station.Address);

    let areaFeature = this.getDockingStationAreaFeature(station);
    this.source.addFeature(areaFeature);

    if (centerToPoint) {
      this.map.getView().setCenter(projectedPoint);
    }
  }

  public addDockingStations(stations: DockingStation[]): void {

    for (let station of stations) {
      this.addDockingStation(station, false);
    }

    if (stations && stations.length > 0) {
      if (this.dockingStationId === 'map') {
        this.fitToLastExtent();
      } else {
        this.zoomToExtent();
      }
    }

  }

  private zoomToExtent(): void {
    if (this.layer) {
      let extent = this.source.getExtent();
      this.map.getView().fit(extent, this.map.getSize());
    }
  }

  fitToLastExtent(): void {
    this.lastExtent = this.settingsService.getLastDockingStationMapExtent();
    if (this.lastExtent != null) {
      this.map.getView().fit(this.lastExtent, { constrainResolution: false });
    } else {
      this.zoomToExtent();
    }
  }


  setCurrentExtent() {
    // let extent = this.map.previousExtent_;
    let extent = this.map.getView().calculateExtent(this.map.getSize());
    this.settingsService.setLastDockingStationMapExtent(extent);
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

}
