
import { forkJoin as observableForkJoin } from 'rxjs';
import { AuthService } from './../../services/auth.service';

import { Component, OnInit, OnDestroy, TemplateRef } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import { LoggerService, SettingsService, AppSettings } from '../../services';
import { UserService } from '../../services/users.service';
import { LocalStorageKeys } from '../../core/constants';
import { UserRoles } from '../../core/constants/user-roles';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonHandler } from '../../core/handlers/common-handler';

@Component({
    selector: 'app-home-layout',
    templateUrl: './home-layout.component.html',
    styleUrls: ['./home-layout.component.scss']
})

export class HomeLayoutComponent implements OnInit, OnDestroy {
    selectedTemplate: TemplateRef<any>;
    selectedLanguage: any;
    selectedMap: string;
    languages: any[] = [
        { id: 'en', name: 'English' },
        { id: 'no', name: 'Norwegian' }
    ];
    userDetails: any;
    showMapOptions = false;
    bikeMap = true;
    dockMap = true;
    showMapLegend = true;
    showReservation: any;
    enableRoutes: boolean;

    mapDetails = [{ name: "Bikes", key: "bikes" },
    { name: "Docks", key: "docks" },
    { name: "Bikes & Docks", key: "bikesAndDocks" }]

    timeZones: any[] = [
        { id: 'UTC', name: 'UTC' },
        { id: 'CET', name: 'CET' }
    ]
    selectedTimeZone: any;
    isStreetTeamLogo: boolean;
    isDashboardUser: boolean;
    dashboardToken: any;
    isCustomerService: boolean = false;
    isAdmin: boolean = false;
    isWorkshopUser: boolean = false;
    profileName: any;
    logoTitle: string;

    constructor(
        public translate: TranslateService,
        private settings: SettingsService,
        private userService: UserService,
        private loggerService: LoggerService,
        appSettings: AppSettings,
        private authService: AuthService,
        //private menuItemservice: MenuItemService,
        private router: Router,
        private activateRouter: ActivatedRoute) {
        // add supportive languages
        translate.addLangs(["en", "no"]);
        // this language will be used as a fallback when a translation isn't found in the current language
        translate.setDefaultLang('no');
        // the lang to use, if the lang isn't available, it will use the current loader to get them   
        //this.selectedLanguage = this.settings.getSelectedLanguage() ? this.settings.getSelectedLanguage() : this.languages[1].id;
        //translate.use(this.selectedLanguage);
        this.settings.mapSelection$.subscribe(res => {
            this.showMapOptions = res;
        })
        //check whether reservation can be shown
        this.showReservation = appSettings.show_reservations;
        //check whether street team routes can be shown
        this.enableRoutes = appSettings.enable_insight;

        //set app logo titile
        this.logoTitle = appSettings.logoTitle;

        //the default time zone to be used
        this.selectedTimeZone = JSON.parse(localStorage.getItem(LocalStorageKeys.PREFERRED_TIMEZONE));
        if (this.selectedTimeZone == null || this.selectedTimeZone == undefined) {
            this.selectedTimeZone = this.timeZones[1].id;
        }
        this.isStreetTeamLogo = false;
        this.isAdmin = false;
        this.isWorkshopUser = false;
        this.isCustomerService = false;

        //the default language to be used
        this.selectedLanguage = JSON.parse(localStorage.getItem(LocalStorageKeys.PREFERRED_LANGUAGE));
        if (this.selectedLanguage == null || this.selectedLanguage == undefined) {
            this.selectedLanguage = this.languages[1].id;
        }
        translate.use(this.selectedLanguage);
    }

    onTimeZoneChange(timeZone: string) {
        if (timeZone != null) {
            if (this.userDetails) {
                var userId = this.userDetails.UserId;
                this.selectedTimeZone = timeZone;
                var mappedLang = CommonHandler.GenerateLanguageObject(this.selectedLanguage);
                var mappedZone = CommonHandler.GenerateTimezoneObject(this.selectedTimeZone);
                var userSettings = {
                    "UserId": userId,
                    "Language": mappedLang.lang,
                    "Timezone": mappedZone.timezone
                }
                this.GetUserSettings(userId).then(res => {
                    if (res) {
                        this.userService.UpdateUserSetting(userSettings).subscribe(result => {
                            this.translate.get(mappedZone.translation).subscribe(name => {
                                this.loggerService.showErrorMessage(name);
                            });
                            this.settings.setSetting(LocalStorageKeys.PREFERRED_TIMEZONE, JSON.stringify(this.selectedTimeZone));
                        }, err => {
                            this.translate.get("COMMON.ERROR_ZONE").subscribe(name => {
                                this.loggerService.showErrorMessage(name);
                            });
                            this.selectedTimeZone = this.timeZones[1].id;
                            this.settings.setSetting(LocalStorageKeys.PREFERRED_TIMEZONE, JSON.stringify(this.selectedTimeZone));
                        });

                    }
                }).catch(err => {
                    this.userService.AddUserSetting(userSettings).subscribe(result => {
                        this.translate.get(mappedZone.translation).subscribe(name => {
                            this.loggerService.showErrorMessage(name);
                        });
                        this.settings.setSetting(LocalStorageKeys.PREFERRED_TIMEZONE, JSON.stringify(this.selectedTimeZone));
                    }, err => {
                        this.translate.get("COMMON.ERROR_ZONE").subscribe(name => {
                            this.loggerService.showErrorMessage(name);
                        });
                        this.selectedTimeZone = this.timeZones[1].id;
                        this.settings.setSetting(LocalStorageKeys.PREFERRED_TIMEZONE, JSON.stringify(this.selectedTimeZone));
                    });
                });
            }
            else {
                this.selectedTimeZone = this.timeZones[1].id;
                this.settings.setSetting(LocalStorageKeys.PREFERRED_TIMEZONE, JSON.stringify(this.selectedTimeZone));
            }
        }
    }

