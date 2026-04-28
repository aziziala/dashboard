import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { UiService } from '../../services/ui.service';
import { filter, Subscription } from 'rxjs';
import { TaxiService } from '../../services/taxi.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit, OnDestroy {
  activeUrl = '';
  isOpen = false;
  isCollapsed = false;
  currentApp: 'SMSTaxi' | 'TaxiSelect' = 'SMSTaxi';
  private sub = new Subscription(); // manage all subscriptions here

  constructor(
  private router: Router,
  private ui: UiService,
  private taxiService: TaxiService   ) {  this.activeUrl = this.router.url;
    this.router.events.pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e: any) => {
        this.activeUrl = e.urlAfterRedirects;
      });
  }

  ngOnInit() {
    // Prevent initial animation

    // ✅ Load saved app (refresh case)
const savedApp = localStorage.getItem('currentApp') as 'SMSTaxi' | 'TaxiSelect';
if (savedApp) {
  this.currentApp = savedApp;
}

// ✅ Listen to live switch changes
this.sub.add(
  this.taxiService.appChanged$.subscribe(app => {
    this.currentApp = app;
  })
);

    const menu = document.querySelector('.vertical-menu');
    menu?.classList.add('no-transition');

    // Desktop: open by default
    if (window.innerWidth >= 992) {
      this.isOpen = true;
      this.isCollapsed = false;
    } else {
      this.isOpen = false;
    }

    // Allow animation after a moment
    setTimeout(() => {
      menu?.classList.remove('no-transition');
    }, 50);

    // MOBILE toggle subscription
    this.sub.add(
      this.ui.mobileMenu$.subscribe(open => {
        if (window.innerWidth < 992) {
          this.isOpen = open;
        }
      })
    );

    // DESKTOP toggle subscription
    this.sub.add(
      this.ui.sidebarOpen$.subscribe(open => {
        if (window.innerWidth >= 992) {
          this.isOpen = open; // desktop sliding works
        }
      })
    );

    // Collapsed subscription
    this.sub.add(
      this.ui.sidebarCollapsedChanges.subscribe(c => {
        this.isCollapsed = c;
      })
    );
  }

  ngOnDestroy() {
    this.sub.unsubscribe(); // unsubscribes from ALL
  }
    toggleMobileMenu(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.isOpen = !this.isOpen;
  }

  toggleCollapse(): void {
    this.isCollapsed = !this.isCollapsed;
  }
}
