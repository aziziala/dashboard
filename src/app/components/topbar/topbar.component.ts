import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { UiService } from '../../services/ui.service';
import { TranslateService } from '@ngx-translate/core';
import { TaxiService } from '../../services/taxi.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-topbar',
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.scss'],
})
export class TopbarComponent implements OnInit, OnDestroy {
  currentApp: 'SMSTaxi' | 'TaxiSelect' = 'SMSTaxi';
  currentLang = 'fr';

  private sub = new Subscription();

  constructor(
    private ui: UiService,
    private translate: TranslateService,
    private taxiService: TaxiService
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
        ? 'http://192.168.100.12:8777/taxi-client/api'
        : '/taxi-client/api';

    this.taxiService.setBaseUrl(url);
  }

  // ================= UI =================

  toggleMobileMenu(event: Event): void {
    event.preventDefault();
    this.ui.toggleMobileMenu();
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

  toggleSidebar(): void {
    this.ui.toggleSidebar();
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
}