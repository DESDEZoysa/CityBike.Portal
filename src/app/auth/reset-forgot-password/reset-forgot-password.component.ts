import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';

import { PropertyExtension } from '../../core/extensions';
import { ResetForgotPassword } from '../../core/models/auth/forgot-password';
import { AuthService } from '../../services/auth.service';
import { CustomValidators } from 'ng4-validators';
import { AppSettings, SettingsService } from '../../services';

@Component({
  selector: 'app-reset-forgot-password',
  templateUrl: './reset-forgot-password.component.html',
  styleUrls: ['./reset-forgot-password.component.scss']
})
export class ResetForgotPasswordComponent implements OnInit {

  public form: FormGroup;
  public formData: ResetForgotPassword;
  logoTitle: string;

  constructor(private fb: FormBuilder, private router: Router, private route: ActivatedRoute, private authService: AuthService, private appSettings: AppSettings) {
    this.formData = new ResetForgotPassword();
    route.queryParams.subscribe((params: Params) => this.formData.Token = params['token'] || null);
    this.logoTitle = appSettings.logoTitle;
  }

  private buildForm() {
    this.form = this.fb.group({});
    this.form.addControl(PropertyExtension.getPropertyName(() => this.formData.Token), new FormControl(this.formData.Token, Validators.required));
    this.form.addControl(PropertyExtension.getPropertyName(() => this.formData.Password), new FormControl(this.formData.Password, [Validators.required]));
    this.form.addControl(PropertyExtension.getPropertyName(() => this.formData.ConfirmPassword),
      new FormControl(this.formData.ConfirmPassword, [Validators.required,
      CustomValidators.equalTo(this.form.controls[PropertyExtension.getPropertyName(() => this.formData.Password)])]));
  }

  ngOnInit() {
    this.buildForm();
  }

  onSubmit() {
    Object.assign(this.formData, this.form.value);

    this.authService.resetForgotPassword(this.formData).subscribe(() => {
      this.router.navigate(['../signin'], { relativeTo: this.route });
    }, (error: any) => {
      this.form.setErrors({ '': 'Error while resetting password ...' })
    });
  }


}
