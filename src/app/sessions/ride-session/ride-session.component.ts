import { Component, OnInit, ViewChild, ElementRef, Inject, Optional } from "@angular/core";
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
import OlText from "ol/style/text";
import OlStroke from "ol/style/stroke";
import OlFill from "ol/style/fill";
import OlLineString from "ol/geom/linestring";
import OlOverlay from "ol/overlay";
import OlSelect from "ol/interaction/select";
import OlCondition from "ol/events/condition";
import OlIcon from 'ol/style/icon';
import { SessionsService } from "../../services/sessions.service";
import { AppSettings, BikesService, DockingStationService, LoggerService } from "../../services";
import { ActivatedRoute } from "@angular/router";
import * as moment from "moment";
import "moment-timezone";
import { DockingStation } from "../../core/models";
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface DialogData {
  SessionId: string;
}

@Component({
  selector: "app-ride-session",
  templateUrl: "./ride-session.component.html",
  styleUrls: ["./ride-session.component.scss"]
})
export class RideSessionComponent implements OnInit {
  @ViewChild("map", { static: true }) mapElement: ElementRef;
  @ViewChild("popup", { static: true }) popupElement: ElementRef;

  map: OlMap;
  source: OlXYZ;
  vectorLayer: OlVectorLayer;
  style: OlStyle;
  popup: OlOverlay;
  onClick: OlSelect;
  rideSession: any;
  positionObservationId = 300;
  sessionId: string;
  isMobile: boolean = false;
  scaleMap: boolean = false;
  colors = { blue: "#0000FF", black: "#000000" };
  bikeStatus = { start: "Start", end: "End", running: "Running", inner: "inner" };
  featureCategory = { point: "point", line: "line" };
  feeTextList = [];
  dockLayer: OlVectorLayer;
  dockingStations: DockingStation[];
  isDetailsDialog: boolean;

  constructor(
    @Optional() @Inject(MAT_DIALOG_DATA) public data: DialogData,
    @Optional() public dialogRef: MatDialogRef<RideSessionComponent>,
    private sessionsService: SessionsService,
    private bikesService: BikesService,
    private activateRoute: ActivatedRoute,
    private loggerService: LoggerService,
    private stationService: DockingStationService,
    private appSettings: AppSettings,
  ) {
    if (this.data == null) {
      this.activateRoute.params.subscribe(params => {
        this.sessionId = params["id"];
        this.isDetailsDialog = false;
      });
    } else {
      this.sessionId = this.data.SessionId;
      this.isDetailsDialog = true;
    }
  }

