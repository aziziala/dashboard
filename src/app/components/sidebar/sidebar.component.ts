import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { UiService } from '../../services/ui.service';
import { filter, Subscription } from 'rxjs';
import { TaxiService } from '../../services/taxi.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent implements OnInit, OnDestroy {
  activeUrl = '';
  isOpen = false;
  isCollapsed = false;
  currentApp: 'SMSTaxi' | 'TaxiSelect' = 'SMSTaxi';

  // ✅ New property used in template instead of `window.innerWidth`
  isMobile: boolean = window.innerWidth < 992;

  private sub = new Subscription();

  constructor(
    private router: Router,
    private ui: UiService,
    private taxiService: TaxiService
  ) {}

  // ✅ Update isMobile on window resize
  @HostListener('window:resize', ['$event'])
  onResize() {
    this.isMobile = window.innerWidth < 992;
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscapePressed(event: KeyboardEvent) {
    if (this.isOpen && this.isMobile) {
      this.ui.closeMobileMenu();
    }
  }

  ngOnInit() {
    // Load saved app
    const savedApp = localStorage.getItem('currentApp') as 'SMSTaxi' | 'TaxiSelect';
    if (savedApp) {
      this.currentApp = savedApp;
    }

    this.sub.add(
      this.taxiService.appChanged$.subscribe((app) => {
        this.currentApp = app;
      })
    );

    // Router URL tracking (properly managed subscription)
    this.sub.add(
      this.router.events
        .pipe(filter((e) => e instanceof NavigationEnd))
        .subscribe((e: NavigationEnd) => {
          this.activeUrl = e.urlAfterRedirects;
        })
    );

    // Prevent initial animation
    const menu = document.querySelector('.vertical-menu');
    menu?.classList.add('no-transition');

    // Desktop: open by default
    if (!this.isMobile) {
      this.isOpen = true;
      this.isCollapsed = false;
    } else {
      this.isOpen = false;
    }

    setTimeout(() => {
      menu?.classList.remove('no-transition');
    }, 50);

    // MOBILE toggle
    this.sub.add(
      this.ui.mobileMenu$.subscribe((open) => {
        if (this.isMobile) {
          this.isOpen = open;
        }
      })
    );

    // DESKTOP toggle
    this.sub.add(
      this.ui.sidebarOpen$.subscribe((open) => {
        if (!this.isMobile) {
          this.isOpen = open;
        }
      })
    );

    // COLLAPSED mode
    this.sub.add(
      this.ui.sidebarCollapsedChanges.subscribe((c) => {
        this.isCollapsed = c;
      })
    );
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

  closeMobile(): void {
    if (this.isMobile) {
      this.ui.closeMobileMenu();
    }
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