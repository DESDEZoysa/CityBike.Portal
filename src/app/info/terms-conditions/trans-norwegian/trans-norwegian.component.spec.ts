import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TransNorwegianComponent } from './trans-norwegian.component';

describe('TransNorwegianComponent', () => {
  let component: TransNorwegianComponent;
  let fixture: ComponentFixture<TransNorwegianComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TransNorwegianComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TransNorwegianComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
