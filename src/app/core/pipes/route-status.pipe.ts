import { Pipe, PipeTransform } from '@angular/core';
import { RouteExtension } from '../extensions/route.extension';

@Pipe({
    name: 'RouteStatus'
})
export class RouteStatusPipe implements PipeTransform {

    transform(value: number): string {
        let text = RouteExtension.GetStreetTeamRouteStatus(value);
        if (!text) {
            text = value ? value.toString() : null;
        }
        return text;
    }
}