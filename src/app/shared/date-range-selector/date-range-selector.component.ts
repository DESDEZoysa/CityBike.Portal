import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import * as moment from 'moment';

import { LoggerService } from '../../services';

@Component({
  selector: 'app-date-range-selector',
  templateUrl: './date-range-selector.component.html',
  styleUrls: ['./date-range-selector.component.scss']
})
export class DateRangeSelectorComponent implements OnInit {

  @Input()
  visible: boolean = false;

  @Output()
  select: EventEmitter<any> = new EventEmitter();

  from: Date;
  to: Date;

  constructor(
    private loggerService: LoggerService
  ) { }

  ngOnInit() {
  }

  onFromChange(date) {
    this.from = date;
  }

  onToChange(date) {
    this.to = date;
  }

  onSelect() {
    if (this.from && this.to) {
      if (this.from <= this.to) {
        this.select.emit({ from: this.from, to: this.to });
      }
      else {
        this.loggerService.showErrorMessage("'To' date must me greater than or equal 'From'");
      }
    }
    else {
      this.loggerService.showErrorMessage("Please enter valid dates!");
    }
  }

}
