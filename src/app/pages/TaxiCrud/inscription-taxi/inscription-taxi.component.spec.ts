import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InscriptionTaxiComponent } from './inscription-taxi.component';

describe('InscriptionTaxiComponent', () => {
  let component: InscriptionTaxiComponent;
  let fixture: ComponentFixture<InscriptionTaxiComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InscriptionTaxiComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(InscriptionTaxiComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
