import { HttpParams, HttpUrlEncodingCodec } from '@angular/common/http';

export class AuthenticationCredentials {
    public grantType: string;
    public username: string;
    public password: string;

    public parseAsHttpParams(): HttpParams {
        return (new HttpParams())
            .set('grant_type', this.grantType)
            .set('username', this.username)
            .set('password', this.password);
    }
}
