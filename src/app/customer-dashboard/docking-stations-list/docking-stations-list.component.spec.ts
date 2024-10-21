import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DockingStationsListComponent } from './docking-stations-list.component';

describe('DockingStationsListComponent', () => {
  let component: DockingStationsListComponent;
  let fixture: ComponentFixture<DockingStationsListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DockingStationsListComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DockingStationsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
