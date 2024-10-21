import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

import { AppSettings } from './app.settings';
import { BikePart } from '../core/models';
import { BikeObservation } from '../core/models/bike/bike-observation';

@Injectable()
export class BikesService {
    headers: HttpHeaders;

    constructor(private http: HttpClient, private settings: AppSettings) {
        this.headers = new HttpHeaders().append('Content-Type', 'application/json');
    }

    public getBikes(): Observable<any> {
        return this.http.get(`${this.settings.api_url}/bikes`);
    }

    public getBikesByAreas(areaIds = []): Observable<any> {
        let options = { headers: this.headers };
        return this.http.post(`${this.settings.api_url}/bikes/filterByAreas`, areaIds, options);
    }

    public getBikesFilteredByArea(): Observable<any> {
        return this.http.get(`${this.settings.api_url}/bikes/area`);
    }

    public getBikeDetails(Id): Observable<any> {
        return this.http.get(`${this.settings.api_url}/bikes/` + Id);
    }

    public createBike(bike): Observable<any> {
        let options = { headers: this.headers };
        return this.http.post(`${this.settings.api_url}/bikes`, bike, options);
    }

    public recreateBike(bike): Observable<any> {
        let options = { headers: this.headers };
        return this.http.post(`${this.settings.api_url}/bikes/recreate`, bike, options);
    }

    public getBikeByMid(mid): Observable<any> {
        return this.http.get(`${this.settings.api_url}/bikes/mid/` + mid);
    }

    public getBikeByVisualId(visualId): Observable<any> {
        return this.http.get(`${this.settings.api_url}/bikes/visual/` + visualId);
    }

    public getWarrantyDetails(): Observable<any> {
        return this.http.get(`${this.settings.api_url}/bikes/report/warranty`);
    }

    public getBikeCurrentFirmware(mid): Observable<any> {
        return this.http.get(`${this.settings.api_url}/bikes/firmware/` + mid);
    }

    public getBikesOnTrips(status): Observable<any> {
        return this.http.get(`${this.settings.api_url}/bikes?ontrip=${status}`);
    }

    public getDashboardGraphStatistics(): Observable<any> {
        return this.http.get(`${this.settings.api_url}/bikes/dashboard/graph/statistics`);
    }

    public updateBikeDetails(details): Observable<any> {
        let options = { headers: this.headers };
        return this.http.put(`${this.settings.api_url}/bikes/` + details.BikeId, details, options);
    }

    public getBikePCB(bikeId: number | string): Observable<BikeObservation[]> {
        return this.http.get<BikeObservation[]>(`${this.settings.api_url}/bikes/${bikeId}/pcb`);
    }

    public getBikeParts(bikeId: number | string): Observable<BikePart[]> {
        return this.http.get<BikePart[]>(`${this.settings.api_url}/bikes/${bikeId}/parts`);
    }

    public enableDisableBike(bikeId: number, bikeStateChange: any): Observable<any> {
        let options = { headers: this.headers };
        return this.http.post(`${this.settings.api_url}/bikes/${bikeId}/disable/statechange`, bikeStateChange, options);
    }

    public getBikeDisabledStateAndReason(bikeId: number): Observable<any> {
        return this.http.get(`${this.settings.api_url}/bikes/${bikeId}/bikestate/`);
    }

    getUndockCommmandHistory(bikeId: number): Observable<any> {
        return this.http.get(`${this.settings.api_url}/bikes/${bikeId}/undock/history`);
    }

    public updateUndockCommandHistoryForStreetRepair(details): Observable<any> {
        let options = { headers: this.headers };
        return this.http.put(`${this.settings.api_url}/bikes/${details.BikeId}/undock/history/${details.isStreetRepair}/streetrepair`, options);
    }

    public updateUndockCommandHistory(details): Observable<any> {
        let options = { headers: this.headers };
        return this.http.put(`${this.settings.api_url}/bikes/${details.BikeId}/undock/history`, details, options);
    }

    // Commands
    public sendUndockCommand(bikeId): Observable<any> {
        let options = { headers: this.headers };
        return this.http.post(`${this.settings.api_url}/bikes/` + bikeId + `/commands/undock`, null, options);
    }

    public sendUnLockCommand(bikeId, waitResponse = false): Observable<any> {
        let options = { headers: this.headers };
        return this.http.post(`${this.settings.api_url}/bikes/` + bikeId + `/commands/unlock?waitResponse=${waitResponse}`, null, options);
    }

