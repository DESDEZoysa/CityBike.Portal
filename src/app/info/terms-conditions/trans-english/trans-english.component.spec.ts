import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TransEnglishComponent } from './trans-english.component';

describe('TransEnglishComponent', () => {
  let component: TransEnglishComponent;
  let fixture: ComponentFixture<TransEnglishComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TransEnglishComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TransEnglishComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
