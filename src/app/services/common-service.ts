import { TranslateService } from "@ngx-translate/core";
import { TranslateMessageTypes } from "../core/enums/TranslateMessageTypes";
import { Injectable } from "@angular/core";
import { CommonType } from "../core/enums/commonType";
import { UserRole } from "../core/enums/userRole";

@Injectable()
export class CommonService {
    /**
     *
     */
    constructor(private translate: TranslateService) {

    }

    public TranslateMessage(type) {
        var msg = "";
        switch (type) {
            case TranslateMessageTypes.BikeServiceGetError:
                this.translate.get("LIVE_MAP.MESSAGES.BIKE_GET_SERVICE_ERROR").subscribe(name => {
                    msg = name;
                });
                break;
            case TranslateMessageTypes.BikeServiceAddSuccess:
                this.translate.get("LIVE_MAP.MESSAGES.BIKE_SERVICE_ADD_SUCCESS").subscribe(name => {
                    msg = name;
                });
                break;
            case TranslateMessageTypes.BikeServiceAddFail:
                this.translate.get("LIVE_MAP.MESSAGES.BIKE_SERVICE_ADD_FAIL").subscribe(name => {
                    msg = name;
                });
                break;
            case TranslateMessageTypes.Disable:
                this.translate.get("LIVE_MAP.MESSAGES.BIKE_DISABLED_STATE_CHANGE_TO").subscribe(name => {
                    msg = name;
                });
                break;
            case TranslateMessageTypes.Enable:
                this.translate.get("LIVE_MAP.MESSAGES.BIKE_ENABLED").subscribe(name => {
                    msg = name;
                });
                break;
            case TranslateMessageTypes.TransportationSuccessCreatedPickedUp:
                this.translate.get("LIVE_MAP.MESSAGES.TRANSPORT_ORDER_CREATED_PICKEDUP").subscribe(name => {
                    msg = name;
                });
                break;
            case TranslateMessageTypes.TransportationSuccessCreatedPickedUpError:
                this.translate.get("LIVE_MAP.MESSAGES.TRANSPORT_ORDER_CREATE_PICKED_ERROR").subscribe(name => {
                    msg = name;
                });
                break;
            case TranslateMessageTypes.TransportationSuccessPickedUp:
                this.translate.get("LIVE_MAP.MESSAGES.TRANSPORT_ORDER_PICKED_UP").subscribe(name => {
                    msg = name;
                });
                break;
            case TranslateMessageTypes.TransportationSuccessPickedUpError:
                this.translate.get("LIVE_MAP.MESSAGES.TRANSPORT_ORDER_PICKED_ERROR").subscribe(name => {
                    msg = name;
                });
                break;
            case TranslateMessageTypes.TransportationExist:
                this.translate.get("LIVE_MAP.MESSAGES.TRANSPORT_ORDER_EXISTS").subscribe(name => {
                    msg = name;
                });
                break;
            case TranslateMessageTypes.DaysAgo:
                this.translate.get("LIVE_MAP.DAYS_AGO").subscribe(name => {
                    msg = name;
                });
                break;
            case TranslateMessageTypes.LockSuccess:
                this.translate.get("LIVE_MAP.MESSAGES.LOCK_SUCCESS").subscribe(name => {
                    msg = name;
                });
                break;
            case TranslateMessageTypes.LockFail:
                this.translate.get("LIVE_MAP.MESSAGES.LOCK_FAIL").subscribe(name => {
                    msg = name;
                });
                break;
            case TranslateMessageTypes.UnlockSuccess:
                this.translate.get("LIVE_MAP.MESSAGES.UNLOCK_SUCCESS").subscribe(name => {
                    msg = name;
                });
                break;
            case TranslateMessageTypes.UnlockFail:
                this.translate.get("LIVE_MAP.MESSAGES.UNLOCK_FAIL").subscribe(name => {
                    msg = name;
                });
                break;
            case TranslateMessageTypes.Never:
                this.translate.get("LIVE_MAP.NEVER").subscribe(name => {
                    msg = name;
                });
                break;
            case TranslateMessageTypes.UndockAndUnlockFail:
                this.translate.get("LIVE_MAP.MESSAGES.UNDOCK_UNLOCK_FAIL").subscribe(name => {
                    msg = name;
                });
                break;
            case TranslateMessageTypes.ErrorReportedSuccess:
                this.translate.get("LIVE_MAP.MESSAGES.ERROR_REPORTED_SUCCESS").subscribe(name => {
                    msg = name;
                });
                break;
            case TranslateMessageTypes.ErrorReportedFail:
                this.translate.get("LIVE_MAP.MESSAGES.ERROR_REPORTED_FAIL").subscribe(name => {
                    msg = name;
                });
                break;
            // case TranslateMessageTypes.AlertAcknowledgedSuccess:
            //     this.translate.get("LIVE_MAP.MESSAGES.ALERT_ACKNOWLEDGE_SUCCESS").subscribe(name => {
            //         msg = name;
            //     });
            //     break;
            // case TranslateMessageTypes.AlertAcknowledgedFail:
            //     this.translate.get("LIVE_MAP.MESSAGES.ALERT_ACKNOWLEDGE_ERROR").subscribe(name => {
            //         msg = name;
            //     });
            //     break;
            // case TranslateMessageTypes.AcknowledgeTransportAndCreateRepairSuccess:
            //     this.translate.get("LIVE_MAP.MESSAGES.TRANSPORT_COMPLETE_REPAIR_SUCCESS").subscribe(name => {
            //         msg = name;
            //     });
            //     break;
            // case TranslateMessageTypes.AcknowledgeTransportAndCreateRepairFail:
            //     this.translate.get("LIVE_MAP.MESSAGES.TRANSPORT_COMPLETE_REPAIR_FAIL").subscribe(name => {
            //         msg = name;
            //     });
            //     break;
            default:
                break;
        }
        return msg;
    }


