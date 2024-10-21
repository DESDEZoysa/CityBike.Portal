import { Injectable } from '@angular/core';
import { HttpHeaders, HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppSettings } from './app.settings';

@Injectable({
    providedIn: 'root'
})
export class RouteService {
    headers: HttpHeaders;

    constructor(private http: HttpClient, private settings: AppSettings) {
        this.headers = new HttpHeaders().append('Content-Type', 'application/json');
    }

    public getAllRouteOrders(isOngoing): Observable<any> {
        return this.http.get(`${this.settings.api_url}/route?isOngoing=${isOngoing}`);
    }

    public createRoute(routeObj): Observable<any> {
        let options = { headers: this.headers };
        return this.http.post(`${this.settings.api_url}/route`, routeObj, options);
    }

    public createWaypointAction(actionObj): Observable<any> {
        let options = { headers: this.headers };
        return this.http.post(`${this.settings.api_url}/route/waypoint/action`, actionObj, options);
    }

    public getRouteDataById(routeId): Observable<any> {
        return this.http.get(`${this.settings.api_url}/route/${routeId}`);
    }

    public getRouteDetailsWithWaypointActions(routeId): Observable<any> {
        return this.http.get(`${this.settings.api_url}/route/${routeId}/details`);
    }

    public updateRoute(routeId, routeObj): Observable<any> {
        let options = { headers: this.headers };
        return this.http.put(`${this.settings.api_url}/route/` + routeId, routeObj, options);
    }

    public updateWaypoint(waypointId, waypointObj): Observable<any> {
        let options = { headers: this.headers };
        return this.http.put(`${this.settings.api_url}/route/waypoint/` + waypointId, waypointObj, options);
    }

    public startRoute(routeId: any): Observable<any> {
        let options = { headers: this.headers };
        return this.http.post(`${this.settings.api_url}/route/${routeId}/start`, options);
    }

    public endRoute(routeId: any): Observable<any> {
        let options = { headers: this.headers };
        return this.http.post(`${this.settings.api_url}/route/${routeId}/end`, options);
    }

    public addWaypoint(routeId: any, waypointObj: any): Observable<any> {
        let options = { headers: this.headers };
        return this.http.post(`${this.settings.api_url}/route/${routeId}/waypoint/add`, waypointObj, options);
    }

    public updateWaypointByAssignedOn(waypointObj): Observable<any> {
        let options = { headers: this.headers };
        return this.http.put(`${this.settings.api_url}/route/waypoint`, waypointObj, options);
    }
}