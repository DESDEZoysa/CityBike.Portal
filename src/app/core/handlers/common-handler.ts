import { BikeModes } from './../enums/bikeModes';
import { BikeState } from './../enums/bikeState';
import { BikeStatus } from "../enums/bikeStatus";
import { LockState } from "../enums/lockState";
import { BikeDisableState } from "../enums/bikeDisableState";
import { BikeStatusColor } from "../constants/bike-status-color";
import * as moment from "moment";
import { UserTimezone } from '../enums/userTimezone';
import { UserLanguage } from '../enums/userLanguage';

export class CommonHandler {
    /**
     *
     */
    public static getBikeStatus(bike, dockingStationId, dockingPointId = null) {
        if (
            !bike.Disabled &&
            !dockingPointId &&
            bike.SessionId &&
            bike.Resolved == 0
            // && bike.UndockFailureCount == 0
        )
            return BikeStatus.NormalInSession;
        else if (
            !bike.Disabled &&
            !dockingPointId &&
            bike.SessionId &&
            // (bike.Resolved > 0 || bike.UndockFailureCount >= 4)
            (bike.Resolved > 0)
        )
            return BikeStatus.ErrorBikesInSession;
        else if (
            !bike.Disabled &&
            !dockingPointId &&
            !bike.SessionId &&
            bike.InSession &&
            bike.Resolved == 0
            // && bike.UndockFailureCount == 0
        )
            return BikeStatus.NormalPassiveSession;
        else if (
            !bike.Disabled &&
            !dockingPointId &&
            !bike.SessionId &&
            bike.InSession &&
            // (bike.Resolved > 0 || bike.UndockFailureCount >= 4)
            (bike.Resolved > 0)
        )
            return BikeStatus.ErrorPassiveSession;
        else if (
            !bike.Disabled &&
            dockingPointId &&
            bike.Resolved == 0
            // && bike.UndockFailureCount == 0
        )
            return BikeStatus.DockedWithNoError;
        else if (
            !bike.Disabled &&
            dockingPointId &&
            // (bike.Resolved > 0 || bike.UndockFailureCount >= 4)
            (bike.Resolved > 0)
        )
            return BikeStatus.DockedWithError;
        else if (
            !bike.Disabled &&
            (!dockingPointId && dockingStationId) &&
            (bike.LockState == LockState.LockedArrest || bike.LockState == LockState.InTransition) &&
            bike.Resolved == 0
            // && bike.UndockFailureCount == 0
        )
            return BikeStatus.LockedWithNoError;
        else if (
            !bike.Disabled &&
            (!dockingPointId && dockingStationId) &&
            (bike.LockState == LockState.LockedArrest || bike.LockState == LockState.InTransition) &&
            // (bike.Resolved > 0 || bike.UndockFailureCount >= 4)
            (bike.Resolved > 0)
        )
            return BikeStatus.LockedWithError;
        else if (
            !bike.Disabled &&
            (bike.LockState == LockState.UnlockedArrest || bike.LockState == LockState.LockedArrest) &&
            bike.Resolved == 0
            // && bike.UndockFailureCount == 0
        )
            return BikeStatus.LooseBikeWithNoError;
        else if (
            !bike.Disabled &&
            (bike.LockState == LockState.UnlockedArrest || bike.LockState == LockState.LockedArrest) &&
            // (bike.Resolved > 0 || bike.UndockFailureCount >= 4)
            (bike.Resolved > 0)
        )
            return BikeStatus.LooseBikeWithError;
        else if (bike.Disabled && (bike.DisableState == BikeDisableState.Testing || bike.DisabledReason == BikeDisableState.Testing))
            return BikeStatus.DisabledWithTesting;
        else if (bike.Disabled && (bike.DisableState == BikeDisableState.Moving || bike.DisabledReason == BikeDisableState.Moving))
            return BikeStatus.DisabledWithMoving;
        else if (bike.Disabled && (bike.DisableState == BikeDisableState.ToWorkshop || bike.DisabledReason == BikeDisableState.ToWorkshop))
            return BikeStatus.DisableToWorkshop;
        else if (bike.Disabled && (bike.DisableState == BikeDisableState.RepairFinished || bike.DisabledReason == BikeDisableState.RepairFinished))
            return BikeStatus.RepairFinished;
        else if (bike.Disabled && (bike.DisableState == BikeDisableState.InWorkshop || bike.DisabledReason == BikeDisableState.InWorkshop))
            return BikeStatus.DisabledInWorkshop;
        else if (bike.Disabled && (bike.DisableState == BikeDisableState.InStorage || bike.DisabledReason == BikeDisableState.InStorage))
            return BikeStatus.DisabledInStorage;
        else if (bike.Disabled && (bike.DisableState == BikeDisableState.CheckedNeedFix || bike.DisabledReason == BikeDisableState.CheckedNeedFix))
            return BikeStatus.DisabledCheckedNeedRepair;
        else if (bike.Disabled && (bike.DisableState == BikeDisableState.WithStreetTeam || bike.DisabledReason == BikeDisableState.WithStreetTeam))
            return BikeStatus.DisabledWithStreetTeam;
        else if (bike.Disabled && (bike.DisableState == BikeDisableState.OnLoan || bike.DisabledReason == BikeDisableState.OnLoan))
            return BikeStatus.DisabledOnLoan;
        else if (bike.Disabled && !dockingPointId)
            return BikeStatus.DisabledLoose;
        else if (bike.Disabled)
            return BikeStatus.Disabled;
    }

