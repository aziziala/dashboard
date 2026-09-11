import { Injectable } from '@angular/core';


@Injectable({ providedIn: 'root' })
export class NotificationSoundService {
  private readonly audio = new Audio('assets/sounds/new-reservation.mp3');
  private unlockListenerAttached = false;
  private pendingPlay = false;

  constructor() {
    this.audio.preload = 'auto';
    this.audio.volume = 0.6;
  }

  playNotificationSound(): void {
    // Rembobine pour permettre des sons rapprochés (plusieurs réservations d'affilée).
    this.audio.currentTime = 0;

    const playPromise = this.audio.play();
    if (playPromise === undefined) {
      return;
    }

    playPromise.catch((err) => {
      // NotAllowedError = autoplay bloqué faute d'interaction utilisateur récente.
      if (err?.name === 'NotAllowedError') {
        this.pendingPlay = true;
        this.attachUnlockListenerOnce();
      } else {
        console.error('Lecture du son de notification impossible :', err);
      }
    });
  }

  private attachUnlockListenerOnce(): void {
    if (this.unlockListenerAttached) {
      return;
    }
    this.unlockListenerAttached = true;

    const unlock = () => {
      if (this.pendingPlay) {
        this.audio
          .play()
          .catch(() => {
            /* toujours bloqué, on abandonne silencieusement — pas critique */
          })
          .finally(() => (this.pendingPlay = false));
      }
      document.removeEventListener('click', unlock);
      document.removeEventListener('keydown', unlock);
    };

    document.addEventListener('click', unlock, { once: true });
    document.addEventListener('keydown', unlock, { once: true });
  }
}