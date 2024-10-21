import { Injectable } from '@angular/core';
import * as ExcelJS from "exceljs/dist/exceljs.min.js";

import * as fs from 'file-saver';
import * as moment from "moment";
import "moment-timezone";
import { AddressExtension } from '../core/extensions';

declare const ExcelJS: any;

@Injectable({
  providedIn: 'root'
})
export class ExcelService {

  constructor() { }

  generateSessionExcel(json: any) {
    let sessionsToPrint = [];

    json.forEach((val) => {
      let valuesArray = [];
      valuesArray.push(val.RideSessionId);
      valuesArray.push(val.VisualId);
      valuesArray.push(val.EndUserId);
      valuesArray.push(val.StartTime);
      valuesArray.push(val.EndTime);
      valuesArray.push((val.StartDockingStationName != null) ? val.StartDockingStationName : AddressExtension.GetAddressStr(val.StartAddress));
      valuesArray.push((val.EndDockingStationName != null) ? val.EndDockingStationName : AddressExtension.GetAddressStr(val.EndAddress));
      valuesArray.push(val.StartChargeLevel);
      valuesArray.push(val.EndChargeLevel);
      valuesArray.push(val.Duration);
      valuesArray.push(parseFloat(val.TripDistance).toFixed(3));
      valuesArray.push(val.Municipality);
      valuesArray.push(val.PriceModelId);
      valuesArray.push(val.StartReason);
      valuesArray.push(val.EndReason);
      valuesArray.push(val.Comment);
      sessionsToPrint.push(valuesArray);
    });

    let workbook = new ExcelJS.Workbook();
    let worksheet = workbook.addWorksheet('Session Data');

    worksheet.columns = [
      { header: 'Session Id', key: 'sessionId', width: 40 },
      { header: 'Visual Id', key: 'visualId', width: 11 },
      { header: 'User', key: 'user', width: 26 },
      { header: 'Started Time', key: 'starttime', width: 30 },
      { header: 'Ended Time', key: 'endedtime', width: 30 },
      { header: 'Started Location', key: 'startedlocation', width: 85 },
      { header: 'Ended Location', key: 'endedlocation', width: 85 },
      { header: 'Start Charge Level', key: 'startedchargelevel', width: 20 },
      { header: 'End Charge Level', key: 'endedchargelevel', width: 20 },
      { header: 'Duration', key: 'duration', width: 12, outlineLevel: 1 },
      { header: 'Trip Distance (KM)', key: 'distance', width: 20 },
      { header: 'Municipality', key: 'municipality', width: 16, outlineLevel: 1 },
      { header: 'Price Model', key: 'pricemodel', width: 16 },
      { header: 'Started Reason', key: 'startreason', width: 45 },
      { header: 'Ended Reason', key: 'endedreason', width: 40 },
      { header: 'Comment', key: 'comment', width: 40 }
    ];

    worksheet.getCell('A1').font = { size: 12, bold: true };
    worksheet.getCell('B1').font = { size: 12, bold: true };
    worksheet.getCell('C1').font = { size: 12, bold: true };
    worksheet.getCell('D1').font = { size: 12, bold: true };
    worksheet.getCell('E1').font = { size: 12, bold: true };
    worksheet.getCell('F1').font = { size: 12, bold: true };
    worksheet.getCell('G1').font = { size: 12, bold: true };
    worksheet.getCell('H1').font = { size: 12, bold: true };
    worksheet.getCell('I1').font = { size: 12, bold: true };
    worksheet.getCell('J1').font = { size: 12, bold: true };
    worksheet.getCell('K1').font = { size: 12, bold: true };
    worksheet.getCell('L1').font = { size: 12, bold: true };
    worksheet.getCell('M1').font = { size: 12, bold: true };
    worksheet.getCell('N1').font = { size: 12, bold: true };
    worksheet.getCell('O1').font = { size: 12, bold: true };
    worksheet.getCell('P1').font = { size: 12, bold: true };

    worksheet.addRows(sessionsToPrint);

    // set style for each cell
    worksheet.eachRow(function (Row, rowNum) {
      Row.alignment = { vertical: 'middle', horizontal: 'left' }
      // Row.eachCell(function (Cell, cellNum) {       
      //   Cell.alignment = { vertical: 'middle', horizontal: 'left' }
      // })
    })

    let date = moment().utc().format('YYYY-MM-DDTHH:mm:ss');

    workbook.xlsx.writeBuffer().then((sessionsToPrint) => {
      let blob = new Blob([sessionsToPrint], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      fs.saveAs(blob, 'SessionData-' + date + '.xlsx');
    });
  }

  generateEventExcel(json: any) {
    let eventToSave = [];

    json.forEach((val) => {
      let valuesArray = [];
      valuesArray.push(val.VisualId);
      valuesArray.push(val.Serial);
      valuesArray.push(val.ReceivedOn);
      valuesArray.push(val.ErrorCategoryName);
      valuesArray.push(val.DockingStationName);
      valuesArray.push(val.HardwareId);
      valuesArray.push(val.Text);
      valuesArray.push(val.Details);
      eventToSave.push(valuesArray);
    });

    let workbook = new ExcelJS.Workbook();
    let worksheet = workbook.addWorksheet('Events');

    worksheet.columns = [
      { header: 'Visual Id', key: 'visualId', width: 10 },
      { header: 'Serial', key: 'serial', width: 15 },
      { header: 'ReceivedOn', key: 'receivedOn', width: 30 },
      { header: 'Error Category', key: 'errorCategory', width: 45 },
      { header: 'Docking Station Name-Address', key: 'dockingStationName', width: 40 },
      { header: 'HardwareId', key: 'hardwareId', width: 20 },
      { header: 'Category Details', key: 'categoryDetails', width: 40 },
      { header: 'Additional Details', key: 'additionalDetails', width: 200 },
    ];

    worksheet.getCell('A1').font = { size: 12, bold: true };
    worksheet.getCell('B1').font = { size: 12, bold: true };
    worksheet.getCell('C1').font = { size: 12, bold: true };
    worksheet.getCell('D1').font = { size: 12, bold: true };
    worksheet.getCell('E1').font = { size: 12, bold: true };
    worksheet.getCell('F1').font = { size: 12, bold: true };
    worksheet.getCell('G1').font = { size: 12, bold: true };
    worksheet.getCell('H1').font = { size: 12, bold: true };
    worksheet.getCell('I1').font = { size: 12, bold: true };
    worksheet.addRows(eventToSave);

    let date = moment().utc().format('YYYY-MM-DDTHH:mm:ss');
    workbook.xlsx.writeBuffer().then((eventToSave) => {
      let blob = new Blob([eventToSave], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      fs.saveAs(blob, 'EventData-' + date + '.xlsx');
    });
  }

  generateIssueExcel(json: any) {
    let eventToSave = [];

    json.forEach((val) => {
      let valuesArray = [];
      valuesArray.push(val.VisualId);
      valuesArray.push(val.ErrorCategoryName);
      valuesArray.push(val.DockingStationName);
      valuesArray.push(val.DockingPointHardwareId);
      valuesArray.push(val.EndUser);
      valuesArray.push(val.EndAppUserId);
      valuesArray.push(val.ReportedDate);
      valuesArray.push((val.CompletedBy != -1) ? val.CompletedBy : "System Resolved");
      valuesArray.push(val.CompletedDate);
      valuesArray.push(val.Comments);
      eventToSave.push(valuesArray);
    });

    let workbook = new ExcelJS.Workbook();
    let worksheet = workbook.addWorksheet('Events');

    worksheet.columns = [
      { header: 'Visual Id', key: 'visualId', width: 10 },
      { header: 'Categories', key: 'categories', width: 30 },
      { header: 'DockingStation Name', key: 'dockingstationname', width: 30 },
      { header: 'DockingPoint HardwareId', key: 'dockingpointhardwareid', width: 30 },
      { header: 'User', key: 'user', width: 25 },
      { header: 'End User', key: 'endUser', width: 30 },
      { header: 'Reported Date', key: 'reportedDate', width: 30 },
      { header: 'Completed By', key: 'completedBy', width: 25 },
      { header: 'Completed Date', key: 'completedDate', width: 30 },
      { header: 'Comments', key: 'comments', width: 100 },
    ];

    worksheet.getCell('A1').font = { size: 12, bold: true };
    worksheet.getCell('B1').font = { size: 12, bold: true };
    worksheet.getCell('C1').font = { size: 12, bold: true };
    worksheet.getCell('D1').font = { size: 12, bold: true };
    worksheet.getCell('E1').font = { size: 12, bold: true };
    worksheet.getCell('F1').font = { size: 12, bold: true };
    worksheet.getCell('G1').font = { size: 12, bold: true };
    worksheet.getCell('H1').font = { size: 12, bold: true };
    worksheet.getCell('I1').font = { size: 12, bold: true };
    worksheet.getCell('J1').font = { size: 12, bold: true };
    worksheet.getCell('K1').font = { size: 12, bold: true };
    worksheet.addRows(eventToSave);

    let date = moment().utc().format('YYYY-MM-DDTHH:mm:ss');
    workbook.xlsx.writeBuffer().then((eventToSave) => {
      let blob = new Blob([eventToSave], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      fs.saveAs(blob, 'IssueData-' + date + '.xlsx');
    });
  }


  generateBikeWarrantyExcel(json: any) {
    let bikesToPrint = [];

    json.forEach((val) => {
      let valuesArray = [];
      valuesArray.push(val.VisualId);
      valuesArray.push(val.Serial);
      valuesArray.push(val.OnboardedTimestamp);
      valuesArray.push(val.OldestSessionStartTime);
      valuesArray.push(val.NewestSessionStartTime);
      valuesArray.push(val.TotalNumberOfSessions);
      valuesArray.push(val.DateBikePassedXDistance);
      valuesArray.push(val.Remarks);
      bikesToPrint.push(valuesArray);
    });

    let workbook = new ExcelJS.Workbook();
    let worksheet = workbook.addWorksheet('Bike Warranty Report');

    worksheet.columns = [
      { header: 'Visual Id', key: 'visualId', width: 10 },
      { header: 'Serial', key: 'Serial', width: 18 },
      { header: 'Onboarded Timestamp', key: 'Onboarded Timestamp', width: 30 },
      { header: 'Oldest Session Start Time', key: 'Oldest Session Start Time', width: 30 },
      { header: 'Newest Session Start Time', key: 'Newest Session Start Time', width: 30 },
      { header: 'Total No.of Sessions', key: 'Total No.of Sessions', width: 25 },
      { header: '2KM Distance Passed Date', key: '2KM Distance Passed Date', width: 30 },
      { header: 'Remarks', key: 'Remarks', width: 75 }
    ];

    worksheet.getCell('A1').font = { size: 12, bold: true };
    worksheet.getCell('B1').font = { size: 12, bold: true };
    worksheet.getCell('C1').font = { size: 12, bold: true };
    worksheet.getCell('D1').font = { size: 12, bold: true };
    worksheet.getCell('E1').font = { size: 12, bold: true };
    worksheet.getCell('F1').font = { size: 12, bold: true };
    worksheet.getCell('G1').font = { size: 12, bold: true };
    worksheet.getCell('H1').font = { size: 12, bold: true };

    worksheet.addRows(bikesToPrint);

    let date = moment().utc().format('YYYY-MM-DDTHH:mm:ss');

    workbook.xlsx.writeBuffer().then((bikesToPrint) => {
      let blob = new Blob([bikesToPrint], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      fs.saveAs(blob, 'BikeWarrantyReport-' + date + '.xlsx');
    });

  }

  generateOperationalBikesCountExcel(json: any) {
    let eventToSave = [];

    json.forEach((val) => {
      let valuesArray = [];
      valuesArray.push(val.Timestamp.split('T')[0]);
      valuesArray.push(val.AverageOfSumOperationalBikes);
      eventToSave.push(valuesArray);
    });

    let workbook = new ExcelJS.Workbook();
    let worksheet = workbook.addWorksheet('Operational Bikes');

    worksheet.columns = [
      { header: 'Date', key: 'date', width: 10 },
      { header: 'Operational Bikes Average', key: 'averageOfSumOperationalBikes', width: 30 }
    ];

    worksheet.getCell('A1').font = { size: 12, bold: true };
    worksheet.getCell('B1').font = { size: 12, bold: true };
    worksheet.addRows(eventToSave);

    let date = moment().utc().format('YYYY-MM-DDTHH:mm:ss');
    workbook.xlsx.writeBuffer().then((eventToSave) => {
      let blob = new Blob([eventToSave], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      fs.saveAs(blob, 'OperationalBikesData-' + date + '.xlsx');
    });
  }
}
