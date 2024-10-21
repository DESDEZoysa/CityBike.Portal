import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AllStationsMapComponent } from './all-stations-map.component';

describe('AllStationsMapComponent', () => {
  let component: AllStationsMapComponent;
  let fixture: ComponentFixture<AllStationsMapComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AllStationsMapComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AllStationsMapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
