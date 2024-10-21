export enum BikeModes {
    All = 25,
    AllAvailable = 6,
    AvailableDocked = 16,
    AvailableFree = 17,

    AllInUse = 7,
    InUseInSession = 18,
    InUsePassiveSession = 19,

    AllDisabled = 8,
    DisabledInStorage = 4,
    DisabledMissing = 24,

    AllDisabledRepair = 9,
    DisabledTesting = 23,
    DisabledMoving = 21,
    DisabledCheckRequired = 22,
    DisabledToWorkshop = 1,
    DisabledInWorkshop = 2,
    DisabledRepairFinished = 3,

    //DisabledReadyForDistribution = 5,
    //DisabledFirmwareUpgrade = 20,

    BikeWithMinorIssues = 26,
    BikeInCar = 27,
    DisabledDPLost = 28,
    DisabledCheckedNeedsRepair = 29,

    AllWithUs = 30,
    AllOperational = 31,
    AllShouldBeChecked = 32,
    DisabledOffline = 33,
    PriorityBikes = 34,
    DisabledWithStreetTeam = 35,
    DisabledOnLoan = 36
}