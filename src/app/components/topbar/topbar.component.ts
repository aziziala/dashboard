import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { UiService } from '../../services/ui.service';
import { TranslateService } from '@ngx-translate/core';
import { TaxiService } from '../../services/taxi.service';
import { Subscription } from 'rxjs';
import { Notificationv2Service } from '../../services/notificationv2.service';

@Component({
  selector: 'app-topbar',
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.scss'],
})
export class TopbarComponent implements OnInit, OnDestroy {
  currentApp: 'SMSTaxi' | 'TaxiSelect' = 'SMSTaxi';
  currentLang = 'fr';

  notifications: any[] = [];
  notificationCount = 0;

  // Mirror of the UiService state so the template always re-renders
  // when the sidebar/menu state changes (drawer open, rail collapsed).
  isMobile = false;
  mobileOpen = false;
  sidebarCollapsed = false;

  private sub = new Subscription();

  constructor(
    private ui: UiService,
    private translate: TranslateService,
    private taxiService: TaxiService,
    private notifService: Notificationv2Service
  ) {
    this.translate.use(this.currentLang);
  }

  // ✅ Keyboard shortcut: F11 for fullscreen
  @HostListener('document:keydown.f11', ['$event'])
  onF11(event: KeyboardEvent) {
    event.preventDefault();
    this.fullscreen();
  }

  ngOnInit(): void {
    const savedApp = localStorage.getItem('currentApp') as 'TaxiSelect' | 'SMSTaxi';
    const savedLang = localStorage.getItem('currentLang') || 'fr';

    this.loadNotifications();


    if (savedApp) {
      this.currentApp = savedApp;
      this.applyAppConfig();
    }

    // ✅ Restore saved language
    if (savedLang) {
      this.currentLang = savedLang;
      this.translate.use(savedLang);
      document.documentElement.dir = savedLang === 'ar' ? 'rtl' : 'ltr';
    }

    // ✅ Keep the sidebar/menu state in sync (toggle button icon/ARIA)
    this.sub.add(
      this.ui.screen$.subscribe(() => {
        this.isMobile = this.ui.isMobile;
      })
    );
    this.sub.add(
      this.ui.mobileMenu$.subscribe((open) => {
        this.mobileOpen = open;
      })
    );
    this.sub.add(
      this.ui.sidebarCollapsedChanges.subscribe((collapsed) => {
        this.sidebarCollapsed = collapsed;
      })
    );

    // ✅ Listen to app changes from other components (optional)
    this.sub.add(
      this.taxiService.appChanged$.subscribe((app) => {
        if (app !== this.currentApp) {
          this.currentApp = app;
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  // ✅ SWITCH APP
  toggleApp(event: any) {
    const isSelect = event.target.checked;
    this.currentApp = isSelect ? 'TaxiSelect' : 'SMSTaxi';

    localStorage.setItem('currentApp', this.currentApp);
    this.applyAppConfig();

    // Notify all components
    this.taxiService.notifyAppChanged(this.currentApp);
  }

  // ✅ CENTRALIZED CONFIG
  private applyAppConfig() {
    const url =
      this.currentApp === 'SMSTaxi'
        ? 'http://41.225.11.231:8777/taxi-client/api'
        : '/taxi-client/api';

    this.taxiService.setBaseUrl(url);
  }

  // ================= UI =================

  /**
   * Master sidebar toggle:
   *  · mobile  → opens/closes the off-canvas drawer
   *  · desktop → toggles the collapsed icon rail
   */
  toggleSidebar(event: Event): void {
    event.preventDefault();
    this.ui.toggleSidebar();
  }

  /** Icon shown in the toggle button depending on the current state. */
  toggleIconClass(): string {
    if (this.isMobile) return this.mobileOpen ? 'bx-x' : 'bx-menu';
    return this.sidebarCollapsed ? 'bx-menu' : 'bx-chevrons-left';
  }

  fullscreen(): void {
    const doc: any = document;
    if (!doc.fullscreenElement) {
      doc.documentElement.requestFullscreen();
    } else {
      doc.exitFullscreen();
    }
  }

  toggleRightbar(): void {
    this.ui.toggleRightbar();
  }

  openInbox(): void {
    window.open('https://webmail.smstaxi.tn', '_blank', 'noopener,noreferrer');
  }

  // ================= LANG =================

  switchLanguage(lang: string) {
    this.currentLang = lang;
    this.translate.use(lang);
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';

    // ✅ Save language preference
    localStorage.setItem('currentLang', lang);
  }

  get currentLangFlag(): string {
    switch (this.currentLang) {
      case 'ar':
        return 'assets/flags/ar.png';
      case 'en':
        return 'assets/flags/eng.png';
      default:
        return 'assets/flags/fr.png';
    }
  }


  loadNotifications(): void {

    this.notifService.getLatestByTarget('ADMIN', 0, 5)
      .subscribe(res => {

        this.notifications = res.content;   // Page content
        this.notificationCount = res.totalElements;

      });

  }

  getTypeIcon(type: string): string {
    switch (type) {
      case 'INFO': return 'fa-info-circle';
      case 'WARNING': return 'fa-exclamation-triangle';
      case 'ERROR': return 'fa-times-circle';
      default: return 'fa-bell';
    }
  }

  getTypeClass(type: string): string {
    switch (type) {
      case 'INFO': return 'bg-primary';
      case 'WARNING': return 'bg-warning';
      case 'ERROR': return 'bg-danger';
      default: return 'bg-secondary';
    }
  }
}