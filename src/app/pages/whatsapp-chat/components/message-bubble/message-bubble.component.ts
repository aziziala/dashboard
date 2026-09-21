import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges
} from '@angular/core';

import {
  ChatMessage,
  ChatMessageStatus,
  MessageDirection,
  MessageType
} from '../../models';

import { ChatService } from '../../services/chat.service';

import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-message-bubble',
  templateUrl: './message-bubble.component.html',
  styleUrls: ['./message-bubble.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MessageBubbleComponent implements OnChanges, OnDestroy {

  @Input() message!: ChatMessage;

  readonly MessageDirection = MessageDirection;
  readonly ChatMessageStatus = ChatMessageStatus;
  readonly MessageType = MessageType;

  /** URL de média résolue pour le message courant, affichée dans le template. */
  mediaUrl: string | undefined;

  /** URL de média déjà résolues, indexées par message.id. */
  private readonly mediaUrlCache = new Map<string, string>();

  /** Messages dont la requête d'URL est déjà en cours. */
  private readonly mediaUrlLoading = new Set<string>();

  /** Messages dont la résolution d'URL a échoué. */
  private readonly mediaUrlFailed = new Set<string>();

  private destroyed = false;

  /** Signale la destruction du composant pour désabonner les requêtes en cours. */
  private readonly destroy$ = new Subject<void>();

  constructor(
    private chatService: ChatService,
    private changeDetectorRef: ChangeDetectorRef
  ) {}

  ngOnChanges(changes: SimpleChanges): void {

    if (changes['message']) {

      const previous = changes['message'].previousValue as ChatMessage | undefined;
      const previousKey = previous?.media?.objectKey;
      const currentKey = this.message?.media?.objectKey;

      console.log(
        '%c[MEDIA] 🔄 ngOnChanges',
        'color: #2196F3; font-weight: bold;',
        {
          messageId: this.message?.id,
          messageType: this.message?.messageType,
          media: this.message?.media,
          objectKeyChanged: previousKey !== currentKey
        }
      );

      // Ne relance la résolution que si la clé d'objet MinIO change réellement :
      // les mises à jour de statut (WebSocket) recréent l'objet message sans
      // changer le média, et ne doivent pas re-fire getMediaUrl().
      if (previousKey !== currentKey) {
        this.mediaUrl = undefined;

        this.resolveMediaUrl();
      }
    }
  }

  ngOnDestroy(): void {

    console.log(
      '%c[MEDIA] 🗑️ MessageBubbleComponent destroyed',
      'color: #9E9E9E; font-weight: bold;',
      {
        messageId: this.message?.id
      }
    );

    this.destroy$.next();
    this.destroy$.complete();

    this.destroyed = true;
  }

  get isOutgoing(): boolean {
    return this.message.direction === MessageDirection.OUT;
  }

  /** Icône de statut façon WhatsApp, affichée uniquement sur les messages sortants. */
  get statusIcon(): string {
    switch (this.message.status) {
      case ChatMessageStatus.PENDING:
        return '🕓';

      case ChatMessageStatus.SENT:
        return '✓';

      case ChatMessageStatus.DELIVERED:
        return '✓✓';

      case ChatMessageStatus.READ:
        return '✓✓';

      case ChatMessageStatus.FAILED:
        return '⚠';

      default:
        return '';
    }
  }

  get statusClass(): string {
    return 'wa-bubble__status--' + this.message.status.toLowerCase();
  }

  /**
   * Résout l'URL de téléchargement du média du message courant.
   */
  private resolveMediaUrl(): void {

    console.group(
      `%c[MEDIA] 🔍 Résolution média`,
      'color: #673AB7; font-weight: bold;'
    );

    console.log('[MEDIA] Message ID:', this.message?.id);

    console.log(
      '[MEDIA] Message type:',
      this.message?.messageType
    );

    console.log(
      '[MEDIA] Message complet:',
      this.message
    );

    console.log(
      '[MEDIA] Media:',
      this.message?.media
    );

    console.log(
      '[MEDIA] objectKey:',
      this.message?.media?.objectKey
    );

    console.log(
      '[MEDIA] mimeType:',
      this.message?.media?.mimeType
    );

    console.log(
      '[MEDIA] fileName:',
      this.message?.media?.fileName
    );

    console.log(
      '[MEDIA] size:',
      this.message?.media?.size
    );

    console.groupEnd();


    /*
     * ============================================================
     * 1. Vérification objectKey
     * ============================================================
     */

    if (!this.message?.media?.objectKey) {

      console.warn(
        '%c[MEDIA] ❌ objectKey absent',
        'color: #F44336; font-weight: bold;',
        {
          messageId: this.message?.id,
          messageType: this.message?.messageType,
          media: this.message?.media
        }
      );

      console.warn(
        '[MEDIA] Aucun appel à getMediaUrl() ne sera effectué.'
      );

      this.mediaUrl = undefined;

      return;
    }


    /*
     * ============================================================
     * 2. Vérification cache
     * ============================================================
     */

    const cached = this.mediaUrlCache.get(this.message.id);

    if (cached) {

      console.log(
        '%c[MEDIA] 💾 URL trouvée dans le cache',
        'color: #4CAF50; font-weight: bold;'
      );

      console.log(
        '[MEDIA] Cached URL:',
        cached
      );

      this.mediaUrl = cached;

      return;
    }


    /*
     * ============================================================
     * 3. Vérification échec précédent
     * ============================================================
     */

    if (this.mediaUrlFailed.has(this.message.id)) {

      console.warn(
        '%c[MEDIA] ⚠️ Résolution déjà échouée pour ce message',
        'color: #FF9800; font-weight: bold;',
        this.message.id
      );

      this.mediaUrl = undefined;

      return;
    }


    /*
     * ============================================================
     * 4. Vérification requête déjà en cours
     * ============================================================
     */

    if (this.mediaUrlLoading.has(this.message.id)) {

      console.log(
        '%c[MEDIA] ⏳ Requête déjà en cours',
        'color: #FF9800; font-weight: bold;',
        this.message.id
      );

      this.mediaUrl = undefined;

      return;
    }


    /*
     * ============================================================
     * 5. Appel API backend
     * ============================================================
     */

    console.log(
      '%c[MEDIA] 🚀 Appel ChatService.getMediaUrl()',
      'color: #2196F3; font-weight: bold;'
    );

    console.log(
      '[MEDIA] messageId envoyé:',
      this.message.id
    );

    console.log(
      '[MEDIA] objectKey:',
      this.message.media.objectKey
    );

    this.mediaUrlLoading.add(this.message.id);


    this.chatService.getMediaUrl(this.message.id).pipe(
      takeUntil(this.destroy$)
    ).subscribe({

      /*
       * ==========================================================
       * SUCCESS
       * ==========================================================
       */

      next: (response) => {

        console.log(
          '%c[MEDIA] ✅ Réponse API reçue',
          'color: #4CAF50; font-weight: bold;',
          response
        );

        console.log(
          '[MEDIA] URL retournée:',
          response?.url
        );

        console.log(
          '[MEDIA] Expiration:',
          response?.expiresInSeconds,
          'secondes'
        );


        /*
         * Component détruit
         */

        if (this.destroyed) {

          console.warn(
            '%c[MEDIA] ⚠️ Component détruit avant réception',
            'color: #FF9800; font-weight: bold;'
          );

          return;
        }


        /*
         * Vérification URL
         */

        if (!response?.url) {

          console.error(
            '%c[MEDIA] ❌ Réponse API sans URL',
            'color: #F44336; font-weight: bold;',
            response
          );

          this.mediaUrlFailed.add(this.message.id);

          this.mediaUrlLoading.delete(this.message.id);

          this.changeDetectorRef.markForCheck();

          return;
        }


        /*
         * Mise en cache
         */

        this.mediaUrlCache.set(
          this.message.id,
          response.url
        );

        console.log(
          '%c[MEDIA] 💾 URL ajoutée au cache',
          'color: #4CAF50; font-weight: bold;'
        );


        /*
         * Affectation mediaUrl
         */

        this.mediaUrl = response.url;

        console.log(
          '%c[MEDIA] 🎯 mediaUrl affectée',
          'color: #4CAF50; font-weight: bold;'
        );

        console.log(
          '[MEDIA] mediaUrl =',
          this.mediaUrl
        );


        /*
         * Fin du loading
         */

        this.mediaUrlLoading.delete(this.message.id);


        /*
         * Détection Angular
         */

        this.changeDetectorRef.markForCheck();

        console.log(
          '%c[MEDIA] ✅ Média prêt pour le template HTML',
          'color: #4CAF50; font-weight: bold;',
          {
            messageId: this.message.id,
            messageType: this.message.messageType,
            mimeType: this.message.media?.mimeType,
            mediaUrl: this.mediaUrl
          }
        );
      },


      /*
       * ==========================================================
       * ERROR
       * ==========================================================
       */

      error: (error) => {

        console.error(
          '%c[MEDIA] ❌ Erreur getMediaUrl()',
          'color: #F44336; font-weight: bold;',
          error
        );

        console.error(
          '[MEDIA] Message ID:',
          this.message.id
        );

        console.error(
          '[MEDIA] Message type:',
          this.message.messageType
        );

        console.error(
          '[MEDIA] objectKey:',
          this.message.media?.objectKey
        );

        console.error(
          '[MEDIA] HTTP status:',
          error?.status
        );

        console.error(
          '[MEDIA] HTTP message:',
          error?.message
        );

        console.error(
          '[MEDIA] Error body:',
          error?.error
        );


        this.mediaUrlFailed.add(this.message.id);

        this.mediaUrlLoading.delete(this.message.id);

        this.mediaUrl = undefined;

        this.changeDetectorRef.markForCheck();
      }
    });
  }

  /**
   * Formate une taille en octets :
   * X o / X Ko / X Mo.
   */
  formatFileSize(size?: number): string {

    if (size == null) {
      return '';
    }

    if (size < 1024) {
      return `${size} o`;
    }

    if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(1)} Ko`;
    }

    return `${(size / (1024 * 1024)).toFixed(1)} Mo`;
  }
}
