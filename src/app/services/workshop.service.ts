import { Injectable } from '@angular/core';
import { HttpHeaders, HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppSettings } from './app.settings';

@Injectable({
    providedIn: 'root'
})
export class WorkshopService {
    headers: HttpHeaders;

    constructor(private http: HttpClient, private settings: AppSettings) { }

    public GetAllWorkshops(): Observable<any> {
        let options = { headers: this.headers };
        return this.http.get(`${this.settings.api_url}/workshop`, options);
    }

    public getAllWorkshopsWithStreetTeam(): Observable<any> {
        let options = { headers: this.headers };
        return this.http.get(`${this.settings.api_url}/workshop/all`, options);
    }

    public CreateWorkshop(details): Observable<any> {
        let options = { headers: this.headers };
        return this.http.post(`${this.settings.api_url}/workshop`, details, options);
    }

    public GetAllWorkshopsByUserPosition(details): Observable<any> {
        let options = { headers: this.headers };
        return this.http.post(`${this.settings.api_url}/workshop/nearby`, details, options);
    }

    public GetWorkshopById(id): Observable<any> {
        let options = { headers: this.headers };
        return this.http.get(`${this.settings.api_url}/workshop/` + id, options);
    }

    public UpdateWorkshop(id, details): Observable<any> {
        let options = { headers: this.headers };
        return this.http.put(`${this.settings.api_url}/workshop/` + id, details, options);
    }
}





