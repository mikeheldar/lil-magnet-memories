// Utility functions to detect device type and capabilities

export function isMobileDevice() {
  if (typeof window === 'undefined') return false;
  
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  
  // Check for mobile devices
  return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
    userAgent.toLowerCase()
  );
}

export function isTabletDevice() {
  if (typeof window === 'undefined') return false;
  
  // Check for tablets (iPad, Android tablets)
  return /ipad|android(?!.*mobile)/i.test(navigator.userAgent);
}

export function isDesktopDevice() {
  if (typeof window === 'undefined') return true;
  
  return !isMobileDevice() && !isTabletDevice();
}
