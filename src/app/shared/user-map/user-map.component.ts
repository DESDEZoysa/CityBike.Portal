import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';

import { Bike, DockingStation } from '../../core/models';
import { DockingStationExtension, MapExtension } from '../../core/extensions';

// openlayers depedencies
import OlMap from 'ol/map';
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
import { AppSettings } from '../../services';

@Component({
  selector: 'app-user-map',
  templateUrl: './user-map.component.html',
  styleUrls: ['./user-map.component.scss']
})
export class UserMapComponent implements OnInit {
  @ViewChild('map', { static: true }) mapElement: ElementRef;
  @ViewChild('popup', { static: true }) popupElement: ElementRef;

  map: OlMap;
  source: OlVector;
  stationsLayer: OlVectorLayer;
  bikesLayer: OlVectorLayer;
  popup: OlOverlay;
  onClick: OlSelect;

  constructor(private router: Router,
    private appSettings: AppSettings) { }

  ngOnInit() {
    this.initializeMap();
  }

  initializeMap() {

    // vecor source that hold the features
    this.source = new OlVector({
      wrapX: false
    });

    // layer that contains the vector source
    this.stationsLayer = new OlVectorLayer({
      // style: style,
      style: (f, r) => this.styleFunction(f, r),
      source: this.source
    });

    // map layer
    let tileLayer = MapExtension.getOSMTileLayer();

    // map view
    let view = new OlView({
      center: OlProj.fromLonLat(this.appSettings.map_center_position),
      zoom: 15,
    });

    // create map instance
    this.map = new OlMap({
      layers: [tileLayer, this.stationsLayer],
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

        if (data.NumberOfAvailableBikes > 0 || data.NumberOfAvailablePoints > 0) {
          this.router.navigate([`customer/dockingstations/${data.DockingStationId}/bikes/list`]);
        }
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
           <span>${data.AddressStr}</span><br/>
           <span>${data.NumberOfAvailableBikes} Bikes Available</span><br/>
           <span>${data.NumberOfAvailablePoints} Points Available</span>
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
    let styles = MapExtension.getDockingStationsStyles(false);
    let text = '';
    if (resolution < 19) {
      // let station:DockingStation = feature.get('data');
      text = MapExtension.getFeatureName(feature);
    };
    styles[1].getText().setText(text);
    return styles;
  }

  interactionStyleFunction(feature: OlFeature, resolution) {
    let styles = MapExtension.getDockingStationsStyles(true);
    let text = '';
    if (resolution < 19) {
      // let station:DockingStation = feature.get('data');
      text = MapExtension.getFeatureName(feature);
    };
    styles[1].getText().setText(text);
    return styles;
  }

  getDockingStationFeature(station: DockingStation) {
    let point = [station.Position.Longitude, station.Position.Latitude];
    let feature = new OlFeature({
      name: station.Name,
      geometry: new OlPoint(OlProj.fromLonLat(point)),
      data: station
    });
    return feature;
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
    return feature;
  }

  public addDockingStation(station: DockingStation, centerToPoint: boolean = true): void {

    let point = [station.Position.Longitude, station.Position.Latitude];
    let projectedPoint = OlProj.fromLonLat(point);

    station.AddressStr = DockingStationExtension.GetAddress(station.Address);

    // let pointFeature = this.getDockingStationFeature(station);
    // this.source.addFeature(pointFeature);

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
    // if (stations && stations.length > 0) {
    //   this.zoomToExtent();
    // }
  }

  public addBikes(bikes: Bike[]): void { }

  private zoomToExtent(): void {
    if (this.stationsLayer) {
      let extent = this.source.getExtent();
      this.map.getView().fit(extent, this.map.getSize());
    }
  }
}
