import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BikesSumOperatonalDialogPopupComponent } from './bikes-sum-operatonal-dialog-popup.component';

describe('BikesSumOperatonalDialogPopupComponent', () => {
  let component: BikesSumOperatonalDialogPopupComponent;
  let fixture: ComponentFixture<BikesSumOperatonalDialogPopupComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BikesSumOperatonalDialogPopupComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BikesSumOperatonalDialogPopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
