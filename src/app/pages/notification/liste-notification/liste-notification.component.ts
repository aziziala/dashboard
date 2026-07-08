import { Component, OnInit, OnDestroy } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import {
  finalize,
  Subject,
  debounceTime,
  distinctUntilChanged,
  takeUntil
} from 'rxjs';

import { Notificationv2Service } from '../../../services/notificationv2.service';
import { NotificationDto } from '../../../models/notification/NotificationDto.model';

@Component({
  selector: 'app-notification-list',
  templateUrl: './liste-notification.component.html',
  styleUrls: ['./liste-notification.component.scss']
})
export class ListeNotificationComponent implements OnInit, OnDestroy {

  // ── DATA ─────────────────────────────────────────────
  notifications: NotificationDto[] = [];

  // ── SEARCH (TITLE ONLY) ─────────────────────────────
  titleSearchTerm = '';
  private titleSearch$ = new Subject<string>();

  // ── PAGINATION ───────────────────────────────────────
  currentPage = 1;
  totalPages = 0;
  totalElements = 0;
  itemsPerPage = 10;
  pageSizeOptions = [10, 25, 50, 100];

  // ── LOADING ──────────────────────────────────────────
  isLoading = false;

  private destroy$ = new Subject<void>();

  constructor(
    private notifService: Notificationv2Service,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {

    // debounce SEARCH TITLE
    this.titleSearch$
      .pipe(
        debounceTime(350),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.currentPage = 1;
        this.load();
      });

    // initial load
    this.load();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── LOAD DATA ────────────────────────────────────────
  load(): void {
    if (this.isLoading) return;
    this.isLoading = true;

    this.notifService
      .getAllWithFilter(
        this.currentPage - 1,
        this.itemsPerPage,
        this.titleSearchTerm || undefined,
        undefined
      )
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: res => {
          this.notifications = res.content;
          this.totalElements = res.totalElements;
          this.totalPages = res.totalPages;
        },
        error: () =>
          this.toastr.error('Impossible de charger les notifications', 'Erreur')
      });
  }

  // ── SEARCH EVENT ─────────────────────────────────────
  onTitleSearchChange(): void {
    this.titleSearch$.next(this.titleSearchTerm);
  }

  // ── PAGINATION ───────────────────────────────────────
  onPageChange(page: number): void {
    this.currentPage = page;
    this.load();
  }

  onPageSizeChange(size: number): void {
    this.itemsPerPage = size;
    this.currentPage = 1;
    this.load();
  }

  // ── HELPERS ──────────────────────────────────────────

  getTypeBadgeClass(type: string): string {
    switch (type) {
      case 'INFO': return 'badge-type info';
      case 'WARNING': return 'badge-type warning';
      case 'ERROR': return 'badge-type error';
      default: return 'badge-type info';
    }
  }

  getTypeIcon(type: string): string {
    switch (type) {
      case 'INFO': return 'fas fa-info-circle';
      case 'WARNING': return 'fas fa-exclamation-triangle';
      case 'ERROR': return 'fas fa-times-circle';
      default: return 'fas fa-bell';
    }
  }

  getChannelIcon(ch: string): string {
    switch (ch) {
      case 'PUSH': return 'fas fa-bell';
      case 'SMS': return 'fas fa-sms';
      case 'EMAIL': return 'fas fa-envelope';
      case 'WHATSAPP': return 'fab fa-whatsapp';
      default: return 'fas fa-paper-plane';
    }
  }

  getTargetBadgeClass(target: string): string {
    switch (target) {
      case 'TAXI': return 'bg-primary';
      case 'CLIENT': return 'bg-success';
      case 'ADMIN': return 'bg-dark';
      default: return 'bg-secondary';
    }
  }

  formatTargetIds(raw: string): string {
    if (!raw) return '—';

    try {
      const parsed = JSON.parse(raw);

      if (Array.isArray(parsed)) {
        if (parsed.includes('ALL')) return 'Tous';

        return parsed.length > 3
          ? `${parsed.slice(0, 3).join(', ')} +${parsed.length - 3}`
          : parsed.join(', ');
      }
    } catch {}

    return raw === 'ALL' ? 'Tous' : raw;
  }

  min(a: number, b: number): number {
    return Math.min(a, b);
  }
}