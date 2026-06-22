import { Component, OnInit } from '@angular/core';
import { DailyStatsDto, SessionStatsDto, SessionStatsServiceService, TaxiSessionDto } from '../../../services/session-stats-service.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-session-stats-dashboard',
  templateUrl: './session-stats-dashboard.component.html',
  styleUrl: './session-stats-dashboard.component.scss'
})
export class SessionStatsDashboardComponent implements OnInit {

  globalStats: SessionStatsDto | null = null;
  allSessions: TaxiSessionDto[] = [];
  dailyStats: DailyStatsDto[] = [];
  loading = true;

  filterStatus: 'all' | 'online' | 'offline' = 'all';
  searchPhone = '';

  currentPage = 1;
  itemsPerPage = 10;

  constructor(private sessionStatsService:SessionStatsServiceService,private router:Router){}

  ngOnInit(): void {
    this.loadAll();
  }
  loadAll(): void {
    this.loading=true;
    this.sessionStatsService.getGlobalStats().subscribe(data => {
      this.globalStats = data;
    });
    this.sessionStatsService.getAllTaxiSessions().subscribe(data => {
      this.allSessions = data;
      this.loading = false;
    });

    const today = new Date();
    const from = new Date(today.getFullYear(),today.getMonth(),1).toISOString().split('T')[0];
    const to = today.toISOString().split('T')[0];
    this.sessionStatsService.getDailyStats(from, to).subscribe(data => {
      this.dailyStats = data;
    });
  
  }
  
  get filteredSessions(): TaxiSessionDto[] {
    return this.allSessions.filter(s =>{
      const matchStatus = this.filterStatus =='all'
        || (this.filterStatus === 'online' && s.online)
        || (this.filterStatus === 'offline' && !s.online);

      const matchSearch = !this.searchPhone
        || s.phone.includes(this.searchPhone)
        || s.username.toLowerCase().includes(this.searchPhone.toLowerCase());

      return matchStatus && matchSearch;  
    });

  }
   viewDetail(phone: string): void {
    this.router.navigate(['/session-stats/detail', phone]);
  }

  get paginatedSessions() {
  const start = (this.currentPage - 1) * this.itemsPerPage;
  const end = start + this.itemsPerPage;

  return this.filteredSessions.slice(start, end);
}

get totalPages(): number {
  return Math.ceil(this.filteredSessions.length / this.itemsPerPage);
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

goToPage(page: number) {
  this.currentPage = page;
}

get pages(): number[] {
  return Array.from(
    { length: this.totalPages },
    (_, i) => i + 1
  );
}

}
