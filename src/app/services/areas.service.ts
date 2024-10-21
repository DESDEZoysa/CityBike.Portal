import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

import { AppSettings } from './app.settings';

@Injectable()
export class AreasService {

    headers: HttpHeaders;

    constructor(private http: HttpClient, private settings: AppSettings) {
        this.headers = new HttpHeaders().append('Content-Type', 'application/json');
    }

    public getAllAreas(): Observable<any> {
        return this.http.get(`${this.settings.api_url}/area`);
    }

    public getAssignOrDefaultAreasForUser(): Observable<any> {
        //return this.http.get(`${this.settings.api_url}/users/area/` + 1)
        return this.http.get(`${this.settings.api_url}/area/user`);
    }

    public updateMinimumBikes(areaId: number, minimumBikes: number): Observable<any> {
        return this.http.put(`${this.settings.api_url}/area/${areaId}/minimumbikes/${minimumBikes}`, null);
    }
}

