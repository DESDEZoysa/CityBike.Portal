import { Injectable } from '@angular/core';
import { HttpHeaders, HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppSettings } from './app.settings';

@Injectable({
    providedIn: 'root'
})
export class StorageService {
    headers: HttpHeaders;

    constructor(private http: HttpClient, private settings: AppSettings) { }

    public getAllStorages(): Observable<any> {
        let options = { headers: this.headers };
        return this.http.get(`${this.settings.api_url}/storage`, options);
    }

    public createStorage(details): Observable<any> {
        let options = { headers: this.headers };
        return this.http.post(`${this.settings.api_url}/storage`, details, options);
    }


    public getStorageById(id): Observable<any> {
        let options = { headers: this.headers };
        return this.http.get(`${this.settings.api_url}/storage/` + id, options);
    }

    public updateStorage(id, details): Observable<any> {
        let options = { headers: this.headers };
        return this.http.put(`${this.settings.api_url}/storage/` + id, details, options);
    }
}





