import { Pipe, PipeTransform } from '@angular/core';
import { Address } from '../models';
import { AddressExtension } from '../extensions';

@Pipe({
  name: 'bikeAddress'
})
export class BikeAddressPipe implements PipeTransform {

  transform(value: Address): string {
    let text = AddressExtension.GetBikeAddressStr(value);
    return text;
  }

}
