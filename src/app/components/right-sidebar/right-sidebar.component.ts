import { Component } from '@angular/core';
import { UiService } from '../../services/ui.service';

@Component({
  selector: 'app-right-sidebar',
  templateUrl: './right-sidebar.component.html',
  styleUrls: ['./right-sidebar.component.scss']
})
export class RightSidebarComponent {
  isOpen = false;
  constructor(private ui: UiService) {
    this.ui.rightbarOpenChanges.subscribe(v => this.isOpen = v);
  }
}


