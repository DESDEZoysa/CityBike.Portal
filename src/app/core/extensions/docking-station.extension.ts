import { DockingStation, Address } from '../models';

export class DockingStationExtension {

    public static GetAddress(address: Address): string {
        let addressStr = '';
        addressStr += address.Street ? address.Street.trim() + ", " : "";
        addressStr += address.ZipCode ? address.ZipCode.trim() + ", " : "";
        addressStr += address.City ? address.City.trim() + ", " : "";
        addressStr += address.District ? address.District.trim() + ", " : "";
        addressStr += address.Country ? address.Country.trim() : "";
        return addressStr;
    }

}