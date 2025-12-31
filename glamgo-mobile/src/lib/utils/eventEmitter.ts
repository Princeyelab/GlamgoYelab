/**
 * Simple Event Emitter for cross-component communication
 * Used for triggering refreshes when notifications are dismissed
 */

type EventCallback = (...args: any[]) => void;

class EventEmitter {
  private events: Map<string, Set<EventCallback>> = new Map();

  on(event: string, callback: EventCallback): () => void {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.events.get(event)?.delete(callback);
    };
  }

  emit(event: string, ...args: any[]): void {
    this.events.get(event)?.forEach(callback => {
      try {
        callback(...args);
      } catch (error) {
        console.error(`Error in event handler for ${event}:`, error);
      }
    });
  }

  off(event: string, callback: EventCallback): void {
    this.events.get(event)?.delete(callback);
  }
}

export const appEvents = new EventEmitter();

// Event names constants
export const EVENTS = {
  REFRESH_PROVIDER_BOOKINGS: 'refresh_provider_bookings',
  REFRESH_CLIENT_BOOKINGS: 'refresh_client_bookings',
  ORDER_CANCELLED: 'order_cancelled',
  ORDER_ACCEPTED: 'order_accepted',
};
