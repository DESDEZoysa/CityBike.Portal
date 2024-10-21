import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SessionTerminateDialogComponent } from './session-terminate-dialog.component';

describe('SessionTerminateDialogComponent', () => {
  let component: SessionTerminateDialogComponent;
  let fixture: ComponentFixture<SessionTerminateDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SessionTerminateDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SessionTerminateDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
