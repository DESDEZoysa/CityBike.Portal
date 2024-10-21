import { Position } from "../common/position";


export class PreviousBike {
    public BikeId: number;
    public Serial: string;
    public VisualId: number;
    public Number: number;
    public ChargeLevel: number;
    public BikeState: number;
    public LockState: number;
    public PowerState: number;
    public Position: Position;
    public Disabled: boolean;
    public SessionId: string;
    public EnudUserId: string;
    public LatestPulse: string;
}