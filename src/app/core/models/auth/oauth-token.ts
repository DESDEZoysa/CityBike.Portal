import * as moment from 'moment';
import { OAuthTokenMetadata } from './oauth-token-metadata';

export class OAuthToken extends OAuthTokenMetadata {
    protected _lastModifiedOn: moment.Moment;
    protected _version: number;

    public get lastModifiedOn(): moment.Moment {
        return this._lastModifiedOn;
    }
    public get version(): number {
        return this._version;
    }
    public get expiresOn(): moment.Moment {
        return (this.isEmpty || !this.lastModifiedOn) ? null : this.lastModifiedOn.clone().add(this.expiresIn, OAuthToken.EXPIRY_DURATION_UNIT);
    }
    public get isValid(): boolean {
        return !!this.expiresOn && this.expiresOn > moment();
    }

    static JSONParseReviver(key: any, value: any): any {
        return (!value) ? value :
            (key === '_lastModifiedOn') ? moment(value) : value;
    }

    constructor(version: number = 0) {
        super();
        this.empty();
        this._version = version;
    }

    /* Token from server has to be updated via this function only. */
    public update(newValues: OAuthTokenMetadata, version?: number): void {
        (!newValues) ? this.empty() : Object.assign(this, newValues);
        /* backsetting lastModifiedAt by a small margin to prevent, token being valid even its actual time has expired...  */
        this._lastModifiedOn = moment().add(-15, 'seconds');
        this._version = version || 0;
    }
}
