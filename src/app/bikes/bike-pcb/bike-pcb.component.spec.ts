import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BikePcbComponent } from './bike-pcb.component';

describe('BikePcbComponent', () => {
  let component: BikePcbComponent;
  let fixture: ComponentFixture<BikePcbComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BikePcbComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BikePcbComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