    public TranslateOnboardMessage(type) {
        var msg = "";
        switch (type) {
            case TranslateMessageTypes.Never:
                this.translate.get("ONBOARD.NEVER").subscribe(name => {
                    msg = name;
                });
                break;
            case TranslateMessageTypes.SecondsAgo:
                this.translate.get("ONBOARD.SECONDS_AGO").subscribe(name => {
                    msg = name;
                });
                break;
            case TranslateMessageTypes.HoursAgo:
                this.translate.get("ONBOARD.HOURS_AGO").subscribe(name => {
                    msg = name;
                });
                break;
            case TranslateMessageTypes.MinutesAgo:
                this.translate.get("ONBOARD.MINUTES_AGO").subscribe(name => {
                    msg = name;
                });
                break;
            case TranslateMessageTypes.DaysAgo:
                this.translate.get("ONBOARD.DAYS_AGO").subscribe(name => {
                    msg = name;
                });
                break;
            default:
                break;
        }
        return msg;
    }

    formatTimeDuration(timeStamp, duration) {
        if (timeStamp !== null) {
            var ts = new Date().getTime() - new Date(timeStamp).getTime();
            var diffMinutes = Math.abs(Math.round(ts / (1000 * 60)));
            if (diffMinutes <= duration) return true;
        }
        return false;
    }

    formatServiceTimeDuration(timeStamp) {
        if (timeStamp && timeStamp !== null && timeStamp != "") {
            var ts = new Date().getTime() - new Date(timeStamp).getTime();

            var diffDays = Math.abs(Math.round(ts / (1000 * 3600 * 24)));
            var diffHours = Math.abs(Math.round(ts / (1000 * 3600)));
            var diffMinutes = Math.abs(Math.round(ts / (1000 * 60)));
            var diffSeconds = Math.abs(Math.round(ts / (1000)));

            // if (diffDays > 1) {
            return diffDays + this.TranslateMessage(TranslateMessageTypes.DaysAgo)
            // }
            // else if (diffHours > 1) {
            //   if (diffHours >= 24 && diffDays == 1) {
            //     return diffDays + " day ago";
            //   } else {
            //     return diffHours + " hours ago";
            //   }
            // }
            // else if (diffMinutes > 1) {
            //   if (diffMinutes >= 60 && diffHours == 1) {
            //     return diffHours + " hour ago";
            //   } else {
            //     return diffMinutes + " minutes ago";
            //   }
            // }
            // else {
            //   if (diffSeconds >= 60 && diffMinutes == 1) {
            //     return diffMinutes + " minute ago";
            //   } else {
            //     return diffSeconds + " seconds ago";
            //   }
            // }
        } else {
            return this.TranslateMessage(TranslateMessageTypes.Never);
        }
    }

