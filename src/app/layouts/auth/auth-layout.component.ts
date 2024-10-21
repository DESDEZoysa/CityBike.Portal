import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { SettingsService } from '../../services';
import { Router } from '@angular/router';
import { LocalStorageKeys } from '../../core/constants';

@Component({
  selector: 'app-layout',
  styles: [],
  templateUrl: './auth-layout.component.html'
})
export class AuthLayoutComponent {
  selectedLanguage: any;
  languages: any[] = [
    { id: 'en', name: 'English' },
    { id: 'no', name: 'Norwegian' }
  ];

  constructor(public translate: TranslateService, private router: Router, private settings: SettingsService) {
    // add supportive languages
    translate.addLangs(["en", "no"]);
    // this language will be used as a fallback when a translation isn't found in the current language
    translate.setDefaultLang('no');
    // the lang to use, if the lang isn't available, it will use the current loader to get them
    //this.selectedLanguage = this.settings.getSelectedLanguage() ? this.settings.getSelectedLanguage() : this.languages[1].id;
    this.selectedLanguage = JSON.parse(localStorage.getItem(LocalStorageKeys.PREFERRED_LANGUAGE));
    if (this.selectedLanguage == null || this.selectedLanguage == undefined) {
      this.selectedLanguage = this.languages[1].id;
      this.settings.setSetting(LocalStorageKeys.PREFERRED_LANGUAGE, JSON.stringify(this.selectedLanguage));
    }
    translate.use(this.selectedLanguage);
  }

  public onLanguageChange(lang: string) {
    this.selectedLanguage = lang;
    this.translate.use(this.selectedLanguage);
    this.settings.setSelectedLanguage(this.selectedLanguage);

    this.settings.setSetting(LocalStorageKeys.PREFERRED_LANGUAGE, JSON.stringify(lang));

    if (this.router.url === '/info/terms-en' && this.selectedLanguage == 'no') {
      this.router.navigate(['/info/terms-no'])
    } else if (this.router.url === '/info/terms-no' && this.selectedLanguage == 'en') {
      this.router.navigate(['/info/terms-en'])
    }
  }

}
