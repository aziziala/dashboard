import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class UiService {
  private rightbarOpen$ = new BehaviorSubject<boolean>(false);
  private mobileMenuOpen$ = new BehaviorSubject<boolean>(false);
  private sidebarCollapsed$ = new BehaviorSubject<boolean>(false);

  rightbarOpenChanges = this.rightbarOpen$.asObservable();
  mobileMenuOpenChanges = this.mobileMenuOpen$.asObservable();
  sidebarCollapsedChanges = this.sidebarCollapsed$.asObservable();

  toggleRightbar(): void {
    const next = !this.rightbarOpen$.value;
    this.rightbarOpen$.next(next);
    document.documentElement.classList.toggle('rightbar-open', next);
  }

  toggleMobileMenu(): void {
    const next = !this.mobileMenuOpen$.value;
    this.mobileMenuOpen$.next(next);
    document.documentElement.classList.toggle('vertical-menu-open', next);
  }

  toggleSidebarCollapsed(): void {
    const next = !this.sidebarCollapsed$.value;
    this.sidebarCollapsed$.next(next);
    document.documentElement.classList.toggle('sidebar-collapsed', next);
  }
}


