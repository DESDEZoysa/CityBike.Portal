import { Pipe, PipeTransform } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Pipe({
  name: 'translateManual',
  pure: false
})
export class TranslateManualPipe implements PipeTransform {

  constructor(private translate: TranslateService) { }

  transform(value: any, args?: any): any {
    if (args == undefined || !args) return value;
    let val = value;
    this.translate.get(args).subscribe((res: string) => {
      val = res;
    });

    return val;
  }

}
