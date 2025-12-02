import { Injectable } from '@angular/core';

export type ThemeMode = 'light' | 'dark';
export type LayoutType = 'vertical' | 'horizontal';
export type SidebarSize = 'default' | 'compact' | 'icon';
export type TopbarColor = 'light' | 'dark' | 'primary' | 'info' | 'success' | 'warning' | 'danger';
export type LayoutWidth = 'fluid' | 'boxed';
export type Direction = 'ltr' | 'rtl';
export type SidebarColor = 'light' | 'dark' | 'brand';

export interface LayoutSettings {
  theme: ThemeMode;
  layout: LayoutType;
  sidebarSize: SidebarSize;
  topbarColor: TopbarColor;
  layoutWidth: LayoutWidth;
  direction: Direction;
  headerFixed: boolean;
  sidebarColor: SidebarColor;
}

const STORAGE_KEY = 'admin_layout_settings_v1';

@Injectable({ providedIn: 'root' })
export class LayoutService {
  private settings: LayoutSettings = {
    theme: 'light',
    layout: 'vertical',
    sidebarSize: 'default',
    topbarColor: 'dark',
    layoutWidth: 'fluid',
    direction: 'ltr',
    headerFixed: true,
    sidebarColor: 'dark'
  };

  constructor() {
    this.load();
    this.applyToDocument();
  }

  getSettings(): LayoutSettings {
    return { ...this.settings };
  }

  update(partial: Partial<LayoutSettings>): void {
    this.settings = { ...this.settings, ...partial } as LayoutSettings;
    this.save();
    this.applyToDocument();
  }

  reset(): void {
    this.settings = {
      theme: 'light',
      layout: 'vertical',
      sidebarSize: 'default',
      topbarColor: 'dark',
      layoutWidth: 'fluid',
      direction: 'ltr',
      headerFixed: true,
      sidebarColor: 'dark'
    };
    this.save();
    this.applyToDocument();
  }

  private save(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
  }

  private load(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        this.settings = { ...this.settings, ...parsed };
      }
    } catch {}
  }

  private applyToDocument(): void {
    const root = document.documentElement;
    // Direction
    root.setAttribute('dir', this.settings.direction);
    root.classList.remove('dir-ltr', 'dir-rtl');
    root.classList.add(`dir-${this.settings.direction}`);
    // Theme
    root.classList.remove('theme-light', 'theme-dark');
    root.classList.add(`theme-${this.settings.theme}`);
    // Layout
    root.classList.remove('layout-vertical', 'layout-horizontal');
    root.classList.add(`layout-${this.settings.layout}`);
    // Sidebar size
    root.classList.remove('sidebar-default', 'sidebar-compact', 'sidebar-icon');
    root.classList.add(`sidebar-${this.settings.sidebarSize}`);
    // Sidebar color
    root.classList.remove('sidebar-light', 'sidebar-dark', 'sidebar-brand');
    root.classList.add(`sidebar-${this.settings.sidebarColor}`);
    // Topbar color
    root.classList.remove('topbar-light', 'topbar-dark', 'topbar-primary', 'topbar-info', 'topbar-success', 'topbar-warning', 'topbar-danger');
    root.classList.add(`topbar-${this.settings.topbarColor}`);
    // Layout width
    root.classList.remove('layout-fluid', 'layout-boxed');
    root.classList.add(`layout-${this.settings.layoutWidth}`);
    // Header position
    root.classList.remove('header-fixed', 'header-static');
    root.classList.add(this.settings.headerFixed ? 'header-fixed' : 'header-static');
  }
}


