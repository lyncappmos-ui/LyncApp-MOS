
type Listener = (data: any, eventName?: string) => void;

class EventBus {
  private listeners: Record<string, Listener[]> = {};
  private channel: any;

  constructor() {
    // In Node.js, BroadcastChannel is available in the global scope since Node 18.
    // We wrap it for safety during builds.
    try {
      this.channel = new (globalThis as any).BroadcastChannel('LYNC_MOS_EVENTS');
      this.channel.onmessage = (event: any) => {
        const { type, data } = event.data;
        this.localEmit(type, data);
      };
    } catch (e) {
      console.warn("BroadcastChannel not available in this environment.");
    }
  }

  on(event: string, callback: Listener) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
  }

  emit(event: string, data: any) {
    this.localEmit(event, data);
    if (this.channel) {
      this.channel.postMessage({ type: event, data });
    }
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
