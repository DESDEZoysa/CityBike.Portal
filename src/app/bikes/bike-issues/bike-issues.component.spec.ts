import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { BikeIssuesComponent } from './bike-issues.component';

describe('BikeIssuesComponent', () => {
  let component: BikeIssuesComponent;
  let fixture: ComponentFixture<BikeIssuesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BikeIssuesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BikeIssuesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
