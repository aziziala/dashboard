import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class UiService {
  private rightbarOpen$ = new BehaviorSubject<boolean>(false);
  //private mobileMenuOpen$ = new BehaviorSubject<boolean>(false);
  private sidebarCollapsed$ = new BehaviorSubject<boolean>(false);
private mobileMenuSubject = new BehaviorSubject<boolean>(false);
  //mobileMenu$ = this.mobileMenuSubject.asObservable();
  rightbarOpenChanges = this.rightbarOpen$.asObservable();
  //mobileMenuOpenChanges = this.mobileMenuOpen$.asObservable();
  sidebarCollapsedChanges = this.sidebarCollapsed$.asObservable();

  toggleRightbar(): void {
    const next = !this.rightbarOpen$.value;
    this.rightbarOpen$.next(next);
    document.documentElement.classList.toggle('rightbar-open', next);
  }
  closeMobileMenu(): void {
    this.mobileMenu.next(false);
  }
  /*toggleMobileMenu(): void {
    const next = !this.mobileMenuOpen$.value;
    this.mobileMenuOpen$.next(next);
    document.documentElement.classList.toggle('vertical-menu-open', next);
  }*/
private mobileMenu = new BehaviorSubject<boolean>(false);
mobileMenu$ = this.mobileMenu.asObservable();

toggleMobileMenu() {
  this.mobileMenu.next(!this.mobileMenu.value);
}

  toggleSidebarCollapsed(): void {
  const next = !this.sidebarCollapsed$.value;
  this.sidebarCollapsed$.next(next);
  document.documentElement.classList.toggle('sidebar-collapsed', next);
}
private sidebarOpen = new BehaviorSubject<boolean>(true);
sidebarOpen$ = this.sidebarOpen.asObservable();
toggleSidebar() {
  this.sidebarOpen.next(!this.sidebarOpen.value);
}

}


