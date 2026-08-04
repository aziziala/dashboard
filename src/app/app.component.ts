import { Component } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { filter } from 'rxjs/operators';
import { UiService } from './services/ui.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'SMS-Taxi Dashboard';
  showLayout = true;

  // Mobile drawer state, mirrored for the layout's backdrop.
  mobileOpen = false;

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private ui: UiService
  ) {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        const currentRoute = this.getCurrentChild(this.activatedRoute);
        this.showLayout = !(currentRoute.snapshot.data['noLayout']);
      });

    this.ui.mobileMenu$.subscribe((open) => {
      this.mobileOpen = open;
    });
  }

  getCurrentChild(route: ActivatedRoute): ActivatedRoute {
    while (route.firstChild) {
      route = route.firstChild;
    }
    return route;
  }

  isSmsPage(): boolean {
    return this.router.url.includes('/sms');
  }

  closeMobileMenu(): void {
    this.ui.closeMobileMenu();
  }
}
