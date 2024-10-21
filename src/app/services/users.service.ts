import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

import { AppSettings } from './app.settings';
import { User } from '../core/models/user/user';

@Injectable()
export class UserService {
    headers: HttpHeaders;

    constructor(private http: HttpClient, private settings: AppSettings) { }

    public getSystemUsers(): Observable<User[]> {
        return this.http.get<User[]>(`${this.settings.api_url}/Users`);
    }

    public getUserById(Id): Observable<any> {
        return this.http.get(`${this.settings.api_url}/users/` + Id);
    }

    public CreateUser(userDetails): Observable<any> {
        let options = { headers: this.headers };
        return this.http.post(`${this.settings.api_url}/users`, userDetails, options);
    }

    public InviteUser(userDetails): Observable<any> {
        let options = { headers: this.headers };
        return this.http.post(`${this.settings.api_url}/users/invite`, userDetails, options);
    }

    public updateUser(userDetails): Observable<any> {
        let options = { headers: this.headers };
        return this.http.put(`${this.settings.api_url}/users`, userDetails, options);
    }

    public getUserRoles(): Observable<any> {
        return this.http.get(`${this.settings.api_url}/users/roles`);
    }

    public getLoggedInUserDetails(): Observable<any> {
        return this.http.get(`${this.settings.api_url}/users/details`);
    }

    public getUserAreaByUserId(Id): Observable<any> {
        return this.http.get(`${this.settings.api_url}/users/area/` + Id);
    }

    public UserActivation(userId: number, state: boolean): Observable<any> {
        let options = { headers: this.headers };
        return this.http.post(`${this.settings.api_url}/users/` + userId + '/activation/' + state, options);
    }

    //UserRoles
    public updateUserRole(userrole): Observable<any> {
        let options = { headers: this.headers };
        return this.http.post(`${this.settings.api_url}/users/userrole`, userrole, options);
    }

    public AddUserPosition(userPosition): Observable<any> {
        let options = { headers: this.headers };
        return this.http.post(`${this.settings.api_url}/users/myposition`, userPosition, options);
    }

    public UpdateUserPosition(userPosition): Observable<any> {
        let options = { headers: this.headers };
        return this.http.put(`${this.settings.api_url}/users/myposition`, userPosition, options);
    }

    public getAllUserPositions(): Observable<any> {
        return this.http.get(`${this.settings.api_url}/users/userpositions`);
    }

    public AddUserSetting(userSetting): Observable<any> {
        let options = { headers: this.headers };
        return this.http.post(`${this.settings.api_url}/users/setting`, userSetting, options);
    }

    public UpdateUserSetting(userSetting): Observable<any> {
        let options = { headers: this.headers };
        return this.http.put(`${this.settings.api_url}/users/setting`, userSetting, options);
    }

    public GetUserSettingByUser(Id): Observable<any> {
        return this.http.get(`${this.settings.api_url}/users/` + Id + `/setting`);
    }

    public updateUserBasicDetails(userDetails): Observable<any> {
        let options = {
            headers: this.headers
        };
        return this.http.put(`${this.settings.api_url}/users/basic/details`, userDetails, options);
    }

    public getUserPrivilegeByUser(id): Observable<any> {
        return this.http.get(`${this.settings.api_url}/users/` + id + `/privilege`);
    }

    public getUserPrivileges(): Observable<any> {
        return this.http.get(`${this.settings.api_url}/users/privileges`);
    }
}
