// Service to detect and manage active market events and check-in status

class MarketEventService {
  // Get all events from localStorage
  getEvents() {
    try {
      const stored = localStorage.getItem('marketEvents');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading events:', error);
      return [];
    }
  }

  // Check if an event is currently active (within start and end time)
  isEventActive(event) {
    const now = new Date();
    const startTime = new Date(event.startDateTime);
    const endTime = new Date(event.endDateTime);
    return now >= startTime && now <= endTime;
  }

  // Get active market events
  getActiveEvents() {
    const events = this.getEvents();
    return events.filter((event) => this.isEventActive(event));
  }

  // Get the first active event (if multiple, return the first one)
  getActiveEvent() {
    const activeEvents = this.getActiveEvents();
    return activeEvents.length > 0 ? activeEvents[0] : null;
  }

  // Check if user is checked into an event
  isUserCheckedIn(eventId) {
    try {
      const stored = localStorage.getItem(`checkedIn_${eventId}`);
      return stored === 'true';
    } catch (error) {
      console.error('Error checking check-in status:', error);
      return false;
    }
  }

  // Set user as checked into an event
  checkInToEvent(eventId) {
    try {
      localStorage.setItem(`checkedIn_${eventId}`, 'true');
      localStorage.setItem(`checkedInAt_${eventId}`, new Date().toISOString());
      return true;
    } catch (error) {
      console.error('Error checking in:', error);
      return false;
    }
  }

  // Check out of an event
  checkOutOfEvent(eventId) {
    try {
      localStorage.removeItem(`checkedIn_${eventId}`);
      localStorage.removeItem(`checkedInAt_${eventId}`);
      return true;
    } catch (error) {
      console.error('Error checking out:', error);
      return false;
    }
  }

  // Check if user is checked into any active event
  isCheckedIntoActiveEvent() {
    const activeEvent = this.getActiveEvent();
    if (!activeEvent) return false;
    return this.isUserCheckedIn(activeEvent.id);
  }

  // Get the event the user is currently checked into (if any)
  getCheckedInEvent() {
    const activeEvent = this.getActiveEvent();
    if (!activeEvent) return null;
    if (this.isUserCheckedIn(activeEvent.id)) {
      return activeEvent;
    }
    return null;
  }
}

export const marketEventService = new MarketEventService();

