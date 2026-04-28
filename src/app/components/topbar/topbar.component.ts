import { Component, OnInit } from '@angular/core';
import { UiService } from '../../services/ui.service';
import { TranslateService } from '@ngx-translate/core';
import { TaxiService } from '../../services/taxi.service';

@Component({
  selector: 'app-topbar',
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.scss']
})
export class TopbarComponent implements OnInit {

  currentApp: 'SMSTaxi' | 'TaxiSelect' = 'SMSTaxi';
  currentLang = 'fr';

  constructor(
    private ui: UiService,
    private translate: TranslateService,
    private taxiService: TaxiService
  ) {
    this.translate.use(this.currentLang);
  }

  ngOnInit(): void {
    const savedApp = localStorage.getItem('currentApp') as 'TaxiSelect' | 'SMSTaxi';

    if (savedApp) {
      this.currentApp = savedApp;
      this.applyAppConfig();
    }
  }

  // ✅ SWITCH APP
  toggleApp(event: any) {
    const isSelect = event.target.checked;

    this.currentApp = isSelect ? 'TaxiSelect' : 'SMSTaxi';

    localStorage.setItem('currentApp', this.currentApp);

    this.applyAppConfig();

    // ✅ Notify all components
   this.taxiService.notifyAppChanged(this.currentApp);
  }

  // ✅ CENTRALIZED CONFIG
  private applyAppConfig() {
    const url = this.currentApp === 'SMSTaxi'
      ? 'http://41.225.11.231:8777/taxi-client/api'
      : 'http://41.225.11.231:8444/taxi-client/api';

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
    window.open('https://webmail.smstaxi.tn', '_blank');
  }

  // ================= LANG =================

  switchLanguage(lang: string) {
    this.currentLang = lang;
    this.translate.use(lang);
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }

  get currentLangFlag(): string {
    switch (this.currentLang) {
      case 'ar': return 'assets/flags/ar.png';
      case 'en': return 'assets/flags/eng.png';
      default: return 'assets/flags/fr.png';
    }
  }
}