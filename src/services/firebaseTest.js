import { collection, addDoc, serverTimestamp, getDocs, query, limit } from 'firebase/firestore';
import { db, ensureNetworkReady, retryOnOffline, auth } from '../firebase/config.js';
import { config } from '../config/environment.js';

class FirebaseTest {
  // Get comprehensive diagnostic information
  async getDiagnosticInfo() {
    const info = {
      timestamp: new Date().toISOString(),
      environment: {
        isTest: config.isTest,
        environment: config.environment,
        hostname: window.location.hostname,
        origin: window.location.origin,
      },
      browser: {
        userAgent: navigator.userAgent,
        online: navigator.onLine,
        cookieEnabled: navigator.cookieEnabled,
        language: navigator.language,
      },
      firebase: {
        projectId: config.firebase.projectId,
        authDomain: config.firebase.authDomain,
        storageBucket: config.firebase.storageBucket,
      },
      auth: {
        currentUser: null,
        isAnonymous: false,
        hasUser: false,
        uid: null,
        email: null,
      },
      firestore: {
        connectionState: 'unknown',
        networkEnabled: false,
        canRead: false,
        canWrite: false,
        error: null,
      },
      indexedDB: {
        available: typeof indexedDB !== 'undefined',
        databases: [],
      },
      errors: [],
    };

    try {
      // Check auth state
      if (auth?.currentUser) {
        info.auth.currentUser = auth.currentUser;
        info.auth.isAnonymous = auth.currentUser.isAnonymous;
        info.auth.hasUser = true;
        info.auth.uid = auth.currentUser.uid;
        info.auth.email = auth.currentUser.email;
      }

      // Check IndexedDB
      if (info.indexedDB.available) {
        try {
          const databases = await indexedDB.databases();
          info.indexedDB.databases = databases.map(db => db.name);
        } catch (e) {
          info.indexedDB.error = e.message;
        }
      }

      // Check Firestore network state
      try {
        const { ensureNetworkReady } = await import('../firebase/config.js');
        await ensureNetworkReady();
        info.firestore.networkEnabled = true;
      } catch (e) {
        info.firestore.error = e.message;
        info.errors.push(`Network check failed: ${e.message}`);
      }

      // Try to read from Firestore
      try {
        const testRef = collection(db, 'user_roles');
        const testQuery = query(testRef, limit(1));
        const snapshot = await Promise.race([
          getDocs(testQuery),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Read timeout after 5s')), 5000))
        ]);
        info.firestore.canRead = true;
        info.firestore.connectionState = 'connected';
      } catch (e) {
        info.firestore.canRead = false;
        info.firestore.connectionState = 'disconnected';
        info.firestore.error = e.message;
        info.errors.push(`Read test failed: ${e.message} (code: ${e.code || 'unknown'})`);
      }

    } catch (error) {
      info.errors.push(`Diagnostic info collection failed: ${error.message}`);
    }

    return info;
  }

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
      return { 
        success: false, 
        error: error.message,
        code: error.code,
        details: {
          name: error.name,
          stack: error.stack,
        }
      };
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
      
      // Try to read from a known collection
      const testRef = collection(db, 'user_roles');
      const testQuery = query(testRef, limit(1));
      
      const snapshot = await Promise.race([
        getDocs(testQuery),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Connection timeout after 10s')), 10000))
      ]);
      
      console.log('Firebase connection test successful');
      return { 
        success: true,
        details: {
          collection: 'user_roles',
          documentCount: snapshot.size,
        }
      };
    } catch (error) {
      console.error('Firebase connection test failed:', error);
      return { 
        success: false, 
        error: error.message,
        code: error.code,
        details: {
          name: error.name,
          message: error.message,
        }
      };
    }
  }

  // Test with retry mechanism
  async testWithRetry() {
    try {
      console.log('Testing Firestore write with retry mechanism...');
      
      const testDoc = {
        test: true,
        timestamp: serverTimestamp(),
        message: 'Firebase retry test',
        testType: 'retry',
      };

      const docRef = await retryOnOffline(async () => {
        return await addDoc(collection(db, 'test'), testDoc);
      });
      
      console.log('Retry test successful:', docRef.id);
      return { success: true, docId: docRef.id };
    } catch (error) {
      console.error('Retry test failed:', error);
      return { 
        success: false, 
        error: error.message,
        code: error.code,
      };
    }
  }
}

export const firebaseTest = new FirebaseTest();
