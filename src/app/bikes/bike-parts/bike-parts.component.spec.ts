import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BikePartsComponent } from './bike-parts.component';

describe('BikePartsComponent', () => {
  let component: BikePartsComponent;
  let fixture: ComponentFixture<BikePartsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BikePartsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BikePartsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
