import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppSettings } from './app.settings';
import { LiveConnectRequest } from '../core/models';

@Injectable()
export class LiveConnectionService {

    constructor(
        protected http: HttpClient,
        protected appSettings: AppSettings) {
    }

    //Get live connection details
    public getLiveConnectionDetails(requestOptions: LiveConnectRequest[]): Observable<any> {
        let options = {
            headers: new HttpHeaders().append('content-type', 'application/json')
        }
        return this.http.post(`${this.appSettings.api_url}/live/request`, JSON.stringify(requestOptions), options);
    }

    public getTicketIntegratorSettings() {
        return this.http.get(`${this.appSettings.api_url}/settings/ticketIntegrator`);
    }

}