    public static getBikeStatusColor(bike) {
        let color = "";
        // this logic is same as bike page color scheme
        if (bike.Disabled &&
            ((bike.DisableState && bike.DisableState != BikeDisableState.CheckedNeedFix
                && bike.DisableState != BikeDisableState.WithStreetTeam 
                && bike.DisableState != BikeDisableState.OnLoan) ||
                (bike.DisabledReason && bike.DisabledReason != BikeDisableState.CheckedNeedFix
                    && bike.DisabledReason != BikeDisableState.WithStreetTeam 
                    && bike.DisabledReason != BikeDisableState.OnLoan))) {
            color = BikeStatusColor.RED;
        }
        else if (bike.Disabled &&
            ((bike.DisableState && bike.DisableState == BikeDisableState.CheckedNeedFix) ||
                (bike.DisabledReason && bike.DisabledReason == BikeDisableState.CheckedNeedFix))) {
            color = BikeStatusColor.PURPLE;
        }
        else if (bike.Disabled &&
            ((bike.DisableState && bike.DisableState == BikeDisableState.WithStreetTeam) ||
                (bike.DisabledReason && bike.DisabledReason == BikeDisableState.WithStreetTeam))) {
            color = BikeStatusColor.GRAY;
        }
        else if (bike.Disabled &&
            ((bike.DisableState && bike.DisableState == BikeDisableState.OnLoan) ||
                (bike.DisabledReason && bike.DisabledReason == BikeDisableState.OnLoan))) {
            color = BikeStatusColor.PINK;
        }
        else if (bike.Resolved != 0) {
            color = BikeStatusColor.AMBER;
        } else {
            if (bike.BikeState == 10) {
                color = BikeStatusColor.GREEN;
            } else {
                color = BikeStatusColor.BLACK;
            }
        }
        return color;
    }

