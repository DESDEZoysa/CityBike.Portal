import { Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { AppSettings } from './app.settings';

@Injectable()
export class LoggerService {

    private actionLabel: string;
    private snackBarConfig: MatSnackBarConfig;

    constructor(
        private settings: AppSettings,
        private snackBar: MatSnackBar) {
        this.actionLabel = settings.snackbar_action_label;
        this.snackBarConfig = {
            duration: settings.snackbar_duration,
        };
    }

    public showErrorMessage(message: string, actionLabel: string = null, snackBarConfig: MatSnackBarConfig = null) {
        if (!snackBarConfig && !actionLabel)
            this.snackBar.open(message, this.actionLabel, this.snackBarConfig);
        else if (!snackBarConfig && actionLabel)
            this.snackBar.open(message, actionLabel, this.snackBarConfig);
        else if (snackBarConfig && !actionLabel)
            this.snackBar.open(message, this.actionLabel, snackBarConfig);
        else if (snackBarConfig && actionLabel)
            this.snackBar.open(message, actionLabel, snackBarConfig);
    }

    public showWarningMessage(message: string) {
        this.snackBar.open(message, this.actionLabel, this.snackBarConfig);
    }

    public showSuccessfulMessage(message: string) {
        this.snackBar.open(message, this.actionLabel, this.snackBarConfig);
    }
}
