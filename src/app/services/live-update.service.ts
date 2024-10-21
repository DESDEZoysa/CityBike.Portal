import { AppSettings } from './app.settings';
import { LiveConnectionService } from './live-connection.service';
import { LoggerService } from './logger.service';
import { LiveSubscriber, LiveConnectRequest, LiveConnectResponse, ParameterTypes } from '../core/models';

declare var Stomp: any;

export class LiveUpdateService {

    //protected ws: WebSocket;
    protected client: any;
    public connected: boolean = false;
    public liveConnectionRequestBody: LiveConnectRequest[];

    //subscriber: LiveSubscriber;
    subscribers: LiveSubscriber[] = [];
    subscription: any;

    constructor(
        private appSettings: AppSettings,
        private loggerService: LoggerService,
        private liveConnectionService: LiveConnectionService
    ) {
    }

    connect() {
        if (this.liveConnectionRequestBody && !this.connected) {

            this.liveConnectionService.getLiveConnectionDetails(this.liveConnectionRequestBody)
                .subscribe(data => {
                    var broker_url = "wss://" + data.Server + ":10443";
                    let ws = new WebSocket(broker_url);
                    // this.ws = new SockJS(this.appSettings.broker_url);
                    this.client = Stomp.over(ws);
                    // RabbitMQ SockJS does not support heartbeats so disable them
                    // this.client.heartbeat.outgoing = 0;
                    // this.client.heartbeat.incoming = 0;
                    this.client.debug = null;
                    if (data != null) {
                        this.client.connect(data.Username, data.Password, (d, e) => { this.onConnect(d, data.QueueName); }, d => { this.onError(d); }, data.VirtualHost);
                    }
                }, error => {
                    if (error && error.status === 401) {
                        this.loggerService.showErrorMessage("Don't have access to live subscription");
                    }
                    else {
                        console.log("Error occurred while retrieving live connection details");
                    }
                });
        }
    }

    disconnect() {
        if (this.subscription) {
            this.subscription.unsubscribe();
        }
        if (this.client) {
            this.client.disconnect(this.onDisconnect());
        }
    }

    onDisconnect() {
        this.connected = false;
        // console.log("disconnected");
    }

    onConnect(data: any, queue: string) {
        this.connected = true;
        this.subscription = this.client.subscribe('/amq/queue/' + queue, payload => this.onMessage(payload));
    }

    onError(data: any) {
        this.loggerService.showErrorMessage("Error occurred while retrieving live data");
    }

    onMessage(payload: any) {
        let subscriber;
        let type: any;
        let device: string;
        let parameterId: number;

        let destination = payload.headers['destination'];
        let keys = destination.split('.');
        type = keys[2];

        if (type && type.toLowerCase() == "cr") {
            type = ParameterTypes.CommandResponse;
            device = keys[1].split('/')[1];
            parameterId = Number(keys[3]);
            subscriber = this.getSubscriberByCommand(device, parameterId);
        }
        // else {
        //     type = ParameterTypes.Observation;
        //     // let exchange = payload.headers['Exchange'];
        //     device = '';
        //     // let observationId = Number('');
        //     // let subscriber = this.getSubscriberByObservation(deviceSerial, observationId);
        // }
        if (subscriber) {
            subscriber.update(device, type, parameterId, payload.body);
        }
    }

    addSubscriber(subscriber: any) {
        if (subscriber) {
            this.subscribers.push(subscriber);
        }
    }

    getSubscriberByObservation(serial: string, observationId: number) {
        return this.subscribers.find(s => s.deviceSerial == serial && s.observationIds.indexOf(observationId) >= 0);
    }

    getSubscriberByCommand(serial: string, commandId: number) {
        return this.subscribers.find(s => s.deviceSerial == serial && s.commandIds.indexOf(commandId) >= 0);
    }
}