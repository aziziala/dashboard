import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-message-input',
  templateUrl: './message-input.component.html',
  styleUrls: ['./message-input.component.scss']
})
export class MessageInputComponent {

  @Input() disabled = false;
  @Output() send = new EventEmitter<string>();

  content = '';

  onSubmit(): void {
    const trimmed = this.content.trim();
    if (!trimmed || this.disabled) {
      return;
    }
    this.send.emit(trimmed);
    this.content = '';
  }

  onKeyDown(event: KeyboardEvent): void {
    // Entrée envoie, Maj+Entrée fait un saut de ligne (comme WhatsApp Web).
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.onSubmit();
    }
  }
}