    onLanguageChange(lang: string) {
        if (this.userDetails) {
            var userId = this.userDetails.UserId;
            this.selectedLanguage = lang;
            var mappedLang = CommonHandler.GenerateLanguageObject(this.selectedLanguage);
            var mappedZone = CommonHandler.GenerateTimezoneObject(this.selectedTimeZone);
            var userSettings = {
                "UserId": userId,
                "Language": mappedLang.lang,
                "Timezone": mappedZone.timezone
            }
            this.GetUserSettings(userId).then(res => {
                if (res) {
                    this.userService.UpdateUserSetting(userSettings).subscribe(result => {
                        this.setLanguage();
                        this.translate.get(mappedLang.translation).subscribe(name => {
                            this.loggerService.showErrorMessage(name);
                        });
                    }, err => {

                        this.selectedLanguage = this.languages[1].id;
                        this.setLanguage();
                        this.translate.get("COMMON.ERROR_LANG").subscribe(name => {
                            this.loggerService.showErrorMessage(name);
                        });
                    });
                }
            }).catch(err => {
                this.userService.AddUserSetting(userSettings).subscribe(result => {
                    this.setLanguage();
                    this.translate.get(mappedLang.translation).subscribe(name => {
                        this.loggerService.showErrorMessage(name);
                    });
                }, err => {
                    this.selectedLanguage = this.languages[1].id;
                    this.setLanguage();
                    this.translate.get("COMMON.ERROR_LANG").subscribe(name => {
                        this.loggerService.showErrorMessage(name);
                    });
                });
            });
        }
        else {
            this.selectedLanguage = lang;
            this.translate.use(this.selectedLanguage);
            this.settings.setSelectedLanguage(this.selectedLanguage);
            this.settings.setSetting(LocalStorageKeys.PREFERRED_LANGUAGE, JSON.stringify(this.selectedLanguage));
        }
    }

    private setLanguage() {
        this.translate.use(this.selectedLanguage);
        this.settings.setSelectedLanguage(this.selectedLanguage);
        this.settings.setSetting(LocalStorageKeys.PREFERRED_LANGUAGE, JSON.stringify(this.selectedLanguage));
    }

    ngOnInit(): void {
        if (this.router.url.startsWith('/dashboard') || this.router.url.startsWith('/session/summary')) {
            var dashboard_token = localStorage.getItem(LocalStorageKeys.DASHBOARD_TOKEN);
            if (dashboard_token) {
                this.isDashboardUser = true;
            }
            else
                this.isDashboardUser = false;
            //skip fetching new auth token, if dashbord refresh continuously while having details in local storage
            var authToken = JSON.parse(localStorage.getItem(LocalStorageKeys.OAUTH_TOKEN));
            if (authToken._claims) {
                this.setMenuPerUser(authToken);
                //skip fetching user setting, if dashbord refresh continuously while having details in local storage
                this.userDetails = JSON.parse(localStorage.getItem(LocalStorageKeys.USER_DETAILS));
                var language = JSON.parse(localStorage.getItem(LocalStorageKeys.PREFERRED_LANGUAGE));
                var timeZone = JSON.parse(localStorage.getItem(LocalStorageKeys.PREFERRED_TIMEZONE));
                if (this.userDetails != null && language && timeZone) {
                    this.setProfileName();
                    return;
                }

                this.loadLoggedInUserDetails();
            }
            else {
                this.activateRouter.queryParams.subscribe(params => {
                    this.dashboardToken = params['token'];
                });
                if (this.dashboardToken) {
                    localStorage.setItem(LocalStorageKeys.DASHBOARD_TOKEN, this.dashboardToken);
                    this.authService.generateRequestTokenByDashboardToken(this.dashboardToken).subscribe(res => {
                        //skip fetching user setting, if dashbord refresh continuously while having details in local storage
                        this.userDetails = JSON.parse(localStorage.getItem(LocalStorageKeys.USER_DETAILS));
                        var language = JSON.parse(localStorage.getItem(LocalStorageKeys.PREFERRED_LANGUAGE));
                        var timeZone = JSON.parse(localStorage.getItem(LocalStorageKeys.PREFERRED_TIMEZONE));
                        if (this.userDetails != null && language && timeZone) {
                            this.setProfileName();
                            return;
                        }
                        this.loadLoggedInUserDetails();

                        var authToken = JSON.parse(localStorage.getItem(LocalStorageKeys.OAUTH_TOKEN));
                        this.setMenuPerUser(authToken);
                    }, err => { });
                }
                else {
                    localStorage.removeItem(LocalStorageKeys.DASHBOARD_TOKEN);
                    //skip fetching user setting, if dashbord refresh continuously while having details in local storage
                    var userDetails = JSON.parse(localStorage.getItem(LocalStorageKeys.USER_DETAILS));
                    var language = JSON.parse(localStorage.getItem(LocalStorageKeys.PREFERRED_LANGUAGE));
                    var timeZone = JSON.parse(localStorage.getItem(LocalStorageKeys.PREFERRED_TIMEZONE));
                    if (userDetails != null && language && timeZone) { return; }

                    this.loadLoggedInUserDetails();

                    var authToken = JSON.parse(localStorage.getItem(LocalStorageKeys.OAUTH_TOKEN));
                    this.setMenuPerUser(authToken);
                }
            }
        }
        else {
            this.loadLoggedInUserDetails();

            var authToken = JSON.parse(localStorage.getItem(LocalStorageKeys.OAUTH_TOKEN));
            this.setMenuPerUser(authToken);
        }
    }

