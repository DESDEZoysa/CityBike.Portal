import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { PropertyExtension } from '../../core/extensions';
import { ForgotPassword } from '../../core/models/auth/forgot-password';
import { CustomValidators } from 'ng4-validators';
import { AppSettings, LoggerService, SettingsService } from '../../services';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss']
})
export class ForgotPasswordComponent implements OnInit {

  public form: FormGroup;
  public formData: ForgotPassword;
  public sendCount: number;
  logoTitle: string;
  constructor(
    private fb: FormBuilder,
    private router: Router,
    route: ActivatedRoute,
    private authService: AuthService,
    private settings: SettingsService,
    private loggerService: LoggerService,
    private appSettings: AppSettings) {

    this.formData = new ForgotPassword();
    this.formData.ResetURL = decodeURI(location.origin + this.router.createUrlTree(['../resetforgotpassword'], { relativeTo: route, queryParams: { token: '{token}' } }));
    this.sendCount = 0;
    this.logoTitle = appSettings.logoTitle;
  }

  private buildForm() {
    this.form = this.fb.group({});
    this.form.addControl(PropertyExtension.getPropertyName(() => this.formData.UserEmail),
      new FormControl(this.formData.UserEmail, [Validators.required, CustomValidators.email]));
  }

  ngOnInit() {
    this.buildForm();
  }

  onSubmit() {
    Object.assign(this.formData, this.form.value);

    //Add user language preference to the object 
    this.formData['PreferredLanguage'] = this.settings.getSelectedLanguage() ? this.settings.getSelectedLanguage() : "en";

    this.authService.forgotPassword(this.formData).subscribe(() => {
      this.sendCount++;
      this.loggerService.showSuccessfulMessage("Please check your email");
    }, (error: any) => {
      this.form.setErrors({ '': error.error })
    });
  }

}
