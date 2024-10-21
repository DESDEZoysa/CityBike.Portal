import { Injectable } from '@angular/core';
import { HttpHeaders, HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppSettings } from './app.settings';

@Injectable({
  providedIn: 'root'
})
export class RepairService {
  headers: HttpHeaders;

  constructor(private http: HttpClient, private settings: AppSettings) {
    this.headers = new HttpHeaders().append('Content-Type', 'application/json');
  }

  public getAllBikeRepairReasons(): Observable<any> {
    return this.http.get(`${this.settings.api_url}/repair/reasons`);
  }

  public CreateRepairAction(details): Observable<any> {
    let options = { headers: this.headers };
    return this.http.post(`${this.settings.api_url}/repair`, details, options);
  }

  public CreateBulkRepairAction(bikeId, details): Observable<any> {
    let options = { headers: this.headers };
    return this.http.post(`${this.settings.api_url}/repair/${bikeId}/repairbulk`, details, options);
  }

  public UpdateBulkRepairAction(details): Observable<any> {
    let options = { headers: this.headers };
    return this.http.put(`${this.settings.api_url}/repair/repairbulk`, details, options);
  }

  public amendBulkRepairAction(bikeId, details): Observable<any> {
    let options = { headers: this.headers };
    return this.http.put(`${this.settings.api_url}/repair/${bikeId}/repairbulk/amend`, details, options);
  }

  public closeAllActiveRepairsForBike(bikeId): Observable<any> {
    let options = { headers: this.headers };
    return this.http.put(`${this.settings.api_url}/repair/${bikeId}/close`, options);
  }

  public completeRepairAction(repairId, repair): Observable<any> {
    let options = { headers: this.headers };
    return this.http.put(`${this.settings.api_url}/repair/${repairId}/complete`, repair, options);
  }

  public getAllBikeRepairHistory(): Observable<any> {
    return this.http.get<any>(`${this.settings.api_url}/repair/history`);
  }

  public getBikeRepairHistory(bikeId: number | string): Observable<any> {
    return this.http.get<any>(`${this.settings.api_url}/repair/${bikeId}/history`);
  }

  public getBikeWorkshopHistory(bikeId: number | string): Observable<any> {
    return this.http.get<any>(`${this.settings.api_url}/repair/${bikeId}/extendedhistory`);
  }

  public getAllWorkshopHistory(from: any, to: any): Observable<any> {
    let options = { headers: this.headers };
    let params = { fromTimestamp: from, toTimestamp: to };
    return this.http.post<any>(`${this.settings.api_url}/repair/extendedhistory`, params, options);
  }

  public getBikeRepairHistoryPerIssue(bikeId: number | string, issueId: number | string): Observable<any> {
    return this.http.get<any>(`${this.settings.api_url}/repair/${bikeId}/issue/${issueId}/history`);
  }

  public GetRepairOrdersByBikeId(bikeId: number | string): Observable<any> {
    let options = { headers: this.headers };
    return this.http.get(`${this.settings.api_url}/repair/${bikeId}/repairorders`, options);
  }

  public GetRepairCategories(): Observable<any> {
    let options = { headers: this.headers };
    return this.http.get(`${this.settings.api_url}/repair/categories`, options);
  }

  public GetAllWorkshopCategories(): Observable<any> {
    let options = { headers: this.headers };
    return this.http.get(`${this.settings.api_url}/repair/categories/workshop`, options);
  }

  public CreateRepairReport(details): Observable<any> {
    let options = { headers: this.headers };
    return this.http.post(`${this.settings.api_url}/repair/report`, details, options);
  }

  public GetAllRepairReports(): Observable<any> {
    let options = { headers: this.headers };
    return this.http.get(`${this.settings.api_url}/repair/report`, options);
  }

  public GetAllRepairCategories(): Observable<any> {
    let options = { headers: this.headers };
    return this.http.get(`${this.settings.api_url}/repair/categories`, options);
  }

  public DeleteRepairAction(repairId): Observable<any> {
    return this.http.delete(`${this.settings.api_url}/repair/${repairId}/repairaction`, repairId);
  }

  public getAllFixCategories(): Observable<any> {
    let options = { headers: this.headers };
    return this.http.get(`${this.settings.api_url}/repair/dockingpoint/categories/fix`, options);
  }

  public fixDockingPointIssue(issueFixed): Observable<any> {
    let options = { headers: this.headers };
    return this.http.post(`${this.settings.api_url}/repair/dockingpoint/complete`, issueFixed, options);
  }

  public getAllDPRepairHistoryByFilter(params): Observable<any> {
    let options = { headers: this.headers };
    return this.http.post(`${this.settings.api_url}/repair/dockingpoint/history/filter`, params, options);
  }

  public getDockingPointIssueFixDetails(id): Observable<any> {
    let options = { headers: this.headers };
    return this.http.get(`${this.settings.api_url}/repair/dockingpoint/issue/fix/${id}/details`, options);
  }

  public updateDockingPointRepairs(repairs): Observable<any> {
    let options = { headers: this.headers };
    return this.http.post(`${this.settings.api_url}/repair/dockingpoint/issue/fix/update`, repairs, options);
  }

  public deleteDockingPointRepair(dockingPointId: any, dpFixId: any): Observable<any> {
    let options = { headers: this.headers };
    return this.http.delete(`${this.settings.api_url}/repair/dockingpoint/${dockingPointId}/fix/${dpFixId}`, options);
  }
}
