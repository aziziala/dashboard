import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TaxisActifsComponent } from './taxis-actifs.component';

describe('TaxisActifsComponent', () => {
  let component: TaxisActifsComponent;
  let fixture: ComponentFixture<TaxisActifsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaxisActifsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TaxisActifsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
