import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BikeMaintenanceComponent } from './bike-maintenance.component';

describe('BikeMaintenanceComponent', () => {
  let component: BikeMaintenanceComponent;
  let fixture: ComponentFixture<BikeMaintenanceComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BikeMaintenanceComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BikeMaintenanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
