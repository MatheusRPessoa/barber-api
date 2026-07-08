import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  async send(
    pushToken: string | null | undefined,
    title: string,
    body: string,
    data?: Record<string, unknown>,
  ): Promise<void> {
    if (!pushToken) return;

    try {
      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: pushToken, title, body, data }),
      });
    } catch (err) {
      this.logger.warn(
        `Failed to send push notification: ${(err as Error).message}`,
      );
    }
  }
}
