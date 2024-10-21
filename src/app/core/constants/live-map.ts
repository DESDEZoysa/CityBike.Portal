import { BikeStatusColor } from "./bike-status-color";

export class LiveMap {
    public static readonly legendInfo = [
        { "color": BikeStatusColor.BLACK, "description": "Bike occupied", "languageKey": "BIKES_LIST.RUNNING", "type": "bike" },
        { "color": BikeStatusColor.GREEN, "description": "Bike available", "languageKey": "BIKES_LIST.AVAILABLE", "type": "bike" },
        { "color": BikeStatusColor.AMBER, "description": "Bike with issues", "languageKey": "BIKES_LIST.ALERTS", "type": "bike" },
        { "color": BikeStatusColor.RED, "description": "Bike disabled", "languageKey": "BIKES_LIST.DISABLED", "type": "bike" },

        { "color": "Black", "description": "Station with bikes", "languageKey": "DOCKING_STATION.BIKES_AVAILABLE", "type": "dock" },
        { "color": "Red", "description": "Station with disabled bikes", "languageKey": "DOCKING_STATION.REQUIRE_MORE_BIKES", "type": "dock" },
        { "color": "Orange", "description": "Station with issue bikes", "languageKey": "DOCKING_STATION.PREFER_MORE_BIKES", "type": "dock" }
    ];

    public static readonly stationLegendInfo = [
        { "state": 1, "color": "Green", "description": "Available bikes equal to ideal bikes", "languageKey": "DOCKING_STATION.BIKES_AVAILABLE_EQUAL_IDEAL", "type": "dock" },
        { "state": 2, "color": "Green", "description": "Available bikes more than ideal bikes", "languageKey": "DOCKING_STATION.BIKES_AVAILABLE_MORE_IDEAL", "type": "dock" },
        { "state": 3, "color": BikeStatusColor.AMBER, "description": "Available bikes less than minimum bikes", "languageKey": "DOCKING_STATION.BIKES_AVAILABLE_LESS_IDEAL", "type": "dock" },
        { "state": 4, "color": "Red", "description": "Available bikes less than ideal bikes", "languageKey": "DOCKING_STATION.BIKES_AVAILABLE_LESS_MIN", "type": "dock" },
        { "state": 5, "color": "White", "description": "Docked bikes with issues", "languageKey": "DOCKING_STATION.BIKES_AVAILABLE_WITH_ISSUES", "type": "dock" }
    ]

}