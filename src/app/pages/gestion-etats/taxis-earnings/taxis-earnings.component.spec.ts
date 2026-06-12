import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TaxisEarningsComponent } from './taxis-earnings.component';

describe('TaxisEarningsComponent', () => {
  let component: TaxisEarningsComponent;
  let fixture: ComponentFixture<TaxisEarningsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaxisEarningsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TaxisEarningsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
