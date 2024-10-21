
import { map } from 'rxjs/operators';
import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';


import { AppSettings } from './app.settings';
import { Address } from '../core/models';

@Injectable()
export class ReverseGeocodingService {

    options;

    constructor(
        private http: HttpClient,
        private appSettings: AppSettings
    ) {
        this.options = {
            headers: new HttpHeaders().append('Content-Type', 'application/json')
        }
    }

    getReverseGeocoding(longitude: number, latitude: number): Observable<Address> {
        return this.http.get(`${this.appSettings.reverse_geocoding_url}/reverse?format=json&lat=${latitude}&lon=${longitude}`).pipe(
            map((res: any) => {
                //console.log(res);
                let address = new Address();
                address.City = res.address.city;
                address.Country = res.address.country;
                address.District = res.address.district;
                address.Street = res.address.road;
                address.DisplayText = res.display_name;
                return address;
            }));
        ;
    }
}