    public static GetBikeModeByBike(bike) {
        if (!bike.Disabled && bike.SessionId == null && bike.BikeState == BikeState.Docked)
            bike.BikeModeId = BikeModes.AvailableDocked;
        else if (!bike.Disabled && bike.SessionId == null && bike.BikeState != BikeState.Docked)
            bike.BikeModeId = BikeModes.AvailableFree;
        else if (!bike.Disabled && bike.SessionId != null)
            bike.BikeModeId = BikeModes.InUseInSession;
        else if (!bike.Disabled && bike.SessionId == null && bike.BikeState == BikeState.Running)
            bike.BikeModeId = BikeModes.InUsePassiveSession;
        else if (bike.Disabled && bike.DisabledReason == BikeDisableState.ToWorkshop)
            bike.BikeModeId = BikeModes.DisabledToWorkshop;
        else if (bike.Disabled && bike.DisabledReason == BikeDisableState.InWorkshop)
            bike.BikeModeId = BikeModes.DisabledInWorkshop;
        else if (bike.Disabled && bike.DisabledReason == BikeDisableState.RepairFinished)
            bike.BikeModeId = BikeModes.DisabledRepairFinished;
        else if (bike.Disabled && bike.DisabledReason == BikeDisableState.InStorage)
            bike.BikeModeId = BikeModes.DisabledInStorage;
        else if (bike.Disabled && bike.DisabledReason == BikeDisableState.Moving)
            bike.BikeModeId = BikeModes.DisabledMoving;
        else if (bike.Disabled && bike.DisabledReason == BikeDisableState.CheckRequired)
            bike.BikeModeId = BikeModes.DisabledCheckRequired;
        else if (bike.Disabled && bike.DisabledReason == BikeDisableState.Missing)
            bike.BikeModeId = BikeModes.DisabledMissing;
        else if (bike.Disabled && bike.DisabledReason == BikeDisableState.Testing)
            bike.BikeModeId = BikeModes.DisabledTesting;
        return bike.BikeModeId;
    }
    public static GetMaxObject(arr, prop) {
        var max;
        for (var i = 0; i < arr.length; i++) {
            if (!max || parseInt(arr[i][prop]) > parseInt(max[prop]))
                max = arr[i];
        }
        return max;
    }

    public static FindDurationInHoursForDate(timeStamp) {
        if (timeStamp && timeStamp !== null && timeStamp != "") {

            var duration = moment.duration(moment.utc().diff(moment(timeStamp)));
            var hours = duration.asHours();
            return hours;
        } else {
            return 0;
        }
    }

    public static GenerateLanguageObject(lang) {
        var selectedLang;
        switch (lang) {
            case "no":
                selectedLang = { "lang": UserLanguage.Norwegian, "translation": "COMMON.LANGUAGE_NO_SAVE" };

                break;
            case "en":
                selectedLang = { "lang": UserLanguage.English, "translation": "COMMON.LANGUAGE_EN_SAVE" };
                break;
            default:
                selectedLang = { "lang": UserLanguage.Norwegian, "translation": "COMMON.LANGUAGE_NO_SAVE" };
                break;
        }
        return selectedLang;
    }

    public static GenerateTimezoneObject(timezone) {
        var selectedTimezone;
        switch (timezone) {
            case "CET":
                selectedTimezone = { "timezone": UserTimezone.CET, "translation": "COMMON.TIMEZONE_CET_SAVE" };
                break;
            case "UTC":
                selectedTimezone = { "timezone": UserTimezone.UTC, "translation": "COMMON.TIMEZONE_UTC_SAVE" };
                break;
            default:
                selectedTimezone = { "timezone": UserTimezone.CET, "translation": "COMMON.TIMEZONE_CET_SAVE" };
                break;
        }
        return selectedTimezone;
    }

    public static MapLanguage(lang) {
        var selectedLang;
        switch (lang) {
            case 1:
                selectedLang = "en";
                break;
            case 2:
                selectedLang = "no";
                break;
            default:
                selectedLang = "no";
                break;
        }
        return selectedLang;
    }

    public static MapTimezone(timezone) {
        var selectedTimezone;
        switch (timezone) {
            case 1:
                selectedTimezone = "CET";
                break;
            case 2:
                selectedTimezone = "UTC";
                break;
            default:
                selectedTimezone = "CET";
                break;
        }
        return selectedTimezone;
    }
}