import * as moment from 'moment';

export class OAuthTokenMetadata {
    protected _token: string;
    protected _type: string;
    protected _expiresIn: number;
    public _claims: any[];
    public static readonly EXPIRY_DURATION_UNIT: moment.DurationInputArg2 = 'seconds';

    public get token(): string { return this._token; }
    public get type(): string { return this._type; }
    public get expiresIn(): number { return this._expiresIn; }
    public get claims(): any[] { return this._claims; }
    protected get isEmpty(): boolean { return (!this._token && !this._type && !this._expiresIn); }

    static parseFromServer(source: any): OAuthTokenMetadata {
        return Object.assign(new OAuthTokenMetadata(), {
            _type: source.token_type,
            _token: source.access_token,
            _expiresIn: source.expires_in,
            _claims: source.access_claims,
        });
    }

    protected empty(): void {
        this._token = null;
        this._type = null;
        this._expiresIn = null;
        this._claims = null;
    }

    constructor() { }
}
