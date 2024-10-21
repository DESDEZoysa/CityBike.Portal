import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import OSM from 'ol/source/osm';
import BingMaps from 'ol/source/bingmaps';
import OlXYZ from 'ol/source/xyz';
import OlTileLayer from 'ol/layer/tile';
import { AppSettings } from './app.settings';
import { MapTypes } from '../core/enums/mapTypes';
import { SettingsService } from './settings.service';
import { LocalStorageKeys } from '../core/constants';
import { MapType } from '@angular/compiler';

@Injectable({
  providedIn: 'root'
})
export class MapSettingsService {

  private changeMapName = new Subject<string>();
  start$ = this.changeMapName.asObservable();

  baseLayer: any;
  cartoLightLayer: any;
  openSeaLayer: any;
  bingLayer: any;
  bingLabelsLayer: any;

  constructor(private appSettings: AppSettings, private settingsService: SettingsService) { }

  changeTrackMap(name: string) {
    this.settingsService.setSetting(LocalStorageKeys.SELECTED_TRACK_MAP, name)
    this.changeMapName.next(name);
  }

  getDefaultMap() {
    let defaultMap = localStorage.getItem(LocalStorageKeys.SELECTED_TRACK_MAP);
    if (!defaultMap)
      defaultMap = MapTypes.mapColorGray.toString();

    return defaultMap;
  }



}
