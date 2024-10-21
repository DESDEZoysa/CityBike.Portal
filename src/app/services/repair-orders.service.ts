import { Injectable } from '@angular/core';
import { HttpHeaders, HttpClient } from '@angular/common/http';
import { AppSettings } from '.';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})

export class RepairOrdersService {
  headers: HttpHeaders;

  constructor(private http: HttpClient, private settings: AppSettings) { }

  public getAllRepairOrders(isOngoing: boolean): Observable<any> {
    return this.http.get(`${this.settings.api_url}/repair/orders?isOngoing=${isOngoing}`);
  }

  public completedRepairOrder(repairOrderId): Observable<any> {
    let options = { headers: this.headers };
    return this.http.put(`${this.settings.api_url}/repair/orders/${repairOrderId}/complete`, options);
  }

  public closeRepairOrder(repairOrderId): Observable<any> {
    let options = { headers: this.headers };
    return this.http.put(`${this.settings.api_url}/repair/order/${repairOrderId}/close`, options);
  }

  public createRepairOrder(bikeId): Observable<any> {
    let options = { headers: this.headers };
    return this.http.post(`${this.settings.api_url}/repair/order/` + bikeId, options);
  }

  public getActiveRepairOrdersCount(): Observable<any> {
    return this.http.get(`${this.settings.api_url}/repair/count`);
  }

}





