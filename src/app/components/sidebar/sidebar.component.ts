import {
  Component,
  OnInit,
  OnDestroy,
  HostBinding,
  HostListener,
} from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { UiService } from '../../services/ui.service';
import { filter, Subscription } from 'rxjs';
import { TaxiService } from '../../services/taxi.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent implements OnInit, OnDestroy {
  activeUrl = '';

  // Application brand shown in the header
  currentApp: 'SMSTaxi' | 'TaxiSelect' = 'SMSTaxi';

  // Sub-menu visibility
  isGestionEtatsOpen = false;
  isGestionNotificationsOpen = false;

  // Mobile off-canvas drawer state
  isOpen = false;

  // Icon-rail state (tablet + desktop). Initialised straight from
  // the service so the first paint is already correct (no flash).
  collapsed = this.ui.sidebarCollapsed;

  // Temporary expansion while the user hovers the collapsed rail
  // on desktop — lets the labels + sub-menus stay reachable.
  railHover = false;

  // User profile (sidebar footer)
  userName = 'Admin';
  userRole = 'Administrateur';

  // Host classes drive the layout width in src/styles/_layout.scss
  @HostBinding('class.sidebar-collapsed') get hostCollapsed(): boolean {
    return this.collapsed;
  }
  @HostBinding('class.rail-expanded') get hostRailExpanded(): boolean {
    return this.railHover;
  }

  get isMobile(): boolean {
    return this.ui.isMobile;
  }

  get initials(): string {
    return (
      this.userName
        .split(' ')
        .map((w) => w.charAt(0))
        .slice(0, 2)
        .join('')
        .toUpperCase() || 'A'
    );
  }

  private sub = new Subscription();

  constructor(
    private router: Router,
    private ui: UiService,
    private taxiService: TaxiService,
    private auth: AuthService
  ) {}

  // ------------------------------------------------------------
  // Hover-to-expand the icon rail (desktop only)
  // ------------------------------------------------------------
  @HostListener('mouseenter')
  onMouseEnter(): void {
    if (this.collapsed && !this.isMobile) {
      this.railHover = true;
    }
  }

  @HostListener('mouseleave')
  onMouseLeave(): void {
    this.railHover = false;
  }

  // ------------------------------------------------------------
  // ESC closes the mobile drawer
  // ------------------------------------------------------------
  @HostListener('document:keydown.escape', ['$event'])
  onEscapePressed(event: KeyboardEvent): void {
    if (this.isMobile && this.isOpen) {
      this.ui.closeMobileMenu();
    }
  }

  // ------------------------------------------------------------
  // Swipe gestures (mobile): swipe the drawer away to close it, or
  // swipe inwards from the drawer's edge to open it.
  // ------------------------------------------------------------
  private swipeStartX: number | null = null;

  @HostListener('document:touchstart', ['$event'])
  onTouchStart(event: TouchEvent): void {
    if (!this.isMobile) return;
    this.swipeStartX = event.touches[0]?.clientX ?? null;
  }

  @HostListener('document:touchend', ['$event'])
  onTouchEnd(event: TouchEvent): void {
    if (!this.isMobile || this.swipeStartX === null) return;
    const startX = this.swipeStartX;
    const endX = event.changedTouches[0]?.clientX ?? startX;
    const dx = endX - startX;
    this.swipeStartX = null;

    const rtl = document.documentElement.dir === 'rtl';

    if (this.isOpen) {
      // Swipe towards the hidden edge closes the drawer
      if ((!rtl && dx < -60) || (rtl && dx > 60)) {
        this.closeMobile();
      }
    } else {
      // Swipe inwards starting from the drawer's edge opens it
      const nearEdge = rtl ? startX > window.innerWidth - 32 : startX < 32;
      if (nearEdge && ((!rtl && dx > 60) || (rtl && dx < -60))) {
        this.ui.openMobileMenu();
      }
    }
  }

  ngOnInit(): void {
    // Restore the last used application
    const savedApp = localStorage.getItem('currentApp') as
      | 'SMSTaxi'
      | 'TaxiSelect';
    if (savedApp) {
      this.currentApp = savedApp;
    }

    this.sub.add(
      this.taxiService.appChanged$.subscribe((app) => {
        this.currentApp = app;
      })
    );

    // Reset the hover-expand when the screen changes
    this.sub.add(
      this.ui.screen$.subscribe(() => {
        this.railHover = false;
      })
    );

    // Mobile drawer state
    this.sub.add(
      this.ui.mobileMenu$.subscribe((open) => {
        this.isOpen = open;
      })
    );

    // Icon-rail state
    this.sub.add(
      this.ui.sidebarCollapsedChanges.subscribe((c) => {
        this.collapsed = c;
      })
    );

    // Router URL tracking: highlight the active route, auto-open the
    // relevant sub-menu and close the mobile drawer on navigation.
    this.sub.add(
      this.router.events
        .pipe(filter((e) => e instanceof NavigationEnd))
        .subscribe((e: NavigationEnd) => {
          this.activeUrl = e.urlAfterRedirects;
          this.isGestionEtatsOpen = this.activeUrl.startsWith('/gestion-etats');
          this.isGestionNotificationsOpen = this.activeUrl.startsWith(
            '/gestion-notifaction'
          );
          if (this.isMobile) {
            this.ui.closeMobileMenu();
          }
        })
    );

    // Sidebar footer profile
    const user = this.auth.currentUserValue;
    if (user?.username) {
      this.userName = user.username;
    }
    const roles = user?.roles ?? (user?.role ? [user.role] : []);
    if (roles.length) {
      this.userRole = roles[0];
    }
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  // ------------------------------------------------------------
  // Actions
  // ------------------------------------------------------------
  closeMobile(): void {
    if (this.isMobile) {
      this.ui.closeMobileMenu();
    }
  }

  toggleCollapse(): void {
    this.ui.toggleSidebarCollapsed();
  }

  toggleGestionEtats(): void {
    this.isGestionEtatsOpen = !this.isGestionEtatsOpen;
  }

  toggleGestionNotifications(): void {
    this.isGestionNotificationsOpen = !this.isGestionNotificationsOpen;
  }
}
