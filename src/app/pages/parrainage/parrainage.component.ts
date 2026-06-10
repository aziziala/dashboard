import { Component, OnInit } from '@angular/core';
import { ParrainageService } from '../../services/parrainage.service';

@Component({
  selector: 'app-parrainage',
  templateUrl: './parrainage.component.html',
  styleUrls: ['./parrainage.component.scss']
})
export class ParrainageComponent implements OnInit {

  // ─── Tabs ───
  activeTab: 'liste' | 'encours' = 'liste';

  // ─── Filters ───
  searchTerm = '';
  statusFilter = '';

  // ─── Stats ───
  config: any = {};
  totalParrainages = 0;
  taxisParticipants = 0;
  aPayer = 0;
  montantEncaisse = 0;

  // ─── Table Data ───
  taxis: any[] = [
    { id: 211913, initials: 'AW', name: 'Chedi Awenli',     phone: '93843131', parrainages: 45, montant: 225, statut: 'Encaissé' },
    { id: 211915, initials: 'AB', name: 'Abd Itif Wesleti', phone: '96216041', parrainages: 8,  montant: 40,  statut: 'Non Encaissé' },
    { id: 211916, initials: 'AR', name: 'Arbi Zaabez',      phone: '99324434', parrainages: 2,  montant: 10,  statut: 'Encaissé' },
    { id: 211921, initials: 'RI', name: 'Ridha Maamouri',   phone: '98895719', parrainages: 5,  montant: 25,  statut: 'Encaissé' },
  ];

  // ─── Filtered Taxis ───
  get filteredTaxis() {
    return this.taxis.filter(taxi => {
      const matchSearch =
        taxi.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        taxi.phone.includes(this.searchTerm);

      const matchStatus =
        this.statusFilter === '' ||
        (this.statusFilter === 'encaisse'     && taxi.statut === 'Encaissé') ||
        (this.statusFilter === 'non-encaisse' && taxi.statut === 'Non Encaissé');
      return matchSearch && matchStatus;
    });
  }

  // ─── Live Scans (Tab 2) ───
  liveScans = [
    {
      clientName: 'Ali Trabelsi',
      time: 'À l\'instant',
      taxiName: 'Nahdi Hamza',
      choice: 'Pour la prochaine course',
      choiceIcon: 'fas fa-calendar',
      amount: 5
    },
    {
      clientName: 'Fatma Ben Ali',
      time: 'Il y a 2 min',
      taxiName: 'Ridha Maamouri',
      choice: 'Une prochaine fois',
      choiceIcon: 'fas fa-clock',
      amount: 5
    },
    {
      clientName: 'Youssef Gharbi',
      time: 'Il y a 5 min',
      taxiName: 'Chedi Awenli',
      choice: 'Sur cette course',
      choiceIcon: 'fas fa-car',
      amount: 5
    },
  ];

  // ─── Modal ───
  showModal    = false;
  selectedTaxi: any = null;

  modalScans = [
    { client: 'Client Anonyme #4654', date: '17/05/2026 09:49', choice: 'Pour la prochaine course', choiceIcon: 'fas fa-calendar', choiceClass: 'choice-purple' },
    { client: 'Client Anonyme #4830', date: '17/05/2026 03:12', choice: 'Une prochaine fois',       choiceIcon: 'fas fa-clock',    choiceClass: 'choice-gray'   },
    { client: 'Client Anonyme #4108', date: '15/05/2026 01:07', choice: 'Sur cette course',         choiceIcon: 'fas fa-car',      choiceClass: 'choice-blue'   },
    { client: 'Client Anonyme #5356', date: '12/05/2026 22:40', choice: 'Une prochaine fois',       choiceIcon: 'fas fa-clock',    choiceClass: 'choice-gray'   },
    { client: 'Client Anonyme #2151', date: '12/05/2026 12:48', choice: 'Pour la prochaine course', choiceIcon: 'fas fa-calendar', choiceClass: 'choice-purple' },
    { client: 'Client Anonyme #5882', date: '05/05/2026 11:08', choice: 'Une prochaine fois',       choiceIcon: 'fas fa-clock',    choiceClass: 'choice-gray'   },
    { client: 'Client Anonyme #1942', date: '04/05/2026 03:43', choice: 'Sur cette course',         choiceIcon: 'fas fa-car',      choiceClass: 'choice-blue'   },
  ];

  openModal(taxi: any): void {
    this.selectedTaxi = taxi;
    this.showModal    = true;
  }
  closeModal(): void {
    this.showModal    = false;
    this.selectedTaxi = null;
  }

  // Called from modal footer button
  marquerPaye(): void {
    if (this.selectedTaxi) {
      this.selectedTaxi.statut = 'Encaissé';
    }
    this.closeModal();
  }

  // Called from table check button directly
  marquerPayeDirect(taxi: any): void {
    taxi.statut = 'Encaissé';
  }

    // ─── Tab Switch ───
  setTab(tab: 'liste' | 'encours'): void {
    this.activeTab = tab;
  }

  ngOnInit(): void {}
}
