import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TrackMapComponent } from './track-map.component';

describe('TrackMapComponent', () => {
  let component: TrackMapComponent;
  let fixture: ComponentFixture<TrackMapComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TrackMapComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TrackMapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
