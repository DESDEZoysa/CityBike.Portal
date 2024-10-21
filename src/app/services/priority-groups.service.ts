import { Injectable } from "@angular/core";
import { HttpHeaders, HttpClient } from '@angular/common/http';
import { AppSettings } from '.';
import { Observable } from 'rxjs';


@Injectable()
export class PriorityGroupService {
    headers: HttpHeaders;

    constructor(private http: HttpClient, private settings: AppSettings) { }

    public getAllPriorityGroups(): Observable<any> {
        return this.http.get(`${this.settings.api_url}/prioritygroup/details`);
    }

    public deletePriorityGroup(id): Observable<any> {
        return this.http.delete(`${this.settings.api_url}/prioritygroup/${id}`);
    }

    public updatePriorityGroup(priorityGroup): Observable<any> {
        let options = { headers: this.headers };
        return this.http.put(`${this.settings.api_url}/prioritygroup`, priorityGroup, options);
    }

    public createPriorityGroup(priorityGroup): Observable<any> {
        let options = { headers: this.headers };
        return this.http.post(`${this.settings.api_url}/prioritygroup`, priorityGroup, options);
    }

    public getAllPriorityReservationsByDockingStation(dockingStationId): Observable<any> {
        return this.http.get(`${this.settings.api_url}/prioritygroup/dockingstation/${dockingStationId}`);
    }

    public createPriorityGroupDockingStation(dockingStationId, priorityGroupDock): Observable<any> {
        let options = { headers: this.headers };
        return this.http.post(`${this.settings.api_url}/prioritygroup/dockingstation/${dockingStationId}/assign`, priorityGroupDock, options);
    }

    public deletePriorityReservation(id): Observable<any> {
        return this.http.delete(`${this.settings.api_url}/prioritygroup/prioritygroupaction/${id}`);
    }
}