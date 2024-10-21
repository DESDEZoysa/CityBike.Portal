import { Component, OnInit, ViewChild } from '@angular/core';
import { BikesService, LoggerService } from '../../services';
import { ExcelService } from '../../services/excel.service';
import { LocalStorageKeys } from '../../core/constants';
import { ConvertTimePipe } from '../../core/pipes/convert-time.pipe';
import * as moment from 'moment';

@Component({
  selector: 'app-bike-warranty-report',
  templateUrl: './bike-warranty-report.component.html',
  styleUrls: ['./bike-warranty-report.component.scss'],
  providers: [ConvertTimePipe]
})

export class BikeWarrantyReportComponent implements OnInit {
  @ViewChild('warrantyReportTable', { static: true }) table: any;
  public warrentydetails: any[];
  isMobile: boolean = false;
  loadingIndicator: boolean = true;

  constructor(
    private bikesService: BikesService,
    private excelService: ExcelService,
    private convertTime: ConvertTimePipe,
    private loggerService: LoggerService
  ) {
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) && (document.documentElement.clientWidth < 768)) {
      this.isMobile = true;
    }
  }

  onResize() {
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) && (document.documentElement.clientWidth < 768)) {
      this.isMobile = true;
    } else {
      this.isMobile = false;
    }
  }

  ngOnInit() {
    this.GetWarrantyDetails();
  }

  GetWarrantyDetails() {
    this.bikesService.getWarrantyDetails()
      .subscribe(data => {
        this.warrentydetails = data;
        for (let detail of this.warrentydetails) {
          if (detail["DateBikePassedXDistance"])
            detail["DateBikePassedXDistance"] = moment(detail["DateBikePassedXDistance"]).format('YYYY-MM-DD');
        }
        this.loadingIndicator = false;
      },
        error => {
          this.loadingIndicator = false;
          if (error.status == 403) {
            this.loggerService.showErrorMessage("Don't have permission to obtain data");
          } else {
            this.loggerService.showErrorMessage("Error occurred while obtaining warranty details");
          }
        });
  }

  toggleExpandRow(row) {
    this.table.rowDetail.toggleExpandRow(row);
  }

  generateExcel() {
    if (this.warrentydetails.length > 0) {
      let convertType = JSON.parse(localStorage.getItem(LocalStorageKeys.PREFERRED_TIMEZONE));
      let dataToExport = JSON.parse(JSON.stringify(this.warrentydetails));
      if (convertType == null || convertType == undefined) {
        convertType = 'CET';
      }
      if (convertType == 'CET') {
        dataToExport = this.convertToTimeType(dataToExport);
      } else {
        this.excelService.generateBikeWarrantyExcel(dataToExport);
      }
    } else {
      return this.loggerService.showErrorMessage("No warranty records found to export");
    }
  }

  convertToTimeType(dataToExport) {
    dataToExport.forEach((details) => {
      details['OnboardedTimestamp'] = this.convertTime.transform(details['OnboardedTimestamp']);
      details['OldestSessionStartTime'] = this.convertTime.transform(details['OldestSessionStartTime']);
      details['NewestSessionStartTime'] = this.convertTime.transform(details['NewestSessionStartTime']);
      return details
    });
    this.excelService.generateBikeWarrantyExcel(dataToExport);
  }
}
