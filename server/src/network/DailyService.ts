/**
 * Service to manage Daily.co voice chat rooms.
 * Creates/deletes rooms via the Daily REST API.
 */
export class DailyService {
  private apiKey: string | undefined;
  private baseUrl = 'https://api.daily.co/v1';

  constructor() {
    this.apiKey = process.env.DAILY_API_KEY;
    if (!this.apiKey) {
      console.warn('[DailyService] DAILY_API_KEY not set — voice chat disabled');
    }
  }

  get isEnabled(): boolean {
    return !!this.apiKey;
  }

  async createRoom(roomId: string): Promise<string | null> {
    if (!this.apiKey) return null;

    try {
      const res = await fetch(`${this.baseUrl}/rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          name: `teg-${roomId}`,
          properties: {
            max_participants: 6,
            enable_chat: false,
            enable_screenshare: false,
            exp: Math.floor(Date.now() / 1000) + 7200, // 2 hours
            eject_at_room_exp: true,
          },
        }),
      });

      if (!res.ok) {
        console.error('[DailyService] Failed to create room:', res.status, await res.text());
        return null;
      }

      const data = (await res.json()) as { url: string };
      return data.url;
    } catch (err) {
      console.error('[DailyService] Error creating room:', err);
      return null;
    }
  }

  async deleteRoom(roomId: string): Promise<void> {
    if (!this.apiKey) return;

    try {
      await fetch(`${this.baseUrl}/rooms/teg-${roomId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });
    } catch (err) {
      console.error('[DailyService] Error deleting room:', err);
    }
  }
}
