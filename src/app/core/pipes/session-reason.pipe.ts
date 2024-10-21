import { Pipe, PipeTransform } from '@angular/core';
import { SessionExtension } from '../extensions/session.extension';

@Pipe({
    name: 'SessionStartEndReasons'
})
export class SessionStartEndReasonsPipe implements PipeTransform {

    transform(value: number): string {
        let text = SessionExtension.GetSessionStartEndReason(value);
        if (!text) {
            text = value ? value.toString() : null;
        }
        return text;
    }
}