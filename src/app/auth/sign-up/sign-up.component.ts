import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { AppSettings, AuthService, LoggerService, SettingsService } from '../../services';
import { CustomValidators } from 'ng4-validators';
import { ImportExportService } from '../../services/import-export.service';
import { LanguageExtension } from '../../core/extensions/language.extension';

let Password = new FormControl('', Validators.required);
let ConfirmPassword = new FormControl('', CustomValidators.equalTo(Password));
let FirstName = new FormControl('', Validators.required);
let LastName = new FormControl('', Validators.required);
let PhoneNumber = new FormControl('', Validators.required);
let CountryId = new FormControl('', Validators.required);

@Component({
  selector: 'app-signup',
  templateUrl: './sign-up.component.html',
  styleUrls: ['./sign-up.component.scss']
})
export class SignUpComponent implements OnInit {

  public form: FormGroup;
  countries;
  countryCode;
  selectedCountry;
  resourceURL;
  logoTitle: string;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private loggerService: LoggerService,
    private importExportService: ImportExportService,
    private settings: SettingsService,
    private appSettings: AppSettings
  ) { }

  ngOnInit() {
    this.form = this.fb.group({
      Email: [null, Validators.compose([Validators.required, Validators.email])],
      Password: Password,
      ConfirmPassword: ConfirmPassword,
      FirstName: FirstName,
      LastName: LastName,
      PhoneNumber: PhoneNumber,
      CountryId: CountryId
    });

    this.logoTitle = this.appSettings.logoTitle;
    this.getCountries();
  }

  onSubmit() {
    let user = {};
    Object.assign(user, this.form.value);
    user['UserId'] = 0; //Defauls UserId Added    
    this.registerUser(user);
  }

  private registerUser(user: any) {
    this.authService.register(user).subscribe((response) => {
      if (response['UserId'] > 0) {
        this.form.reset() // Clear form fields 
        this.router.navigate(['/auth/signin']);
      }
      //this.form.setErrors({ '': 'Registration failed..' });
    },
      (error: any) => {
        if (typeof error.error === 'object') {
          this.loggerService.showErrorMessage(error.error.PhoneNumber[0]);
        } else {
          this.loggerService.showErrorMessage(error.error.replace('_UNIQUE', ''));
        }
      });
  }

  getCountries() {
    this.authService.geCountries()
      .subscribe(data => {
        this.countries = data;
      }, error => {
        this.loggerService.showErrorMessage("Getting country details failed!");
      });
  }

  onCountryChange(event) {
    this.selectedCountry = this.countries.find(x => x.CountryId == event.value);
    this.countryCode = this.selectedCountry.Code;
  }

  downloadTermsAndConditions() {
    let selectedLanguage = this.settings.getSelectedLanguage() != null ? this.settings.getSelectedLanguage() : 'en';
    // let languageCode = LanguageExtension.GetLanguageCode(selectedLanguage);
    // this.resourceURL = this.importExportService.downloadTermsAndConditions(languageCode);
    // window.open(this.resourceURL, '_self');
    if (selectedLanguage == 'en') {
      this.router.navigate(['/info/terms-en'])
    } else {
      this.router.navigate(['/info/terms-no']);
    }
  }
}
