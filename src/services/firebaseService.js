import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { ref, uploadBytes, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { auth } from '../firebase/config.js';
import { signInAnonymously } from 'firebase/auth';
import { db, storage } from '../firebase/config.js';

export const DEFAULT_SHIPPING_OPTIONS = [
  {
    id: 'standard_shipping',
    value: 'standard_shipping',
    label: 'Standard Shipping',
    description: 'Ships via USPS with tracking in about 5-7 business days.',
    estimatedTimeline: 'Estimated delivery in 5-7 business days',
    cost: 5,
    type: 'shipping',
    allowAddress: true,
    requiresAddress: true, // Default to requiring address
    default: true,
  },
  {
    id: 'expedited_shipping',
    value: 'expedited_shipping',
    label: 'Expedited Shipping',
    description: 'Priority handling with faster door-to-door delivery.',
    estimatedTimeline: 'Estimated delivery in 2-3 business days',
    cost: 15,
    type: 'shipping',
    allowAddress: true,
    requiresAddress: true, // Default to requiring address
  },
  {
    id: 'collect_at_event',
    value: 'collect_at_event',
    label: 'Collect at Market Event',
    description: 'Pick up your magnets at the market booth for free.',
    estimatedTimeline: 'Ready for pickup at the event',
    cost: 0,
    type: 'pickup',
    allowAddress: false,
    requiresAddress: false, // Pickup doesn't require address
  },
];

// Track if we've waited for auth state restoration on this page load
let authStateWaitCompleted = false;
const AUTH_STATE_WAIT_TIME = 500; // ms to wait for Firebase to restore auth state

class FirebaseService {
  // Upload photos to Firebase Storage with progress tracking
  async uploadPhotos(photos, onProgress = null) {
    // Ensure we have an auth context for Storage rules (request.auth != null)
    // Do this silently - don't expose anonymous auth to users
    // Only sign in anonymously if there's no user OR the current user is anonymous
    // Wait once per page load to allow Firebase to restore authenticated sessions
    if (!authStateWaitCompleted) {
      await new Promise((resolve) => setTimeout(resolve, AUTH_STATE_WAIT_TIME));
      authStateWaitCompleted = true;
    }
    const currentUser = auth?.currentUser;
    if (!currentUser || currentUser.isAnonymous) {
      try {
        const userCredential = await signInAnonymously(auth);
        // Wait a moment for auth state to propagate
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (e) {
        // Silent failure - proceed with uploads anyway
        // Storage rules may reject if they require auth, but we'll try
      }
    }

    console.log(`Starting parallel upload of ${photos.length} photos...`);
    const timestamp = Date.now();

    // Track progress for each photo
    const progressMap = new Map();
    const totalSize = photos.reduce((sum, photo) => sum + (photo.size || 0), 0);
    let totalUploaded = 0;

    // Helper to update overall progress
    const updateOverallProgress = () => {
      if (onProgress) {
        // Calculate total size from actual uploads if available (more accurate)
        let actualTotalSize = totalSize;
        const allProgress = Array.from(progressMap.values());
        if (allProgress.length > 0) {
          const sumOfTotals = allProgress.reduce((sum, p) => sum + (p.total || 0), 0);
          if (sumOfTotals > 0) {
            actualTotalSize = sumOfTotals;
          }
        }
        
        const overallPercent = actualTotalSize > 0 
          ? Math.min(100, Math.round((totalUploaded / actualTotalSize) * 100))
          : 0;
        const completedCount = allProgress.filter(p => p.completed).length;
        
        const progressData = {
          overall: overallPercent,
          completed: completedCount,
          total: photos.length,
          uploaded: totalUploaded,
          totalSize: actualTotalSize,
        };
        
        // Call the progress callback with error handling
        try {
          onProgress(progressData);
        } catch (error) {
          console.error('Error in progress callback:', error);
        }
      }
    };

    // Upload all photos in parallel for much faster uploads
    const uploadPromises = photos.map(async (photo, i) => {
      // Sanitize filename to avoid issues with special characters
      // Replace problematic characters but keep the original name for display
      const sanitizedName = photo.name
        .replace(/[#\[\]()]/g, '_') // Replace special chars that can cause issues
        .replace(/\s+/g, '_'); // Replace spaces with underscores
      const fileName = `orders/${timestamp}_${i}_${sanitizedName}`;
      const storageRef = ref(storage, fileName);

      try {
        console.log(`Uploading photo ${i + 1}/${photos.length}: ${photo.name} (${(photo.size / 1024 / 1024).toFixed(2)} MB)`);
        const uploadStartTime = Date.now();
        
        // Provide metadata to avoid multipart quirks and ensure proper Content-Type
        const metadata = {
          contentType: photo.type || 'image/jpeg',
          cacheControl: 'public,max-age=3600',
        };

        const uploadTask = uploadBytesResumable(storageRef, photo, metadata);
        
        // Initialize progress tracking for this photo
        progressMap.set(i, { uploaded: 0, total: photo.size || 0, completed: false });
        let lastProgressUpdate = Date.now();
        let lastBytesTransferred = 0;
        
        await new Promise((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            (snapshot) => {
              // Update progress for this specific photo
              const bytesTransferred = snapshot.bytesTransferred;
              const totalBytes = snapshot.totalBytes;
              const photoProgress = progressMap.get(i);
              
              if (photoProgress) {
                const previousUploaded = photoProgress.uploaded;
                photoProgress.uploaded = bytesTransferred;
                photoProgress.total = totalBytes; // Update total in case it wasn't known initially
                
                // Calculate bytes uploaded since last update
                const bytesDelta = bytesTransferred - previousUploaded;
                totalUploaded += bytesDelta;
                
                // Log upload speed every second
                const now = Date.now();
                const timeDelta = now - lastProgressUpdate;
                if (timeDelta >= 1000) { // Log every second
                  const bytesSinceLastUpdate = bytesTransferred - lastBytesTransferred;
                  const speedMBps = (bytesSinceLastUpdate / 1024 / 1024) / (timeDelta / 1000);
                  const elapsedSeconds = (now - uploadStartTime) / 1000;
                  const totalMB = bytesTransferred / 1024 / 1024;
                  
                  console.log(`📤 Photo ${i + 1}/${photos.length} (${photo.name}): ${totalMB.toFixed(2)} MB uploaded in ${elapsedSeconds.toFixed(1)}s (${speedMBps.toFixed(2)} MB/s)`);
                  
                  lastProgressUpdate = now;
                  lastBytesTransferred = bytesTransferred;
                }
                
                // Update overall progress immediately (this triggers the callback)
                updateOverallProgress();
              }
            },
            (err) => reject(err),
            () => {
              // Mark as completed
              const uploadEndTime = Date.now();
              const uploadDuration = (uploadEndTime - uploadStartTime) / 1000;
              const totalMB = (photo.size || 0) / 1024 / 1024;
              const avgSpeedMBps = totalMB / uploadDuration;
              
              const photoProgress = progressMap.get(i);
              if (photoProgress) {
                photoProgress.completed = true;
                photoProgress.uploaded = photoProgress.total;
                updateOverallProgress();
              }
              
              console.log(`✅ Photo ${i + 1}/${photos.length} (${photo.name}) completed: ${totalMB.toFixed(2)} MB in ${uploadDuration.toFixed(1)}s (avg ${avgSpeedMBps.toFixed(2)} MB/s)`);
              resolve();
            }
          );
        });
        
        const downloadURL = await getDownloadURL(storageRef);
        console.log(`Photo ${i + 1} uploaded successfully`);

        return {
          name: photo.name,
          url: downloadURL,
          fileName: fileName,
          size: photo.size,
          type: photo.type,
        };
      } catch (error) {
        console.error(`Error uploading photo ${i + 1}:`, error);
        // Mark as completed even on error to update progress
        const photoProgress = progressMap.get(i);
        if (photoProgress) {
          photoProgress.completed = true;
        }
        updateOverallProgress();
        throw error;
      }
    });

    // Wait for all uploads to complete in parallel
    const uploadedPhotos = await Promise.all(uploadPromises);
    console.log(`All ${photos.length} photos uploaded successfully`);
    
    // Final progress update
    if (onProgress) {
      onProgress({
        overall: 100,
        completed: photos.length,
        total: photos.length,
        uploaded: totalSize,
        totalSize: totalSize,
      });
    }
    
    return uploadedPhotos;
  }

  // Save order to Firestore
  async saveOrder(orderData, onProgress = null) {
    try {
      // Upload photos first
      console.log('Starting photo uploads...');
      const uploadedPhotos = await this.uploadPhotos(orderData.photos, onProgress);
      console.log(`Photo uploads completed: ${uploadedPhotos.length} photos uploaded`);

      // Prepare order document
      const orderDoc = {
        orderNumber: orderData.orderNumber,
        customer: {
          firstName: orderData.firstName,
          lastName: orderData.lastName,
          email: orderData.email,
          phone: orderData.phone || '',
        },
        userId: orderData.userId || null,
        specialInstructions: orderData.specialInstructions || '',
        photos: uploadedPhotos,
        quantities: orderData.quantities,
        totalMagnets: orderData.totalMagnets,
        status: 'new',
        submissionDate: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Ensure we have an auth context for Firestore rules (request.auth != null)
      // This is critical - Firestore rules require authentication
      // Only sign in anonymously if there's no user OR the current user is anonymous
      // Never replace an authenticated user with anonymous
      // Wait once per page load to allow Firebase to restore authenticated sessions
      if (!authStateWaitCompleted) {
        await new Promise((resolve) => setTimeout(resolve, AUTH_STATE_WAIT_TIME));
        authStateWaitCompleted = true;
      }
      const currentUser = auth?.currentUser;
      if (!currentUser || currentUser.isAnonymous) {
        console.log('No authenticated user before Firestore save, signing in anonymously...');
        try {
          await signInAnonymously(auth);
          // Auth state should propagate immediately
          console.log('Anonymous sign-in completed, current user:', auth.currentUser?.uid);
        } catch (authError) {
          console.error('Anonymous sign-in failed before Firestore save:', authError);
          // Continue anyway - rules might allow unauthenticated writes
        }
      } else {
        console.log('User already authenticated:', auth.currentUser.uid);
      }

      // Log the operation (Step 1: Track when errors occur)
      const { logOperation, completeOperation } = await import('../utils/firestoreLogger.js');
      const logId = logOperation('saveOrder', {
        collection: 'orders',
        orderNumber: orderData.orderNumber,
        photoCount: orderDoc.photos.length,
      });
      
      // Add to Firestore with timeout (increased to 30 seconds to account for slow uploads)
      console.log('Saving order to Firestore...');
      console.log('Firestore database:', db.app.options.projectId);
      console.log('Current auth user:', auth?.currentUser?.uid || 'null');
      console.log('Order document to save:', { ...orderDoc, photos: `[${orderDoc.photos.length} photos]` });
      
      const savePromise = addDoc(collection(db, 'orders'), orderDoc)
        .then((docRef) => {
          completeOperation(logId, { data: { docId: docRef.id } });
          return docRef;
        })
        .catch((error) => {
          completeOperation(logId, { error });
          console.error('Firestore save error details:', error);
          console.error('Error code:', error.code);
          console.error('Error message:', error.message);
          throw error;
        });
      
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error('Firebase operation timed out after 30 seconds')),
          30000
        )
      );

      const docRef = await Promise.race([savePromise, timeoutPromise]);
      console.log('Order saved with ID:', docRef.id);

      // Send email notification for new order (to admin)
      try {
        await this.sendOrderEmail({
          firstName: orderData.firstName,
          lastName: orderData.lastName,
          email: orderData.email,
          phone: orderData.phone || '',
          specialInstructions: orderData.specialInstructions || '',
          photos: uploadedPhotos,
          quantities: orderData.quantities,
          orderNumber: orderData.orderNumber,
          totalMagnets: orderData.totalMagnets,
        });
        console.log('Order email sent successfully');
      } catch (emailError) {
        console.error('Failed to send order email:', emailError);
        // Don't throw error - order was saved successfully
      }

      // Send status update email to customer
      try {
        await this.sendStatusUpdateEmail({
          firstName: orderData.firstName,
          lastName: orderData.lastName,
          email: orderData.email,
          orderNumber: orderData.orderNumber,
          status: 'new',
          photos: uploadedPhotos,
          quantities: orderData.quantities,
          totalMagnets: orderData.totalMagnets,
        });
        console.log('Status update email sent successfully');
      } catch (statusEmailError) {
        console.error('Failed to send status update email:', statusEmailError);
        // Don't throw error - order was saved successfully
      }

      return {
        id: docRef.id,
        ...orderDoc,
      };
    } catch (error) {
      console.error('Error saving order:', error);
      throw error;
    }
  }

  // Get all orders
  async getOrders() {
    try {
      const ordersRef = collection(db, 'orders');
      const q = query(ordersRef, orderBy('submissionDate', 'desc'));
      const querySnapshot = await getDocs(q);

      const orders = [];
      querySnapshot.forEach((doc) => {
        orders.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      return orders;
    } catch (error) {
      console.error('Error getting orders:', error);
      throw error;
    }
  }

  // Get orders for a specific user (by userId or email)
  async getUserOrders(userId, userEmail = null) {
    try {
      const ordersRef = collection(db, 'orders');
      const q = query(ordersRef, orderBy('submissionDate', 'desc'));
      const querySnapshot = await getDocs(q);

      const orders = [];
      querySnapshot.forEach((doc) => {
        const orderData = doc.data();
        const matchesUserId = orderData.userId === userId;
        const matchesEmail =
          userEmail && orderData.customer?.email === userEmail;

        if (matchesUserId || matchesEmail) {
          orders.push({
            id: doc.id,
            ...orderData,
          });
        }
      });

      return orders;
    } catch (error) {
      console.error('Error getting user orders:', error);
      throw error;
    }
  }

  // Update order status
  async updateOrderStatus(orderId, status) {
    try {
      // First get the order details
      const orderRef = doc(db, 'orders', orderId);
      const orderDoc = await this.getOrderById(orderId);

      if (!orderDoc) {
        throw new Error('Order not found');
      }

      // Update the status
      await updateDoc(orderRef, {
        status: status,
        updatedAt: serverTimestamp(),
      });

      // Send status update email to customer
      try {
        await this.sendStatusUpdateEmail({
          firstName: orderDoc.customer.firstName,
          lastName: orderDoc.customer.lastName,
          email: orderDoc.customer.email,
          orderNumber: orderDoc.orderNumber,
          status: status,
          photos: orderDoc.photos,
          quantities: orderDoc.quantities,
          totalMagnets: orderDoc.totalMagnets,
        });
        console.log('Status update email sent successfully');
      } catch (statusEmailError) {
        console.error('Failed to send status update email:', statusEmailError);
        // Don't throw error - status was updated successfully
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  }

  // Update shipping status
  async updateShippingStatus(orderId, shippingStatus) {
    try {
      const orderRef = doc(db, 'orders', orderId);
      const orderDoc = await this.getOrderById(orderId);

      if (!orderDoc) {
        throw new Error('Order not found');
      }

      // Update the shipping status
      await updateDoc(orderRef, {
        shippingStatus: shippingStatus,
        updatedAt: serverTimestamp(),
      });

      // Send shipping status update email to customer if order has shipping
      if (orderDoc.shippingOption && orderDoc.shippingOption.type === 'shipping') {
        try {
          // You can add email notification for shipping updates here if needed
          console.log('Shipping status updated:', shippingStatus);
        } catch (emailError) {
          console.error('Failed to send shipping status email:', emailError);
          // Don't throw error - status was updated successfully
        }
      }
    } catch (error) {
      console.error('Error updating shipping status:', error);
      throw error;
    }
  }

  // Delete order
  async deleteOrder(orderId) {
    try {
      await deleteDoc(doc(db, 'orders', orderId));
    } catch (error) {
      console.error('Error deleting order:', error);
      throw error;
    }
  }

  // Delete photo from Firebase Storage
  async deletePhotoFromStorage(photoUrl) {
    try {
      // Extract the file path from the URL
      // Firebase Storage URLs are like: https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{path}?alt=media&token={token}
      const urlObj = new URL(photoUrl);
      const pathMatch = urlObj.pathname.match(/\/o\/(.+)\?/);
      if (!pathMatch) {
        throw new Error('Invalid photo URL format');
      }
      const filePath = decodeURIComponent(pathMatch[1]);
      const storageRef = ref(storage, filePath);
      await deleteObject(storageRef);
      console.log('Photo deleted from Storage:', filePath);
    } catch (error) {
      console.error('Error deleting photo from Storage:', error);
      throw error;
    }
  }

  // Find orders containing a specific photo
  async findOrdersWithPhoto(photoUrl, photoName) {
    try {
      const orders = await this.getOrders();
      const matchingOrders = [];

      orders.forEach((order) => {
        let hasPhoto = false;

        // Check legacy photo-based orders
        if (order.photos && order.photos.length > 0) {
          hasPhoto = order.photos.some((photo) => {
            return photo.url === photoUrl || photo.name === photoName;
          });
        }

        // Check cart-based orders
        if (!hasPhoto && order.cartItems && order.cartItems.length > 0) {
          order.cartItems.forEach((item) => {
            if (item.isCustomUpload && item.photos) {
              const found = item.photos.some((photo) => {
                return photo.url === photoUrl || photo.name === photoName;
              });
              if (found) {
                hasPhoto = true;
              }
            }
          });
        }

        if (hasPhoto) {
          matchingOrders.push(order);
        }
      });

      return matchingOrders;
    } catch (error) {
      console.error('Error finding orders with photo:', error);
      throw error;
    }
  }

  // Get order by ID
  async getOrderById(orderId) {
    try {
      const orderRef = doc(db, 'orders', orderId);
      const orderDoc = await getDoc(orderRef);

      if (orderDoc.exists()) {
        return {
          id: orderDoc.id,
          ...orderDoc.data(),
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting order by ID:', error);
      throw error;
    }
  }

  // Send order email (to admin)
  async sendOrderEmail(orderData) {
    try {
      const response = await fetch(
        'https://us-central1-lil-magnet-memories.cloudfunctions.net/api/send-order-email',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(orderData),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error sending order email:', error);
      throw error;
    }
  }

  // Send status update email (to customer)
  async sendStatusUpdateEmail(orderData) {
    try {
      const response = await fetch(
        'https://us-central1-lil-magnet-memories.cloudfunctions.net/api/send-status-update-email',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(orderData),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error sending status update email:', error);
      throw error;
    }
  }

  async processSquarePayment(paymentData) {
    try {
      const response = await fetch(
        'https://us-central1-lil-magnet-memories.cloudfunctions.net/api/payments/create',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(paymentData),
        }
      );

      let result = null;
      try {
        result = await response.json();
      } catch (parseError) {
        if (!response.ok) {
          throw new Error('Failed to process Square payment');
        }
        return null;
      }

      if (!response.ok) {
        const errorMessage =
          result?.error || 'Failed to process Square payment';
        const error = new Error(errorMessage);
        error.details = result?.details || null;
        throw error;
      }

      if (result?.error) {
        const error = new Error(result.error);
        error.details = result?.details || null;
        throw error;
      }

      return result;
    } catch (error) {
      console.error('Error processing Square payment:', error);
      throw error;
    }
  }

  // Product Management Methods
  async getProducts(includeTesting = false) {
    try {
      const productsCollection = collection(db, 'products');
      const q = query(productsCollection, orderBy('description', 'asc'));
      const querySnapshot = await getDocs(q);

      const products = [];
      querySnapshot.forEach((doc) => {
        const productData = {
          id: doc.id,
          ...doc.data(),
        };
        // Filter out testing products unless explicitly requested (for admins)
        if (!includeTesting && productData.isTesting === true) {
          return;
        }
        products.push(productData);
      });

      return products;
    } catch (error) {
      console.error('Error getting products:', error);
      throw error;
    }
  }

  async getShippingOptions(includeTesting = false) {
    try {
      const shippingDocRef = doc(db, 'settings', 'shippingOptions');
      const snapshot = await getDoc(shippingDocRef);
      let options = [];
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (Array.isArray(data?.options) && data.options.length > 0) {
          options = data.options;
        }
      }
      
      // If no options in database, use defaults
      if (options.length === 0) {
        options = DEFAULT_SHIPPING_OPTIONS.map((option) => ({ ...option }));
      }
      
      // Filter out testing options unless explicitly requested (for admins)
      if (!includeTesting) {
        options = options.filter((option) => !option.isTesting);
      }
      
      return options;
    } catch (error) {
      console.error('Error loading shipping options:', error);
      // Return defaults filtered by testing flag
      const defaults = DEFAULT_SHIPPING_OPTIONS.map((option) => ({ ...option }));
      if (!includeTesting) {
        return defaults.filter((option) => !option.isTesting);
      }
      return defaults;
    }
  }

  async saveShippingOptions(options) {
    try {
      const shippingDocRef = doc(db, 'settings', 'shippingOptions');
      await setDoc(
        shippingDocRef,
        {
          options,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (error) {
      console.error('Error saving shipping options:', error);
      throw error;
    }
  }

  async addProduct(productData) {
    try {
      const productsCollection = collection(db, 'products');
      const docRef = await addDoc(productsCollection, {
        ...productData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding product:', error);
      throw error;
    }
  }

  async updateProduct(productId, productData) {
    try {
      const productDoc = doc(db, 'products', productId);
      await updateDoc(productDoc, {
        ...productData,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  }

  async deleteProduct(productId) {
    try {
      const productDoc = doc(db, 'products', productId);
      await deleteDoc(productDoc);
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  }

  async uploadProductImage(file) {
    try {
      const fileName = `products/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, fileName);

      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      return downloadURL;
    } catch (error) {
      console.error('Error uploading product image:', error);
      throw error;
    }
  }

  // Cart Management Methods
  async saveUserCart(userId, cartItems) {
    try {
      if (!userId) {
        console.warn('⚠️ Cannot save cart: no user ID');
        return;
      }
      
      // Sanitize cart items for Firestore - remove base64 previews (too large for Firestore 1MB limit)
      // Keep only Firebase Storage URLs which are small and persistent
      const sanitizedItems = cartItems.map(item => {
        if (item.isCustomUpload && item.photos) {
          // Remove base64 previews, keep only Firebase Storage URLs
          const sanitizedPhotos = item.photos.map(photo => ({
            name: photo.name,
            url: photo.url, // Firebase Storage URL (persistent, small)
            // Don't include preview (base64 can be 1-5MB per image, exceeds Firestore limit)
            fileName: photo.fileName,
            size: photo.size,
            type: photo.type,
            quantity: photo.quantity,
          }));
          return {
            ...item,
            photos: sanitizedPhotos,
          };
        }
        return item;
      });
      
      // Calculate approximate size to warn if too large
      const estimatedSize = JSON.stringify(sanitizedItems).length;
      if (estimatedSize > 900000) { // Warn if approaching 1MB limit
        console.warn('⚠️ Cart size is large:', estimatedSize, 'bytes. Firestore limit is 1MB.');
      }
      
      const cartDocRef = doc(db, 'user_carts', userId);
      await setDoc(
        cartDocRef,
        {
          items: sanitizedItems,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      console.log('✅ Cart saved to Firestore for user:', userId, sanitizedItems.length, 'items', `(${estimatedSize} bytes)`);
    } catch (error) {
      console.error('❌ Error saving cart to Firestore:', error);
      console.error('   Error details:', {
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      throw error;
    }
  }

  async loadUserCart(userId) {
    try {
      if (!userId) {
        console.warn('⚠️ Cannot load cart: no user ID');
        return [];
      }
      console.log('📦 Loading cart from Firestore for user:', userId);
      const cartDocRef = doc(db, 'user_carts', userId);
      const snapshot = await getDoc(cartDocRef);
      if (snapshot.exists()) {
        const data = snapshot.data();
        const items = data.items || [];
        console.log('✅ Cart loaded from Firestore for user:', userId, items.length, 'items');
        return items;
      }
      console.log('ℹ️ No cart found in Firestore for user:', userId);
      return [];
    } catch (error) {
      console.error('❌ Error loading cart from Firestore:', error);
      return [];
    }
  }

  async clearUserCart(userId) {
    try {
      if (!userId) {
        console.warn('Cannot clear cart: no user ID');
        return;
      }
      const cartDocRef = doc(db, 'user_carts', userId);
      await deleteDoc(cartDocRef);
      console.log('Cart cleared from Firestore for user:', userId);
    } catch (error) {
      console.error('Error clearing cart from Firestore:', error);
      throw error;
    }
  }

  // Save cart-based order to Firestore
  async saveCartOrder(orderData) {
    try {
      const cartItems = JSON.parse(JSON.stringify(orderData.cartItems || []));
      const shippingOption = orderData.shippingOption
        ? JSON.parse(JSON.stringify(orderData.shippingOption))
        : null;
      const paymentOption = orderData.paymentOption
        ? JSON.parse(JSON.stringify(orderData.paymentOption))
        : null;

      // Prepare order document
      const orderDoc = {
        orderNumber: orderData.orderNumber,
        orderType: orderData.orderType || 'product_cart',
        cartItems,
        customer: orderData.customer,
        userId: orderData.userId || null,
        shippingOption,
        paymentOption,
        subtotal: orderData.subtotal || 0,
        shipping: orderData.shipping || 0,
        tax: orderData.tax || 0,
        totalAmount: orderData.totalAmount || 0,
        shippingTimeline: orderData.shippingTimeline || null,
        status: orderData.status || 'pending',
        // Set default shipping status for orders with shipping
        shippingStatus: shippingOption && shippingOption.type === 'shipping' ? 'pending' : null,
        submissionDate: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Add to Firestore with timeout
      const savePromise = addDoc(collection(db, 'orders'), orderDoc);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error('Firebase operation timed out')),
          10000
        )
      );

      const docRef = await Promise.race([savePromise, timeoutPromise]);
      console.log('Cart order saved with ID:', docRef.id);

      // Send email notification for new order (to admin)
      try {
        await this.sendOrderEmail({
          firstName: orderData.customer.firstName,
          lastName: orderData.customer.lastName,
          email: orderData.customer.email,
          phone: orderData.customer.phone || '',
          specialInstructions: `Order Type: Cart Order\nShipping: ${orderData.shippingOption.type}`,
          photos: [], // No photos for cart orders
          quantities: orderData.cartItems.map((item) => item.quantity),
          orderNumber: orderData.orderNumber,
          totalMagnets: orderData.cartItems.reduce(
            (sum, item) => sum + item.quantity,
            0
          ),
        });
        console.log('Order email sent successfully');
      } catch (emailError) {
        console.error('Failed to send order email:', emailError);
        // Don't throw error - order was saved successfully
      }

      return docRef.id;
    } catch (error) {
      console.error('Error saving cart order:', error);
      throw error;
    }
  }

  // Market Events Methods
  // Get all market events
  async getMarketEvents() {
    try {
      const eventsRef = collection(db, 'marketEvents');
      const q = query(eventsRef, orderBy('startDateTime', 'desc'));
      const querySnapshot = await getDocs(q);

      const events = [];
      querySnapshot.forEach((doc) => {
        events.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      return events;
    } catch (error) {
      console.error('Error getting market events:', error);
      throw error;
    }
  }

  // Create a new market event
  async createMarketEvent(eventData) {
    try {
      const eventDoc = {
        name: eventData.name,
        location: eventData.location,
        startDateTime: eventData.startDateTime,
        endDateTime: eventData.endDateTime,
        isTesting: eventData.isTesting || false,
        checkedIn: false,
        checkedOut: false,
        checkedInAt: null,
        checkedOutAt: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, 'marketEvents'), eventDoc);
      console.log('Market event created with ID:', docRef.id);
      return { id: docRef.id, ...eventDoc };
    } catch (error) {
      console.error('Error creating market event:', error);
      throw error;
    }
  }

  // Update a market event
  async updateMarketEvent(eventId, updates) {
    try {
      const eventRef = doc(db, 'marketEvents', eventId);
      await updateDoc(eventRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
      console.log('Market event updated:', eventId);
    } catch (error) {
      console.error('Error updating market event:', error);
      throw error;
    }
  }

  // Delete a market event
  async deleteMarketEvent(eventId) {
    try {
      await deleteDoc(doc(db, 'marketEvents', eventId));
      console.log('Market event deleted:', eventId);
    } catch (error) {
      console.error('Error deleting market event:', error);
      throw error;
    }
  }

  // Check in to a market event
  async checkInToMarketEvent(eventId) {
    try {
      const eventRef = doc(db, 'marketEvents', eventId);
      await updateDoc(eventRef, {
        checkedIn: true,
        checkedOut: false,
        checkedInAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      console.log('Checked in to market event:', eventId);
    } catch (error) {
      console.error('Error checking in to market event:', error);
      throw error;
    }
  }

  // Check out of a market event
  async checkOutOfMarketEvent(eventId) {
    try {
      const eventRef = doc(db, 'marketEvents', eventId);
      await updateDoc(eventRef, {
        checkedOut: true,
        checkedOutAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      console.log('Checked out of market event:', eventId);
    } catch (error) {
      console.error('Error checking out of market event:', error);
      throw error;
    }
  }

  // Undo check out of a market event
  async undoCheckOutOfMarketEvent(eventId) {
    try {
      const eventRef = doc(db, 'marketEvents', eventId);
      await updateDoc(eventRef, {
        checkedOut: false,
        checkedOutAt: null,
        updatedAt: serverTimestamp(),
      });
      console.log('Undid check out of market event:', eventId);
    } catch (error) {
      console.error('Error undoing check out of market event:', error);
      throw error;
    }
  }
}

export const firebaseService = new FirebaseService();

