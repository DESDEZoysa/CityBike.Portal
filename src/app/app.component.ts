import { Component } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { AppSettings } from './services';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'app';
  constructor(private titleService: Title, private appSettings: AppSettings) {
    this.titleService.setTitle(this.appSettings.title);
  }
}
