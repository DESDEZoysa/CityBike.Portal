import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RideSessionComponent } from './ride-session.component';

describe('RideSessionComponent', () => {
  let component: RideSessionComponent;
  let fixture: ComponentFixture<RideSessionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RideSessionComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RideSessionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
