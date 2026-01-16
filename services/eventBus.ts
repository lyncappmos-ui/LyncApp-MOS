
type Listener = (data: any) => void;

class EventBus {
  private listeners: Record<string, Listener[]> = {};

  on(event: string, callback: Listener) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
  }

  emit(event: string, data: any) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(cb => cb(data));
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
  SMS_SENT = 'SMS_SENT',
  TRUST_UPDATED = 'TRUST_UPDATED',
  SYNC_REQUIRED = 'SYNC_REQUIRED'
}
