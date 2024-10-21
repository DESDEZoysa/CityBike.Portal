import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

import { AppSettings } from './app.settings';


@Injectable()
export class SystemSettingsService {

    headers: HttpHeaders;

    constructor(private http: HttpClient, private settings: AppSettings) { }

    public getFAQ(): Observable<any> {
        return this.http.get(`${this.settings.api_url}/Settings/faq`);
    }

    public getHELP(): Observable<any> {
        return this.http.get(`${this.settings.api_url}/Settings/help`);
    }

    public getSETTING(): Observable<any> {
        return this.http.get(`${this.settings.api_url}/Settings`);
    }

    public getTemplateCurrentFirmware(tid): Observable<any> {
        return this.http.get(`${this.settings.api_url}/Settings/firmware/` + tid);
    }

    public updateSETTING(systemConfigs): Observable<any> {
        return this.http.put(`${this.settings.api_url}/Settings`, systemConfigs);
    }
}
