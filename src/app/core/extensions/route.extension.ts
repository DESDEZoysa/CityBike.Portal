export class RouteExtension {

    public static GetStreetTeamRouteStatus(status: number): string {
        let text;
        switch (status) {
            case 1:
                text = 'ROUTES.ROUTE_STATUS.DRAFT';
                break;
            case 2:
                text = 'ROUTES.ROUTE_STATUS.ASSIGNED';
                break;
            case 3:
                text = 'ROUTES.ROUTE_STATUS.ONGOING';
                break;
            case 4:
                text = 'ROUTES.ROUTE_STATUS.COMPLETED';
                break;
        }
        return text;
    }
}