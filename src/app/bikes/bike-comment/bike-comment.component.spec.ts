import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BikeCommentComponent } from './bike-comment.component';

describe('BikeCommentComponent', () => {
  let component: BikeCommentComponent;
  let fixture: ComponentFixture<BikeCommentComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BikeCommentComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BikeCommentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
