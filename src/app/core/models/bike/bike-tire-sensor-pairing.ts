import { BikeObservation } from "./bike-observation";

export class BikeTireSensorPairing {
    Name: string;
    Front: BikeObservation;
    Rear: BikeObservation;
    Symbol: string;
    constructor(name: string, front: BikeObservation, rear: BikeObservation, symbol: string) {
        this.Name = name;
        this.Front = front;
        this.Rear = rear;
        this.Symbol = symbol;
    }
}