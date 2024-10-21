import { Pipe, PipeTransform } from '@angular/core';
import { BikeExtension } from '../extensions';
import { TranslateService } from '@ngx-translate/core';

@Pipe({
    name: 'bikeModes'
})
export class BikeModePipe implements PipeTransform {

    constructor(private translate: TranslateService) { }

    transform(value: number): string {
        let text = BikeExtension.GetBikeMode(value);
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