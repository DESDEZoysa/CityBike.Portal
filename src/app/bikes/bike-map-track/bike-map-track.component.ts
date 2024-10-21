import { Component, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { LoggerService, BikesService, SettingsService } from "../../services";
import * as moment from "moment";
import { MapTypes } from "../../core/enums/mapTypes";
import { MapSettingsService } from "../../services/map-settings.service";

const LAST_HOUR: string = "LastHour";
const LAST_DAY: string = "LastDay";
const LAST_WEEK: string = "LastWeek";
const LAST_MONTH: string = "LastMonth";
const CUSTOM: string = "Custom";
const LAST_KNOWN: string = "LastKnown";

const ALL: string = "all";
const ON_TRIPS: string = "ontrips";
const NOT_ON_TRIPS: string = "notontrips";

@Component({
  selector: "app-bike-map-track",
  templateUrl: "./bike-map-track.component.html",
  styleUrls: ["./bike-map-track.component.scss"],
})
export class BikeMapTrackComponent implements OnInit {
  to;
  from;
  bikeId: any;
  title: any;
  allMap: boolean = false;
  bikeVisualId: any;
  selectedMap: string;
  isLastKnown: boolean = false;

  mapDetails = [
    {
      name: "COMMON.MAP_COLOR",
      key: MapTypes.mapColor,
      languageKey: "MAP_MENU.MAP_COLOR",
    },
    {
      name: "COMMON.MAP_GREY",
      key: MapTypes.mapColorGray,
      languageKey: "MAP_MENU.MAP_GREY",
    },
    {
      name: "COMMON.SATELLITE",
      key: MapTypes.mapSatellite,
      languageKey: "MAP_MENU.SATELLITE",
    },
    {
      name: "COMMON.SATELLITE_NAMES",
      key: MapTypes.mapSatelliteWithNames,
      languageKey: "MAP_MENU.SATELLITE_WITH_NAMES",
    },
  ];
  selectedTab: any;

  constructor(
    private route: ActivatedRoute,
    private loggerService: LoggerService,
    private bikesService: BikesService,
    private mapSettings: MapSettingsService,
    private settingsService: SettingsService
  ) {
    this.bikeId = route.snapshot.params["id"];

    if (this.bikeId == ALL) {
      this.allMap = true;
      this.title = "BIKES_LIST.ALL";
    } else if (this.bikeId == ON_TRIPS) {
      this.allMap = true;
      this.title = "BIKES_LIST.ALL_ON_TRIPS";
    } else if (this.bikeId == NOT_ON_TRIPS) {
      this.allMap = true;
      this.title = "BIKES_LIST.ALL_NOT_ON_TRIPS";
    } else {
      //Getting bike visual id
      this.bikesService.getBikeDetails(this.bikeId).subscribe((data) => {
        this.bikeVisualId = data["VisualId"];
      });
    }
  }

  ngOnInit() {
    this.selectedMap = this.mapSettings.getDefaultMap();
    this.getTimeStamps(LAST_KNOWN);
  }

  tabChanged(selectedTab) {
    this.selectedTab = selectedTab;
    this.getTimeStamps(selectedTab);
  }

  searchData(event) {
    this.from = moment(event["from"]).startOf('day').format('YYYY-MM-DDTHH:mm:ss');
    this.to = moment(event["to"]).endOf('day').format('YYYY-MM-DDTHH:mm:ss');
  }

  changeMap(name) {
    this.selectedMap = name;
    this.mapSettings.changeTrackMap(name);
  }

  getTimeStamps(selectedTab) {
    this.to = moment();
    if (selectedTab == LAST_HOUR) {
      this.from = moment(this.to).subtract(moment.duration(1, "hours"));
      this.isLastKnown = false;
    } else if (selectedTab == LAST_DAY) {
      this.from = moment(this.to).subtract(moment.duration(1, "days"));
      this.isLastKnown = false;
    } else if (selectedTab == LAST_WEEK) {
      this.from = moment(this.to).subtract(moment.duration(1, "weeks"));
      this.isLastKnown = false;
    } else if (selectedTab == LAST_MONTH) {
      this.from = moment(this.to).subtract(moment.duration(1, "months"));
      this.isLastKnown = false;
    } else if (selectedTab == CUSTOM) {
      this.from = this.to;
      this.isLastKnown = false;
    } else if (selectedTab == LAST_KNOWN) {
      //this line is added to show only last known bike position
      this.isLastKnown = true;
    }
  }
}
