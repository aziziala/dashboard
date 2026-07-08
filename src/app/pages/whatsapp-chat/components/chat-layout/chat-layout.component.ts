import { Component, OnDestroy, OnInit } from '@angular/core';
import { ChatStateService } from '../../services/chat-state.service';

/**
 * Conteneur racine du module chat : initialise la connexion WebSocket et le
 * chargement des conversations une seule fois, affiche la sidebar (toujours
 * visible) + un <router-outlet> pour la zone de discussion (ChatWindowComponent
 * ou EmptyChatComponent selon la route active).
 */
@Component({
  selector: 'app-chat-layout',
  templateUrl: './chat-layout.component.html',
  styleUrls: ['./chat-layout.component.scss']
})
export class ChatLayoutComponent implements OnInit, OnDestroy {

  constructor(private chatStateService: ChatStateService) {}

  ngOnInit(): void {
    this.chatStateService.init();
  }

  ngOnDestroy(): void {
    this.chatStateService.destroy();
  }
}