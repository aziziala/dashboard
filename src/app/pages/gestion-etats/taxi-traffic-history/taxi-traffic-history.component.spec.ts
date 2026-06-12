import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TaxiTrafficHistoryComponent } from './taxi-traffic-history.component';

describe('TaxiTrafficHistoryComponent', () => {
  let component: TaxiTrafficHistoryComponent;
  let fixture: ComponentFixture<TaxiTrafficHistoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaxiTrafficHistoryComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TaxiTrafficHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