    public sendLockCommand(bikeId, waitResponse = false): Observable<any> {
        let options = { headers: this.headers };
        return this.http.post(`${this.settings.api_url}/bikes/` + bikeId + `/commands/lock?waitResponse=${waitResponse}`, null, options);
    }

    public sendBlinkCommand(bikeId): Observable<any> {
        let options = { headers: this.headers };
        return this.http.post(`${this.settings.api_url}/bikes/` + bikeId + `/commands/blink`, null, options);
    }

    public sendPeerUndockCommand(bikeId): Observable<any> {
        let options = { headers: this.headers };
        return this.http.post(`${this.settings.api_url}/bikes/` + bikeId + `/commands/PeerUndock`, null, options);
    }

    public sendStartSessionCommand(bikeId): Observable<any> {
        let options = { headers: this.headers };
        return this.http.post(`${this.settings.api_url}/bikes/` + bikeId + `/commands/startsession`, null, options);
    }

    public sendStopSessionCommand(bikeId): Observable<any> {
        let options = { headers: this.headers };
        return this.http.post(`${this.settings.api_url}/bikes/` + bikeId + `/commands/stopsession`, null, options);
    }

    public sendEBikeControllerTestCommand(bikeId: number): Observable<any> {
        let options = { headers: this.headers };
        return this.http.post(`${this.settings.api_url}/bikes/` + bikeId + `/commands/ebike/test`, null, options);
    }

    public sendBikePCBRestartCommand(bikeId): Observable<any> {
        let options = { headers: this.headers };
        return this.http.post(`${this.settings.api_url}/bikes/` + bikeId + `/commands/pcb/restart`, null, options);
    }

    public sendBikePCBDownloadSettingsCommand(bikeId): Observable<any> {
        let options = { headers: this.headers };
        return this.http.post(`${this.settings.api_url}/bikes/` + bikeId + `/commands/pcb/downloadsettings`, null, options);
    }

    public sendBikePCBUpgradeFirmwareCommand(bikeId: any): Observable<any> {
        let options = { headers: this.headers };
        return this.http.post(`${this.settings.api_url}/bikes/` + bikeId + `/commands/pcb/upgradefirmware`, null, options);
    }

    public sendBikePCBPollAllCommand(bikeId): Observable<any> {
        let options = { headers: this.headers };
        return this.http.post(`${this.settings.api_url}/bikes/` + bikeId + `/commands/pcb/pollall`, null, options);
    }

    public sendBikePCBUpgradeFirmwareCommandByMID(mid: any): Observable<any> {
        let options = { headers: this.headers };
        return this.http.post(`${this.settings.api_url}/bikes/` + mid + `/commands/pcb/upgradefirmwarebymid`, null, options);
    }

    public sendPollAllCommandToBikes(): Observable<any> {
        let options = { headers: this.headers };
        return this.http.post(`${this.settings.api_url}/bikes/commands/pcb/pollall`, null, options);
    }

    public sendRestartCommandToBikes(): Observable<any> {
        let options = { headers: this.headers };
        return this.http.post(`${this.settings.api_url}/bikes/commands/pcb/restart`, null, options);
    }

    public sendDownloadSettingsCommandToBikes(): Observable<any> {
        let options = { headers: this.headers };
        return this.http.post(`${this.settings.api_url}/bikes/commands/pcb/downloadsettings`, null, options);
    }


    public sendUpgradeFirmwareCommandToBikes(): Observable<any> {
        let options = { headers: this.headers };
        return this.http.post(`${this.settings.api_url}/bikes/commands/pcb/upgradefirmware`, null, options);
    }

    public SendPollSingleCommandToBikes(observationId): Observable<any> {
        let options = { headers: this.headers };
        return this.http.post(`${this.settings.api_url}/bikes/commands/pcb/pollsingle/` + observationId, null, options);
    }

    //Get Bike Position Details 
    public getBikePositionDetails(bikeId: number, observationId: number, from: Date, to: Date): Observable<any> {
        let options = { headers: this.headers };
        let params = { fromTimestamp: from, toTimestamp: to };
        return this.http.post(`${this.settings.api_url}/bikes/` + bikeId + `/observation/` + observationId, params, options);
    }

    public releaseBike(bikeId, endUserId): Observable<any> {
        let options = { headers: this.headers };
        let params = { BikeId: bikeId, EndUserId: endUserId };
        return this.http.post(`${this.settings.api_url}/bikes/` + bikeId + `/release`, params, options);
    }

