import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { AppSettings } from "./app.settings";

@Injectable({
    providedIn: 'root'
})
export class ZonesService {
    headers: HttpHeaders;

    constructor(private http: HttpClient, private settings: AppSettings) { }

    public getAllZones(): Observable<any> {
        let options = { headers: this.headers };
        return this.http.get(`${this.settings.insight_api_url}/zones?includeGeometries=false`, options);
    }

    public getAllZonesWithGeometries(): Observable<any> {
        let options = { headers: this.headers };
        return this.http.get(`${this.settings.insight_api_url}/zones?includeGeometries=true`, options);
    }

    public getFilteredLatestZoneBikeDemandInfo(timeZone: any) {
        return this.http.get(`${this.settings.insight_api_url}/zones/bike/demand/info/filter?timeZone=${timeZone}`);
    }
}