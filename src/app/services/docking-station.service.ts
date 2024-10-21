
import { interval as observableInterval, Observable } from 'rxjs';

import { map, mergeMap } from 'rxjs/operators';
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';




import { AppSettings } from './app.settings';
import { DockingStation } from '../core/models';
import { DockingStationTechData } from '../core/models/dock/docking-station-tech-data';


@Injectable()
export class DockingStationService {

    headers: HttpHeaders;

    constructor(private http: HttpClient, private settings: AppSettings) { }

    getDockingStations(includePoints: boolean): Observable<DockingStation[]> {
        return this.http.get<DockingStation[]>(`${this.settings.api_url}/dockingstations?includePoints=${includePoints}`);
    }

    getDockingStationsByArea(includePoints: boolean): Observable<any> {
        return this.http.get(`${this.settings.api_url}/dockingstations/byArea?includePoints=${includePoints}`);
    }

    public getDockingStatonsBySelectedAreas(areaIds = [], includePoints: boolean): Observable<any> {
        let options = { headers: this.headers };
        return this.http.post(`${this.settings.api_url}/dockingstations/filterByAreas?includePoints=${includePoints}`, areaIds, options);
    }

    getDockingStationsLive(includePoints: boolean): Observable<DockingStation[]> {
        return observableInterval(50000).pipe(
            mergeMap(() => this.http.get<DockingStation[]>(`${this.settings.api_url}/dockingstations?includePoints=${includePoints}`)),
            map(res => res),)
    }

    getNearestDockingStations(longitude, latitude, radiusInMeters): Observable<DockingStation[]> {
        return this.http.get<DockingStation[]>(`${this.settings.api_url}/dockingstations/nearest?longitude=${longitude}&latitude=${latitude}&radiusInMeters=${radiusInMeters}`);
    }

    getDockingStation(id: number, includePoints: boolean): Observable<any> {
        return this.http.get(`${this.settings.api_url}/dockingstations/${id}?includePoints=${includePoints}`);
    }

    getDockingStationTechnicalData(dockingStationId: number): Observable<any> {
        return this.http.get(`${this.settings.api_url}/dockingstations/${dockingStationId}/technical/data`);
    }

    updateDockingStationTechnicalDetails(dockingStationId: number, technicalDetails: DockingStationTechData): Observable<any> {
        return this.http.put(`${this.settings.api_url}/dockingstations/${dockingStationId}/technical/data`, technicalDetails);
    }

    getDockingPointsForStation(dockingStationId: any): Observable<any> {
        return this.http.get(`${this.settings.api_url}/dockingstations/${dockingStationId}/dockingpoints/bikes`);
    }

    getUndockedBikesInDockingStation(dockingStationId: any): Observable<any> {
        return this.http.get(`${this.settings.api_url}/dockingstations/${dockingStationId}/bikes/undocked`);
    }

    getUndockedBikesWithPriority(dockingStationId: any): Observable<any> {
        return this.http.get(`${this.settings.api_url}/dockingstations/${dockingStationId}/bikes/undockedpriority`);
    }

    getDockingPointsInDockingStation(dockingStationId: any): Observable<any> {
        return this.http.get(`${this.settings.api_url}/dockingstations/${dockingStationId}/dockingpoints`);
    }

    getReleasableBikesDetails(dockingStationId: any, endUserId: any): Observable<any> {
        return this.http.get(`${this.settings.api_url}/dockingstations/${dockingStationId}/bikes/releasable/${endUserId}`);
    }

    public enableDisableStation(stationId: number, dsStateChange: any): Observable<any> {
        let options = { headers: this.headers };
        return this.http.post(`${this.settings.api_url}/dockingstations/${stationId}/disable/statechange`, dsStateChange, options);
    }

    getAllDockingPointDetails(): Observable<any> {
        return this.http.get(`${this.settings.api_url}/dockingstations/dockingpoints/count`);
    }

    getUndockCommmandHistory(dockingPointId: any): Observable<any> {
        return this.http.get(`${this.settings.api_url}/dockingstations/dockingpoints/${dockingPointId}/undock/history`);
    }

    // Docking point commands

    startChargingForDockingPoint(dockingStationId: string | number, dockingPointId: string | number): Observable<any> {
        return this.http.post(`${this.settings.api_url}/dockingstations/${dockingStationId}/dockingpoints/${dockingPointId}/commands/startcharging`, null);
    }

    stopChargingForDockingPoint(dockingStationId: string | number, dockingPointId: string | number): Observable<any> {
        return this.http.post(`${this.settings.api_url}/dockingstations/${dockingStationId}/dockingpoints/${dockingPointId}/commands/stopcharging`, null);
    }

