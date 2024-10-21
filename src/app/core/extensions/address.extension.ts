import { Address } from '../models';

export class AddressExtension {

    public static GetAddressStr(address: Address): string {
        let text = '';
        if (address) {
            text += address.Street ? address.Street.trim() + "," : "";
            text += address.ZipCode ? address.ZipCode.trim() + "," : "";
            text += address.City ? address.City.trim() + "," : "";
            text += address.District ? address.District.trim() + "," : "";
            text += address.Country ? address.Country.trim() : "";
        }
        return text;
    }

    public static GetBikeAddressStr(address: Address): string {
        let text = '';
        if (address && address.DisplayText) {
            text = address.DisplayText;
        }
        else if (address) {
            text += address.Street ? address.Street.trim() + ',' : '';
            if (address.City) {
                text += address.City ? address.City : '';
            }
            else {
                text = text.replace(',', '');
            }
        }
        return text;
    }

    public static GetShortAddressStr(address: Address): string {
        let text = '';
        if (address) {
            //text += address.District ? address.District.trim();
            text += address.City ? address.City.trim() : "";
            text += address.Street ? ", " + address.Street.trim() : "";
            text += address.ZipCode ? ", " + address.ZipCode.trim() : "";
        }
        return text;
    }
}