    formatServiceTimeDurationCount(timeStamp) {
        if (timeStamp && timeStamp !== null && timeStamp != "") {
            var ts = new Date().getTime() - new Date(timeStamp).getTime();

            var diffDays = Math.abs(Math.round(ts / (1000 * 3600 * 24)));
            var diffHours = Math.abs(Math.round(ts / (1000 * 3600)));
            var diffMinutes = Math.abs(Math.round(ts / (1000 * 60)));
            var diffSeconds = Math.abs(Math.round(ts / (1000)));

            // if (diffDays > 1) {
            return diffDays;
            // }
            // else if (diffHours > 1) {
            //   if (diffHours >= 24 && diffDays == 1) {
            //     return diffDays + " day ago";
            //   } else {
            //     return diffHours + " hours ago";
            //   }
            // }
            // else if (diffMinutes > 1) {
            //   if (diffMinutes >= 60 && diffHours == 1) {
            //     return diffHours + " hour ago";
            //   } else {
            //     return diffMinutes + " minutes ago";
            //   }
            // }
            // else {
            //   if (diffSeconds >= 60 && diffMinutes == 1) {
            //     return diffMinutes + " minute ago";
            //   } else {
            //     return diffSeconds + " seconds ago";
            //   }
            // }
        } else {
            return 0;
        }
    }

    formatReportErrorTimeDurationCount(timeStamp) {
        if (timeStamp && timeStamp !== null && timeStamp != "") {
            var ts = new Date().getTime() - new Date(timeStamp).getTime();

            var diffDays = Math.abs(Math.round(ts / (1000 * 3600 * 24)));
            var diffHours = Math.abs(Math.round(ts / (1000 * 3600)));
            var diffMinutes = Math.abs(Math.round(ts / (1000 * 60)));
            var diffSeconds = Math.abs(Math.round(ts / (1000)));

            // if (diffDays > 1) {
            return diffDays;
            // }
            // else if (diffHours > 1) {
            //   if (diffHours >= 24 && diffDays == 1) {
            //     return diffDays + " day ago";
            //   } else {
            //     return diffHours + " hours ago";
            //   }
            // }
            // else if (diffMinutes > 1) {
            //   if (diffMinutes >= 60 && diffHours == 1) {
            //     return diffHours + " hour ago";
            //   } else {
            //     return diffMinutes + " minutes ago";
            //   }
            // }
            // else {
            //   if (diffSeconds >= 60 && diffMinutes == 1) {
            //     return diffMinutes + " minute ago";
            //   } else {
            //     return diffSeconds + " seconds ago";
            //   }
            // }
        } else {
            return 0;
        }
    }

    formatReportErrorTimeDuration(timeStamp) {
        if (timeStamp && timeStamp !== null && timeStamp != "") {
            var ts = new Date().getTime() - new Date(timeStamp).getTime();

            var diffDays = Math.abs(Math.round(ts / (1000 * 3600 * 24)));
            var diffHours = Math.abs(Math.round(ts / (1000 * 3600)));
            var diffMinutes = Math.abs(Math.round(ts / (1000 * 60)));
            var diffSeconds = Math.abs(Math.round(ts / (1000)));

            // if (diffDays > 1) {
            return diffDays + this.TranslateMessage(TranslateMessageTypes.DaysAgo)
            // }
            // else if (diffHours > 1) {
            //   if (diffHours >= 24 && diffDays == 1) {
            //     return diffDays + " day ago";
            //   } else {
            //     return diffHours + " hours ago";
            //   }
            // }
            // else if (diffMinutes > 1) {
            //   if (diffMinutes >= 60 && diffHours == 1) {
            //     return diffHours + " hour ago";
            //   } else {
            //     return diffMinutes + " minutes ago";
            //   }
            // }
            // else {
            //   if (diffSeconds >= 60 && diffMinutes == 1) {
            //     return diffMinutes + " minute ago";
            //   } else {
            //     return diffSeconds + " seconds ago";
            //   }
            // }
        } else {
            return this.TranslateMessage(TranslateMessageTypes.Never);
        }
    }

