import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DockingPointEditComponent } from './docking-point-edit.component';

describe('DockingPointEditComponent', () => {
  let component: DockingPointEditComponent;
  let fixture: ComponentFixture<DockingPointEditComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DockingPointEditComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DockingPointEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
