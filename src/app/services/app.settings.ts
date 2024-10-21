import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable()
export class AppSettings {

    public readonly api_url: string;
    public readonly main_url: string;
    public readonly insight_api_url: string;
    public readonly reverse_geocoding_url: string;
    public readonly snackbar_action_label: string;
    public readonly snackbar_duration: number;
    public readonly auth_token_version: number;
    public readonly bing_map_key: string;
    public readonly show_reservations: boolean;
    public readonly s3_Image_URL: string;
    public readonly mcs_template: string;
    public readonly title: string;
    public readonly logoTitle: string;
    public readonly map_center_position: number[];
    public readonly enable_insight: boolean;

    constructor() {
        this.api_url = environment.api_url;
        this.main_url = environment.main_url;
        this.insight_api_url = environment.insight_api_url;
        this.show_reservations = false;
        this.snackbar_duration = 10000;
        this.auth_token_version = 1491992118;
        this.mcs_template = environment.mcs_template;
        this.snackbar_action_label = 'close';
        this.reverse_geocoding_url = 'https://nominatim.openstreetmap.org';
        this.s3_Image_URL = environment.s3_image_url;
        this.bing_map_key = 'AgJ4bLJlWyKVbp0O91oqkKbJyWw5d8iDdwmrjMEOD82U_PI4hIEqjyGhsR1oQq3y';
        this.title = environment.title;
        this.logoTitle = environment.logo_title;
        this.map_center_position = environment.map_center_position;
        this.enable_insight = environment.enable_insight;
    }
}
