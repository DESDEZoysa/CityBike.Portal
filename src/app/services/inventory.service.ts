import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppSettings } from './app.settings';

@Injectable({
  providedIn: 'root'
})
export class InventoryService {
  headers: HttpHeaders;

  constructor(private http: HttpClient, private settings: AppSettings) {
    this.headers = new HttpHeaders().append('Content-Type', 'application/json');
  }

  public getAllBikeParts(): Observable<any> {
    return this.http.get(`${this.settings.api_url}/inventory/parts`);
  }

  public getAllBikeVariants(): Observable<any> {
    return this.http.get(`${this.settings.api_url}/inventory/variants`);
  }

  public getAllVariantsforPart(partId): Observable<any> {
    return this.http.get(`${this.settings.api_url}/inventory/parts/` + partId + `/variants`);
  }

  public getAllPartsAndVariants(): Observable<any> {
    return this.http.get<any>(`${this.settings.api_url}/inventory`);
  }

  public createPartVariant(partVariant): Observable<any> {
    let options = { headers: this.headers };
    return this.http.post(`${this.settings.api_url}/inventory`, partVariant, options);
  }

  public updatePartVariant(partVariant): Observable<any> {
    let options = { headers: this.headers };
    return this.http.put(`${this.settings.api_url}/inventory`, partVariant, options);
  }

  public updateBulkPartVariant(partVariant): Observable<any> {
    let options = { headers: this.headers };
    return this.http.put(`${this.settings.api_url}/inventory/bulk`, partVariant, options);
  }

  public getAllPartVariantsByFilter(workshopId): Observable<any> {
    return this.http.get<any>(`${this.settings.api_url}/inventory/workshop/` + workshopId);
  }

  public moveInventoryStock(moveInventoryDet): Observable<any> {
    let options = { headers: this.headers };
    return this.http.post(`${this.settings.api_url}/inventory/move`, moveInventoryDet, options);
  }

  public getAllPartDetails(): Observable<any> {
    return this.http.get(`${this.settings.api_url}/inventory/parts/details`);
  }
}
