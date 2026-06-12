import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TaxisInactifsComponent } from './taxis-inactifs.component';

describe('TaxisInactifsComponent', () => {
  let component: TaxisInactifsComponent;
  let fixture: ComponentFixture<TaxisInactifsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaxisInactifsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TaxisInactifsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
