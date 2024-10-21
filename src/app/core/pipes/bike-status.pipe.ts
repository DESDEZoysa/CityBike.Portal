import { Pipe, PipeTransform } from '@angular/core';
import { BikeExtension } from '../extensions';

@Pipe({
  name: 'bikeStatus'
})
export class BikeStatusPipe implements PipeTransform {

  transform(value: number): string {
    let text = BikeExtension.GetBikeStatus(value);
    if (!text) {
      text = value ? value.toString() : null;
    }
    return text;
  }

}
