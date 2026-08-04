import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

/**
 * Screen-size categories that drive the responsive sidebar behaviour.
 *   mobile  → < 768px   → off-canvas drawer
 *   tablet  → 768–1199  → icon rail (can be expanded)
 *   desktop → ≥ 1200px  → expanded by default, collapse remembered
 */
export type ScreenSize = 'mobile' | 'tablet' | 'desktop';

const COLLAPSED_KEY = 'sms-sidebar-collapsed';
const MOBILE_MAX_WIDTH = 768;   // below this the sidebar is a drawer
const TABLET_MAX_WIDTH = 1200;  // below this we prefer the icon rail

/**
 * Central UI state store.
 *
 * Keeps screen detection + sidebar state in one place so the topbar,
 * the sidebar and the app shell stay in perfect sync. All resize work
 * is requestAnimationFrame-throttled to avoid change-detection churn.
 */
@Injectable({ providedIn: 'root' })
export class UiService {
  private screenSubject = new BehaviorSubject<ScreenSize>(this.detectScreen());
  screen$ = this.screenSubject.asObservable();

  private collapsedSubject = new BehaviorSubject<boolean>(this.readCollapsed());
  sidebarCollapsedChanges = this.collapsedSubject.asObservable();

  private mobileOpenSubject = new BehaviorSubject<boolean>(false);
  mobileMenu$ = this.mobileOpenSubject.asObservable();

  // Kept for backward compatibility with existing consumers.
  private sidebarOpenSubject = new BehaviorSubject<boolean>(true);
  sidebarOpen$ = this.sidebarOpenSubject.asObservable();

  private rightbarSubject = new BehaviorSubject<boolean>(false);
  rightbarOpenChanges = this.rightbarSubject.asObservable();

  private rafId = 0;

  constructor() {
    this.applyScreenPolicy(this.screenSubject.value);
    window.addEventListener('resize', () => this.onWindowResize(), { passive: true });
  }

  // ------------------------------------------------------------
  // Getters
  // ------------------------------------------------------------
  get screen(): ScreenSize {
    return this.screenSubject.value;
  }

  get isMobile(): boolean {
    return this.screenSubject.value === 'mobile';
  }

  get sidebarCollapsed(): boolean {
    return this.collapsedSubject.value;
  }

  get mobileOpen(): boolean {
    return this.mobileOpenSubject.value;
  }

  // ------------------------------------------------------------
  // Screen detection (rAF-throttled)
  // ------------------------------------------------------------
  private detectScreen(): ScreenSize {
    const w = window.innerWidth;
    if (w < MOBILE_MAX_WIDTH) return 'mobile';
    if (w < TABLET_MAX_WIDTH) return 'tablet';
    return 'desktop';
  }

  private onWindowResize(): void {
    cancelAnimationFrame(this.rafId);
    this.rafId = requestAnimationFrame(() => {
      const next = this.detectScreen();
      if (next !== this.screenSubject.value) {
        this.screenSubject.next(next);
        this.applyScreenPolicy(next);
      }
    });
  }

  /**
   * Cross-breakpoint defaults:
   *  · desktop → respect the user's saved preference
   *  · tablet  → start collapsed (icon rail)
   *  · mobile  → drawer closed, body scroll unlocked
   */
  private applyScreenPolicy(size: ScreenSize): void {
    if (size === 'mobile') {
      // The drawer is always full-width — never collapsed (and the
      // tablet/desktop preference must stay untouched).
      this.setCollapsed(false, false);
      this.closeMobileMenu();
    } else if (size === 'tablet') {
      // Temporary default (icon rail) — must NOT overwrite the
      // saved desktop preference, hence `persist: false`.
      this.setCollapsed(true, false);
    } else {
      this.setCollapsed(this.readCollapsed(), false);
    }
  }

  // ------------------------------------------------------------
  // Mobile drawer
  // ------------------------------------------------------------
  openMobileMenu(): void {
    this.mobileOpenSubject.next(true);
    document.body.classList.add('sidebar-mobile-open');
  }

  closeMobileMenu(): void {
    this.mobileOpenSubject.next(false);
    document.body.classList.remove('sidebar-mobile-open');
  }

  toggleMobileMenu(): void {
    if (this.mobileOpenSubject.value) {
      this.closeMobileMenu();
    } else {
      this.openMobileMenu();
    }
  }

  // ------------------------------------------------------------
  // Collapsed rail (tablet + desktop) with localStorage persistence
  // ------------------------------------------------------------
  private setCollapsed(value: boolean, persist = true): void {
    if (this.collapsedSubject.value === value) return;
    this.collapsedSubject.next(value);
    if (persist && this.screenSubject.value !== 'mobile') {
      try {
        localStorage.setItem(COLLAPSED_KEY, value ? 'collapsed' : 'expanded');
      } catch {
        /* storage unavailable — state still works for this session */
      }
    }
  }

  toggleSidebarCollapsed(): void {
    this.setCollapsed(!this.collapsedSubject.value);
  }

  /**
   * Master sidebar toggle used by the topbar hamburger:
   * opens the drawer on mobile, toggles the rail elsewhere.
   */
  toggleSidebar(): void {
    if (this.isMobile) {
      this.toggleMobileMenu();
    } else {
      this.toggleSidebarCollapsed();
    }
  }

  // ------------------------------------------------------------
  // Legacy / compatibility
  // ------------------------------------------------------------
  toggleSidebarOpen(): void {
    this.sidebarOpenSubject.next(!this.sidebarOpenSubject.value);
  }

  toggleRightbar(): void {
    const next = !this.rightbarSubject.value;
    this.rightbarSubject.next(next);
    document.documentElement.classList.toggle('rightbar-open', next);
  }

  // ------------------------------------------------------------
  // Persistence helpers
  // ------------------------------------------------------------
  private readCollapsed(): boolean {
    try {
      return localStorage.getItem(COLLAPSED_KEY) === 'collapsed';
    } catch {
      return false;
    }
  }
}
