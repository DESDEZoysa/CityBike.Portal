import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, FormControl, NgForm, FormGroupDirective } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { PropertyExtension } from '../../core/extensions';
import { AuthenticationCredentials } from '../../core/models/auth';
import { AuthService } from '../../services/auth.service';
import { ImportExportService } from '../../services/import-export.service';
import { AppSettings, SettingsService } from '../../services';
import { LanguageExtension } from '../../core/extensions/language.extension';
import { TranslateService } from '@ngx-translate/core';

/** Error when invalid control is dirty, touched, or submitted. */
export class MyErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    const isSubmitted = form && form.submitted;
    return !!(control && control.invalid && (control.dirty || control.touched || isSubmitted));
  }
}


@Component({
  selector: 'app-sign-in',
  templateUrl: './sign-in.component.html',
  styleUrls: ['./sign-in.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class SignInComponent implements OnInit {

  public form: FormGroup;
  public credentials: AuthenticationCredentials;
  public matcher;
  public resourceURL: string;
  redirect_uri: any;
  logoTitle: string;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private activateRouter: ActivatedRoute,
    private authService: AuthService,
    private importExportService: ImportExportService,
    private settings: SettingsService,
    private appSettings: AppSettings,
    private translate: TranslateService
  ) {
    this.activateRouter.queryParams.subscribe(params => {
      this.redirect_uri = params['redirect_uri'];
    })
    var tempUrlPath = localStorage.getItem("tempUrlPath");
    if (tempUrlPath) {
      this.redirect_uri = tempUrlPath;
    }
    this.credentials = new AuthenticationCredentials();
    this.matcher = new MyErrorStateMatcher();
    this.credentials.grantType = 'password';

    //set app logo titile
    this.logoTitle = appSettings.logoTitle;
  }

  private buildForm() {
    this.form = this.fb.group({});
    this.form.addControl(PropertyExtension.getPropertyName(() => this.credentials.username), new FormControl(this.credentials.username, [Validators.required]));
    this.form.addControl(PropertyExtension.getPropertyName(() => this.credentials.password), new FormControl(this.credentials.password, [Validators.required]));
  }

  ngOnInit() {
    this.buildForm();
  }

  onSubmit() {
    Object.assign(this.credentials, this.form.value);
    this.authService.login(this.credentials).subscribe((result: boolean) => {
      //this.router.navigateByUrl((!this.authService.redirectURL) ? '/bikes' : this.authService.redirectURL);
      if (!this.redirect_uri)
        window.location.href = (!this.authService.redirectURL) ? '/bikes' : this.authService.redirectURL;
      else
        window.location.href = this.redirect_uri;
      this.authService.redirectURL = null;
    }, (error: any) => {
      if (error.error == "User claims not verified.") {
        this.translate.get("LOG_IN.VERIFY_LOGIN").subscribe(text => {
          this.form.setErrors({ '': text });
        });
      } else {
        this.translate.get("LOG_IN.INVALID_CREDENTIALS").subscribe(text => {
          this.form.setErrors({ '': text });
        });

      }
    });
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
