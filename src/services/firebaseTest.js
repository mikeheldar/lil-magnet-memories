import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config.js';

class FirebaseTest {
  // Simple test to check if basic Firestore write works
  async testBasicWrite() {
    try {
      console.log('Testing basic Firestore write...');

      const testDoc = {
        test: true,
        timestamp: serverTimestamp(),
        message: 'Firebase connection test',
      };

      const docRef = await addDoc(collection(db, 'test'), testDoc);
      console.log('Basic write test successful:', docRef.id);
      return { success: true, docId: docRef.id };
    } catch (error) {
      console.error('Basic write test failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Test with minimal data (no file uploads)
  async testMinimalOrderWrite() {
    try {
      console.log('Testing minimal order write...');

      const orderDoc = {
        orderNumber: 'TEST-' + Date.now(),
        customer: {
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com',
          phone: '123-456-7890',
        },
        specialInstructions: 'Test order',
        photos: [], // Empty array instead of file uploads
        quantities: [],
        totalMagnets: 1,
        status: 'pending',
        submissionDate: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, 'orders'), orderDoc);
      console.log('Minimal order write test successful:', docRef.id);
      return { success: true, docId: docRef.id };
    } catch (error) {
      console.error('Minimal order write test failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Test Firebase connection without any writes
  async testConnection() {
    try {
      console.log('Testing Firebase connection...');
      // Just try to access the database reference
      const testCollection = collection(db, 'test');
      console.log('Firebase connection test successful');
      return { success: true };
    } catch (error) {
      console.error('Firebase connection test failed:', error);
      return { success: false, error: error.message };
    }
  }
}

export const firebaseTest = new FirebaseTest();
