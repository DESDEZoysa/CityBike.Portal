import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BikeMapTrackComponent } from './bike-map-track.component';

describe('BikeMapTrackComponent', () => {
  let component: BikeMapTrackComponent;
  let fixture: ComponentFixture<BikeMapTrackComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BikeMapTrackComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BikeMapTrackComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
