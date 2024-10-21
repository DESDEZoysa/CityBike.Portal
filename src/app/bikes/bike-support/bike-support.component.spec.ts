import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BikeSupportComponent } from './bike-support.component';

describe('BikeSupportComponent', () => {
  let component: BikeSupportComponent;
  let fixture: ComponentFixture<BikeSupportComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BikeSupportComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BikeSupportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
