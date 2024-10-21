import { ParameterTypes } from './parameter-types';

export class LiveSubscriber {

    deviceSerial: string;
    observationIds: number[];
    commandIds: number[];
    dataType: number;

    updateCallback: any;

    constructor(serial: string, observations: number[], commands: number[], dataType: number) {
        this.deviceSerial = serial;
        this.observationIds = observations;
        this.commandIds = commands;
        this.dataType = dataType;
    }

    update(device: string, type: ParameterTypes, parameter: number, message: any): void {
        let data = this.getData(JSON.parse(message));
        if (this.updateCallback) {
            this.updateCallback(device, type, parameter, data);
        }
    }

    private getData(data: any): any {
        if (this.dataType == 5) {
            data = {
                Timestamp: data.Timestamp,
                Longitude: data.Value.Longitude,
                Latitude: data.Value.Latitude,
                Altitude: data.Value.Altitude
            };
        }
        return data;
    }
}