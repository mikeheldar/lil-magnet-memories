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
  where,
  limit,
} from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  getStorage,
} from 'firebase/storage';
import { auth } from '../firebase/config.js';
import { signInAnonymously } from 'firebase/auth';
import { db, storage, default as getApp } from '../firebase/config.js';
import { config } from '../config/environment.js';

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
const AUTH_STATE_WAIT_TIME = 100; // ms to wait for Firebase to restore auth state (reduced from 500ms for faster uploads)

class FirebaseService {
  // Convert WebP image to JPG (test environment only)
  async convertWebPToJPG(file) {
    return new Promise((resolve, reject) => {
      // Validate file
      if (!file || !(file instanceof File || file instanceof Blob)) {
        reject(new Error('Invalid file provided for conversion'));
        return;
      }

      // Check file size
      if (file.size === 0) {
        reject(new Error('File is empty'));
        return;
      }

      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      let resolved = false;

      // Set timeout to prevent hanging
      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          URL.revokeObjectURL(objectUrl);
          reject(new Error('Image conversion timeout - image took too long to load'));
        }
      }, 30000); // 30 second timeout

      img.onload = () => {
        if (resolved) return;
        resolved = true;
        clearTimeout(timeout);

        try {
          // Validate image dimensions
          if (img.width === 0 || img.height === 0) {
            URL.revokeObjectURL(objectUrl);
            reject(new Error('Invalid image dimensions'));
            return;
          }

          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);

          // Clean up object URL
          URL.revokeObjectURL(objectUrl);

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to convert WebP to JPG - canvas conversion failed'));
                return;
              }
              const jpgFile = new File(
                [blob],
                file.name.replace(/\.webp$/i, '.jpg'),
                { type: 'image/jpeg' }
              );
              resolve(jpgFile);
            },
            'image/jpeg',
            0.92 // Quality: 0.92 for good balance
          );
        } catch (error) {
          URL.revokeObjectURL(objectUrl);
          reject(new Error(`Failed to convert WebP to JPG: ${error.message}`));
        }
      };

      img.onerror = (error) => {
        if (resolved) return;
        resolved = true;
        clearTimeout(timeout);
        URL.revokeObjectURL(objectUrl);

        // Try to get more specific error info
        const errorMsg = error?.message || error?.type || 'Unknown error';
        const errorDetails = {
          message: errorMsg,
          fileSize: file.size,
          fileType: file.type || 'unknown',
          fileName: file.name || 'unknown',
        };

        console.error('Image load error details:', errorDetails);
        console.error('Object URL:', objectUrl);
        console.error('File details:', {
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified,
        });

        // Check if file might be corrupted or invalid
        if (file.size === 0) {
          reject(new Error('File is empty'));
        } else if (!file.type || (!file.type.includes('image') && !file.type.includes('webp'))) {
          reject(new Error(`Invalid file type: ${file.type}. File might not be a valid image.`));
        } else {
          // The blob might be corrupted or the browser can't decode WebP from blob URL
          // This is a known issue with some WebP files
          reject(new Error(`Browser cannot decode WebP image. This may be a browser compatibility issue or corrupted file. File size: ${file.size} bytes, type: ${file.type || 'unknown'}`));
        }
      };

      // Set source after setting up handlers
      // Add a small delay to ensure blob URL is ready
      setTimeout(() => {
        if (!resolved) {
          img.src = objectUrl;
        }
      }, 10);
    });
  }

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
        // Wait a moment for auth state to propagate (reduced from 100ms for faster uploads)
        await new Promise((resolve) => setTimeout(resolve, 50));
      } catch (e) {
        // Silent failure - proceed with uploads anyway
        // Storage rules may reject if they require auth, but we'll try
      }
    }

    console.log(`Starting parallel upload of ${photos.length} photos...`);
    const timestamp = Date.now();

    // Get the actual storage instance (not the Proxy) for use with ref()
    // The Proxy works for property access but ref() needs the actual instance
    const storageInstance = getStorage(getApp());

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
          const sumOfTotals = allProgress.reduce(
            (sum, p) => sum + (p.total || 0),
            0
          );
          if (sumOfTotals > 0) {
            actualTotalSize = sumOfTotals;
          }
        }

        const overallPercent =
          actualTotalSize > 0
            ? Math.min(100, Math.round((totalUploaded / actualTotalSize) * 100))
            : 0;
        const completedCount = allProgress.filter((p) => p.completed).length;

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
      // Convert WebP to JPG in test environment
      let fileToUpload = photo;
      if (config.isTest && photo.type === 'image/webp') {
        console.log(`Converting WebP to JPG: ${photo.name}`);
        try {
          fileToUpload = await this.convertWebPToJPG(photo);
          console.log(`Converted ${photo.name} to ${fileToUpload.name}`);
        } catch (error) {
          console.error('Failed to convert WebP to JPG, using original:', error);
          // Continue with original file if conversion fails
        }
      }

      // Sanitize filename to avoid issues with special characters
      // Replace problematic characters but keep the original name for display
      const sanitizedName = fileToUpload.name
        .replace(/[#\[\]()]/g, '_') // Replace special chars that can cause issues
        .replace(/\s+/g, '_'); // Replace spaces with underscores
      
      // Helper function to perform upload with retry logic for 412 errors
      const performUpload = async (retryCount = 0) => {
        // Initialize progress tracking variables at function scope for access in try and catch blocks
        let lastProgressUpdate = Date.now();
        let lastBytesTransferred = 0;
        
        // On retry, get a completely fresh storage instance to ensure clean session
        const currentStorageInstance = retryCount > 0 ? getStorage(getApp()) : storageInstance;
        
        // Generate completely fresh filename on retry to avoid any stale session conflicts
        // Use new timestamp on retry to ensure completely new upload session
        const currentTimestamp = retryCount > 0 ? Date.now() : timestamp;
        const fileNameSuffix = retryCount > 0 ? `_retry${retryCount}_${Math.random().toString(36).substring(2, 8)}` : '';
        const fileName = `orders/${currentTimestamp}_${i}_${sanitizedName}${fileNameSuffix}`;
        const storageRef = ref(currentStorageInstance, fileName);

        try {
          if (retryCount > 0) {
            console.log(
              `🔄 Retrying upload ${i + 1}/${photos.length} (attempt ${retryCount + 1}): ${photo.name}`
            );
          } else {
            console.log(
              `Uploading photo ${i + 1}/${photos.length}: ${photo.name} (${(
                photo.size /
                1024 /
                1024
              ).toFixed(2)} MB)`
            );
          }
          const uploadStartTime = Date.now();

          // Provide metadata to avoid multipart quirks and ensure proper Content-Type
          // On retry, ensure we have completely fresh metadata to avoid session conflicts
          const metadata = {
            contentType: fileToUpload.type || 'image/jpeg',
            cacheControl: 'public,max-age=3600',
            // Add custom metadata on retry to ensure fresh upload session
            ...(retryCount > 0 && { 
              customMetadata: { 
                retryAttempt: retryCount.toString(),
                retryTimestamp: Date.now().toString()
              }
            })
          };

          // For files under 5MB, use uploadBytes to avoid resumable session timeout issues (412 errors)
          // For larger files, use uploadBytesResumable for progress tracking and resumability
          const FILE_SIZE_THRESHOLD = 5 * 1024 * 1024; // 5MB
          const useResumable = fileToUpload.size > FILE_SIZE_THRESHOLD;
          
          let uploadTask;
          if (!useResumable) {
            // For smaller files, use uploadBytes which is more reliable and doesn't have session timeout issues
            // This avoids 412 Precondition Failed errors for files that upload quickly anyway
            try {
              await uploadBytes(storageRef, fileToUpload, metadata);
              // Update progress to 100% for small files
              const photoProgress = progressMap.get(i);
              if (photoProgress) {
                photoProgress.uploaded = fileToUpload.size;
                photoProgress.total = fileToUpload.size;
                photoProgress.completed = true;
                updateOverallProgress();
              }
              const downloadURL = await getDownloadURL(storageRef);
              console.log(`Photo ${i + 1} uploaded successfully (non-resumable)`);
              return {
                name: fileToUpload.name,
                url: downloadURL,
                fileName: fileName,
                size: fileToUpload.size,
                type: fileToUpload.type,
              };
            } catch (uploadError) {
              // If uploadBytes fails, check if it's retryable
              const errorMessage = uploadError?.message?.toLowerCase() || '';
              const errorCode = uploadError?.code || '';
              const httpStatus = uploadError?.httpStatus || uploadError?.serverResponseCode || null;
              
              const isRetryable = 
                httpStatus === 412 ||
                errorMessage.includes('412') ||
                errorMessage.includes('precondition failed') ||
                (errorCode === 'storage/unknown' && retryCount < 3);
              
              if (isRetryable && retryCount < 3) {
                // Retry logic will be handled below
                throw { ...uploadError, shouldRetry: true, httpStatus: httpStatus || 412 };
              }
              throw uploadError;
            }
          }
          
          // For larger files, use resumable upload
          uploadTask = uploadBytesResumable(storageRef, fileToUpload, metadata);

          // Initialize progress tracking for this photo
          progressMap.set(i, {
            uploaded: 0,
            total: fileToUpload.size || 0,
            completed: false,
          });
          
          // Reset progress tracking variables for this upload attempt
          lastProgressUpdate = Date.now();
          lastBytesTransferred = 0;

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
                  if (timeDelta >= 1000) {
                    // Log every second
                    const bytesSinceLastUpdate =
                      bytesTransferred - lastBytesTransferred;
                    const speedMBps =
                      bytesSinceLastUpdate / 1024 / 1024 / (timeDelta / 1000);
                    const elapsedSeconds = (now - uploadStartTime) / 1000;
                    const totalMB = bytesTransferred / 1024 / 1024;

                    console.log(
                      `📤 Photo ${i + 1}/${photos.length} (${
                        fileToUpload.name
                      }): ${totalMB.toFixed(
                        2
                      )} MB uploaded in ${elapsedSeconds.toFixed(
                        1
                      )}s (${speedMBps.toFixed(2)} MB/s)`
                    );

                    lastProgressUpdate = now;
                    lastBytesTransferred = bytesTransferred;
                  }

                  // Update overall progress immediately (this triggers the callback)
                  updateOverallProgress();
                }
              },
              (err) => {
                // Comprehensive error inspection for debugging
                const errorMessage = err?.message?.toLowerCase() || '';
                const errorCode = err?.code || '';
                const serverResponse = err?.serverResponse?.toString() || '';
                
                // Log full error object for debugging - check all possible places for 412
                console.warn('📋 Full error object inspection:', {
                  code: errorCode,
                  message: errorMessage,
                  serverResponse: serverResponse,
                  serverResponseCode: err?.serverResponseCode,
                  statusCode: err?.statusCode,
                  httpStatus: err?.httpStatus,
                  // Check nested properties
                  _delegate: err?._delegate,
                  // Check if error has a cause
                  cause: err?.cause,
                  // Stringify the whole error to find 412 anywhere
                  errorString: JSON.stringify(err),
                  // Check stack trace
                  stack: err?.stack?.substring(0, 500)
                });
                
                // Extract HTTP status from multiple possible locations
                let httpStatus = 
                  err?.serverResponseCode || 
                  err?.statusCode || 
                  err?.httpStatus ||
                  err?._delegate?.serverResponseCode ||
                  err?._delegate?.statusCode ||
                  null;
                
                // Also check in server response string
                if (!httpStatus && serverResponse) {
                  const statusMatch = serverResponse.match(/412|Precondition Failed/i);
                  if (statusMatch) httpStatus = 412;
                }
                
                // Check error string representation for 412
                if (!httpStatus) {
                  const errorString = JSON.stringify(err);
                  if (errorString.includes('412') || errorString.includes('Precondition Failed')) {
                    httpStatus = 412;
                  }
                }
                
                // AGGRESSIVE 412 detection: If it's storage/unknown during upload and we're uploading bytes,
                // treat it as potentially a 412 (common pattern we're seeing)
                // This handles cases where Firebase wraps the 412 as storage/unknown
                const isLikely412 = 
                  httpStatus === 412 ||
                  errorMessage.includes('412') ||
                  errorMessage.includes('precondition failed') ||
                  serverResponse.includes('412') ||
                  (errorCode === 'storage/unknown' && retryCount < 3); // Treat storage/unknown as potentially retryable
                
                const shouldRetry = isLikely412 && retryCount < 3;
                
                if (shouldRetry) {
                  console.warn(`⚠️ Upload error for photo ${i + 1} (attempt ${retryCount + 1}), will retry with fresh session...`);
                  console.warn('Error details:', {
                    code: errorCode,
                    httpStatus: httpStatus,
                    message: errorMessage.substring(0, 200),
                    serverResponse: serverResponse.substring(0, 200),
                    fullError: err
                  });
                  
                  // Cancel current upload task to release resources
                  try {
                    uploadTask.cancel();
                  } catch (cancelError) {
                    // Ignore cancel errors - task might already be in error state
                  }
                  
                  // Reject with a special flag that we can catch and retry
                  // Token refresh will happen in catch block where we can await it
                  reject({ ...err, shouldRetry: true, isPreconditionFailed: true, httpStatus: httpStatus });
                } else {
                  reject(err);
                }
              },
              () => {
                // Mark as completed
                const uploadEndTime = Date.now();
                const uploadDuration = (uploadEndTime - uploadStartTime) / 1000;
                const totalMB = (fileToUpload.size || 0) / 1024 / 1024;
                const avgSpeedMBps = totalMB / uploadDuration;

                const photoProgress = progressMap.get(i);
                if (photoProgress) {
                  photoProgress.completed = true;
                  photoProgress.uploaded = photoProgress.total;
                  updateOverallProgress();
                }

                console.log(
                  `✅ Photo ${i + 1}/${photos.length} (${
                    fileToUpload.name
                  }) completed: ${totalMB.toFixed(
                    2
                  )} MB in ${uploadDuration.toFixed(
                    1
                  )}s (avg ${avgSpeedMBps.toFixed(2)} MB/s)`
                );
                resolve();
              }
            );
          });

          const downloadURL = await getDownloadURL(storageRef);
          console.log(`Photo ${i + 1} uploaded successfully`);

          return {
            name: fileToUpload.name,
            url: downloadURL,
            fileName: fileName,
            size: fileToUpload.size,
            type: fileToUpload.type,
          };
        } catch (error) {
          // Check if it's a 412 Precondition Failed error that we should retry
          const errorMessage = error?.message?.toLowerCase() || '';
          const errorCode = error?.code || '';
          const serverResponse = error?.serverResponse?.toString() || '';
          
          // Extract HTTP status from multiple possible locations
          const httpStatus = 
            error?.httpStatus || 
            error?.serverResponseCode || 
            error?.statusCode || 
            (serverResponse.match(/412/) ? 412 : null);
          
          // Check if error was marked as retryable by error handler
          const isRetryableError = error?.shouldRetry || error?.retryable || error?.isPreconditionFailed || error?.isLikely412;
          
          // Be aggressive about detecting 412: storage/unknown during upload is often 412
          const isPreconditionFailed = 
            isRetryableError ||
            httpStatus === 412 ||
            errorMessage.includes('412') ||
            errorMessage.includes('precondition failed') ||
            (errorCode === 'storage/unknown' && retryCount < 3); // Treat storage/unknown as potentially retryable
          
          if (isPreconditionFailed && retryCount < 3) {
            // Log detailed error information for debugging
            console.warn('⚠️ 412 Precondition Failed detected - upload session expired:', {
              code: errorCode,
              httpStatus: httpStatus,
              message: errorMessage.substring(0, 200),
              serverResponse: serverResponse.substring(0, 200),
              retryCount: retryCount + 1,
              maxRetries: 3
            });
            
            // Wait longer before retrying to ensure stale session state clears
            // Exponential backoff: 2s, 3s, 5s for retries
            const waitTimes = [2000, 3000, 5000];
            const waitTime = waitTimes[retryCount] || 5000;
            console.log(`⏳ Waiting ${waitTime}ms before retry with completely fresh upload session...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            
            // Refresh auth token before retry to ensure we have a valid token
            try {
              const currentUser = auth?.currentUser;
              if (currentUser && currentUser.getIdToken) {
                const token = await currentUser.getIdToken(true); // Force refresh
                console.log('✅ Auth token refreshed before retry', token ? 'fresh token obtained' : 'no token');
              } else if (!currentUser || (currentUser && currentUser.isAnonymous)) {
                // Re-authenticate if no user or anonymous - get completely fresh auth
                await signInAnonymously(auth);
                await new Promise(resolve => setTimeout(resolve, 300)); // Wait longer for auth to fully propagate
                console.log('✅ Re-authenticated before retry, user:', auth?.currentUser?.uid);
              }
            } catch (tokenError) {
              console.warn('⚠️ Failed to refresh auth token, proceeding with retry anyway:', tokenError);
            }
            
            // Reset progress tracking for retry - start completely fresh
            const photoProgress = progressMap.get(i);
            if (photoProgress) {
              photoProgress.uploaded = 0;
              photoProgress.completed = false;
            }
            lastProgressUpdate = Date.now();
            lastBytesTransferred = 0;
            
            // IMPORTANT: Generate a completely new timestamp for the retry to ensure fresh filename
            // This prevents any potential conflicts with stale upload sessions
            const retryTimestamp = Date.now();
            const retryFileNameSuffix = retryCount > 0 ? `_retry${retryCount}_${Math.random().toString(36).substring(2, 8)}` : '';
            const retryFileName = `orders/${retryTimestamp}_${i}_${sanitizedName}${retryFileNameSuffix}`;
            
            console.log(`🔄 Retrying upload with completely fresh session: ${retryFileName}`);
            
            // Retry with a completely fresh upload session
            // Pass retry info so we can use fresh filename
            return performUpload(retryCount + 1);
          }
          
          // If not a 412 error or max retries reached, throw the error
          throw error;
        }
      };

      try {
        return await performUpload();
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

  // Convert existing WebP image to JPG and update order (test environment only)
  async convertWebPPhotoInOrder(orderId, photoIndex, photo) {
    if (!config.isTest) {
      return null; // Only in test environment
    }

    // Check if photo is WebP
    const isWebP = photo.url && (photo.url.includes('.webp') || photo.type === 'image/webp');
    if (!isWebP) {
      return null; // Not a WebP image
    }

    try {
      console.log(`Converting WebP photo in order ${orderId}: ${photo.name || photoIndex}`);

      // Fetch the WebP image with CORS handling
      const response = await fetch(photo.url, {
        mode: 'cors',
        credentials: 'omit',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      }

      const blob = await response.blob();

      // Verify blob is valid
      if (!blob || blob.size === 0) {
        console.error('Invalid blob received from fetch');
        return null;
      }

      // Verify it's actually a WebP image
      const isWebPType = blob.type.includes('webp') || photo.url.includes('.webp') || photo.type === 'image/webp';
      if (!isWebPType) {
        console.log('Image is not WebP, skipping conversion');
        return null;
      }

      // Ensure proper MIME type - sometimes Firebase Storage doesn't set the correct type
      let mimeType = blob.type;
      if (!mimeType || (!mimeType.includes('webp') && !mimeType.includes('image'))) {
        // Try to detect from URL or default to webp
        if (photo.url.includes('.webp')) {
          mimeType = 'image/webp';
        } else {
          mimeType = 'image/webp'; // Default assumption for conversion
        }
      }

      const webpFile = new File([blob], photo.name || `photo_${photoIndex}.webp`, {
        type: mimeType
      });

      console.log(`Converting WebP file: ${webpFile.name}, size: ${webpFile.size} bytes, type: ${webpFile.type}, original blob type: ${blob.type}`);

      // Verify the blob has actual data
      if (webpFile.size < 100) {
        console.error('File too small, might be corrupted');
        return null;
      }

      // Convert to JPG - if conversion fails, return null (don't throw)
      let jpgFile;
      try {
        jpgFile = await this.convertWebPToJPG(webpFile);
      } catch (conversionError) {
        console.warn(`Failed to convert WebP to JPG for photo ${photoIndex} in order ${orderId}:`, conversionError);
        // Return null instead of throwing - conversion is optional
        return null;
      }

      if (!jpgFile) {
        console.warn(`Conversion returned null for photo ${photoIndex} in order ${orderId}`);
        return null;
      }

      // Upload JPG to Firebase Storage
      const timestamp = Date.now();
      const sanitizedName = jpgFile.name.replace(/[#\[\]()]/g, '_').replace(/\s+/g, '_');
      const fileName = `orders/${timestamp}_${photoIndex}_${sanitizedName}`;
      const storageRef = ref(storage, fileName);

      const metadata = {
        contentType: 'image/jpeg',
        cacheControl: 'public,max-age=3600',
      };

      await uploadBytes(storageRef, jpgFile, metadata);
      const downloadURL = await getDownloadURL(storageRef);

      // Update order in Firestore
      const orderRef = doc(db, 'orders', orderId);
      const orderDoc = await getDoc(orderRef);

      if (orderDoc.exists()) {
        const orderData = orderDoc.data();
        const updatedPhotos = [...(orderData.photos || [])];

        // Update the photo at the specified index
        if (updatedPhotos[photoIndex]) {
          updatedPhotos[photoIndex] = {
            ...updatedPhotos[photoIndex],
            url: downloadURL,
            fileName: fileName,
            name: jpgFile.name,
            type: 'image/jpeg',
            size: jpgFile.size,
            convertedFromWebP: true,
          };

          await updateDoc(orderRef, {
            photos: updatedPhotos,
          });

          console.log(`✅ Converted and updated photo ${photoIndex} in order ${orderId}`);
          return {
            url: downloadURL,
            fileName: fileName,
            name: jpgFile.name,
            type: 'image/jpeg',
          };
        }
      }

      return null;
    } catch (error) {
      console.error(`Failed to convert WebP photo in order ${orderId}:`, error);
      return null;
    }
  }

  // Save order to Firestore
  async saveOrder(orderData, onProgress = null) {
    try {
      let uploadedPhotos;
      
      // Check if photos are already uploaded (have URLs)
      if (orderData.photosAlreadyUploaded) {
        console.log('Photos already uploaded, skipping upload step...');
        uploadedPhotos = orderData.photos; // Already have URL, name, etc.
      } else {
        // Upload photos first
        console.log('Starting photo uploads...');
        uploadedPhotos = await this.uploadPhotos(
          orderData.photos,
          onProgress
        );
        console.log(
          `Photo uploads completed: ${uploadedPhotos.length} photos uploaded`
        );
      }

      // Prepare order document with all fields sanitized
      const orderDoc = {
        orderNumber: orderData.orderNumber,
        customer: {
          firstName: orderData.firstName || '',
          lastName: orderData.lastName || '',
          email: orderData.email || '',
          phone: orderData.phone || '',
        },
        userId: orderData.userId || null,
        specialInstructions: orderData.specialInstructions || '',
        photos: uploadedPhotos,
        quantities: orderData.quantities || [],
        totalMagnets: orderData.totalMagnets || 0,
        subtotal: orderData.subtotal || 0,
        shipping: orderData.shipping || 0,
        tax: orderData.tax || 0,
        totalAmount: orderData.totalAmount || 0,
        status: 'new',
        submissionDate: serverTimestamp(),
        submissionDateClient: Date.now(), // Client-side timestamp (milliseconds) - always available
        createdAt: serverTimestamp(),
        createdAtClient: Date.now(), // Client-side timestamp (milliseconds) - always available
        updatedAt: serverTimestamp(),
      };
      
      // Only include optional fields if they are defined and not null
      if (orderData.paymentOption && orderData.paymentOption !== null) {
        orderDoc.paymentOption = orderData.paymentOption;
      }
      if (orderData.shippingOption && orderData.shippingOption !== null) {
        orderDoc.shippingOption = orderData.shippingOption;
      }

      // Ensure we have an auth context for Firestore rules (request.auth != null)
      // This is critical - Firestore rules require authentication
      // Only sign in anonymously if there's no user OR the current user is anonymous
      // Never replace an authenticated user with anonymous
      // Wait once per page load to allow Firebase to restore authenticated sessions
      if (!authStateWaitCompleted) {
        await new Promise((resolve) =>
          setTimeout(resolve, AUTH_STATE_WAIT_TIME)
        );
        authStateWaitCompleted = true;
      }
      const currentUser = auth?.currentUser;
      if (!currentUser || currentUser.isAnonymous) {
        console.log(
          'No authenticated user before Firestore save, signing in anonymously...'
        );
        try {
          await signInAnonymously(auth);
          // Auth state should propagate immediately
          console.log(
            'Anonymous sign-in completed, current user:',
            auth.currentUser?.uid
          );
        } catch (authError) {
          console.error(
            'Anonymous sign-in failed before Firestore save:',
            authError
          );
          // Continue anyway - rules might allow unauthenticated writes
        }
      } else {
        console.log('User already authenticated:', auth.currentUser.uid);
      }

      // Log the operation (Step 1: Track when errors occur)
      const { logOperation, completeOperation } = await import(
        '../utils/firestoreLogger.js'
      );
      const logId = logOperation('saveOrder', {
        collection: 'orders',
        orderNumber: orderData.orderNumber,
        photoCount: orderDoc.photos.length,
      });

      // Add to Firestore with timeout (increased to 30 seconds to account for slow uploads)
      console.log('Saving order to Firestore...');
      console.log('Firestore database:', db.app.options.projectId);
      console.log('Current auth user:', auth?.currentUser?.uid || 'null');
      console.log('Order document to save:', {
        ...orderDoc,
        photos: `[${orderDoc.photos.length} photos]`,
      });

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
          () =>
            reject(new Error('Firebase operation timed out after 30 seconds')),
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
          subtotal: orderData.subtotal || 0,
          shipping: orderData.shipping || 0,
          tax: orderData.tax || 0,
          totalAmount: orderData.totalAmount || 0,
          shippingOption: orderData.shippingOption || null,
          paymentOption: orderData.paymentOption || null,
          cartItems: [],
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
          shippingOption: orderDoc.shippingOption || null,
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
      if (
        orderDoc.shippingOption &&
        orderDoc.shippingOption.type === 'shipping'
      ) {
        try {
          // Send shipping email when status is 'shipped'
          if (shippingStatus === 'shipped') {
            await this.sendStatusUpdateEmail({
              firstName: orderDoc.customer.firstName,
              lastName: orderDoc.customer.lastName,
              email: orderDoc.customer.email,
              orderNumber: orderDoc.orderNumber,
              status: 'shipped',
              photos: orderDoc.photos || [],
              quantities: orderDoc.quantities || [],
              totalMagnets: orderDoc.totalMagnets || 0,
              shippingOption: orderDoc.shippingOption,
            });
            console.log('Shipping email sent successfully');
          } else {
          console.log('Shipping status updated:', shippingStatus);
          }
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
      if (!photoUrl || typeof photoUrl !== 'string') {
        throw new Error('Invalid photo URL: URL is missing or not a string');
      }

      // Skip blob URLs - they're local and don't need to be deleted from Storage
      if (photoUrl.startsWith('blob:')) {
        console.log('Skipping blob URL deletion:', photoUrl);
        return;
      }

      // Skip data URLs - they're base64 encoded and don't need to be deleted
      if (photoUrl.startsWith('data:')) {
        console.log('Skipping data URL deletion:', photoUrl);
        return;
      }

      // Extract the file path from the URL
      // Firebase Storage URLs are like: https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{path}?alt=media&token={token}
      // Or: https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{path}?alt=media
      let filePath = null;

      try {
        const urlObj = new URL(photoUrl);
        // Try to match the path in the URL
        const pathMatch = urlObj.pathname.match(/\/o\/(.+?)(?:\?|$)/);
        if (pathMatch) {
          filePath = decodeURIComponent(pathMatch[1]);
        } else {
          // If it's already a storage path (starts with 'orders/'), use it directly
          if (photoUrl.includes('orders/')) {
            const pathMatch2 = photoUrl.match(/orders\/.+$/);
            if (pathMatch2) {
              filePath = pathMatch2[0];
            }
          }
        }
      } catch (urlError) {
        // If URL parsing fails, check if it's already a storage path
        if (photoUrl.includes('orders/')) {
          const pathMatch = photoUrl.match(/orders\/.+$/);
          if (pathMatch) {
            filePath = pathMatch[0];
          }
        }
      }

      if (!filePath) {
        console.warn('Could not extract file path from URL:', photoUrl);
        throw new Error(
          `Invalid photo URL format: ${photoUrl.substring(0, 100)}`
        );
      }

      // Ensure storage is initialized by accessing it through the proxy
      // This triggers the lazy initialization
      const storageInstance = getStorage(getApp());
      const storageRef = ref(storageInstance, filePath);
      
      // Verify the ref was created successfully
      if (!storageRef) {
        throw new Error(`Failed to create storage reference for path: ${filePath}`);
      }
      
      await deleteObject(storageRef);
      console.log('✅ Photo deleted from Storage:', filePath);
    } catch (error) {
      console.error('❌ Error deleting photo from Storage:', error);
      console.error('Photo URL was:', photoUrl);
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
      let response;
      try {
        response = await fetch(
          'https://us-central1-lil-magnet-memories.cloudfunctions.net/api/payments/create',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(paymentData),
          }
        );
      } catch (fetchError) {
        // Handle network errors (firewall, CORS, etc.)
        console.error('Network error processing payment:', fetchError);
        const errorMessage = fetchError.message || 'Network error';
        const isFirewallError =
          errorMessage.includes('Failed to fetch') ||
          errorMessage.includes('NetworkError') ||
          errorMessage.includes('CORS') ||
          errorMessage.includes('blocked');

        // Log the error
        await this.logTransactionError({
          errorType: 'payment_network_error',
          errorMessage: isFirewallError
            ? 'Payment request was blocked (firewall/network issue)'
            : errorMessage,
          errorDetails: {
            originalError: errorMessage,
            isFirewallError,
            paymentData: {
              orderNumber: paymentData.orderNumber,
              amount: paymentData.amount,
            },
          },
          transactionData: {
            orderNumber: paymentData.orderNumber,
            amount: paymentData.amount,
            paymentMethod: paymentData.sourceId ? 'square_card' : 'apple_pay',
            customerEmail: paymentData.buyerEmail,
            customerName: paymentData.customerName,
          },
        }).catch((logError) => {
          console.error('Failed to log transaction error:', logError);
        });

        throw new Error(
          isFirewallError
            ? 'Payment request was blocked. Please check your network connection or try again later.'
            : `Payment processing failed: ${errorMessage}`
        );
      }

      let result = null;
      try {
        result = await response.json();
      } catch (parseError) {
        if (!response.ok) {
          // Log error before throwing
          await this.logTransactionError({
            errorType: 'payment_failed',
            errorMessage: 'Failed to process Square payment - JSON parse error',
            errorDetails: {
              status: response.status,
              statusText: response.statusText,
              parseError: parseError.message,
            },
            transactionData: {
              orderNumber: paymentData.orderNumber,
              amount: paymentData.amount,
              paymentMethod: paymentData.sourceId ? 'square_card' : 'unknown',
              customerEmail: paymentData.buyerEmail,
              customerName: paymentData.customerName,
            },
          });
          throw new Error('Failed to process Square payment');
        }
        return null;
      }

      if (!response.ok) {
        // Get user-friendly error message
        const friendlyError = this.getSquareErrorMessage(result);
        const error = new Error(friendlyError.message);
        error.userMessage = friendlyError.message;
        error.userCaption = friendlyError.caption;
        error.details = result || { status: response.status, statusText: response.statusText };
        error.originalResult = result; // Keep original for logging

        // Log error before throwing (with full technical details for admin)
        await this.logTransactionError({
          errorType: 'payment_failed',
          errorMessage: result?.error || friendlyError.message,
          errorDetails: result || {
            status: response.status,
            statusText: response.statusText,
          },
          transactionData: {
            orderNumber: paymentData.orderNumber,
            amount: paymentData.amount,
            paymentMethod: paymentData.sourceId ? 'square_card' : 'unknown',
            customerEmail: paymentData.buyerEmail,
            customerName: paymentData.customerName,
          },
        });
        throw error;
      }

      if (result?.error || (result?.errors && result.errors.length > 0)) {
        // Get user-friendly error message
        const friendlyError = this.getSquareErrorMessage(result);
        const error = new Error(friendlyError.message);
        error.userMessage = friendlyError.message;
        error.userCaption = friendlyError.caption;
        error.details = result?.details || result;
        error.originalResult = result; // Keep original for logging

        // Log error before throwing (with full technical details for admin)
        await this.logTransactionError({
          errorType: 'payment_failed',
          errorMessage: result?.error || friendlyError.message,
          errorDetails: result?.details || result,
          transactionData: {
            orderNumber: paymentData.orderNumber,
            amount: paymentData.amount,
            paymentMethod: paymentData.sourceId ? 'square_card' : 'unknown',
            customerEmail: paymentData.buyerEmail,
            customerName: paymentData.customerName,
          },
        });
        throw error;
      }

      return result;
    } catch (error) {
      console.error('Error processing Square payment:', error);
      // Log error if not already logged
      if (!error.logged) {
        await this.logTransactionError({
          errorType: 'payment_failed',
          errorMessage: error.message || 'Unknown payment error',
          errorDetails: error.details || { stack: error.stack },
          transactionData: {
            orderNumber: paymentData?.orderNumber,
            amount: paymentData?.amount,
            paymentMethod: paymentData?.sourceId ? 'square_card' : 'unknown',
            customerEmail: paymentData?.buyerEmail,
            customerName: paymentData?.customerName,
          },
        });
      }
      throw error;
    }
  }

  // Translate Square error codes to user-friendly messages
  getSquareErrorMessage(result) {
    if (!result || !result.errors || !Array.isArray(result.errors)) {
      return {
        message: 'Your payment could not be processed',
        caption: "Don't worry - you have not been charged. Please check your payment information and try again.",
      };
    }

    const errors = result.errors;
    const errorCodes = errors.map((e) => e.code).filter(Boolean);

    // Check for specific error codes and provide helpful messages
    if (errorCodes.includes('CVV_FAILURE')) {
      return {
        message: 'Card Security Code Incorrect',
        caption: 'The 3-digit security code on the back of your card (or 4 digits on the front for Amex) appears to be incorrect. Please check and try again.',
      };
    }

    if (errorCodes.includes('GENERIC_DECLINE')) {
      // Check if CVV also failed
      if (errorCodes.includes('CVV_FAILURE')) {
        return {
          message: 'Payment Declined',
          caption: 'Your card was declined and the security code was incorrect. Please verify your card details, check with your bank, or try a different payment method.',
        };
      }
      return {
        message: 'Payment Declined',
        caption: 'Your card was declined by your bank. This could be due to insufficient funds, account restrictions, or security measures. Please check with your bank or try a different payment method.',
      };
    }

    if (errorCodes.includes('INSUFFICIENT_FUNDS')) {
      return {
        message: 'Insufficient Funds',
        caption: 'Your card does not have enough funds to complete this transaction. Please use a different payment method or contact your bank.',
      };
    }

    if (errorCodes.includes('CARD_EXPIRED')) {
      return {
        message: 'Card Expired',
        caption: 'The expiration date on your card has passed. Please use a different card or update your card information.',
      };
    }

    if (errorCodes.includes('INVALID_EXPIRATION')) {
      return {
        message: 'Invalid Expiration Date',
        caption: 'The card expiration date appears to be incorrect. Please check and try again.',
      };
    }

    if (errorCodes.includes('INVALID_CARD')) {
      return {
        message: 'Invalid Card Information',
        caption: 'The card information you entered appears to be invalid. Please check your card number, expiration date, and security code, then try again.',
      };
    }

    if (errorCodes.includes('CARD_NOT_SUPPORTED')) {
      return {
        message: 'Card Not Supported',
        caption: 'This card type is not supported for this transaction. Please use a different payment method.',
      };
    }

    // Default message for other errors
    return {
      message: 'Payment Could Not Be Processed',
      caption: "Don't worry - you have not been charged. Please check your payment information and try again, or use a different payment method.",
    };
  }

  // Log transaction errors to Firestore for admin review
  async logTransactionError(errorData) {
    try {
      const errorsCollection = collection(db, 'errored_transactions');
      await addDoc(errorsCollection, {
        ...errorData,
        timestamp: serverTimestamp(),
        createdAt: new Date().toISOString(),
      });
      console.log('✅ Transaction error logged to Firestore');
    } catch (logError) {
      console.error('❌ Failed to log transaction error:', logError);
      // Don't throw - error logging failure shouldn't break the payment flow
    }
  }

  // Product Management Methods
  async getProducts(includeTesting = false) {
    try {
      const productsCollection = collection(db, 'products');
      let querySnapshot;
      let usedSortOrder = false;
      
      try {
        // Try to order by sortOrder field
        const q = query(productsCollection, orderBy('sortOrder', 'asc'));
        querySnapshot = await getDocs(q);
        console.log('✅ Products query with sortOrder succeeded:', querySnapshot.size, 'products');
        usedSortOrder = true;
        
        // If query succeeded but returned 0 products, fallback to unordered query
        // This handles the case where products exist but don't have sortOrder field
        if (querySnapshot.size === 0) {
          console.warn('⚠️ sortOrder query returned 0 products, trying unordered query as fallback...');
          querySnapshot = await getDocs(productsCollection);
          console.log('✅ Unordered query returned:', querySnapshot.size, 'products');
          usedSortOrder = false;
        }
      } catch (sortOrderError) {
        // Fallback: if sortOrder query fails with error, try without ordering
        console.warn('⚠️ sortOrder query failed with error, falling back to unordered query:', sortOrderError.message);
        querySnapshot = await getDocs(productsCollection);
        console.log('✅ Products query without ordering succeeded:', querySnapshot.size, 'products');
        usedSortOrder = false;
      }

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
      
      // Sort products in memory by sortOrder if available
      // This handles both cases: products with sortOrder (sort by it) and without (sort by description)
      if (products.length > 0) {
        const hasSortOrder = products.some(p => p.sortOrder !== undefined);
        if (hasSortOrder) {
          products.sort((a, b) => {
            const sortA = a.sortOrder ?? 999999;
            const sortB = b.sortOrder ?? 999999;
            return sortA - sortB;
          });
          console.log('📊 Sorted products by sortOrder in memory');
        } else if (!usedSortOrder) {
          // If no products have sortOrder, sort by description as fallback
          products.sort((a, b) => (a.description || '').localeCompare(b.description || ''));
          console.log('📊 Sorted products by description in memory (no sortOrder field)');
        }
      }

      console.log(`✅ Returning ${products.length} products (includeTesting: ${includeTesting})`);
      return products;
    } catch (error) {
      console.error('Error getting products:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
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
      const defaults = DEFAULT_SHIPPING_OPTIONS.map((option) => ({
        ...option,
      }));
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
      
      // Get the highest sortOrder for products in the same category and collection
      let maxSortOrder = -1;
      const q = query(
        productsCollection,
        where('category', '==', productData.category || 'custom'),
        where('collection', '==', productData.collection || 'Uncategorized'),
        orderBy('sortOrder', 'desc'),
        limit(1)
      );
      
      try {
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const topProduct = snapshot.docs[0].data();
          maxSortOrder = topProduct.sortOrder ?? -1;
        }
      } catch (queryError) {
        // If query fails (e.g., missing index), just use default sort order
        console.warn('Could not query for max sortOrder, using default:', queryError.message);
      }
      
      const docRef = await addDoc(productsCollection, {
        ...productData,
        sortOrder: maxSortOrder + 1,
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

  async updateProductSortOrders(productUpdates) {
    try {
      // productUpdates is an array of { id, sortOrder }
      // Update all products in a batch for efficiency
      const batch = [];
      for (const update of productUpdates) {
        const productDoc = doc(db, 'products', update.id);
        batch.push(
          updateDoc(productDoc, {
            sortOrder: update.sortOrder,
            updatedAt: serverTimestamp(),
          })
        );
      }
      await Promise.all(batch);
      console.log(`Updated sort order for ${productUpdates.length} products`);
    } catch (error) {
      console.error('Error updating product sort orders:', error);
      throw error;
    }
  }

  async uploadProductImage(file) {
    try {
      // Get storage instance directly to avoid Proxy issues with ref()
      // The Proxy might not work correctly with Firebase's ref() function
      // Use getApp() which is already imported as default
      const storageInstance = getStorage(getApp());
      
      const fileName = `products/${Date.now()}_${file.name}`;
      const storageRef = ref(storageInstance, fileName);

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
      // CRITICAL: Preserve totalCost, pricing, and totalPrice for proper order total calculation
      const sanitizedItems = cartItems.map((item) => {
        const sanitized = { ...item };
        
        if (item.isCustomUpload && item.photos) {
          // Remove base64 previews, keep only Firebase Storage URLs
          const sanitizedPhotos = item.photos.map((photo) => {
            const photoData = {
              name: photo.name || '',
              url: photo.url || '', // Firebase Storage URL (persistent, small)
              quantity: photo.quantity || 1,
            };
            
            // Only include optional fields if they're defined
            if (photo.fileName) photoData.fileName = photo.fileName;
            if (photo.size) photoData.size = photo.size;
            if (photo.type) photoData.type = photo.type;
            if (photo.path) photoData.path = photo.path;
            
            return photoData;
          });
          sanitized.photos = sanitizedPhotos;
        }
        
        // Preserve totalCost for custom uploads (critical for order total)
        if (item.isCustomUpload && item.totalCost) {
          sanitized.totalCost = item.totalCost;
        }
        
        // Preserve pricing for custom uploads (needed to recalculate if totalCost is missing)
        if (item.isCustomUpload && item.pricing) {
          sanitized.pricing = item.pricing;
        }
        
        // Preserve totalPrice for regular products
        if (!item.isCustomUpload && item.totalPrice !== undefined) {
          sanitized.totalPrice = item.totalPrice;
        }
        
        // Preserve pricePerUnit and productPricing for regular products
        if (!item.isCustomUpload) {
          if (item.pricePerUnit !== undefined) sanitized.pricePerUnit = item.pricePerUnit;
          if (item.productPricing) sanitized.productPricing = item.productPricing;
        }
        
        return sanitized;
      });

      // Calculate approximate size to warn if too large
      const estimatedSize = JSON.stringify(sanitizedItems).length;
      if (estimatedSize > 900000) {
        // Warn if approaching 1MB limit
        console.warn(
          '⚠️ Cart size is large:',
          estimatedSize,
          'bytes. Firestore limit is 1MB.'
        );
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
      console.log(
        '✅ Cart saved to Firestore for user:',
        userId,
        sanitizedItems.length,
        'items',
        `(${estimatedSize} bytes)`
      );
    } catch (error) {
      console.error('❌ Error saving cart to Firestore:', error);
      console.error('   Error details:', {
        message: error.message,
        code: error.code,
        stack: error.stack,
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
        console.log(
          '✅ Cart loaded from Firestore for user:',
          userId,
          items.length,
          'items'
        );
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

  // Remove undefined values from an object (Firestore doesn't allow undefined)
  removeUndefinedValues(obj) {
    if (obj === null || obj === undefined) {
      return null;
    }
    if (Array.isArray(obj)) {
      return obj
        .map((item) => this.removeUndefinedValues(item))
        .filter((item) => item !== undefined);
    }
    if (typeof obj === 'object') {
      const cleaned = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          const value = obj[key];
          if (value !== undefined) {
            cleaned[key] = this.removeUndefinedValues(value);
          }
        }
      }
      return cleaned;
    }
    return obj;
  }

  // Clean cart items for Firestore - remove File objects, base64 previews, and other non-serializable data
  // CRITICAL: Preserve totalCost, pricing, and totalPrice for proper order total calculation
  cleanCartItemsForFirestore(cartItems) {
    return cartItems.map((item) => {
      const cleaned = {
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        price: item.price,
        isCustomUpload: item.isCustomUpload || false,
        specialInstructions: item.specialInstructions || null,
        marketEventContext: item.marketEventContext || false,
      };

      // For custom uploads, clean photos - only keep URLs, not File objects or base64
      if (item.isCustomUpload && item.photos) {
        cleaned.photos = item.photos.map((photo) => {
          const cleanedPhoto = {
            name: photo.name || '',
            url: photo.url || null,
            fileName: photo.fileName || null,
            size: photo.size || null,
            type: photo.type || null,
          };
          // Remove preview/base64 data - Firestore doesn't like large base64 strings
          // Only keep the URL which is what we need
          return cleanedPhoto;
        });
      }

      // CRITICAL: Preserve totalCost for custom uploads (needed for order total)
      if (item.isCustomUpload && item.totalCost) {
        cleaned.totalCost = item.totalCost;
      }

      // CRITICAL: Preserve pricing for custom uploads (needed to recalculate if totalCost is missing)
      if (item.isCustomUpload && item.pricing) {
        cleaned.pricing = item.pricing;
      }

      // Clean photoQuantities if it exists
      if (item.photoQuantities) {
        cleaned.photoQuantities = item.photoQuantities;
      }

      // Clean cost breakdown if it exists
      if (item.costBreakdown) {
        cleaned.costBreakdown = item.costBreakdown.map((breakdown) => ({
          qty: breakdown.qty,
          count: breakdown.count,
          price: breakdown.price,
        }));
      }

      // CRITICAL: Preserve totalPrice for regular products
      if (!item.isCustomUpload && item.totalPrice !== undefined) {
        cleaned.totalPrice = item.totalPrice;
      }

      // Preserve pricePerUnit and productPricing for regular products
      if (!item.isCustomUpload) {
        if (item.pricePerUnit !== undefined) cleaned.pricePerUnit = item.pricePerUnit;
        if (item.productPricing) cleaned.productPricing = item.productPricing;
      }

      return cleaned;
    });
  }

  // Save cart-based order to Firestore
  async saveCartOrder(orderData) {
    try {
      // Clean cart items to remove File objects, base64 previews, and other non-serializable data
      const cartItems = this.cleanCartItemsForFirestore(
        orderData.cartItems || []
      );

      // Clean shipping and payment options
      const shippingOption = orderData.shippingOption
        ? (() => {
            const cleaned = JSON.parse(
              JSON.stringify(orderData.shippingOption)
            );
            // Remove any File objects or non-serializable data from address
            if (cleaned.address) {
              cleaned.address = {
                street: cleaned.address.street || '',
                city: cleaned.address.city || '',
                state: cleaned.address.state || '',
                zip: cleaned.address.zip || '',
                country: cleaned.address.country || 'US',
              };
            }
            return cleaned;
          })()
        : null;

      const paymentOption = orderData.paymentOption
        ? (() => {
            const cleaned = JSON.parse(JSON.stringify(orderData.paymentOption));
            // Remove any File objects or non-serializable data from billing address
            if (cleaned.billingAddress) {
              cleaned.billingAddress = {
                street: cleaned.billingAddress.street || '',
                city: cleaned.billingAddress.city || '',
                state: cleaned.billingAddress.state || '',
                zip: cleaned.billingAddress.zip || '',
                country: cleaned.billingAddress.country || 'US',
              };
            }
            return cleaned;
          })()
        : null;

      // Prepare order document
      const orderDoc = {
        orderNumber: orderData.orderNumber,
        orderType: orderData.orderType || 'product_cart',
        cartItems,
        customer: {
          firstName: orderData.customer?.firstName || '',
          lastName: orderData.customer?.lastName || '',
          email: orderData.customer?.email || '',
          phone: orderData.customer?.phone || '',
        },
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
        shippingStatus:
          shippingOption && shippingOption.type === 'shipping'
            ? 'pending'
            : null,
        submissionDate: serverTimestamp(),
        submissionDateClient: Date.now(), // Client-side timestamp (milliseconds) - always available
        createdAt: serverTimestamp(),
        createdAtClient: Date.now(), // Client-side timestamp (milliseconds) - always available
        updatedAt: serverTimestamp(),
      };

      // Remove all undefined values before saving (Firestore doesn't allow undefined)
      const cleanedOrderDoc = this.removeUndefinedValues(orderDoc);

      // Add to Firestore with increased timeout (60 seconds for large orders with many photos)
      const savePromise = addDoc(collection(db, 'orders'), cleanedOrderDoc);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(
          () =>
            reject(new Error('Firebase operation timed out after 60 seconds')),
          60000
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
          specialInstructions: `Order Type: Cart Order`,
          photos: [], // No photos for cart orders
          quantities: orderData.cartItems.map((item) => item.quantity || 1),
          orderNumber: orderData.orderNumber,
          totalMagnets: orderData.cartItems.reduce(
            (sum, item) => sum + (item.quantity || 1),
            0
          ),
          subtotal: orderData.subtotal || 0,
          shipping: orderData.shipping || 0,
          tax: orderData.tax || 0,
          totalAmount: orderData.totalAmount || 0,
          shippingOption: orderData.shippingOption || null,
          paymentOption: orderData.paymentOption || null,
          cartItems: orderData.cartItems || [],
        });
        console.log('Order email sent successfully');
      } catch (emailError) {
        console.error('Failed to send order email:', emailError);
        // Don't throw error - order was saved successfully
      }

      // Return the document ID so we can update it later
      return docRef.id;
    } catch (error) {
      console.error('Error saving cart order:', error);
      throw error;
    }
  }

  // Update order payment status and payment details
  async updateOrderPaymentStatus(orderId, updates) {
    try {
      if (!orderId) {
        throw new Error('Order ID is required to update payment status');
      }

      const orderRef = doc(db, 'orders', orderId);
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp(),
      };

      // Remove undefined values
      const cleanedUpdateData = this.removeUndefinedValues(updateData);

      await updateDoc(orderRef, cleanedUpdateData);
      console.log('✅ Order payment status updated:', orderId);
    } catch (error) {
      console.error('Error updating order payment status:', error);
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
        eventLink: eventData.eventLink || null,
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

  // Reviews Management Methods
  // Get all reviews (ordered by created date, most recent first)
  async getReviews() {
    try {
      const reviewsCollection = collection(db, 'reviews');
      const q = query(reviewsCollection, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);

      const reviews = [];
      querySnapshot.forEach((doc) => {
        reviews.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      return reviews;
    } catch (error) {
      console.error('Error getting reviews:', error);
      throw error;
    }
  }

  // Add a new review
  async addReview(reviewData) {
    try {
      const reviewsCollection = collection(db, 'reviews');
      const docRef = await addDoc(reviewsCollection, {
        customerName: reviewData.customerName,
        reviewText: reviewData.reviewText,
        rating: reviewData.rating || 5, // Default to 5 stars
        profilePicture: reviewData.profilePicture || null,
        email: reviewData.email || null, // Store email for verification purposes
        isVerified: reviewData.isVerified !== undefined ? reviewData.isVerified : true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding review:', error);
      throw error;
    }
  }

  // Update an existing review
  async updateReview(reviewId, reviewData) {
    try {
      const reviewDoc = doc(db, 'reviews', reviewId);
      await updateDoc(reviewDoc, {
        ...reviewData,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating review:', error);
      throw error;
    }
  }

  // Delete a review
  async deleteReview(reviewId) {
    try {
      await deleteDoc(doc(db, 'reviews', reviewId));
    } catch (error) {
      console.error('Error deleting review:', error);
      throw error;
    }
  }

  // Upload a review profile picture
  async uploadReviewProfilePicture(file) {
    try {
      // Ensure auth context and handle anonymous sign-in if needed
      if (!authStateWaitCompleted) {
        await new Promise((resolve) => setTimeout(resolve, AUTH_STATE_WAIT_TIME));
        authStateWaitCompleted = true;
      }
      const currentUser = auth?.currentUser;
      if (!currentUser || currentUser.isAnonymous) {
        try {
          await signInAnonymously(auth);
          await new Promise((resolve) => setTimeout(resolve, 50));
        } catch (e) {
          console.warn('Anonymous sign-in failed for review profile picture upload:', e);
        }
      }

      const storageInstance = getStorage(getApp());
      const fileName = `reviews/${Date.now()}_${file.name}`;
      const storageRef = ref(storageInstance, fileName);

      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (error) {
      console.error('Error uploading review profile picture:', error);
      throw error;
    }
  }

  // Get product type visibility settings
  async getProductTypeVisibility() {
    try {
      const adminConfigRef = doc(db, 'admin_config', 'settings');
      const adminConfigSnap = await getDoc(adminConfigRef);
      
      if (adminConfigSnap.exists()) {
        const data = adminConfigSnap.data();
        return {
          custom: data.productTypeVisibility?.custom !== false, // Default to true
          designer: data.productTypeVisibility?.designer !== false,
          specialty: data.productTypeVisibility?.specialty !== false,
        };
      }
      // Default: all enabled
      return { custom: true, designer: true, specialty: true };
    } catch (error) {
      console.error('Error getting product type visibility:', error);
      // Default: all enabled on error
      return { custom: true, designer: true, specialty: true };
    }
  }

  // Update product type visibility settings
  async updateProductTypeVisibility(visibility) {
    try {
      const adminConfigRef = doc(db, 'admin_config', 'settings');
      await setDoc(adminConfigRef, {
        productTypeVisibility: visibility,
      }, { merge: true });
      return true;
    } catch (error) {
      console.error('Error updating product type visibility:', error);
      throw error;
    }
  }
}

export const firebaseService = new FirebaseService();
