export class DockingPointExtension {

    public static GetDockingPointState(state: number): string {
        let text;
        switch (state) {
            case 0:
                text = 'DPDocking : Docked';
                break;
            case 1:
                text = 'Available';
                break;
            case 2:
                text = 'Occupied';
                break;
            case 3:
                text = 'Disabled';
                break;
            case 10:
                text = 'Locked';
                break;
            case 11:
                text = 'Unlocked';
                break;
            case 20:
                text = 'InTransition';
                break;
        }
        return text;
    }
}