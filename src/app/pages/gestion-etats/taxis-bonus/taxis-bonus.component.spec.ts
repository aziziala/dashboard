import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TaxisBonusComponent } from './taxis-bonus.component';

describe('TaxisBonusComponent', () => {
  let component: TaxisBonusComponent;
  let fixture: ComponentFixture<TaxisBonusComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaxisBonusComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TaxisBonusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
