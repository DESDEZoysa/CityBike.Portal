export class PositionRecalculationExtension {

    static calculatePositionFromPoint(lat, lon, degree) {
        let earthRadius = 6371;
        let dist = 0.01;
        let brng = this.toRad(degree);
        dist = dist / earthRadius;

        var lat1 = this.toRad(lat), lon1 = this.toRad(lon);

        var lat2 = Math.asin(Math.sin(lat1) * Math.cos(dist) +
            Math.cos(lat1) * Math.sin(dist) * Math.cos(brng));

        var lon2 = lon1 + Math.atan2(Math.sin(brng) * Math.sin(dist) *
            Math.cos(lat1),
            Math.cos(dist) - Math.sin(lat1) *
            Math.sin(lat2));

        if (isNaN(lat2) || isNaN(lon2)) return null;

        var lat3 = this.toDeg(lat2);
        var lon3 = this.toDeg(lon2);

        return { "Latitude": lat3, "Longitude": lon3, "Altitude": 0 }

    }

    private static toRad(item) {
        return item * Math.PI / 180;
    }

    private static toDeg(item) {
        return item * 180 / Math.PI;
    }

    static groupArray = key => array =>

        array.reduce((objectsByKeyValue, obj) => {
            const value = obj[key];
            objectsByKeyValue[value] = (objectsByKeyValue[value] || []).concat(obj);
            return objectsByKeyValue;
        }, {});

    static getBikesGroupArray(bikes) {
        var grpBikes = this.groupArray("DockingStationId")(bikes);
        var grpBikesArray: any[] = [] = Object.values(grpBikes)
        return grpBikesArray;
    }
}