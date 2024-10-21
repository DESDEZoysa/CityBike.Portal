export class BikeExtension {

    public static GetBikeStatus(status: number): string {
        let text;
        switch (status) {
            case 10:
                text = 'Running';
                break;
            case 20:
                text = 'Docked';
                break;
            case 30:
                text = 'Parked Vertically';
                break;
            case 31:
                text = 'Parked Horizontally';
                break;
        }
        return text;
    }

    public static GetLockStatus(status: number): string {
        let text;
        switch (status) {
            case 10:
                text = 'Locked';
                break;
            case 11:
                text = 'Unlocked';
                break;
            case 12:
                text = 'Locked-Free';
                break;
            case 13:
                text = 'Unlocked-Free';
                break;
            case 20:
                text = 'In Transition';
                break;
        }
        return text;
    }

    public static GetBikeMode(status: any): string {
        let text;
        switch (status) {
            case 16:
                text = 'DASHBOARD.AVILABLE_DOCKED';
                break;
            case 17:
                text = 'DASHBOARD.AVILABLE_FREE';
                break;
            case 18:
                text = 'DASHBOARD.INUSE_SESSION';
                break;
            case 19:
                text = 'DASHBOARD.INUSE_PASSIVESESSION';
                break;
            case 4:
                text = 'DASHBOARD.DISABLED_INSTORAGE';
                break;
            case 1:
                text = 'DASHBOARD.DISABLED_TO_WORKSHOP';
                break;
            case 2:
                text = 'DASHBOARD.DISABLED_IN_WORKSHOP';
                break;
            case 3:
                text = 'DASHBOARD.DISABLED_REPAIR_FINISHED';
                break;
            case 5:
                text = 'DASHBOARD.DISABLED_READY_FOR_DISTRIBUTION';
                break;
            case 20:
                text = 'DASHBOARD.DISABLED_FIRMWARE_UPGRADE';
                break;
            case 13:
                text = 'DASHBOARD.DISABLED_LOW_TIRE_PRESSURE';
                break;
            case 21:
                text = 'DASHBOARD.DISABLED_MOVING';
                break;
            case 22:
                text = 'DASHBOARD.DISABLED_CHECK_REQUIRED';
                break;
            case 23:
                text = 'DASHBOARD.DISABLED_TESTING';
                break;
            case 24:
                text = 'DASHBOARD.DISABLED_MISSING';
                break;
            case 29:
                text = 'DASHBOARD.DISABLED_CHECKED_NEEDS_REPAIR';
                break;
            case 30:
                text = 'DASHBOARD.SHOULD_BE_CHECKED';
                break;
            case 31:
                text = 'DASHBOARD.NORMAL';
                break;
            case 35:
                text = 'DASHBOARD.WITH_STREET_TEAM';
                break;
            case 36:
                text = 'DASHBOARD.ON_LOAN';
                break;
        }
        return text;
    }

    public static GetLockState(state: any): string {
        let text;
        switch (state) {
            case 10:
                text = 'BIKE_DETAILS.LOCKSTATE.LOCKED';
                break;
            case 11:
                text = 'BIKE_DETAILS.LOCKSTATE.UNLOCKED';
                break;
            case 20:
                text = 'BIKE_DETAILS.LOCKSTATE.TRANSITION';
                break;
        }
        return text;
    }

    // public static GetBikeMode(status: number): string {
    //     let text;
    //     switch (status) {
    //         case 16:
    //             text = 'Available-Docked';
    //             break;
    //         case 17:
    //             text = 'Available-Free';
    //             break;
    //         case 18:
    //             text = 'InUse-InSession';
    //             break;
    //         case 18:
    //             text = 'InUse-PassiveSession';
    //             break;
    //         case 4:
    //             text = 'Disabled-InStorage';
    //             break;
    //         case 1:
    //             text = 'Disabled-ToWorkshop';
    //             break;
    //         case 2:
    //             text = 'Disabled-InWorkshop';
    //             break;
    //         case 3:
    //             text = 'Disabled-RepairFinished';
    //             break;
    //         case 5:
    //             text = 'Disabled-ReadyForDistribution';
    //             break;
    //         case 20:
    //             text = 'Disabled-FirmwareUpgrade';
    //             break;
    //         case 10:
    //             text = 'Disabled-Offline';
    //             break;
    //         case 11:
    //             text = 'Disabled-LostPosition';
    //             break;
    //         case 12:
    //             text = 'Disabled-LowBattery';
    //             break;
    //         case 13:
    //             text = 'Disabled-LowTirePressure';
    //             break;
    //         case 21:
    //             text = 'Disabled-Moving';
    //             break;
    //         case 22:
    //             text = 'Disabled-CheckRequired';
    //             break;
    //         case 23:
    //             text = 'Disabled-Testing';
    //             break;
    //         case 24:
    //             text = 'Disabled-Missing';
    //             break;
    //     }
    //     return text;
    // }
}