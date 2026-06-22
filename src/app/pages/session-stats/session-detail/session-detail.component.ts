import { Component, OnInit } from '@angular/core';
import { SessionStatsServiceService, TaxiSessionDto } from '../../../services/session-stats-service.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-session-detail',
  templateUrl: './session-detail.component.html',
  styleUrl: './session-detail.component.scss'
})
export class SessionDetailComponent implements OnInit {
  phone = '';
  session: TaxiSessionDto | null = null;
  loading = true;

  filterType: 'all' | 'month' | 'day' = 'all';
  selectedYear = new Date().getFullYear();
  selectedMonth = new Date().getMonth() + 1;
  selectedDay = new Date().toISOString().split('T')[0];

  months = [
    { value: 1, label: 'Janvier' }, { value: 2, label: 'Février' },
    { value: 3, label: 'Mars' }, { value: 4, label: 'Avril' },
    { value: 5, label: 'Mai' }, { value: 6, label: 'Juin' },
    { value: 7, label: 'Juillet' }, { value: 8, label: 'Août' },
    { value: 9, label: 'Septembre' }, { value: 10, label: 'Octobre' },
    { value: 11, label: 'Novembre' }, { value: 12, label: 'Décembre' }
  ];
  currentPage = 1;
  itemsPerPage = 10;
  constructor(
    private route: ActivatedRoute,
    private sessionStatsService: SessionStatsServiceService
  ) {}

  ngOnInit(): void {
    this.phone = this.route.snapshot.paramMap.get('phone') || '';
    this.loadSession();
  }

  loadSession(): void {
    this.loading = true;

    if (this.filterType === 'month') {
      this.sessionStatsService.getByMonth(this.phone, this.selectedYear, this.selectedMonth)
        .subscribe(data => { this.session = data;  this.currentPage = 1;this.loading = false; });
    } else if (this.filterType === 'day') {
      this.sessionStatsService.getByDay(this.phone, this.selectedDay)
        .subscribe(data => { this.session = data; this.currentPage = 1; this.loading = false; });
    } else {
      this.sessionStatsService.getTaxiSessionByPhone(this.phone)
        .subscribe(data => { this.session = data;  this.currentPage = 1;this.loading = false; });
    }
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.loadSession();
  }

  goBack(): void {
    window.history.back();
  }
  get paginatedHistory() {

  if (!this.session?.history) {
    return [];
  }

  const start = (this.currentPage - 1) * this.itemsPerPage;
  const end = start + this.itemsPerPage;

  return this.session.history.slice(start, end);
}

get totalPages(): number {
  return Math.ceil(
    (this.session?.history?.length || 0)
    / this.itemsPerPage
  );
}

get pages(): number[] {
  return Array.from(
    { length: this.totalPages },
    (_, i) => i + 1
  );
}

goToPage(page: number) {
  this.currentPage = page;
}

nextPage() {
  if (this.currentPage < this.totalPages) {
    this.currentPage++;
  }
}

prevPage() {
  if (this.currentPage > 1) {
    this.currentPage--;
  }
}

}
