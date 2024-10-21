import { Position } from '../common/position';
import { Address } from '../common/address';

export class DockingStation {

    public AddressStr: string = '';
    public DockingStationId: number;
    public Name: string;
    public Geometry: string;
    public DeviceId: string;
    public VisualId: string;
    public Position: Position;
    public Address: Address;
    public NumberOfAvailableBikes: number;
    public NumberOfAvailablePoints: number;
    public NumberOfReservations: number;
    public TotalNumberOfPoints: number;
    public MinimumBikesRequired: number;
    public IdealNumberOfBikes: number;
    public NumberOfPriorityReservations: number;
    public StationStatus: string;
    public AreaName: string;
    public DockingPoints: any[];
    public IsOnboardStation: boolean;
    public Disabled: boolean;
    public DisabledReason: string;
}

