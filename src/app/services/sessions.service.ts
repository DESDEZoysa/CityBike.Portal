import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

import { AppSettings } from './app.settings';

@Injectable()
export class SessionsService {

    headers: HttpHeaders;

    constructor(private http: HttpClient, private settings: AppSettings) {
        this.headers = new HttpHeaders().append('Content-Type', 'application/json');
    }

    public getAllSessions(): Observable<any> {
        return this.http.get(`${this.settings.api_url}/RideSession`);
    }

    public getActiveSessions(): Observable<any> {
        return this.http.get(`${this.settings.api_url}/RideSession/active`);
    }

    public getAllRideSessionByEndUserId(endUserId: string): Observable<any> {
        return this.http.get(`${this.settings.api_url}/RideSession/${endUserId}/history`);
    }

    public getSessionWithBike(id) {
        return this.http.get(`${this.settings.api_url}/RideSession/${id}/bike`);
    }

    public terminateSession(bikeId: number, comment: any): Observable<any> {
        let options = { headers: this.headers };
        return this.http.post(`${this.settings.api_url}/bikes/${bikeId}/terminate`, comment, options);
    }

    public GetFilteredSessions(from, to): Observable<any> {
        let options = { headers: this.headers };
        let params = { fromTimestamp: from, toTimestamp: to };
        return this.http.post(`${this.settings.api_url}/RideSession/filter`, params, options);
    }

    /**sessions filter including areas */

    public getActiveSessionsIncludingAreas(areaIds = [], isExport): Observable<any> {
        let options = { headers: this.headers };
        let params = { AreaIds: areaIds, IsExport: isExport };
        return this.http.post(`${this.settings.api_url}/RideSession/activeByAreas`, params, options);
    }

    public GetFilteredSessionsByArea(from, to, areaIds = [], isExport): Observable<any> {
        let options = { headers: this.headers };
        let params = { fromTimestamp: from, toTimestamp: to, AreaIds: areaIds, IsExport: isExport };
        return this.http.post(`${this.settings.api_url}/RideSession/filterByAreas`, params, options);
    }

    public GetAllFilteredSessionHistory(requestDto: any): Observable<any> {
        let options = { headers: this.headers };
        return this.http.post(`${this.settings.api_url}/RideSession/history/filter`, requestDto, options);
    }
}

