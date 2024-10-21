import { Injectable } from '@angular/core';
import { AppSettings } from './app.settings';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class ImportExportService {

  headers: HttpHeaders;
  constructor(private http: HttpClient, private settings: AppSettings) { }

  public downloadTermsAndConditions(language) {
    return (this.settings.api_url + `/importexport/terms/` + language);
  };

  // public downloadExcelReport(reportModel): Observable<any> {
  //   let headers = new HttpHeaders({
  //     'Content-Type': 'application/json',
  //   });
  //   let options = {
  //     headers: headers
  //   };
  //   return this.http.post(`${this.settings.api_url}/ImportExport/ExcelExport/json`, reportModel, options)
  // }

  public downloadBikeListExcelReport() {
    const options = { responseType: 'blob' as 'blob' };
    return this.http.get(this.settings.api_url + `/importexport/excel/bikelist`, options);
  }

  public downloadBikeListPDFReport() {
    const options = { responseType: 'blob' as 'blob' };
    return this.http.get(this.settings.api_url + `/importexport/pdf/bikelist`, options);
  }

  // public getImageURL(imageName, folderName): Observable<any> {
  //   let options = { headers: this.headers };
  //   let imageURLDTO = { "FileName": imageName, "FolderName": folderName }
  //   return this.http.post(`${this.settings.api_url}/importexport/image`, imageURLDTO, options);
  // }
}




