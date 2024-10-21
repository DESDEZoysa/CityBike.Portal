export class LiveConnectRequest {
    MID: string;
    ConnectAllObservations: boolean;
    ConnectAllCommands: boolean;
    ObservationIds: number[];
    CommandIds: number[];
    InitObservationValues: boolean;
    ReceiveDevicePulse: boolean;
    PulseId: number;
}