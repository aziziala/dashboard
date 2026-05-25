import { Component, OnInit } from '@angular/core';
import { PromoCode } from '../../models/promo-code.model';
import { PromoCodeService } from '../../services/promo-code.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-promo-management',
  templateUrl: './promo-management.component.html',
  styleUrl: './promo-management.component.scss'
})
export class PromoManagementComponent implements OnInit {
  promos:PromoCode[]=[];
  filteredPromos:PromoCode[]=[];
  selectedPromoId!: number;
  searchTerm:string = '';
  newPromo: PromoCode = {
    code: '',
    discountPercentage: 0,
    active: true,
    expirationDate: new Date(),
    description: ''
  };
 constructor(private promoService: PromoCodeService ,
  private modalService: NgbModal) {}

  ngOnInit(): void {
    this.loadPromos();
  }
  loadPromos() {
    this.promoService.getAllPromos().subscribe({
      next: (data) => {
        this.promos = data;
        this.filteredPromos = data;
      },
      error: (err) => {
        console.log(err);
      }
    });
  }
  openPromoModal(content: any) {
  this.modalService.open(content, { centered: true });
}
 /* searchPromo() {
    this.filteredPromos = this.promos.filter(p =>p.code.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }*/

  createPromo() {
    this.promoService.createPromo(this.newPromo).subscribe({
      next: () => {
        this.loadPromos();

        this.newPromo = {
          code: '',
          discountPercentage: 0,
          active: true,
          expirationDate: new Date(),
          description: ''
        };
      },
      error: (err) => {
        console.log(err);
      }
    });
  }
  openDeactivateModal(content: any, promoId: number) {

  this.selectedPromoId = promoId;

  this.modalService.open(content, {
    centered: true
  });

}
  deactivatePromo(modal: any) {

  this.promoService.deactivatePromo(this.selectedPromoId).subscribe({

    next: () => {

       this.promos = this.promos.map(promo => {

    if (promo.id === this.selectedPromoId) {

      return {
        ...promo,
        active: false
      };

    }

    return promo;

  });

  this.filteredPromos = [...this.promos];

  modal.close();

    },

    error: (err) => {

      console.log(err);

    }

  });

}
}
