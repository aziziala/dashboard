import { Component } from '@angular/core';
import { UiService } from '../../services/ui.service';

@Component({
  selector: 'app-topbar',
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.scss']
})
export class TopbarComponent {
  constructor(private ui: UiService) {}

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
}


