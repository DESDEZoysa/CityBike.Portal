export class Commands {
    public static readonly Restart = 100;
    public static readonly DownloadSettings = 101;
    public static readonly UpgradeFirmware = 102;
    public static readonly PollSingle = 103;
    public static readonly PollAll = 104;
    public static readonly EBikeControllerTest = 150;
    public static readonly BikePCBTest = 151;

    public static readonly StartCharging = 200;
    public static readonly StopCharging = 201;
    public static readonly StartSession = 202;
    public static readonly StopSession = 203;
    public static readonly StartHeating = 208;
    public static readonly StopHeating = 209;
    public static readonly Undock = 210;
    public static readonly ResetSlaveDP = 211;
    public static readonly DownloadDPLog = 212;
    public static readonly Blink = 213;
    public static readonly PeerUndock = 214;
    public static readonly LocateBike = 216;

    public static readonly FreeLock = 300;
    public static readonly UnLock = 310;
    public static readonly Lock = 311;
    public static readonly ResetTrip = 302;
    public static readonly SetAssistLimit = 303;

    public static readonly DetectTirePressure = 601;

    public static readonly StartPassiveSession = 710;
    public static readonly StopPassiveSession = 711;
}
