import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { OnTripsComponent } from './on-trips.component';

describe('OnTripsComponent', () => {
  let component: OnTripsComponent;
  let fixture: ComponentFixture<OnTripsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ OnTripsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OnTripsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
