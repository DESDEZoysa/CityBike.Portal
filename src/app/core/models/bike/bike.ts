import { Position } from '../common/position';
import { Address } from '../common/address';
import { PreviousBike } from './previous-bike';

export class Bike {
    public BikeId: number;
    public Serial: string;
    public VisualId: number;
    public DockingPointId: number;
    public DockingStationId: number;
    public Address: Address;
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
    public PreviousBike: PreviousBike;
    public SessionStartTime: string;
    public ChargeLevelUpdatedTime: string;
    public BikeModeId: string;
    public UndockFailureCount: number;
    public BikeModeExtended: string;
    public InSession: boolean;
    public DisabledReason: number;
    public AccumulateTotalDistance: number;
    public WorkshopId: any;
    public GracePeriodStartDate: any;
    public GracePeriod: any;
    public isGracePeriodExpired: boolean;
    public GracePeriodStart: any;
    public GracePeriodEnd: any;
}