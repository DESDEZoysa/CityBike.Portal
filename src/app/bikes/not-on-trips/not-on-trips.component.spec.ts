import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NotOnTripsComponent } from './not-on-trips.component';

describe('NotOnTripsComponent', () => {
  let component: NotOnTripsComponent;
  let fixture: ComponentFixture<NotOnTripsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NotOnTripsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NotOnTripsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
