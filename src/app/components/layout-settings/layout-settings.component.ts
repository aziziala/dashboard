import { Component } from '@angular/core';
import { LayoutService, LayoutSettings, LayoutType, LayoutWidth, SidebarSize, ThemeMode, TopbarColor } from '../../services/layout.service';

@Component({
  selector: 'app-layout-settings',
  templateUrl: './layout-settings.component.html',
  styleUrls: ['./layout-settings.component.scss']
})
export class LayoutSettingsComponent {
  isOpen = false;
  settings: LayoutSettings;

  themes: ThemeMode[] = ['light', 'dark'];
  layouts: LayoutType[] = ['vertical', 'horizontal'];
  widths: LayoutWidth[] = ['fluid', 'boxed'];
  sidebarSizes: SidebarSize[] = ['default', 'compact', 'icon'];
  topbarColors: TopbarColor[] = ['light', 'dark', 'primary', 'info', 'success', 'warning', 'danger'];

  constructor(private layout: LayoutService) {
    this.settings = this.layout.getSettings();
  }

  toggle(): void {
    this.isOpen = !this.isOpen;
  }

  update(partial: Partial<LayoutSettings>): void {
    this.layout.update(partial);
    this.settings = this.layout.getSettings();
  }

  reset(): void {
    this.layout.reset();
    this.settings = this.layout.getSettings();
  }
}


