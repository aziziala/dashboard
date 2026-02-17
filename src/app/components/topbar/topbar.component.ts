import { Component } from '@angular/core';
import { UiService } from '../../services/ui.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-topbar',
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.scss']
})
export class TopbarComponent {
  constructor(private ui: UiService,
    private translate: TranslateService) {
        this.translate.use(this.currentLang);
    }

  toggleMobileMenu(event: Event): void {
    event.preventDefault();
    this.ui.toggleMobileMenu();
  }

  fullscreen(): void {
    const doc: any = document;
    if (!doc.fullscreenElement && !doc.mozFullScreenElement && !doc.webkitFullscreenElement) {
      (doc.documentElement.requestFullscreen || doc.documentElement.mozRequestFullScreen || doc.documentElement.webkitRequestFullscreen).call(doc.documentElement);
    } else {
      (doc.exitFullscreen || doc.mozCancelFullScreen || doc.webkitExitFullscreen).call(doc);
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

  currentLang = 'fr';

  switchLanguage(lang: string) {
    this.currentLang = lang;
    this.translate.use(lang);

    // RTL support for Arabic
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

