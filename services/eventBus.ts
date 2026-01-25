
type Listener = (data: any, eventName?: string) => void;

class EventBus {
  private listeners: Record<string, Listener[]> = {};
  private channel: any = null;
  private sequence = 0;

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        this.channel = new BroadcastChannel('LYNC_MOS_EVENTS');
        this.channel.onmessage = (event: any) => {
          const { type, data } = event.data;
          this.localEmit(type, data);
        };
      } catch (e) {
        console.warn("[MOS_BUS] BroadcastChannel not available in this browser context.");
      }
    }
  }

  on(event: string, callback: Listener) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
  }

  emit(event: string, data: any) {
    this.sequence++;
    const enrichedData = {
      ...data,
      metadata: {
        sequence: this.sequence,
        timestamp: new Date().toISOString(),
        eventHash: this.generateEventHash(event, data)
      }
    };

    this.localEmit(event, enrichedData);
    if (this.channel) {
      this.channel.postMessage({ type: event, data: enrichedData });
    }
  }

  private generateEventHash(event: string, data: any): string {
    return `seq_${this.sequence}_${Math.random().toString(36).substring(7)}`;
  }

  private localEmit(event: string, data: any) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(cb => cb(data));
    }
    if (this.listeners['*']) {
      this.listeners['*'].forEach(cb => cb(data, event));
    }
    const category = event.split('_')[0].toLowerCase();
    if (this.listeners[`${category}.*`]) {
      this.listeners[`${category}.*`].forEach(cb => cb(data, event));
    }
  }

  off(event: string, callback: Listener) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
  }
}

export const bus = new EventBus();

export enum MOSEvents {
  TRIP_STARTED = 'TRIP_STARTED',
  TRIP_COMPLETED = 'TRIP_COMPLETED',
  TICKET_ISSUED = 'TICKET_ISSUED',
  REVENUE_ANCHORED = 'REVENUE_ANCHORED',
  SMS_SENT = 'SMS_SENT',
  TRUST_UPDATED = 'TRUST_UPDATED',
  CREDENTIAL_ISSUED = 'CREDENTIAL_ISSUED',
  SYNC_REQUIRED = 'SYNC_REQUIRED',
  HEALTH_CHECK = 'HEALTH_CHECK'
}
