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
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
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
  },
];

class FirebaseService {
  // Upload photos to Firebase Storage
  async uploadPhotos(photos) {
    const uploadedPhotos = [];

    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];
      const fileName = `orders/${Date.now()}_${i}_${photo.name}`;
      const storageRef = ref(storage, fileName);

      try {
        const snapshot = await uploadBytes(storageRef, photo);
        const downloadURL = await getDownloadURL(snapshot.ref);

        uploadedPhotos.push({
          name: photo.name,
          url: downloadURL,
          fileName: fileName,
          size: photo.size,
          type: photo.type,
        });
      } catch (error) {
        console.error('Error uploading photo:', error);
        throw error;
      }
    }

    return uploadedPhotos;
  }

  // Save order to Firestore
  async saveOrder(orderData) {
    try {
      // Upload photos first
      const uploadedPhotos = await this.uploadPhotos(orderData.photos);

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

      // Add to Firestore with timeout
      const savePromise = addDoc(collection(db, 'orders'), orderDoc);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error('Firebase operation timed out')),
          10000
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
  async getProducts() {
    try {
      const productsCollection = collection(db, 'products');
      const q = query(productsCollection, orderBy('description', 'asc'));
      const querySnapshot = await getDocs(q);

      const products = [];
      querySnapshot.forEach((doc) => {
        products.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      return products;
    } catch (error) {
      console.error('Error getting products:', error);
      throw error;
    }
  }

  async getShippingOptions() {
    try {
      const shippingDocRef = doc(db, 'settings', 'shippingOptions');
      const snapshot = await getDoc(shippingDocRef);
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (Array.isArray(data?.options) && data.options.length > 0) {
          return data.options;
        }
      }
      return DEFAULT_SHIPPING_OPTIONS;
    } catch (error) {
      console.error('Error loading shipping options:', error);
      return DEFAULT_SHIPPING_OPTIONS;
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
      console.log('Creating market event with data:', eventData);
      
      const eventDoc = {
        name: eventData.name,
        location: eventData.location,
        startDateTime: eventData.startDateTime,
        endDateTime: eventData.endDateTime,
        checkedIn: false,
        checkedOut: false,
        checkedInAt: null,
        checkedOutAt: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      console.log('Event document to save:', eventDoc);
      console.log('Collection path: marketEvents');

      const eventsRef = collection(db, 'marketEvents');
      const docRef = await addDoc(eventsRef, eventDoc);
      
      console.log('✅ Market event created successfully!');
      console.log('Document ID:', docRef.id);
      console.log('Document path:', docRef.path);
      
      // Verify the document was created by reading it back
      try {
        const createdDoc = await getDoc(docRef);
        if (createdDoc.exists()) {
          console.log('✅ Verified: Document exists in Firestore');
          console.log('Document data:', createdDoc.data());
        } else {
          console.error('❌ ERROR: Document was not found after creation!');
        }
      } catch (verifyError) {
        console.error('Error verifying document creation:', verifyError);
      }

      // Return the created event with the ID
      const createdEvent = {
        id: docRef.id,
        name: eventData.name,
        location: eventData.location,
        startDateTime: eventData.startDateTime,
        endDateTime: eventData.endDateTime,
        checkedIn: false,
        checkedOut: false,
        checkedInAt: null,
        checkedOutAt: null,
      };
      
      return createdEvent;
    } catch (error) {
      console.error('❌ Error creating market event:', error);
      console.error('Error code:', error?.code);
      console.error('Error message:', error?.message);
      console.error('Error stack:', error?.stack);
      
      // Provide more helpful error messages
      if (error?.code === 'permission-denied') {
        throw new Error('Permission denied: Check Firebase security rules for marketEvents collection');
      } else if (error?.code === 'unavailable') {
        throw new Error('Firebase service unavailable. Please check your connection.');
      } else {
        throw error;
      }
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