    formatBikeOnboardTimeDuration(timeStamp) {
        if (timeStamp && timeStamp !== null && timeStamp != "") {
            var ts = new Date().getTime() - new Date(timeStamp).getTime();

            var diffDays = Math.abs(Math.round(ts / (1000 * 3600 * 24)));
            var diffHours = Math.abs(Math.round(ts / (1000 * 3600)));
            var diffMinutes = Math.abs(Math.round(ts / (1000 * 60)));
            var diffSeconds = Math.abs(Math.round(ts / (1000)));

            if (diffDays > 1) {
                return diffDays + this.TranslateMessage(TranslateMessageTypes.DaysAgo)
            }
            else if (diffHours > 1) {
                if (diffHours >= 24 && diffDays == 1) {
                    return diffDays + this.TranslateOnboardMessage(TranslateMessageTypes.DaysAgo);
                } else {
                    return diffHours + this.TranslateOnboardMessage(TranslateMessageTypes.HoursAgo);
                }
            }
            else if (diffMinutes > 1) {
                if (diffMinutes >= 60 && diffHours == 1) {
                    return diffHours + this.TranslateOnboardMessage(TranslateMessageTypes.HoursAgo);
                } else {
                    return diffMinutes + this.TranslateOnboardMessage(TranslateMessageTypes.MinutesAgo);
                }
            }
            else {
                if (diffSeconds >= 60 && diffMinutes == 1) {
                    return diffMinutes + this.TranslateOnboardMessage(TranslateMessageTypes.MinutesAgo);
                } else {
                    return diffSeconds + this.TranslateOnboardMessage(TranslateMessageTypes.SecondsAgo);
                }
            }
        } else {
            return this.TranslateOnboardMessage(TranslateMessageTypes.Never);
        }
    }

    mapReportedUser(x: any) {
        let reportedUser = "";
        if (x.EndUserId == CommonType.AutoUser) {
            this.translate.get("LIVE_MAP.ERROR_REPORT_MSG.SYSTEM").subscribe(name => {
                reportedUser = name;
            });
        }
        else if (x.EndUserId != CommonType.AutoUser && !x.EndAppUserId && x.RoleId) {
            if (x.RoleId == UserRole.Admin) {
                this.translate.get("LIVE_MAP.ERROR_REPORT_MSG.ADMIN").subscribe(name => {
                    reportedUser = `${name} (${x.EndUser})`;
                });
            }
            else if (x.RoleId == UserRole.StreetTeam) {
                // reportedUser = `Service user (${x.EndUser})`;
                this.translate.get("LIVE_MAP.ERROR_REPORT_MSG.STREET_TEAM").subscribe(name => {
                    reportedUser = `${name} (${x.EndUser})`;
                });
            }
            else if (x.RoleId == UserRole.CustomerService) {
                this.translate.get("LIVE_MAP.ERROR_REPORT_MSG.CUSTOMER_SERVICE").subscribe(name => {
                    reportedUser = `${name} (${x.EndUser})`;
                    // reportedUser = `Customer center (${x.EndUser})`;
                });
            }
        }
        else if (x.EndUserId != CommonType.AutoUser && x.EndAppUserId) {
            // reportedUser = "Customer reported issue";
            this.translate.get("LIVE_MAP.ERROR_REPORT_MSG.CUSTOMER_REPORTED").subscribe(name => {
                reportedUser = name;
            });
        }
        return reportedUser;
    }
}