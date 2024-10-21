import { Pipe, PipeTransform } from '@angular/core';
import * as moment from 'moment';

import 'moment-timezone';
import { LocalStorageKeys } from '../constants';

@Pipe({
  name: 'timeZone',
  pure: false
})
export class TimeZonePipe implements PipeTransform {

  transform(value: string): string {
    if (value != null || value != undefined) {
      let convertType = JSON.parse(localStorage.getItem(LocalStorageKeys.PREFERRED_TIMEZONE));
      if (convertType == null || convertType == undefined) {
        convertType = 'CET';
      }
      switch (convertType) {
        case 'UTC':
          return value; //moment(value).utc().format('YYYY-MM-DDTHH:mm:ss')
        case 'CET':
          return this.utcToLocal(value, "Europe/Berlin");
      }
    } else {
      return value;
    }

  }

  utcToLocal(utcdateTime, tz) {
    var zone = moment.tz(tz).format("Z") // Actual zone value e:g +5:30
    var zoneValue = zone.replace(/[^0-9: ]/g, "") // Zone value without + - chars
    var operator = zone && zone.split("") && zone.split("")[0] === "-" ? "-" : "+" // operator for addition subtraction
    var localDateTime
    var hours = zoneValue.split(":")[0]
    var minutes = zoneValue.split(":")[1]
    if (operator === "-") {
      localDateTime = moment(utcdateTime).utc().subtract(hours, "hours").subtract(minutes, "minutes").format("YYYY-MM-DDTHH:mm:ss")
    } else if (operator) {
      localDateTime = moment(utcdateTime).utc().add(hours, "hours").add(minutes, "minutes").format("YYYY-MM-DDTHH:mm:ss")
    } else {
      localDateTime = "Invalid Timezone Operator"
    }
    return localDateTime
  }

}
