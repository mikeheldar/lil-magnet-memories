// Service to detect and manage active market events and check-in status
import { firebaseService } from './firebaseService.js';
import { authService } from './authService.js';
import { auth } from '../firebase/config.js';
import { signInAnonymously } from 'firebase/auth';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config.js';

// Track if we've waited for auth state restoration on this page load
let authStateWaitCompleted = false;
const AUTH_STATE_WAIT_TIME = 500; // ms to wait for Firebase to restore auth state

class MarketEventService {
  constructor() {
    this.eventsCache = [];
    this.cacheTimestamp = null;
    this.cacheTimeout = 30000; // Cache for 30 seconds (shorter for faster updates)
    this.listenerUnsubscribe = null;
    this.listeners = new Set(); // Set of callback functions to notify on changes
    
    // Ensure anonymous auth before initializing real-time listener
    this.ensureAuth().then(() => {
      // Set up real-time listener immediately
      this.setupRealtimeListener();
    }).catch(err => {
      console.error('Error ensuring auth for market events:', err);
      // Try to set up listener anyway
      this.setupRealtimeListener();
    });
  }

  // Set up real-time Firestore listener for immediate updates
  setupRealtimeListener() {
    // Unsubscribe from existing listener if any
    if (this.listenerUnsubscribe) {
      this.listenerUnsubscribe();
      this.listenerUnsubscribe = null;
    }

    try {
      const eventsRef = collection(db, 'marketEvents');
      const q = query(eventsRef, orderBy('startDateTime', 'desc'));
      
      // Set up real-time listener
      this.listenerUnsubscribe = onSnapshot(
        q,
        (querySnapshot) => {
          console.log('🔄 Market events updated in real-time');
          const events = [];
          querySnapshot.forEach((doc) => {
            const eventData = doc.data();
            events.push({
              id: doc.id,
              ...eventData,
            });
          });

          // Convert Firebase timestamps to ISO strings for compatibility
          let processedEvents = events.map((event) => {
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

          // Filter out testing events for non-admin users
          const isAdmin = authService.isAdmin();
          if (!isAdmin) {
            processedEvents = processedEvents.filter(event => !event.isTesting);
          }

          // Update cache immediately
          this.eventsCache = processedEvents;
          this.cacheTimestamp = Date.now();

          // Notify all listeners
          this.notifyListeners();
        },
        (error) => {
          console.error('Error in market events real-time listener:', error);
          // Fallback to periodic refresh if listener fails
          this.refreshCache().catch(err => {
            console.error('Error refreshing cache after listener error:', err);
          });
        }
      );
    } catch (error) {
      console.error('Error setting up market events real-time listener:', error);
      // Fallback to initial cache refresh
      this.refreshCache().catch(err => {
        console.error('Error initializing market event cache:', err);
      });
    }
  }

  // Add a listener callback that will be called when events change
  addListener(callback) {
    this.listeners.add(callback);
    // Immediately call with current state
    if (this.eventsCache.length > 0) {
      callback();
    }
    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  // Notify all listeners that events have changed
  notifyListeners() {
    this.listeners.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('Error in market event listener callback:', error);
      }
    });
  }

  // Cleanup method to unsubscribe from listener
  cleanup() {
    if (this.listenerUnsubscribe) {
      this.listenerUnsubscribe();
      this.listenerUnsubscribe = null;
    }
    this.listeners.clear();
  }

  // Ensure we have an auth context (anonymous if needed) for Firestore reads
  // Only sign in anonymously if there's no user OR the current user is anonymous
  // Never replace an authenticated user with anonymous
  async ensureAuth() {
    try {
      // Wait once per page load to allow Firebase to restore authenticated sessions
      if (!authStateWaitCompleted) {
        await new Promise((resolve) => setTimeout(resolve, AUTH_STATE_WAIT_TIME));
        authStateWaitCompleted = true;
      }
      const currentUser = auth.currentUser;
      if (!currentUser || currentUser.isAnonymous) {
        // Sign in anonymously to ensure we can read market events
        // This is silent - users won't see any indication
        await signInAnonymously(auth);
      }
    } catch (error) {
      // Non-blocking - if anonymous sign-in fails, we'll try to read anyway
      // Firestore rules might allow unauthenticated reads
      console.error('Error ensuring auth (non-blocking):', error);
    }
  }

  // Get all events from Firebase (with caching)
  async getEvents() {
    try {
      // Ensure we have auth before reading
      await this.ensureAuth();

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
      let processedEvents = events.map((event) => {
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

      // Filter out testing events for non-admin users
      const isAdmin = authService.isAdmin();
      if (!isAdmin) {
        processedEvents = processedEvents.filter(event => !event.isTesting);
      }

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
    // With real-time listener, cache should be populated quickly
    // But if it's still empty, return null (listener will update it soon)
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

