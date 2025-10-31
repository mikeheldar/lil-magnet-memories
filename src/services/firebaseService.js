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
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase/config.js';

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
}

export const firebaseService = new FirebaseService();
