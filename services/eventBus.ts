
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

  /**
   * Listen for events. Supports wildcards.
   */
  on(event: string, callback: Listener) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
  }

  /**
   * Broadcast an event to both local and cross-tab/window consumers.
   */
  emit(event: string, data: any) {
    this.localEmit(event, data);
    this.channel.postMessage({ type: event, data });
  }

  private localEmit(event: string, data: any) {
    // 1. Exact match
    if (this.listeners[event]) {
      this.listeners[event].forEach(cb => cb(data));
    }
    // 2. Wildcard (The Bridge uses this)
    if (this.listeners['*']) {
      this.listeners['*'].forEach(cb => cb(data, event));
    }
    // 3. Category wildcard (e.g., operational.*)
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

if (typeof window !== 'undefined') {
  (window as any).MOSBus = bus;
}

export enum MOSEvents {
  // Operational Stream
  TRIP_STARTED = 'TRIP_STARTED',
  TRIP_COMPLETED = 'TRIP_COMPLETED',
  
  // Revenue Stream
  TICKET_ISSUED = 'TICKET_ISSUED',
  REVENUE_ANCHORED = 'REVENUE_ANCHORED',
  SMS_SENT = 'SMS_SENT',
  
  // Trust Stream
  TRUST_UPDATED = 'TRUST_UPDATED',
  CREDENTIAL_ISSUED = 'CREDENTIAL_ISSUED',
  
  // System Stream
  SYNC_REQUIRED = 'SYNC_REQUIRED',
  HEALTH_CHECK = 'HEALTH_CHECK'
}
