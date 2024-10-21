import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'replace'
})
export class ReplacePipe implements PipeTransform {

  transform(value: string, search: any, replace: string): string {
    let text = value;
    if (value && search) {
      text = value.replace(search, replace);
    }
    return text;
  }

}
