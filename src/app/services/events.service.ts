import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppSettings } from './app.settings';

@Injectable()
export class EventService {

    headers: HttpHeaders;

    constructor(private http: HttpClient, private settings: AppSettings) {
        this.headers = new HttpHeaders().append('Content-Type', 'application/json');
    }

    public getEventsByBikeId(bikeId): Observable<any> {
        return this.http.get(`${this.settings.api_url}/alert/` + bikeId);
    }

    public getEvents(): Observable<any> {
        return this.http.get(`${this.settings.api_url}/alert/`);
    }

    public acknowledgeEvent(eventId): Observable<any> {
        let options = { headers: this.headers };
        return this.http.put(`${this.settings.api_url}/alert/` + eventId + `/acknowledge`, options);
    }

    public acknowledgeAllEvents(bikeId): Observable<any> {
        let options = { headers: this.headers };
        return this.http.put(`${this.settings.api_url}/alert/bike/` + bikeId + `/acknowledge`, options);
    }

    public filterAllEvents(params: any): Observable<any> {
        let options = { headers: this.headers };
        return this.http.post(`${this.settings.api_url}/alert/filter`, params, options);
    }

    public filterAllEventsByAcknowledgeStatus(acknowledgeStatus): Observable<any> {
        return this.http.get(`${this.settings.api_url}/alert/count/` + acknowledgeStatus);
    }

    public GetAllEventsByUnacknowledgeCount(): Observable<any> {
        return this.http.get(`${this.settings.api_url}/alert/count/unacknowledge`);
    }

    /**
     * Event Categories
     */
    public getEventCategories(params): Observable<any> {
        let options = { headers: this.headers };
        return this.http.post(`${this.settings.api_url}/alert/categories`, params, options);
    }
    public getEventCategoriesByBikeId(params): Observable<any> {
        let options = { headers: this.headers };
        return this.http.post(`${this, this.settings.api_url}/alert/categories`, params, options);
    }

    public filterAllEventsByCategories(params: any): Observable<any> {
        let options = { headers: this.headers };
        return this.http.post(`${this.settings.api_url}/alert/filterAll`, params, options);
    }
}

