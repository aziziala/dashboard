import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TaxisCoursesComponent } from './taxis-courses.component';

describe('TaxisCoursesComponent', () => {
  let component: TaxisCoursesComponent;
  let fixture: ComponentFixture<TaxisCoursesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaxisCoursesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TaxisCoursesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
