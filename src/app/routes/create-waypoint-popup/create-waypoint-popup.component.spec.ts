import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateWaypointPopupComponent } from './create-waypoint-popup.component';

describe('CreateWaypointPopupComponent', () => {
  let component: CreateWaypointPopupComponent;
  let fixture: ComponentFixture<CreateWaypointPopupComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CreateWaypointPopupComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateWaypointPopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
