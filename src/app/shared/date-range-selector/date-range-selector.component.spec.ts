import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { DateRangeSelectorComponent } from './date-range-selector.component';

describe('DateRangeSelectorComponent', () => {
  let component: DateRangeSelectorComponent;
  let fixture: ComponentFixture<DateRangeSelectorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DateRangeSelectorComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DateRangeSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
