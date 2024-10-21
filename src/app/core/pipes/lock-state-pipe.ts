import { Pipe, PipeTransform } from "@angular/core";
import { TranslateService } from "@ngx-translate/core";
import { BikeExtension } from "../extensions";

@Pipe({
    name: 'lockStates'
})

export class BikeLockPipe implements PipeTransform {

    constructor(private translate: TranslateService) { }

    transform(value: number): string {
        let text = BikeExtension.GetLockState(value);
        if (!text) {
            text = value ? value.toString() : null;
        }
        if (text) {
            this.translate.get(text).subscribe(txt => {
                text = txt;
            });
        }
        return text;
    }

}