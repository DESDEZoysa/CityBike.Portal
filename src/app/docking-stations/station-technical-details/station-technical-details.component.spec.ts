import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { StationTechnicalDetailsComponent } from './station-technical-details.component';

describe('StationTechnicalDetailsComponent', () => {
  let component: StationTechnicalDetailsComponent;
  let fixture: ComponentFixture<StationTechnicalDetailsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ StationTechnicalDetailsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StationTechnicalDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
