/**
 * Device detection utility
 * Detects device type, browser, OS, and other information
 */

export interface DeviceInfo {
  deviceType: 'desktop' | 'tablet' | 'mobile';
  browser: string;
  browserVersion: string;
  os: string;
  osVersion: string;
  screenResolution: string;
  language: string;
  timezone: string;
  userAgent: string;
}

/**
 * Detect device type based on screen width and user agent
 */
function detectDeviceType(): 'desktop' | 'tablet' | 'mobile' {
  const ua = navigator.userAgent.toLowerCase();
  const width = window.innerWidth;

  // Check for mobile devices
  if (/mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(ua)) {
    return 'mobile';
  }

  // Check for tablets
  if (/tablet|ipad|playbook|silk/i.test(ua) || (width >= 768 && width < 1024)) {
    return 'tablet';
  }

  return 'desktop';
}

/**
 * Detect browser name and version
 */
function detectBrowser(): { name: string; version: string } {
  const ua = navigator.userAgent;
  let name = 'Unknown';
  let version = 'Unknown';

  // Edge (Chromium-based)
  if (ua.indexOf('Edg/') > -1) {
    name = 'Edge';
    version = ua.match(/Edg\/(\d+\.\d+)/)?.[1] || 'Unknown';
  }
  // Chrome
  else if (ua.indexOf('Chrome') > -1 && ua.indexOf('Edg') === -1) {
    name = 'Chrome';
    version = ua.match(/Chrome\/(\d+\.\d+)/)?.[1] || 'Unknown';
  }
  // Safari
  else if (ua.indexOf('Safari') > -1 && ua.indexOf('Chrome') === -1) {
    name = 'Safari';
    version = ua.match(/Version\/(\d+\.\d+)/)?.[1] || 'Unknown';
  }
  // Firefox
  else if (ua.indexOf('Firefox') > -1) {
    name = 'Firefox';
    version = ua.match(/Firefox\/(\d+\.\d+)/)?.[1] || 'Unknown';
  }
  // Opera
  else if (ua.indexOf('OPR') > -1 || ua.indexOf('Opera') > -1) {
    name = 'Opera';
    version = ua.match(/(?:OPR|Opera)\/(\d+\.\d+)/)?.[1] || 'Unknown';
  }

  return { name, version };
}

/**
 * Detect operating system and version
 */
function detectOS(): { name: string; version: string } {
  const ua = navigator.userAgent;
  let name = 'Unknown';
  let version = 'Unknown';

  // Windows
  if (ua.indexOf('Win') > -1) {
    name = 'Windows';
    if (ua.indexOf('Windows NT 10.0') > -1) version = '10/11';
    else if (ua.indexOf('Windows NT 6.3') > -1) version = '8.1';
    else if (ua.indexOf('Windows NT 6.2') > -1) version = '8';
    else if (ua.indexOf('Windows NT 6.1') > -1) version = '7';
  }
  // macOS
  else if (ua.indexOf('Mac') > -1 && ua.indexOf('iPhone') === -1 && ua.indexOf('iPad') === -1) {
    name = 'macOS';
    const match = ua.match(/Mac OS X (\d+[._]\d+)/);
    if (match) {
      version = match[1].replace('_', '.');
    }
  }
  // iOS
  else if (ua.indexOf('iPhone') > -1 || ua.indexOf('iPad') > -1) {
    name = 'iOS';
    const match = ua.match(/OS (\d+[._]\d+)/);
    if (match) {
      version = match[1].replace('_', '.');
    }
  }
  // Android
  else if (ua.indexOf('Android') > -1) {
    name = 'Android';
    const match = ua.match(/Android (\d+\.\d+)/);
    if (match) {
      version = match[1];
    }
  }
  // Linux
  else if (ua.indexOf('Linux') > -1) {
    name = 'Linux';
  }

  return { name, version };
}

/**
 * Get screen resolution
 */
function getScreenResolution(): string {
  return `${window.screen.width}x${window.screen.height}`;
}

/**
 * Get browser language
 */
function getLanguage(): string {
  return navigator.language || 'Unknown';
}

/**
 * Get timezone
 */
function getTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'Unknown';
  }
}

/**
 * Get complete device information
 */
export function getDeviceInfo(): DeviceInfo {
  const browser = detectBrowser();
  const os = detectOS();

  return {
    deviceType: detectDeviceType(),
    browser: browser.name,
    browserVersion: browser.version,
    os: os.name,
    osVersion: os.version,
    screenResolution: getScreenResolution(),
    language: getLanguage(),
    timezone: getTimezone(),
    userAgent: navigator.userAgent,
  };
}

/**
 * Format device info for display
 */
export function formatDeviceInfo(info: DeviceInfo): string {
  const deviceIcon = info.deviceType === 'desktop' ? '💻' : info.deviceType === 'tablet' ? '📲' : '📱';
  return `${deviceIcon} ${info.deviceType} | ${info.browser} ${info.browserVersion} | ${info.os} ${info.osVersion}`;
}

