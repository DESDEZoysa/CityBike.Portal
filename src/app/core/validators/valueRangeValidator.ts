import { AbstractControl } from "@angular/forms";

export class ValueRangeValidator {
    static checkValueRange(min, max) {
        return (control: AbstractControl) => {
            if (control.value < min || control.value > max) {
                return { exceed: true };
            } else {
                return null;
            }
        };
    }
}