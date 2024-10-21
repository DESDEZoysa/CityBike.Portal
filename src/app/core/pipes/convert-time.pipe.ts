import { Pipe, PipeTransform } from '@angular/core';
import * as moment from 'moment';

import 'moment-timezone';
import { LocalStorageKeys } from '../constants';

@Pipe({
  name: 'convertTime',
  pure: false
})
export class ConvertTimePipe implements PipeTransform {

  transform(value: string, type: string = null, duration: number = 0): string {
    if (value) {
      let convertType = JSON.parse(localStorage.getItem(LocalStorageKeys.PREFERRED_TIMEZONE));
      if (convertType == null || convertType == undefined) {
        convertType = 'CET';
      }
      let result;
      switch (convertType) {
        case 'UTC':
          result = value; //moment(value).utc().format('YYYY-MM-DDTHH:mm:ss')
          break;
        case 'CET':
          result = moment(value).tz("Europe/Berlin").format('YYYY-MM-DDTHH:mm:ss'); //moment(value).tz("Europe/Berlin").format('YYYY-MM-DDTHH:mm:ss');
          break;
      }

      if (type) {
        if (duration == 0)
          result = moment(result).format(type);
        else
          result = moment(result).subtract(duration, 'seconds').format(type);
      }
      return result;
    } else {
      return value;
    }

  }

}
