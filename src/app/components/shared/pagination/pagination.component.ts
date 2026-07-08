import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges
} from '@angular/core';

/**
 * Generic reusable pagination component.
 * Usage:
 *   <app-pagination
 *     [currentPage]="currentPage"
 *     [totalPages]="totalPages"
 *     (pageChange)="onPageChange($event)">
 *   </app-pagination>
 */
@Component({
  selector: 'app-pagination',
  template: `
    <nav aria-label="Page navigation" class="mt-3" *ngIf="totalPages > 1">
      <ul class="pagination justify-content-center">

        <!-- Previous -->
        <li class="page-item" [class.disabled]="currentPage === 1">
          <a class="page-link" (click)="go(currentPage - 1)" role="button">
            <i class="fas fa-chevron-left"></i>
          </a>
        </li>

        <!-- First page shortcut -->
        <li class="page-item" *ngIf="visiblePages[0] > 1">
          <a class="page-link" (click)="go(1)" role="button">1</a>
        </li>
        <li class="page-item disabled" *ngIf="visiblePages[0] > 2">
          <span class="page-link">…</span>
        </li>

        <!-- Visible window -->
        <li
          class="page-item"
          *ngFor="let p of visiblePages"
          [class.active]="currentPage === p">
          <a class="page-link" (click)="go(p)" role="button">{{ p }}</a>
        </li>

        <!-- Last page shortcut -->
        <li class="page-item disabled" *ngIf="visiblePages[visiblePages.length - 1] < totalPages - 1">
          <span class="page-link">…</span>
        </li>
        <li class="page-item" *ngIf="visiblePages[visiblePages.length - 1] < totalPages">
          <a class="page-link" (click)="go(totalPages)" role="button">{{ totalPages }}</a>
        </li>

        <!-- Next -->
        <li class="page-item" [class.disabled]="currentPage === totalPages">
          <a class="page-link" (click)="go(currentPage + 1)" role="button">
            <i class="fas fa-chevron-right"></i>
          </a>
        </li>

      </ul>

      <!-- Page info -->
      <p class="text-center text-muted small mt-1">
        Page {{ currentPage }} sur {{ totalPages }}
        <span *ngIf="totalElements"> · {{ totalElements }} résultat(s)</span>
      </p>
    </nav>
  `
})
export class PaginationComponent implements OnChanges {
  @Input() currentPage = 1;
  @Input() totalPages  = 1;
  @Input() totalElements?: number;
  @Input() windowSize  = 5;          // number of page buttons visible

  @Output() pageChange = new EventEmitter<number>();

  visiblePages: number[] = [];

  ngOnChanges(_: SimpleChanges): void {
    this.buildWindow();
  }

  go(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.currentPage) return;
    this.pageChange.emit(page);
  }

  private buildWindow(): void {
    const half  = Math.floor(this.windowSize / 2);
    let start   = Math.max(1, this.currentPage - half);
    let end     = start + this.windowSize - 1;

    if (end > this.totalPages) {
      end   = this.totalPages;
      start = Math.max(1, end - this.windowSize + 1);
    }

    this.visiblePages = Array.from(
      { length: end - start + 1 },
      (_, i) => start + i
    );
  }
}