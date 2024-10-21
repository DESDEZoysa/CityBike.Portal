import { Injectable } from '@angular/core';
import { HttpHeaders, HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppSettings } from './app.settings';

@Injectable({
    providedIn: 'root'
})
export class IssueService {
    headers: HttpHeaders;

    constructor(private http: HttpClient, private settings: AppSettings) { }

    public GetErrorCategories(): Observable<any> {
        let options = { headers: this.headers };
        return this.http.get(`${this.settings.api_url}/issue/hierarchy`, options);
    }

    public CreateErrorReport(details): Observable<any> {
        let options = { headers: this.headers };
        return this.http.post(`${this.settings.api_url}/issue/report`, details, options);
    }

    public GetAllErrorReports(): Observable<any> {
        let options = { headers: this.headers };
        return this.http.get(`${this.settings.api_url}/issue/report`, options);
    }

    public GetAllIssueReportCount(): Observable<any> {
        let options = { headers: this.headers };
        return this.http.get(`${this.settings.api_url}/issue/count`, options);
    }

    public GetAllErrorCategories(): Observable<any> {
        let options = { headers: this.headers };
        return this.http.get(`${this.settings.api_url}/issue/categories`, options);
    }

    public GetAllErrorReportsPerBike(bikeId): Observable<any> {
        return this.http.get(`${this.settings.api_url}/issue/report/${bikeId}`);
    }

    public ResolveIssue(id, issueId): Observable<any> {
        let options = { headers: this.headers };
        return this.http.put(`${this.settings.api_url}/issue/report/` + id + `/issue/${issueId}/resolve`, options);
    }

    public ResolveIssuePerBike(id): Observable<any> {
        let options = { headers: this.headers };
        return this.http.put(`${this.settings.api_url}/issue/report/` + id + `/resolve`, options);
    }

    public DisableStuckBikeAndDockingPoint(params): Observable<any> {
        let options = { headers: this.headers };
        return this.http.post(`${this.settings.api_url}/issue/report/bike/stuck`, params, options);
    }

    public GetActiveCriticalIssueCountPerBike(bikeId): Observable<any> {
        let options = { headers: this.headers };
        return this.http.get(`${this.settings.api_url}/issue/bike/` + bikeId + `/activecount`, options);
    }

    public GetAllActiveIssueCountPerBike(bikeId): Observable<any> {
        let options = { headers: this.headers };
        return this.http.get(`${this.settings.api_url}/issue/bike/` + bikeId + `/allactivecount`, options);
    }

    public getAllErrorReportsByFilter(params): Observable<any> {
        let options = { headers: this.headers };
        return this.http.post(`${this.settings.api_url}/issue/filter`, params, options);
    }

    public getAllDockingPointErrorCategories(): Observable<any> {
        return this.http.get(`${this.settings.api_url}/issue/dockingpoint/categories`);
    }

    public createDPIssue(dpErrorReportDto): Observable<any> {
        let options = { headers: this.headers };
        return this.http.post(`${this.settings.api_url}/issue/dockingpoint/report`, dpErrorReportDto, options);
    }

    public getActiveDockingPointErrorReportsByDPId(dockingPointId): Observable<any> {
        let options = { headers: this.headers };
        return this.http.get(`${this.settings.api_url}/issue/dockingpoint/${dockingPointId}/report`, options);
    }

    public getAllActiveDockingPointErrorReports(): Observable<any> {
        let options = { headers: this.headers };
        return this.http.get(`${this.settings.api_url}/issue/dockingpoint/report/active`, options);
    }

    public getAllActiveErrorReports(): Observable<any> {
        let options = { headers: this.headers };
        return this.http.get(`${this.settings.api_url}/issue/reports/active`, options);
    }
}





