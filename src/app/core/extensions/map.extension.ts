import { DockingStation } from '../models';
import { StationColors } from '../constants';

// openlayers depedencies
import OlMap from 'ol/map';
import OlVector from 'ol/source/vector';
import OlXYZ from 'ol/source/xyz';
import OlTileLayer from 'ol/layer/tile';
import OlVectorLayer from 'ol/layer/vector';
import OlView from 'ol/view';
import OlProj from 'ol/proj';
import OlFeature from 'ol/feature';
import OlPoint from 'ol/geom/point';
import OlPolygon from 'ol/geom/polygon';
import OlStyle from 'ol/style/style';
import OlCircle from 'ol/style/circle';
import OlText from 'ol/style/text';
import OlStroke from 'ol/style/stroke';
import OlFill from 'ol/style/fill';
import OlOverlay from 'ol/overlay';
import OlInteraction from 'ol/interaction';
import OlSelect from 'ol/interaction/select';
import OlCondition from 'ol/events/condition';
import OlRegularShape from 'ol/style/regularshape';
import OlIcon from "ol/style/icon";

export class MapExtension {

  static getOSMTileLayer(): OlTileLayer {
    return new OlTileLayer({
      source: new OlXYZ({
        crossOrigin: null,
        url: 'https://cartodb-basemaps-{a-c}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png',
        attributions: "© OpenStreetMap"
      })
    });
  }

  static getDockingStationStat(station: DockingStation): string {
    let text = '';
    if (station) {
      text = `${station.Name}\r\n${station.NumberOfAvailableBikes} bikes available\r\n${station.NumberOfAvailablePoints} points available`;
    }
    return text;
  }

  static getFeatureName(feature: OlFeature): string {
    let text = '';
    if (feature) {
      text = feature.get('name');
    }
    return text;
  }



  static getStationFeatureColor(data: DockingStation): string {
    let color = '';
    if (!data) return color;

    if (data.NumberOfAvailableBikes >= data.MinimumBikesRequired && data.NumberOfAvailableBikes >= data.IdealNumberOfBikes) {
      color = StationColors.BIKES_AVAILABLE;
    }
    else if (data.NumberOfAvailableBikes < data.MinimumBikesRequired) {
      color = StationColors.MINIMUM_BIKES;
    }
    else if (data.NumberOfAvailableBikes < data.IdealNumberOfBikes) {
      color = StationColors.IDEAL_BIKES;
    }
    return color;
  }

  static getStationTickFeatureColor(data: DockingStation): string {
    let color = '';
    if (!data) return color;

    if (data.NumberOfAvailableBikes >= data.MinimumBikesRequired && data.NumberOfAvailableBikes >= data.IdealNumberOfBikes) {
      color = StationColors.BIKES_AVAILABLE;
    }
    else if (data.NumberOfAvailableBikes < data.MinimumBikesRequired) {
      color = StationColors.MINIMUM_BIKES;
    }
    else if (data.NumberOfAvailableBikes < data.IdealNumberOfBikes) {
      color = StationColors.IDEAL_BIKES;
    }
    return color;
  }

  public static getClusterNumberStyle(color, highlighted: boolean = false): OlStyle {
    let imageRadius = highlighted ? 12 : 10;
    // point
    return new OlStyle({
      image: new OlCircle({
        radius: imageRadius,
        fill: new OlFill({
          color: color
        }),
      }),
      text: new OlText({
        font: `14px Roboto, "Helvetica Neue", sans-serif`,
        textAlign: 'center',
        placement: 'point',
        fill: new OlFill({
          color: '#FFF'
        })
      })
    })
  }

  public static getDeviceStyle(highlighted: boolean = false, alpha: number = 1): OlStyle {
    let featureColor = highlighted ? `rgba(252,1,7,${alpha})` : `rgba(252,1,7,${alpha})`;
    let imageRadius = highlighted ? 7 : 5;
    let strokeWidth = highlighted ? 3 : 1.25;
    // point
    return new OlStyle({
      image: new OlCircle({
        radius: imageRadius,
        fill: new OlFill({
          color: featureColor
        }),
      }),
      text: new OlText({
        font: `14px Roboto, "Helvetica Neue", sans-serif`,
        offsetX: 20,
        offsetY: 0,
        textAlign: 'left',
        placement: 'point',
        fill: new OlFill({
          color: featureColor
        })
      })
    })
  }

