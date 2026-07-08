import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ChatLayoutComponent } from './components/chat-layout/chat-layout.component';
import { EmptyChatComponent } from './components/empty-chat/empty-chat.component';
import { ChatWindowComponent } from './components/chat-window/chat-window.component';

const routes: Routes = [
  {
    path: '',
    component: ChatLayoutComponent,
    children: [
      { path: '', component: EmptyChatComponent, pathMatch: 'full' },
      { path: ':conversationId', component: ChatWindowComponent }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class WhatsappChatRoutingModule {}