    public getBikeSession(visualId: string, endUserId: string): Observable<any> {
        if (!visualId) { visualId = "" }
        if (!endUserId) { endUserId = "" }
        return this.http.get(`${this.settings.api_url}/bikes/session?visualId=${visualId}&endUserId=${endUserId}`);
    }

    public endBikeSession(bikeId, sessionId, timestamp, isEndedWithFee): Observable<any> {
        let options = { headers: this.headers };
        let sessionData = { "SessionId": sessionId, "EndTime": timestamp, "IsEndedWithFee": isEndedWithFee }
        return this.http.post(`${this.settings.api_url}/bikes/${bikeId}/endsession`, sessionData, options);
    }
    public sendStartPassiveSessionCommand(bikeId): Observable<any> {
        let options = { headers: this.headers };
        return this.http.post(`${this.settings.api_url}/bikes/` + bikeId + `/commands/startpassivesession`, null, options);
    }

    public sendStopPassiveSessionCommand(bikeId): Observable<any> {
        let options = { headers: this.headers };
        return this.http.post(`${this.settings.api_url}/bikes/` + bikeId + `/commands/stoppassivesession`, null, options);
    }

    public sendLocateBikeCommand(bikeId): Observable<any> {
        let options = { headers: this.headers };
        return this.http.post(`${this.settings.api_url}/bikes/` + bikeId + `/commands/locate`, null, options);
    }

    //Bike comments
    public getBikesComments(bikeId): Observable<any> {
        return this.http.get(`${this.settings.api_url}/bikes/comment/` + bikeId);
    }

    public CreateBikeComment(commentDetails): Observable<any> {
        let options = { headers: this.headers };
        return this.http.post(`${this.settings.api_url}/bikes/comment`, commentDetails, options);
    }

    public UpdateBikeComment(commentDetails): Observable<any> {
        let options = { headers: this.headers };
        return this.http.put(`${this.settings.api_url}/bikes/comment/` + commentDetails.BikeId, commentDetails, options);
    }

    //Bike parts
    getBikePartTreeDetails(bikeId): Observable<any> {
        return this.http.get(`${this.settings.api_url}/bikes/` + bikeId + `/parts/tree`);
    }

    public detectTirePressure(bikeId) {
        let options = { headers: this.headers };
        return this.http.post(`${this.settings.api_url}/bikes/` + bikeId + `/commands/detectpressuresensors`, null, options);
    }

    //Bike all bike modes
    public getAllBikeModes(): Observable<any> {
        return this.http.get(`${this.settings.api_url}/bikes/bikemodes`);
    }

    //All bike modes by area
    public getAllBikeModesByArea(areaIds = []): Observable<any> {
        let options = { headers: this.headers };
        return this.http.post(`${this.settings.api_url}/bikes/bikemodesbyarea`, areaIds, options);
    }

    public getAllBikesAndModesByArea(areaIds = []): Observable<any> {
        let options = { headers: this.headers };
        return this.http.post(`${this.settings.api_url}/bikes/bikemodes/area`, areaIds, options);
    }

    public getBikeSessionByBikeId(id, isOngoing): Observable<any> {
        return this.http.get(`${this.settings.api_url}/bikes/` + id + `/session?isOngoing=${isOngoing}`);
    }

    public GetFilteredSessions(id, from, to): Observable<any> {
        let options = { headers: this.headers };
        return this.http.get(`${this.settings.api_url}/bikes/` + id + `/session?from=${from}&to=${to}`, options);
    }

    public getBikeServiceByBikeId(id): Observable<any> {
        return this.http.get(`${this.settings.api_url}/bikes/` + id + `/service`);
    }

    public CreateOrUpdateBikeService(id, serviceDetails): Observable<any> {
        let options = { headers: this.headers };
        return this.http.post(`${this.settings.api_url}/bikes/` + id + `/service`, serviceDetails, options);
    }

    //add to car 

    public AddBikeToCar(id, carDTO): Observable<any> {
        let options = { headers: this.headers };
        return this.http.post(`${this.settings.api_url}/bikes/user/` + id + `/transport`, carDTO, options);
    }

    public getBikeTransportByUserId(id): Observable<any> {
        return this.http.get(`${this.settings.api_url}/bikes/user/` + id + `/transport`);
    }

