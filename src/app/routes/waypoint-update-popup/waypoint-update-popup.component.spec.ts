import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WaypointUpdatePopupComponent } from './waypoint-update-popup.component';

describe('WaypointUpdatePopupComponent', () => {
  let component: WaypointUpdatePopupComponent;
  let fixture: ComponentFixture<WaypointUpdatePopupComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WaypointUpdatePopupComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WaypointUpdatePopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
