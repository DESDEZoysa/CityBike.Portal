
import { map } from 'rxjs/operators';
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observer, Observable } from 'rxjs';

import { AppSettings } from './app.settings';
import { LocalStorageKeys } from '../core/constants';
import { AuthenticationCredentials, OAuthTokenMetadata, OAuthToken } from '../core/models/auth';
import { UserRoles } from '../core/constants/user-roles';
import { SettingsService } from './settings.service';

@Injectable()
export class AuthService {

    private _oAuthToken: OAuthToken;
    public redirectURL: string;

    public get oAuthToken(): OAuthToken {
        if (!this._oAuthToken) {
            var valuesFromStorage: any = {};
            try { valuesFromStorage = JSON.parse(localStorage.getItem(LocalStorageKeys.OAUTH_TOKEN) || '{}', OAuthToken.JSONParseReviver); }
            catch (error) { console.log('Skipping error. Token data in storage is either corrupted/depreciated ...', error); }
            this._oAuthToken = Object.assign(new OAuthToken(), valuesFromStorage);
        }
        /* User has to forcefully logged-out if the auth token version is below minimum... */
        if (this._oAuthToken.version < this.settings.auth_token_version) { this.logout(); }
        return this._oAuthToken;
    }

    constructor(private http: HttpClient, private settings: AppSettings, private settingsService: SettingsService) { }

    protected updateOAuthToken(value: OAuthTokenMetadata) {
        this._oAuthToken.update(value, this.settings.auth_token_version);
        localStorage.setItem(LocalStorageKeys.OAUTH_TOKEN, JSON.stringify(this._oAuthToken));
    }

    public register(user: any) {
        return this.http
            .post(`${this.settings.api_url}/auth/register`, JSON.stringify(user), {
                headers: new HttpHeaders().set('Content-Type', 'application/json')
            }).pipe(
                map((response: Response) => {
                    return response;
                }));
    }

    public login(credentials: AuthenticationCredentials): Observable<boolean> {
        var resultObserver: Observer<boolean>;
        var result = new Observable<boolean>((observer: Observer<boolean>) => { resultObserver = observer; }).publish();
        result.connect();

        //
        this.http
            .post(`${this.settings.api_url}/token`, credentials.parseAsHttpParams().toString(), {
                headers: new HttpHeaders().set('Content-Type', 'application/x-www-form-urlencoded')
            })
            .subscribe((response: object) => {
                this.updateOAuthToken(OAuthToken.parseFromServer(response));
                this.redirectForUserClaims(OAuthToken.parseFromServer(response));
                resultObserver.next(true);
                resultObserver.complete();
            }, (error: Error) => {
                resultObserver.error(error);
                resultObserver.complete();
            });

        return result;
    }

    public redirectForUserClaims(value: OAuthTokenMetadata) {
        if (value.claims.includes(UserRoles.ADMIN)) {
            this.redirectURL = '/dashboard';
        }
        else if (value.claims.includes(UserRoles.WORKSHOP)) {
            this.redirectURL = '/bikes';
        }
        else if (value.claims.includes(UserRoles.CUSTOMER_SERVICE)) {
            this.redirectURL = '/dockingStations';
        }
        else if (value.claims.includes(UserRoles.STREET_TEAM)) {
            this.redirectURL = '/bikes/live';
        }
        else if (value.claims.includes(UserRoles.CUSTOMER)) {
            this.redirectURL = '/customer/dashboard';
        }
    }

    public logout(): void {
        this.updateOAuthToken(null);
        this.settingsService.clearSettings();
    }

    public forgotPassword(value: any) {
        return this.http.post(`${this.settings.api_url}/auth/forgotPassword`, JSON.stringify(value), {
            headers: new HttpHeaders().set('Content-Type', 'application/json')
        });
    }

    public resetForgotPassword(value: any) {
        return this.http.post(`${this.settings.api_url}/auth/resetForgotPassword`, JSON.stringify(value), {
            headers: new HttpHeaders().set('Content-Type', 'application/json')
        });
    }

    //Countries 
    geCountries(): Observable<any> {
        return this.http.get(`${this.settings.api_url}/Countries`);
    }

    isAdmin() {
        if (this.oAuthToken._claims.includes(UserRoles.ADMIN)) return true;
        return false;
    }

    isAdminOrManitanance() {
        if (this.oAuthToken._claims.includes(UserRoles.WORKSHOP) || this.oAuthToken._claims.includes(UserRoles.ADMIN)) return true;
        return false;
    }

    isAdminOrMaintanceOrService() {
        if (this.oAuthToken._claims.includes(UserRoles.WORKSHOP) || this.oAuthToken._claims.includes(UserRoles.ADMIN)
            || this.oAuthToken._claims.includes(UserRoles.STREET_TEAM)) return true;
        return false;
    }

    isAdminOrMaintanceOrServiceOrSupport() {
        if (this.oAuthToken._claims.includes(UserRoles.WORKSHOP) || this.oAuthToken._claims.includes(UserRoles.ADMIN)
            || this.oAuthToken._claims.includes(UserRoles.STREET_TEAM) || this.oAuthToken._claims.includes(UserRoles.CUSTOMER_SERVICE)) return true;
        return false;
    }

    public generateRequestTokenByDashboardToken(dashboardToken): Observable<any> {
        var resultObserver: Observer<boolean>;
        var result = new Observable<boolean>((observer: Observer<boolean>) => { resultObserver = observer; }).publish();
        result.connect();

        //
        this.http.get(`${this.settings.api_url}/auth/generateAuthToken/` + dashboardToken)
            .subscribe((response: object) => {
                this.updateOAuthToken(OAuthToken.parseFromServer(response));
                this.redirectForUserClaims(OAuthToken.parseFromServer(response));
                resultObserver.next(true);
                resultObserver.complete();
            }, (error: Error) => {
                resultObserver.error(error);
                resultObserver.complete();
            });

        return result;
    }

}

