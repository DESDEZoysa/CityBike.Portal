import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { AppSettings } from "./app.settings";

@Injectable()
export class CarService {
    headers: HttpHeaders;

    constructor(private http: HttpClient, private settings: AppSettings) { }

    public getAllStreetTeamCars(): Observable<any> {
        return this.http.get(`${this.settings.api_url}/cars`);
    }

    public getAllUnAssignedStreetTeamCars(): Observable<any> {
        return this.http.get(`${this.settings.api_url}/cars/unassigned`);
    }
}