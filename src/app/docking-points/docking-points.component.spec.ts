import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DockingPointsComponent } from './docking-points.component';

describe('BikesComponent', () => {
  let component: DockingPointsComponent;
  let fixture: ComponentFixture<DockingPointsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DockingPointsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DockingPointsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
