import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DisableStationConfirmationPopupComponent } from './disable-station-confirmation-popup.component';

describe('DisableDockingStationConfirmationPopupComponent', () => {
  let component: DisableStationConfirmationPopupComponent;
  let fixture: ComponentFixture<DisableStationConfirmationPopupComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DisableStationConfirmationPopupComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DisableStationConfirmationPopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
