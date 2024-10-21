import { Component, ElementRef, Input, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { AppSettings, SettingsService } from '../../services';
import OlMap from "ol/map";
import BingMaps from 'ol/source/bingmaps';
import OlVector from "ol/source/vector";
import OlXYZ from "ol/source/xyz";
import OlTileLayer from "ol/layer/tile";
import OlVectorLayer from "ol/layer/vector";
import OlView from "ol/view";
import OlProj from "ol/proj";
import OlFeature from "ol/feature";
import OlPoint from "ol/geom/point";
import OlStyle from "ol/style/style";
import OlIcon from "ol/style/icon";
import OlText from "ol/style/text";
import OlStroke from "ol/style/stroke";
import OlFill from "ol/style/fill";
import OlLineString from 'ol/geom/linestring';
import OlPolygon from 'ol/geom/polygon';

@Component({
  selector: 'app-shared-route-map',
  templateUrl: './route-map.component.html',
  styleUrls: ['./route-map.component.scss']
})
export class RouteMapComponent implements OnInit {
  @Input() dockingStations;
  @Input() workshops;
  @Input() storages;
  @Input() bikes;
  @Input() waypoints;
  @ViewChild("routemap") mapElement: ElementRef;
  private _waypoints;
  map: OlMap;
  source: any;
  dockLayer: OlVectorLayer;
  bikeLayer: OlVectorLayer;
  routeLayer: OlVectorLayer;
  bingLabelsLayer: OlTileLayer;
  tileLayer: OlTileLayer;
  storagePointLayer: OlTileLayer;
  workshopPointLayer: OlTileLayer;
  style: OlStyle;
  view: OlView;

  constructor(private settingsService: SettingsService, private appSettings: AppSettings) { }

  ngOnInit(): void {
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.dockingStations?.currentValue) {
      let docks = changes.dockingStations?.currentValue;
      this.createDockingStationFeature(docks);
    }
    if (changes.bikes?.currentValue) {
      let bikes = changes.bikes?.currentValue;
      this.createBikeFeature(bikes);
    }
    if (changes.storages?.currentValue) {
      let allStorages = changes.storages?.currentValue;
      this.createStorageWaypointFeature(allStorages);
    }
    if (changes.workshops?.currentValue) {
      let allWorkshops = changes.workshops?.currentValue;
      this.createWorkshopWaypointFeature(allWorkshops);
    }
    if (changes.waypoints?.currentValue) {
      let allWaypoints = changes.waypoints?.currentValue;
      this.createRoutePaths(allWaypoints);
    }
  }

  ngAfterViewInit(): void {
    this.initializeMap();
  }

  initializeMap() {
    let existsZoomLevel = this.settingsService.getLiveMapZoomLevel();
    let mapZoomLevel = existsZoomLevel ? Number(existsZoomLevel) : 16;

    this.dockLayer = new OlVectorLayer({
      style: (f, r) => this.wayPointStyleFunction(f, r),
      source: new OlVector({})
    });

    this.bikeLayer = new OlVectorLayer({
      style: (f, r) => this.bikeStyleFunction(f, r),
      source: new OlVector({})
    });

    this.routeLayer = new OlVectorLayer({
      style: (f, r) => this.routeStyleFunction(f, r),
      source: new OlVector({})
    });

    this.storagePointLayer = new OlVectorLayer({
      style: (f, r) => this.wayPointStyleFunction(f, r),
      source: new OlVector({})
    });

    this.workshopPointLayer = new OlVectorLayer({
      style: (f, r) => this.wayPointStyleFunction(f, r),
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
        key: this.appSettings.bing_map_key
      })
    });

    this.view = new OlView({
      center: OlProj.fromLonLat(this.appSettings.map_center_position),
      zoom: mapZoomLevel,
      minZoom: 3,
      maxZoom: 22
    });

    this.map = new OlMap({
      layers: [this.tileLayer, this.bingLabelsLayer, this.bikeLayer, this.dockLayer, this.storagePointLayer, this.workshopPointLayer, this.routeLayer],
      view: this.view
    });

    this.map.setTarget(this.mapElement.nativeElement);
  }

  private routeStyleFunction(feature: OlFeature, resolution) {
    const geometry = feature.getGeometry();
    const mid = geometry.getCoordinateAt(0.5);
    const styles = [
      // linestring
      new OlStyle({
        stroke: new OlStroke({
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

  private createStorageWaypointFeature(waypoint: any) {
    let storagePointLayerSource = this.storagePointLayer.getSource();
    storagePointLayerSource.clear(true);
    waypoint?.forEach(wp => {
      if (wp?.Position) {
        let data = {
          "waypointIcon": "/assets/images/insight-icons/storage-default.svg",
          "waypointId": wp?.Id
        }
        let wayPointFeature = new OlFeature({
          name: wp?.Name,
          geometry: new OlPoint([wp.Position.Longitude, wp.Position.Latitude]).transform('EPSG:4326', 'EPSG:3857'),
          data: data,
          type: "storage"
        });
        wayPointFeature.setId(wp?.Id);
        storagePointLayerSource.addFeature(wayPointFeature);
      }
    });
  }

  private createWorkshopWaypointFeature(waypoint: any) {
    let workshopPointLayerSource = this.workshopPointLayer.getSource();
    workshopPointLayerSource.clear(true);
    waypoint?.forEach(wp => {
      if (wp?.Position) {
        let data = {
          "waypointIcon": "/assets/images/insight-icons/workshop-default.svg",
          "waypointId": wp?.Id
        }
        let wayPointFeature = new OlFeature({
          name: wp?.Name,
          geometry: new OlPoint([wp.Position.Longitude, wp.Position.Latitude]).transform('EPSG:4326', 'EPSG:3857'),
          data: data,
          type: "workshop"
        });
        wayPointFeature.setId(wp?.Id);
        workshopPointLayerSource.addFeature(wayPointFeature);
      }
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

  private bikeStyleFunction(feature: OlFeature, resolution) {
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

  private createDockingStationFeature(dockingStations: any) {
    let dockSource = this.dockLayer.getSource();
    dockSource.clear(true);

    dockingStations?.forEach(wp => {
      if (wp?.Position) {
        let data = {
          "waypointIcon": "/assets/images/insight-icons/ds-default.svg",
          "waypointId": wp?.DockingStationId,
        }
        let wayPointFeature = new OlFeature({
          name: wp?.Name,
          geometry: new OlPoint([wp.Position.Longitude, wp.Position.Latitude]).transform('EPSG:4326', 'EPSG:3857'),
          data: data,
          type: "dock"
        });
        wayPointFeature.setId(wp?.DockingStationId);
        dockSource.addFeature(wayPointFeature);
      }
    });
  }

  private createBikeFeature(bikes: any) {
    let bikeSource = this.bikeLayer.getSource();
    bikeSource.clear(true);

    bikes?.forEach(wp => {
      if (wp?.Position) {
        let data = {
          "waypointIcon": "/assets/images/insight-icons/bike-default.svg",
          "waypointId": wp?.BikeId,
        }
        let wayPointFeature = new OlFeature({
          name: wp?.VisualId,
          geometry: new OlPoint([wp.Position.Longitude, wp.Position.Latitude]).transform('EPSG:4326', 'EPSG:3857'),
          data: data,
          type: "bike"
        });
        wayPointFeature.setId(wp?.BikeId);
        bikeSource.addFeature(wayPointFeature);
      }
    });
  }

  private createRoutePaths(waypoints: any) {

    //update waypoint styles
    this.updateWayPointDetails(waypoints);

    let positions = waypoints?.flatMap(wp => {
      if (wp?.Position && wp?.Position?.Longitude && wp?.Position?.Latitude) {
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
  }

  private createRouteFeature(routePoints: number[][]) {
    let routeLayerSource = this.routeLayer.getSource();
    routeLayerSource.clear(true);
    let j
    for (j = 0; j < routePoints.length - 1; j++) {
      //data: property can be added route feature
      let routeFeature = new OlFeature({
        //name: this.routeId,
        geometry: new OlLineString([routePoints[j], routePoints[j + 1]]).transform('EPSG:4326', 'EPSG:3857'),
        type: "route"
      });
      routeLayerSource.addFeature(routeFeature);
    }

    //forcus street route in the map
    let coordinates = []
    coordinates.push(routePoints);
    let polygon = new OlPolygon(coordinates).transform('EPSG:4326', 'EPSG:3857');
    this.view.fit(polygon);
  }

  private updateWayPointDetails(waypoints: any) {
    waypoints?.forEach(wp => {
      if (wp?.DockingStationId) {
        let docSource = this.dockLayer.getSource();
        let docFeature = docSource.getFeatureById(wp.DockingStationId);
        if (docFeature) {
          if (wp?.CompletedDate && !wp?.IsSkipped) {
            docFeature.set('data', { 'waypointIcon': '/assets/images/insight-icons/ds-completed.svg', 'waypointId': wp?.DockingStationId });
          }
          else if (wp?.CompletedDate && wp?.IsSkipped) {
            docFeature.set('data', { 'waypointIcon': '/assets/images/insight-icons/ds-skip.svg', 'waypointId': wp?.DockingStationId });
          }
        }
      }
      else if (wp?.BikeId) {
        let bikeSource = this.bikeLayer.getSource();
        let bikeFeature = bikeSource.getFeatureById(wp?.BikeId);
        if (bikeFeature) {
          if (wp?.CompletedDate && !wp?.IsSkipped) {
            bikeFeature.set('data', { 'waypointIcon': '/assets/images/insight-icons/bike-completed.svg', 'waypointId': wp?.BikeId });
          }
          else if (wp?.CompletedDate && wp?.IsSkipped) {
            bikeFeature.set('data', { 'waypointIcon': '/assets/images/insight-icons/bike-skip.svg', 'waypointId': wp?.BikeId });
          }
        }
      }
      else if (wp?.StorageId) {
        let storageSource = this.storagePointLayer.getSource();
        let storageFeature = storageSource.getFeatureById(wp?.StorageId);
        if (storageFeature) {
          if (wp?.CompletedDate && !wp?.IsSkipped) {
            storageFeature.set('data', { 'waypointIcon': '/assets/images/insight-icons/storage-completed.svg', 'waypointId': wp?.StorageId });
          }
          else if (wp?.CompletedDate && wp?.IsSkipped) {
            storageFeature.set('data', { 'waypointIcon': '/assets/images/insight-icons/storage-skip.svg', 'waypointId': wp?.StorageId });
          }
        }
      }
      else if (wp?.WorkshopId) {
        let workshopSource = this.workshopPointLayer.getSource();
        let workshopFeature = workshopSource.getFeatureById(wp?.WorkshopId);
        if (workshopFeature) {
          if (wp?.CompletedDate && !wp?.IsSkipped) {
            workshopFeature.set('data', { 'waypointIcon': '/assets/images/insight-icons/workshop-completed.svg', 'waypointId': wp?.WorkshopId });
          }
          else if (wp?.CompletedDate && wp?.IsSkipped) {
            workshopFeature.set('data', { 'waypointIcon': '/assets/images/insight-icons/workshop-skip.svg', 'waypointId': wp?.WorkshopId });
          }
        }
      }
    });
  }
}
