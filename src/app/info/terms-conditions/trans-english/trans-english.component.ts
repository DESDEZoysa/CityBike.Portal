import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SettingsService } from '../../../services';

@Component({
  selector: 'app-trans-english',
  templateUrl: './trans-english.component.html',
  styleUrls: ['./trans-english.component.scss']
})
export class TransEnglishComponent {
  selectedLanguage: any;
  languages: any[] = [
    { id: 'en', name: 'English' },
    { id: 'no', name: 'Norwegian' }
  ];

  constructor(private router: Router, private settings: SettingsService) {
    this.selectedLanguage = this.settings.getSelectedLanguage() ? this.settings.getSelectedLanguage() : this.languages[0].id;
  }

  public onLanguageChange(lang: string) {
    this.selectedLanguage = lang;
    this.settings.setSelectedLanguage(this.selectedLanguage);

    if (this.selectedLanguage == 'no') {
      this.router.navigate(['/info/terms-no']);
    } else if (this.selectedLanguage == 'en') {
      this.router.navigate(['/info/terms-en']);
    }
  }


}