  onResize() {
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      this.isMobile = true;
    }
    else {
      this.isMobile = false;
    }
  }

  ngOnInit() {
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
      style: (f, r) => this.styleFunction(f, r),
      source: this.source
    });

    this.dockLayer = new OlVectorLayer({
      style: (f, r) => this.styleDockFunction(f, r),
      source: new OlVector({})
    });

    let view = new OlView({
      center: OlProj.fromLonLat(this.appSettings.map_center_position),
      zoom: 10
    });

    this.map = new OlMap({
      layers: [tileLayer, this.vectorLayer, this.dockLayer],
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

    this.getSession();
    this.getAllDockingStations();
  }

  getSession() {
    this.sessionsService.getSessionWithBike(this.sessionId)
      .subscribe((session: any) => {
        if (session.FeeDetails != null) {
          this.convertFeeTypesToText(session.FeeDetails);
        }
        var startTime = session.StartTime;
        var endTime = session.EndTime || new Date().toISOString();
        var endTimeExtended = moment.utc(endTime).add(1, "seconds").toISOString();

        if (session.StartTime) {
          var m1 = session.StartTime;
          session.StartTime = m1;
        }
        if (session.EndTime) {
          var m2 = session.EndTime;
          session.EndTime = m2;
        }
        this.rideSession = session;
        //this.rideSession.LockStateValue = this.getLockState(session.LockState);
        // if (!session.EndTime) {
        //   this.getBikeDetails(session.BikeId);
        // }
        this.getBikePosition(session, startTime, endTimeExtended);
      }, error => {
        this.loggerService.showErrorMessage('Error occured when getting session details for bike');
      });
  }

  getBikePosition(session, from, to) {
    this.bikesService.getBikePositionDetails(session.BikeId, this.positionObservationId, from, to)
      .subscribe(
        data => {
          this.updatePositionOnMap(session, data.Observations);
        },
        error => { }
      );
  }

  // getBikeDetails(bikeId) {
  //   this.bikesService.getBikeDetails(bikeId)
  //     .subscribe(data => {
  //       this.rideSession.BikeStateValue = this.getBikeState(data.BikeState);
  //       this.rideSession.LockStateValue = this.getLockState(data.LockState);
  //       this.rideSession.PowerStateValue = this.getPowerState(data.PowerState)
  //       this.rideSession.CurrentChargeLevel = data.ChargeLevel;
  //       this.rideSession.MaximumSpeed = data.MaximumSpeed;
  //       this.rideSession.CurrentTripDistance = data.CurrentTripDistance;
  //     }, error => { });
  // }

  // getBikeState(bikeState) {
  //   let bikeStateValue = "";
  //   if (bikeState === BikeState.Docked) {
  //     bikeStateValue = "Docked";
  //   } else if (bikeState === BikeState.ParkedHorizontally) {
  //     bikeStateValue = "Parked Horizontally";
  //   } else if (bikeState === BikeState.ParkedVertically) {
  //     bikeStateValue = "Parked Vertically";
  //   } else if (bikeState === BikeState.Running) {
  //     bikeStateValue = "Running";
  //   }
  //   return bikeStateValue;
  // }

  // getLockState(lockState) {
  //   let lockStateValue = "";
  //   if (lockState === LockState.InTransition) {
  //     lockStateValue = "In Transition";
  //   } else if (lockState === LockState.LockedArrest) {
  //     lockStateValue = "Locked";
  //   } else if (lockState === LockState.UnlockedArrest) {
  //     lockStateValue = "Unlocked";
  //   }
  //   return lockStateValue;
  // }

  // getPowerState(powerState) {
  //   let powerStateValue = "";
  //   if (powerState === PowerState.Standby) {
  //     powerStateValue = "Standby";
  //   } else if (powerState === PowerState.Running) {
  //     powerStateValue = "Running";
  //   } else if (powerState === PowerState.Hibernating) {
  //     powerStateValue = "Hibernating";
  //   } else if (powerState === PowerState.ChargingFinished) {
  //     powerStateValue = "Charging Finished";
  //   } else if (powerState === PowerState.ChargingNormal) {
  //     powerStateValue = "Charging Normal";
  //   }
  //   return powerStateValue;
  // }

  updatePositionOnMap(session, observations) {
    if (!observations || observations.length <= 0) return;
    let points = [];

    observations.forEach(element => {
      points.push([element.Value.Longitude, element.Value.Latitude]);
    });

    let isRunning = session.EndTime != null ? false : true;

    let firstPosition = observations[0];
    let lastPosition = observations[observations.length - 1];

    let innerPositions = [...observations];
    innerPositions.pop();
    innerPositions.shift();

    let firstFeature = new OlFeature({
      geometry: new OlPoint(
        OlProj.transform(
          [firstPosition.Value.Longitude, firstPosition.Value.Latitude],
          "EPSG:4326",
          "EPSG:3857"
        )
      ),
      type: this.bikeStatus.start,
      category: this.featureCategory.point,
      data: this.getMapPoint(firstPosition.Value, firstPosition.Timestamp)
    });

    this.source.addFeature(firstFeature);

    innerPositions.forEach(innerPosition => {
      let feature = new OlFeature({
        geometry: new OlPoint(
          OlProj.transform(
            [innerPosition.Value.Longitude, innerPosition.Value.Latitude],
            "EPSG:4326",
            "EPSG:3857"
          )
        ),
        type: this.bikeStatus.inner,
        category: this.featureCategory.point,
        data: this.getMapPoint(innerPosition.Value, innerPosition.Timestamp)
      });
      this.source.addFeature(feature);
    });

    let lastFeature = new OlFeature({
      geometry: new OlPoint(
        OlProj.transform(
          [lastPosition.Value.Longitude, lastPosition.Value.Latitude],
          "EPSG:4326",
          "EPSG:3857"
        )
      ),
      type: isRunning ? this.bikeStatus.running : this.bikeStatus.end,
      category: this.featureCategory.point,
      data: this.getMapPoint(lastPosition.Value, lastPosition.Timestamp)
    });

    this.source.addFeature(lastFeature);

    // Draw line
    let lineFeature = new OlFeature({
      geometry: new OlLineString(points).transform("EPSG:4326", "EPSG:3857"),
      category: this.featureCategory.line
    });

    this.source.addFeature(lineFeature);
    this.zoomToExtent();
  }

  styleFunction(feature: OlFeature, resolution) {
    let type = feature.get("type");
    var color =
      type == this.bikeStatus.start ? this.colors.blue : [255, 255, 255, 1];
    let text = "";

    if (type == this.bikeStatus.start) {
      text = this.bikeStatus.start;
    } else if (type == this.bikeStatus.end) {
      text = this.bikeStatus.end;
    } else if (type == this.bikeStatus.running) {
      text = this.bikeStatus.running;
    }

    let style = this.getLayerStyle(color);

    if (feature.get("category") == this.featureCategory.point)
      style.getText().setText(text);
    return style;
  }

  styleDockFunction(feature: OlFeature, resolution) {
    let style;
    // let type = feature.get("type");
    style = this.getDockLayerStyle(false);
    style.getText().setText(resolution < 4 ? feature.get('name') : '');
    return style;
  }

  getOnHoverInteracion(): OlSelect {
    let select = new OlSelect({
      condition: OlCondition.pointerMove,
      style: (f, r) => this.interactionStyleFunction(f, r)
    });
    select.on("select", event => {
      if (event.selected.length > 0) {
        let features = event.target.getFeatures().getArray();
        let feature = features[0];
        let data = feature.get("data");

        // change cursor to pointer
        this.mapElement.nativeElement.style.cursor = "pointer";

        // show popup
        if (data) {
          this.popup.setPosition(event.mapBrowserEvent.coordinate);
          this.popupElement.nativeElement.style.display = "";
          let type = feature.get("type");
          // if (type != this.bikeStatus.inner) {
          //   this.popupElement.nativeElement.innerHTML = `<span>Timestamp:${this.convertTime.transform(data.Timestamp)}</span><br/>
          //    <span>Longitude:${data.Longitude}</span><br/>
          //    <span>Latitude :${data.Latitude}</span><br/>
          //    <span>Altitude :${data.Altitude}</span><br/>`;
          // }
          // else {
          this.popupElement.nativeElement.innerHTML = `<span>Timestamp:${moment(data.Timestamp).tz("Europe/Berlin").format('YYYY-MM-DD HH:mm:ss')}</span><br/>`;
          // }
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

  interactionStyleFunction(feature: OlFeature, resolution) {
    let type = feature.get("type");
    var color =
      type == this.bikeStatus.start ? this.colors.blue : [255, 255, 255, 1];
    let text = "";

    if (type == this.bikeStatus.start) {
      text = this.bikeStatus.start;
    } else if (type == this.bikeStatus.end) {
      text = this.bikeStatus.end;
    } else if (type == this.bikeStatus.running) {
      text = this.bikeStatus.running;
    }

    let style = this.getLayerStyle(color, true);

    if (feature.get("category") == this.featureCategory.point)
      style.getText().setText(text);
    return style;
  }

  private getLayerStyle(color, highlighted = false) {
    let featureColor = highlighted ? '#FF2C00' : '#04A3E3';
    let featureFillColor = highlighted ? 'transparent' : color;
    let imageRadius = highlighted ? 8 : 5;
    let strokeWidth = highlighted ? 2 : 1.5;
    var myStyle = new OlStyle({
      image: new OlCircle({
        radius: imageRadius,
        fill: new OlFill({ color: featureFillColor }),
        stroke: new OlStroke({
          color: featureColor,
          width: strokeWidth
        })
      }),
      stroke: new OlStroke({
        color: featureColor,
        width: 2
      }),
      text: new OlText({
        font: `bold 11px Roboto, "Helvetica Neue", sans-serif`,
        // offsetX: 10,
        offsetY: -15, // 0
        textAlign: "right",
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
    return myStyle;
  }

  private getMapPoint(position: any, timeStamp) {
    let point = {
      Longitude: position.Longitude,
      Latitude: position.Latitude,
      Altitude: position.Altitude,
      Timestamp: timeStamp
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

  convertFeeTypesToText(feeList) {
    var feeArray = feeList.split(',');
    for (let i = 0; i < feeArray.length; i++) {
      if (feeArray[i] == 100) {
        this.feeTextList.push("100 Returned Outside");
      } else if (feeArray[i] == 101) {
        this.feeTextList.push("101 Long Session");
      } else if (feeArray[i] == 103) {
        this.feeTextList.push("103 Medium Session");
      } else if (feeArray[i] == 104) {
        this.feeTextList.push("104 Returned inside having available docking points");
      } else if (feeArray[i] == 105) {
        this.feeTextList.push("105 Startup Fee");
      }
    }
    this.feeTextList.sort();
  }

  private getDockLayerStyle(highlighted = false): OlStyle {
    let style = new OlStyle({
      // image: new OlIcon({
      //   src: '/assets/images/map-icons/ds-bike-track.svg',
      //   scale: (highlighted) ? 1.2 : 1
      // }),
      stroke: new OlStroke({
        color: '#00AA50',
        width: 1
      }),
      text: new OlText({
        font: `bold 11px Roboto, "Helvetica Neue", sans-serif`,
        // offsetX: 10,         
        offsetY: -45, // 0
        textAlign: 'left',
        placement: 'point',
        fill: new OlFill({
          color: '#000'
        }),
        stroke: new OlStroke({
          color: '#FFF',
          width: 4
        })
      })
    });
    return style;
  }

  getAllDockingStations() {
    this.stationService.getDockingStationsByArea(false).subscribe(result => {
      var activeStations = result.filter(d => !d.Disabled);
      this.dockingStations = activeStations;
      this.updateDockingStationMap();
    }, err => {
      this.loggerService.showErrorMessage("Error while loading docking stations")
    })
  }

  updateDockingStationMap() {
    for (let station of this.dockingStations) {
      this.addDockingStation(station);
    }
  }


  public addDockingStation(
    station: DockingStation
  ): void {
    let polygonText = station.Geometry;
    polygonText = polygonText.substring(7);
    polygonText = polygonText.replace(/\(/g, '[').replace(/\)/g, ']').replace(/\,/g, '],[').replace(/ /g, ',');
    let points = JSON.parse(polygonText);
    let pointFeature = new OlFeature({
      name: station["Name"].toString(),
      geometry: new OlPoint(OlProj.transform([station["Position"]["Longitude"], station["Position"]["Latitude"]], 'EPSG:4326', 'EPSG:3857')),
      type: "station"
    });
    let dockSource = this.dockLayer.getSource();
    dockSource.addFeature(pointFeature);

    // Draw docking station radius
    let lineFeature = new OlFeature({
      geometry: new OlLineString(points).transform('EPSG:4326', 'EPSG:3857'),
      type: "station"
    });
    dockSource.addFeature(lineFeature);
  }

  closeDialog() {
    this.dialogRef.close();
  }

}
