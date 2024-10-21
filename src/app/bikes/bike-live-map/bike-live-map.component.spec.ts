import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BikeLiveMapComponent } from './bike-live-map.component';

describe('BikeLiveMapComponent', () => {
  let component: BikeLiveMapComponent;
  let fixture: ComponentFixture<BikeLiveMapComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BikeLiveMapComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BikeLiveMapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