    public UpdateBikeTransport(id, transportDet): Observable<any> {
        let options = { headers: this.headers };
        return this.http.put(`${this.settings.api_url}/bikes/user/` + id, transportDet, options);
    }

    public UpdateBikeWorkshop(workshopDetails): Observable<any> {
        let options = { headers: this.headers };
        return this.http.put(`${this.settings.api_url}/bikes/` + workshopDetails.BikeId + `/workshop`, workshopDetails, options);
    }

    public GetBikesFilterByBikeModeId(bikeModeId): Observable<any> {
        return this.http.get(`${this.settings.api_url}/bikes/` + bikeModeId + `/filter`);
    }


    //All error category wise dashboard data
    public GetBikeDashboardFilter(errorCategorIds = []): Observable<any> {
        let options = { headers: this.headers };
        return this.http.post(`${this.settings.api_url}/bikes/errorcatdashboard`, errorCategorIds, options);
    }

    public GetBikesIssueFilterByBikeMode(bikeModeFilterId): Observable<any> {
        return this.http.get(`${this.settings.api_url}/bikes/` + bikeModeFilterId + `/issuefilter`);
    }

    public updateBikeOnboardDetails(details): Observable<any> {
        let options = { headers: this.headers };
        return this.http.put(`${this.settings.api_url}/bikes/` + details.Serial + `/onboard`, details, options);
    }

    public getNotOnboardFirmwareUpgradedBikes(): Observable<any> {
        return this.http.get(`${this.settings.api_url}/bikes/onboardbikes`);
    }

    public sendBlinkCommandBViaSerial(mid): Observable<any> {
        let options = { headers: this.headers };
        return this.http.post(`${this.settings.api_url}/bikes/mid/` + mid + `/commands/blink`, null, options);
    }

    public sendUndockCommandBySerial(mid): Observable<any> {
        let options = { headers: this.headers };
        return this.http.post(`${this.settings.api_url}/bikes/mid/` + mid + `/commands/undock`, null, options);
    }

    public SendPeerUndock(mid): Observable<any> {
        let options = { headers: this.headers };
        return this.http.post(`${this.settings.api_url}/bikes/mid/` + mid + `/commands/PeerUndock`, null, options);
    }

    public startPassiveSessionBikeCommand(mid): Observable<any> {
        let options = { headers: this.headers };
        return this.http.post(`${this.settings.api_url}/bikes/mid/` + mid + `/commands/startpassivesession`, null, options);
    }

    public stopPassiveSessionBikeCommand(mid): Observable<any> {
        let options = { headers: this.headers };
        return this.http.post(`${this.settings.api_url}/bikes/mid/` + mid + `/commands/stoppassivesession`, null, options);
    }


    public getAllBikeOnboardLogs(): Observable<any> {
        return this.http.get(`${this.settings.api_url}/bikes/onboardlogs`);
    }

    public getWorkshopOrCarOrStorageLocation(id): Observable<any> {
        return this.http.get(`${this.settings.api_url}/bikes/` + id + `/locationinfo`);
    }

    public resetUndockFailureCountByBike(id): Observable<any> {
        let options = { headers: this.headers };
        return this.http.put(`${this.settings.api_url}/bikes/` + id + `/resetundockfailure`, null, options);
    }

    public updateBikeStorage(storageDetails): Observable<any> {
        let options = { headers: this.headers };
        return this.http.put(`${this.settings.api_url}/bikes/` + storageDetails.BikeId + `/storage`, storageDetails, options);
    }

    public getInstantBikeCellularQualityInfo(id): Observable<any> {
        return this.http.get(`${this.settings.api_url}/bikes/` + id + `/quality`);
    }

    public getLastKnownObservation(bikeId, currentObservations: any): Observable<any> {
        let options = { headers: this.headers };
        return this.http.post(`${this.settings.api_url}/bikes/${bikeId}/observations/snapshot`, currentObservations, options);
    }

    public removeDPWHIDForPCB(mid: any, bikeDPHWIDResetObj: any): Observable<any> {
        let options = { headers: this.headers };
        return this.http.put(`${this.settings.api_url}/bikes/mid/${mid}/mcs/dphwid`, bikeDPHWIDResetObj, options);
    }

    public getAverageOfSumOperationalBikes(filterOption: any) {
        let options = { headers: this.headers };
        return this.http.post(`${this.settings.api_url}/bikes/statistics/filter`, filterOption, options);
    }
}