    startHeatingForDockingPoint(dockingStationId: string | number, dockingPointId: string | number): Observable<any> {
        return this.http.post(`${this.settings.api_url}/dockingstations/${dockingStationId}/dockingpoints/${dockingPointId}/commands/startheating`, null);
    }

    stopHeatingForDockingPoint(dockingStationId: string | number, dockingPointId: string | number): Observable<any> {
        return this.http.post(`${this.settings.api_url}/dockingstations/${dockingStationId}/dockingpoints/${dockingPointId}/commands/stopheating`, null);
    }

    startUnconditionalChargingForDockingPoint(dockingStationId: string | number, dockingPointId: string | number): Observable<any> {
        return this.http.post(`${this.settings.api_url}/dockingstations/${dockingStationId}/dockingpoints/${dockingPointId}/commands/startunconditionalcharging`, null);
    }

    resetSlaveForDockingPoint(dockingStationId: string | number, dockingPointId: string | number): Observable<any> {
        return this.http.post(`${this.settings.api_url}/dockingstations/${dockingStationId}/dockingpoints/${dockingPointId}/commands/resetslave`, null);
    }

    downloadDPLogForDockingPoint(dockingStationId: string | number, dockingPointId: string | number): Observable<any> {
        return this.http.post(`${this.settings.api_url}/dockingstations/${dockingStationId}/dockingpoints/${dockingPointId}/commands/downloaddplog`, null);
    }

    getDockingPointDetails(dockingStationId: any, dockingPointId: any): Observable<any> {
        return this.http.get(`${this.settings.api_url}/dockingstations/${dockingStationId}/dockingpoints/${dockingPointId}`);
    }

    updateDockingPointDetails(dockingStationId: number, dockingPointId: number, dockingPointDetails: any): Observable<any> {
        let options = {
            headers: this.headers
        };
        return this.http.put(`${this.settings.api_url}/dockingstations/` + dockingStationId + `/dockingpoints/` + dockingPointId, dockingPointDetails, options);
    }

    deleteDockingPoint(dockingStationId: number, dockingPointId: number): Observable<any> {

        return this.http.delete(`${this.settings.api_url}/dockingstations/` + dockingStationId + `/dockingpoints/` + dockingPointId);
    }

    createDockingPoint(dockingStationId: number, dockingPointDetails: any): Observable<any> {
        let options = {
            headers: this.headers
        };
        return this.http.post(`${this.settings.api_url}/dockingstations/` + dockingStationId + `/dockingpoints`, dockingPointDetails, options);
    }

    createDockingStation(dockingStation): Observable<any> {
        let options = {
            headers: this.headers
        };
        return this.http.post(`${this.settings.api_url}/dockingstations`, dockingStation, options);
    }

    updateDockingStation(dockingStationId, dockingStation): Observable<any> {
        let options = {
            headers: this.headers
        };
        return this.http.put(`${this.settings.api_url}/dockingstations/${dockingStationId}`, dockingStation, options);
    }

    deleteDockingStation(dockingStationId: number): Observable<any> {
        return this.http.delete(`${this.settings.api_url}/dockingstations/${dockingStationId}`);
    }

    public getBikeOnboardStatus(tid, dpId): Observable<any> {
        return this.http.get(`${this.settings.api_url}/dockingstations/dp/` + dpId + `/onboardstatus`);
    }

    updateNumberOfReservations(dockingStationId, numberOfReservations): Observable<any> {
        let options = {
            headers: this.headers
        };
        return this.http.get(`${this.settings.api_url}/dockingstations/${dockingStationId}/reservation/${numberOfReservations}`, options);
    }

    getAllBikesWithPriority(dockingStationId: any): Observable<any> {
        return this.http.get(`${this.settings.api_url}/dockingstations/${dockingStationId}/bikes/priority`);
    }

    getDockingStationStatsByDockingStationMode(dsModeId: any): Observable<any> {
        return this.http.get(`${this.settings.api_url}/dockingstations/${dsModeId}/filter`);
    }

    enableDisableDockingPoint(dockingStationId: any, dockingPointId: any, dpStateChangeDto: any): Observable<any> {
        let options = {
            headers: this.headers
        };
        return this.http.post(
            `${this.settings.api_url}/dockingstations/${dockingStationId}/dockingpoint/${dockingPointId}/disable/statechange`,
            dpStateChangeDto,
            options);
    }

    getUnsuccessfulSessionDetails(dockingStationId: any): Observable<any> {
        return this.http.get(`${this.settings.api_url}/dockingstations/${dockingStationId}/unsuccessful/commands/precentage`);
    }

    checkDockingStation(dockingStationId: any): Observable<any> {
        return this.http.get(`${this.settings.api_url}/dockingstations/${dockingStationId}/check`);
    }
}