  static getDockingStationsStyles(highlighted: boolean = false, color: string = '#FF2C00'): OlStyle[] {
    let featureColor = highlighted ? '#FF2C00' : '#04A3E3';
    if (color) {
      featureColor = color;
    }
    let imageRadius = highlighted ? 5 : 2;
    let strokeWidth = highlighted ? 3 : 2;

    let styles = [
      // polygon
      new OlStyle({
        stroke: new OlStroke({
          color: featureColor,
          width: strokeWidth
        })
      }),
      new OlStyle({
        image: new OlRegularShape({
          radius: 8,
          fill: new OlFill({
            color: featureColor
          }),
          points: 4,
          angle: Math.PI / 4
        }),
        text: new OlText({
          font: `14px Roboto, "Helvetica Neue", sans-serif`,
          offsetX: 0,
          offsetY: 0,
          textAlign: 'center',
          placement: 'point',
          fill: new OlFill({
            color: 'white'
          })
        })
      })
    ]
    return styles;
  }

  static getLargeDockingStationStyles(highlighted: boolean = false, data, isMobile: boolean = false): OlStyle[] {
    let featureColor = highlighted ? '#FF2C00' : '#04A3E3';
    let color = data.StationStatus;
    if (color) {
      featureColor = color;
    }
    let imageRadius = highlighted ? 2 : 2;
    let strokeWidth = highlighted ? 2 : 2;

    let styles = [
      // polygon
      new OlStyle({
        stroke: new OlStroke({
          color: featureColor,
          width: strokeWidth
        })
      }),
      new OlStyle({
        image: new OlIcon(({
          src: data["dockIcon"],
          rotation: 0,
          rotateWithView: true,
          scale: (isMobile) ? 1.2 : 1.5
        })),
        text: new OlText({
          font: `18px Roboto, "Helvetica Neue", sans-serif`,
          offsetX: 0,
          offsetY: 0,
          textAlign: 'center',
          placement: 'point',
          fill: new OlFill({
            color: 'white'
          })
        })
      })
    ]
    return styles;
  }

  static getSmallDockingStationsStyles(highlighted: boolean = false, data, isMobile: boolean = false): OlStyle[] {
    let featureColor = highlighted ? '#FF2C00' : '#04A3E3';
    let color = data.StationStatus;
    if (color) {
      featureColor = color;
    }
    let imageRadius = highlighted ? 5 : 2;
    let strokeWidth = highlighted ? 3 : 2;

    let styles = [
      // polygon
      new OlStyle({
        stroke: new OlStroke({
          color: featureColor,
          width: strokeWidth
        })
      }),
      new OlStyle({
        image: new OlIcon(({
          anchor: [1.785, 1.785],
          anchorXUnits: 'fraction',
          anchorYUnits: 'fraction',
          anchorOrigin: 'top-right',
          src: data["smallIcon"],
          rotation: 0,
          rotateWithView: true,
          scale: (isMobile) ? 0.8 : 1
        })),
        text: new OlText({
          font: `10px Roboto, "Helvetica Neue", sans-serif`,
          offsetX: (isMobile) ? 14.785 : 17.785,
          offsetY: (isMobile) ? -14.785 : -17.785,
          offsetOrgin: 'top-right',
          textAlign: 'center',
          placement: 'point',
          fill: new OlFill({
            color: 'white'
          })
        }),
      })
    ]
    return styles;
  }

  static getDockingStationRadiusStyles(): OlStyle[] {
    let styles = [
      // line
      new OlStyle({
        stroke: new OlStroke({
          color: '#00AA50',
          width: 1
        })
      })
    ]
    return styles;
  }

  static getTickStationsStyles(highlighted: boolean = false, color: string = '#FF2C00'): OlStyle[] {

    let featureColor = highlighted ? '#FF2C00' : '#04A3E3';
    if (color) {
      featureColor = color;
    }
    let imageRadius = highlighted ? 5 : 2;
    let strokeWidth = highlighted ? 3 : 2;

    let styles = [
      // polygon
      new OlStyle({
        stroke: new OlStroke({
          color: featureColor,
          width: strokeWidth
        })
      }),
      // point
      new OlStyle({
        image: new OlRegularShape({
          radius: 10,
          fill: new OlFill({
            color: featureColor
          }),
          points: 4,
          angle: Math.PI / 4
        }),
        text: new OlText({
          font: `14px Roboto, "Helvetica Neue", sans-serif`,
          offsetX: 0,
          offsetY: 0,
          textAlign: 'center',
          placement: 'point',
          fill: new OlFill({
            color: '#000'
          }),
          stroke: new OlStroke({
            color: '#FFF',
            width: 2
          })
        }),
        // geometry: function (feature) {
        //   let data = feature.get('data');
        //   let coordinates = [data.Position.Longitude, data.Position.Latitude];
        //   return new OlPoint(OlProj.fromLonLat(coordinates));
        // }
      })
    ]
    return styles;
  }

}