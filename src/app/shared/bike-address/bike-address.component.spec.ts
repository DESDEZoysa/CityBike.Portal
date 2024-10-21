import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BikeAddressComponent } from './bike-address.component';

describe('BikeAddressComponent', () => {
  let component: BikeAddressComponent;
  let fixture: ComponentFixture<BikeAddressComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BikeAddressComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BikeAddressComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
