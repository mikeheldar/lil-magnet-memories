// Service to detect and manage active market events and check-in status
import { firebaseService } from './firebaseService.js';

class MarketEventService {
  constructor() {
    this.eventsCache = [];
    this.cacheTimestamp = null;
    this.cacheTimeout = 30000; // Cache for 30 seconds (shorter for faster updates)
    // Initialize cache on service creation
    this.refreshCache().catch(err => {
      console.error('Error initializing market event cache:', err);
    });
  }

  // Get all events from Firebase (with caching)
  async getEvents() {
    try {
      // Check if cache is still valid
      const now = Date.now();
      if (
        this.eventsCache.length > 0 &&
        this.cacheTimestamp &&
        now - this.cacheTimestamp < this.cacheTimeout
      ) {
        return this.eventsCache;
      }

      // Fetch from Firebase
      const events = await firebaseService.getMarketEvents();
      
      // Convert Firebase timestamps to ISO strings for compatibility
      const processedEvents = events.map((event) => {
        const processed = { ...event };
        if (processed.createdAt?.toDate) {
          processed.createdAt = processed.createdAt.toDate().toISOString();
        }
        if (processed.updatedAt?.toDate) {
          processed.updatedAt = processed.updatedAt.toDate().toISOString();
        }
        if (processed.checkedInAt?.toDate) {
          processed.checkedInAt = processed.checkedInAt.toDate().toISOString();
        }
        if (processed.checkedOutAt?.toDate) {
          processed.checkedOutAt = processed.checkedOutAt.toDate().toISOString();
        }
        return processed;
      });

      // Update cache
      this.eventsCache = processedEvents;
      this.cacheTimestamp = now;

      return processedEvents;
    } catch (error) {
      console.error('Error loading events from Firebase:', error);
      // Fallback to localStorage for backward compatibility
      try {
        const stored = localStorage.getItem('marketEvents');
        return stored ? JSON.parse(stored) : [];
      } catch (localError) {
        console.error('Error loading events from localStorage:', localError);
        return [];
      }
    }
  }

  // Refresh the cache
  async refreshCache() {
    this.cacheTimestamp = null;
    return await this.getEvents();
  }

  // Check if an event is currently active (within start and end time)
  isEventActive(event) {
    const now = new Date();
    const startTime = new Date(event.startDateTime);
    const endTime = new Date(event.endDateTime);
    return now >= startTime && now <= endTime;
  }

  // Get active market events (sync version using cache)
  getActiveEventsSync() {
    return this.eventsCache.filter((event) => this.isEventActive(event));
  }

  // Get active market events (async version)
  async getActiveEvents() {
    const events = await this.getEvents();
    return events.filter((event) => this.isEventActive(event));
  }

  // Get the first active event (if multiple, return the first one) - sync version
  getActiveEventSync() {
    const activeEvents = this.getActiveEventsSync();
    return activeEvents.length > 0 ? activeEvents[0] : null;
  }

  // Get the first active event (async version)
  async getActiveEvent() {
    const activeEvents = await this.getActiveEvents();
    return activeEvents.length > 0 ? activeEvents[0] : null;
  }

  // Check if user is checked into an event (sync version)
  isUserCheckedInSync(eventId) {
    try {
      const event = this.eventsCache.find((e) => e.id === eventId);
      return event ? event.checkedIn === true : false;
    } catch (error) {
      console.error('Error checking check-in status:', error);
      return false;
    }
  }

  // Check if user is checked into an event (async version)
  async isUserCheckedIn(eventId) {
    try {
      const events = await this.getEvents();
      const event = events.find((e) => e.id === eventId);
      return event ? event.checkedIn === true : false;
    } catch (error) {
      console.error('Error checking check-in status:', error);
      return false;
    }
  }

  // Set user as checked into an event (legacy method, kept for compatibility - now uses cache)
  checkInToEvent(eventId) {
    try {
      const event = this.eventsCache.find((e) => e.id === eventId);
      if (event) {
        // This is a legacy method - actual check-in should be done via Firebase
        // This just updates the cache for immediate UI updates
        event.checkedIn = true;
        event.checkedInAt = new Date().toISOString();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error checking in:', error);
      return false;
    }
  }

  // Check out of an event (legacy method, kept for compatibility - now uses cache)
  checkOutOfEvent(eventId) {
    try {
      const event = this.eventsCache.find((e) => e.id === eventId);
      if (event) {
        // This is a legacy method - actual check-out should be done via Firebase
        // This just updates the cache for immediate UI updates
        event.checkedOut = true;
        event.checkedOutAt = new Date().toISOString();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error checking out:', error);
      return false;
    }
  }

  // Check if user is checked into any active event (sync version)
  isCheckedIntoActiveEvent() {
    const activeEvent = this.getActiveEventSync();
    if (!activeEvent) return false;
    return this.isUserCheckedInSync(activeEvent.id);
  }

  // Get the event the user is currently checked into (if any) - sync version
  // An event is "live" only if:
  // 1. It's within the start and end time window, AND
  // 2. An admin has checked into it (checkedIn === true), AND
  // 3. The admin has NOT checked out yet (checkedOut !== true)
  getCheckedInEvent() {
    // If cache is empty, try to trigger async refresh (but return null for now)
    // The cache will be populated on next check
    if (this.eventsCache.length === 0) {
      // Trigger async refresh in background (fire and forget)
      this.refreshCache().catch(err => {
        console.error('Error refreshing cache in getCheckedInEvent:', err);
      });
      return null;
    }

    const activeEvent = this.getActiveEventSync();
    if (!activeEvent) return null;
    
    // Check if admin is checked in and not checked out
    if (activeEvent.checkedIn === true && activeEvent.checkedOut !== true) {
      return activeEvent;
    }
    
    return null;
  }

  // Get the event the user is currently checked into (async version)
  async getCheckedInEventAsync() {
    const activeEvent = await this.getActiveEvent();
    if (!activeEvent) return null;
    
    // Check if admin is checked in and not checked out
    if (activeEvent.checkedIn === true && activeEvent.checkedOut !== true) {
      return activeEvent;
    }
    
    return null;
  }
}

export const marketEventService = new MarketEventService();

