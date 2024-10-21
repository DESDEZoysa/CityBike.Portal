import { Pipe, PipeTransform } from '@angular/core';
import { DockingPointExtension } from '../extensions/docking-point.extension';

@Pipe({
    name: 'dockingPointState'
})
export class DockingPointStatePipe implements PipeTransform {

    transform(value: number): string {

        value = +value;
        let text = DockingPointExtension.GetDockingPointState(value);
        if (!text) {
            text = value ? value.toString() : null;
        }
        return text;
    }

}
