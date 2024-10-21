import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DockingStationsComponent } from './docking-stations.component';

describe('BikesComponent', () => {
  let component: DockingStationsComponent;
  let fixture: ComponentFixture<DockingStationsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DockingStationsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DockingStationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