    setMenuPerUser(authToken: any) {
        if (authToken._claims[0] == UserRoles.STREET_TEAM) {
            this.isStreetTeamLogo = true;
        }
        else if (authToken._claims[0] == UserRoles.CUSTOMER_SERVICE) {
            this.isCustomerService = true;
        }
        else if (authToken._claims[0] == UserRoles.ADMIN) {
            this.isAdmin = true;
        }
        else if (authToken._claims[0] == UserRoles.WORKSHOP) {
            this.isWorkshopUser = true;
        }
    }

    setProfileName() {
        this.profileName = this.userDetails["FirstName"];
    }

    private loadLoggedInUserDetails() {
        observableForkJoin(this.userService.getLoggedInUserDetails())
            .subscribe(data => {

                this.userDetails = data[0];
                this.setProfileName();
                var userId = this.userDetails.UserId;
                this.GetUserSettings(userId).then(res => {
                    this.selectedLanguage = CommonHandler.MapLanguage(res.Language);
                    this.selectedTimeZone = CommonHandler.MapTimezone(res.Timezone);
                    this.setLanguageAndTimezone();
                }).catch(err => {
                    var mappedLang = CommonHandler.GenerateLanguageObject(this.selectedLanguage);
                    var mappedZone = CommonHandler.GenerateTimezoneObject(this.selectedTimeZone);
                    var userSettings = {
                        "UserId": userId,
                        "Language": mappedLang.lang,
                        "Timezone": mappedZone.timezone
                    };
                    this.userService.AddUserSetting(userSettings).subscribe(result => {
                        this.setLanguageAndTimezone();
                        this.translate.get("COMMON.DEFAULT_SETTINGS").subscribe(name => {
                            this.loggerService.showErrorMessage(name);
                        });
                    }, err => {
                        this.translate.get("COMMON.ERROR_LANG").subscribe(name => {
                            this.loggerService.showErrorMessage(name);
                        });
                        this.selectedLanguage = this.languages[1].id;
                        this.selectedTimeZone = this.timeZones[1].id;
                        this.setLanguageAndTimezone();
                    });
                });
                localStorage.setItem(LocalStorageKeys.USER_DETAILS, JSON.stringify(this.userDetails));
            }, () => {
                this.loggerService.showErrorMessage("Error while obtaning user details.");
            });
    }

    private setLanguageAndTimezone() {
        this.translate.use(this.selectedLanguage);
        this.settings.setSelectedLanguage(this.selectedLanguage);
        this.settings.setSetting(LocalStorageKeys.PREFERRED_LANGUAGE, JSON.stringify(this.selectedLanguage));
        this.settings.setSetting(LocalStorageKeys.PREFERRED_TIMEZONE, JSON.stringify(this.selectedTimeZone));
    }

    ngOnDestroy() {
        localStorage.setItem(LocalStorageKeys.USER_DETAILS, JSON.stringify(null));
        localStorage.setItem(LocalStorageKeys.SELECTED_AREAS, JSON.stringify(null));
    }

    changeMap(type) {
        if (type == "bike") {
            this.bikeMap = !this.bikeMap;
        }
        else if (type == "dock") {
            this.dockMap = !this.dockMap;
        } else if (type == "legend") {
            this.showMapLegend = !this.showMapLegend;
        }
        this.settings.changeMap({ 'bike': this.bikeMap, 'dock': this.dockMap, 'showLegend': this.showMapLegend })
    }

    NavigateToMap() {
        this.router.navigateByUrl('bikes/live');
    }

    GetUserSettings(userId): any {
        var promise = new Promise((resolve, reject) => {
            this.userService.GetUserSettingByUser(userId).subscribe(res => {
                resolve(res);
            }, err => {
                reject();
            });
        });
        return promise;
    }
}



