export class SessionExtension {

    public static GetSessionStartEndReason(status: number): string {
        let text;
        switch (status) {
            case 100:
                text = 'Release Docked';
                break;
            case 101:
                text = 'Release Locked Inside DockingStaion';
                break;
            case 102:
                text = 'Release Unlocked Inside DockingStaion';
                break;
            case 103:
                text = 'Release Locked Outside';
                break;
            case 104:
                text = 'Release Unlocked Outside';
                break;
            case 105:
                text = 'Release Docked Outside';
                break;
            case 200:
                text = 'Return Docked';
                break;
            case 201:
                text = 'Undocking Canceled(ERR509)';
                break;
            case 202:
                text = 'Undocking Failed';
                break;
            case 203:
                text = 'Return Inside DockingStaion';
                break;
            case 204:
                text = 'Return Outside';
                break;
            case 205:
                text = 'Session Manually Terminated';
                break;
            case 206:
                text = 'Auto Terminated After 12Hrs';
                break;
        }
        return text;
    }

}