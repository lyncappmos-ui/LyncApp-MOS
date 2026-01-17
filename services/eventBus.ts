
type Listener = (data: any, eventName?: string) => void;

class EventBus {
  private listeners: Record<string, Listener[]> = {};
  private channel: BroadcastChannel;

  constructor() {
    this.channel = new BroadcastChannel('LYNC_MOS_EVENTS');
    this.channel.onmessage = (event) => {
      const { type, data } = event.data;
      this.localEmit(type, data);
    };
  }

  on(event: string, callback: Listener) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
  }

  emit(event: string, data: any) {
    this.localEmit(event, data);
    this.channel.postMessage({ type: event, data });
  }

  private localEmit(event: string, data: any) {
    // Standard listeners
    if (this.listeners[event]) {
      this.listeners[event].forEach(cb => cb(data));
    }
    // Wildcard listeners for the Bridge
    if (this.listeners['*']) {
      this.listeners['*'].forEach(cb => cb(data, event));
    }
  }

  off(event: string, callback: Listener) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
  }
}

export const bus = new EventBus();

if (typeof window !== 'undefined') {
  (window as any).MOSBus = bus;
}

export enum MOSEvents {
  TRIP_STARTED = 'TRIP_STARTED',
  TRIP_COMPLETED = 'TRIP_COMPLETED',
  TICKET_ISSUED = 'TICKET_ISSUED',
  SMS_SENT = 'SMS_SENT',
  TRUST_UPDATED = 'TRUST_UPDATED',
  SYNC_REQUIRED = 'SYNC_REQUIRED'
}
