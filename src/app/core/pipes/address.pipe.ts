import { Pipe, PipeTransform } from '@angular/core';
import { Address } from '../models';
import { AddressExtension } from '../extensions';

@Pipe({
  name: 'address'
})
export class AddressPipe implements PipeTransform {

  transform(value: Address): string {
    let text = AddressExtension.GetAddressStr(value);
    return text;
  }

}
