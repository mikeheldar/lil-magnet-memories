/**
 * Firestore Operation Logger
 * 
 * Step 1: Track all Firestore operations to identify when "client is offline" errors occur
 * 
 * This logger wraps Firestore operations and logs:
 * - When operations are called
 * - Connection state at that moment
 * - Browser network state
 * - Auth state
 * - Operation results/errors
 * - Timing information
 */

import { db, auth } from '../firebase/config.js';

// Store operation logs
const operationLogs = [];
const MAX_LOGS = 100; // Keep last 100 operations

// Get current state snapshot
function getStateSnapshot() {
  return {
    timestamp: new Date().toISOString(),
    browser: {
      online: typeof navigator !== 'undefined' ? navigator.onLine : false,
      connection: typeof navigator !== 'undefined' && navigator.connection ? {
        effectiveType: navigator.connection.effectiveType,
        downlink: navigator.connection.downlink,
        rtt: navigator.connection.rtt,
      } : null,
    },
    auth: {
      currentUser: auth?.currentUser ? {
        uid: auth.currentUser.uid,
        email: auth.currentUser.email,
        isAnonymous: auth.currentUser.isAnonymous,
      } : null,
    },
    firestore: {
      // We can't directly check Firestore connection state, but we can infer it
      // from whether operations succeed or fail
    },
  };
}

// Log an operation
export function logOperation(operation, details) {
  const log = {
    id: `op-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    operation,
    state: getStateSnapshot(),
    details,
    startTime: typeof performance !== 'undefined' ? performance.now() : Date.now(),
  };
  
  operationLogs.push(log);
  
  // Keep only last MAX_LOGS
  if (operationLogs.length > MAX_LOGS) {
    operationLogs.shift();
  }
  
  // Log to console with detailed info
  console.log(`[Firestore Op] ${operation}:`, {
    id: log.id,
    state: log.state,
    details,
  });
  
  return log.id;
}

// Complete an operation log
export function completeOperation(logId, result) {
  const log = operationLogs.find(l => l.id === logId);
  if (!log) return;
  
  const endTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const duration = endTime - log.startTime;
  
  log.result = {
    success: !result.error,
    error: result.error ? {
      message: result.error.message,
      code: result.error.code,
      name: result.error.name,
    } : null,
    data: result.data || null,
    duration: `${duration.toFixed(2)}ms`,
  };
  
  log.endTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
  log.completed = true;
  
  if (result.error) {
    console.error(`[Firestore Op] ${log.operation} FAILED:`, {
      id: logId,
      error: log.result.error,
      state: log.state,
      duration: log.result.duration,
    });
  } else {
    console.log(`[Firestore Op] ${log.operation} SUCCESS:`, {
      id: logId,
      duration: log.result.duration,
    });
  }
  
  return log;
}

// Get all logs
export function getLogs() {
  return [...operationLogs];
}

// Get logs for a specific operation type
export function getLogsForOperation(operation) {
  return operationLogs.filter(log => log.operation === operation);
}

// Get failed operations
export function getFailedOperations() {
  return operationLogs.filter(log => log.completed && log.result && !log.result.success);
}

// Get operations with "offline" errors
export function getOfflineErrors() {
  return operationLogs.filter(log => 
    log.completed && 
    log.result && 
    !log.result.success &&
    (log.result.error?.code === 'unavailable' || 
     log.result.error?.message?.toLowerCase().includes('offline'))
  );
}

// Clear logs
export function clearLogs() {
  operationLogs.length = 0;
}

// Export logs as JSON (for debugging)
export function exportLogs() {
  return JSON.stringify(operationLogs, null, 2);
}

// Get summary statistics
export function getSummary() {
  const total = operationLogs.length;
  const completed = operationLogs.filter(l => l.completed).length;
  const successful = operationLogs.filter(l => l.completed && l.result?.success).length;
  const failed = operationLogs.filter(l => l.completed && l.result && !l.result.success).length;
  const offlineErrors = getOfflineErrors().length;
  
  return {
    total,
    completed,
    successful,
    failed,
    offlineErrors,
    successRate: completed > 0 ? `${((successful / completed) * 100).toFixed(1)}%` : 'N/A',
  };
}

