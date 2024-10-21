import { Injectable } from '@angular/core';
import { LocalStorageKeys } from '../core/constants';
import { Subject } from 'rxjs';

@Injectable()
export class SettingsService {

    public selectedLanguage: string;
    private changeMapName = new Subject<object>();
    private showMapSelection = new Subject<boolean>();
    map$ = this.changeMapName.asObservable();
    mapSelection$ = this.showMapSelection.asObservable();


    constructor() {
        this.initializeSettings();
    }

    initializeSettings() {
        this.selectedLanguage = this.getSetting(LocalStorageKeys.PREFERRED_LANGUAGE);
    }

    changeMap(name) {
        this.changeMapName.next(name);
    }

    showMapOptions(show: boolean) {
        this.showMapSelection.next(show)
    }

    setSetting(key: string, value: string): void {
        localStorage.setItem(key, value);
    }

    getSetting(key: string): string {
        return localStorage.getItem(key);
    }

    public setSelectedLanguage(value: string): void {
        this.selectedLanguage = value;
    }

    public getSelectedLanguage(): string {
        return this.selectedLanguage;
    }

    public getSelectedTimezone(): string {
        return this.getSetting(LocalStorageKeys.PREFERRED_TIMEZONE);
    }

    public setLastBikeMapExtent(extent: number[]): void {
        this.setSetting(LocalStorageKeys.LAST_BIKE_MAP_EXTENT, JSON.stringify(extent));
    }

    public setLiveMapZoomLevel(zoom: string) {
        this.setSetting(LocalStorageKeys.LIVE_MAP_ZOOM_LEVEL, zoom);
    }

    public getLiveMapZoomLevel() {
        return this.getSetting(LocalStorageKeys.LIVE_MAP_ZOOM_LEVEL);
    }

    public getLastBikeMapExtent(): number[] {
        let extent;
        let extentSer = this.getSetting(LocalStorageKeys.LAST_BIKE_MAP_EXTENT);
        if (extentSer) {
            extent = JSON.parse(extentSer);
        }
        return extent;
    }

    public setLastDockingStationMapExtent(extent: number[]): void {
        this.setSetting(LocalStorageKeys.LAST_DOCKING_STATION_MAP_EXTENT, JSON.stringify(extent));
    }

    public getLastDockingStationMapExtent(): number[] {
        let extent;
        let extentSer = this.getSetting(LocalStorageKeys.LAST_DOCKING_STATION_MAP_EXTENT);
        if (extentSer) {
            extent = JSON.parse(extentSer);
        }
        return extent;
    }

    clearSettings(): void {
        localStorage.removeItem(LocalStorageKeys.USER_DETAILS);
        localStorage.removeItem(LocalStorageKeys.LAST_BIKE_MAP_EXTENT);
        localStorage.removeItem(LocalStorageKeys.LAST_DOCKING_STATION_MAP_EXTENT);
        localStorage.removeItem(LocalStorageKeys.SELECTED_AREAS);
        localStorage.removeItem(LocalStorageKeys.PREFERRED_LANGUAGE);
        localStorage.removeItem(LocalStorageKeys.PREFERRED_TIMEZONE);
        localStorage.removeItem(LocalStorageKeys.DASHBOARD_TOKEN);
    }
}
