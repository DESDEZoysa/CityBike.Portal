import { EventEmitter, Injectable } from '@angular/core';

import { HubConnection } from '@microsoft/signalr';
import * as signalR from '@microsoft/signalr';
import { SignalRSubscriber } from '../core/models/live/signalr-subscriber';
import { LocalStorageKeys } from '../core/constants/local-storage-keys';
import { AppSettings } from './app.settings';

const reconnectionPattern = [0, 3000, 5000, 10000, 15000, 30000];

@Injectable()
export class SignalRService {

    private _hubConnection: HubConnection | undefined;
    signalReceived = new EventEmitter<SignalRSubscriber>();

    constructor(private settings: AppSettings) {
        this.buildConnection();
    }

    private buildConnection() {
        var authToken = JSON.parse(localStorage.getItem(LocalStorageKeys.OAUTH_TOKEN))._token;
        let host = `${this.settings.main_url}/hubs/citybikehub`;

        this._hubConnection = new signalR.HubConnectionBuilder()
            .withUrl(host, { accessTokenFactory: () => authToken })
            .withAutomaticReconnect(reconnectionPattern)
            .configureLogging(signalR.LogLevel.Critical)
            .build();
    }

    public startConnection() {
        this._hubConnection.start().catch(err => console.error(err.toString()));

        this.registerSignalEvents();
    }

    public stopConnection() {
        this._hubConnection.stop().catch(err => console.error(err.toString()));
    }

    public SubscribeConnection(id) {
        this._hubConnection.invoke("Subscribe", id)
            .catch(error => {
                console.log(error);
            });
    }

    public UnSubscribeConnection(id) {
        this._hubConnection.invoke("Unsubscribe", id)
            .catch(error => {
                console.log(error);
            });
    }

    private registerSignalEvents() {
        this._hubConnection.on("BikeUpdate", (update: SignalRSubscriber) => {
            // console.log(update);
            this.signalReceived.emit(update);
        });
    }

}