/**
 * Market Event Controller
 * Utilities to create, activate, deactivate, and manage market events for testing
 */

import { adminDb } from '../../../src/firebase/config';
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  getDoc,
  query,
  where,
  getDocs,
  deleteDoc,
} from 'firebase/firestore';

export interface MarketEvent {
  id?: string;
  name: string;
  location: string;
  startDateTime: string;
  endDateTime: string;
  checkedIn: boolean;
  checkedOut: boolean;
  isTesting: boolean;
}

export class MarketEventController {
  private static testEvents: MarketEvent[] = [];

  /**
   * Create a test market event
   */
  static async createEvent(
    event: Omit<MarketEvent, 'id' | 'checkedIn' | 'checkedOut'>
  ): Promise<string> {
    try {
      const eventData: MarketEvent = {
        ...event,
        checkedIn: false,
        checkedOut: false,
      };

      // In a real implementation, you would use Firebase Admin SDK
      // For now, we'll store in memory for testing
      const id = `test-event-${Date.now()}`;
      this.testEvents.push({ ...eventData, id });

      return id;
    } catch (error) {
      console.error('Error creating market event:', error);
      throw error;
    }
  }

  /**
   * Check in to a market event (activate it)
   */
  static async checkIn(eventId: string): Promise<void> {
    const event = this.testEvents.find((e) => e.id === eventId);
    if (event) {
      event.checkedIn = true;
      event.checkedOut = false;
    }
  }

  /**
   * Check out of a market event (deactivate it)
   */
  static async checkOut(eventId: string): Promise<void> {
    const event = this.testEvents.find((e) => e.id === eventId);
    if (event) {
      event.checkedOut = true;
      event.checkedIn = false;
    }
  }

  /**
   * Get active market event
   */
  static getActiveEvent(): MarketEvent | null {
    return this.testEvents.find((e) => e.checkedIn && !e.checkedOut) || null;
  }

  /**
   * Deactivate all market events
   */
  static async deactivateAll(): Promise<void> {
    this.testEvents.forEach((event) => {
      event.checkedIn = false;
      event.checkedOut = true;
    });
  }

  /**
   * Delete a test market event
   */
  static async deleteEvent(eventId: string): Promise<void> {
    this.testEvents = this.testEvents.filter((e) => e.id !== eventId);
  }

  /**
   * Clean up all test events
   */
  static async cleanup(): Promise<void> {
    this.testEvents = [];
  }

  /**
   * Get all test events
   */
  static getAllEvents(): MarketEvent[] {
    return [...this.testEvents];
  }
}

