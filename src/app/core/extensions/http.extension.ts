
import { map } from 'rxjs/operators';
import { Observable, AsyncSubject } from 'rxjs';

export class HttpExtension {

    constructor() {
        throw new Error('Cannot new this class');
    }

    static fetch(resourceUrl: string): Observable<any> {
        let result = new AsyncSubject();
        let req = new XMLHttpRequest();
        req.open('GET', resourceUrl);

        req.onload = () => {
            result.next(req.response);
            result.complete();
        };

        req.send();
        return result;
    }

    static fetchAsJson(jsonResourceUrl: string): Observable<any> {
        return HttpExtension.fetch(jsonResourceUrl).pipe(map((data: any) => JSON.parse(data)));
    }

}
