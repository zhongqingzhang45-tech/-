export interface DeviceInfo {
  fingerprint: string;
  deviceId: string;
  deviceName: string;
  deviceType: "mobile" | "tablet" | "desktop";
  os: string;
  osVersion: string;
  browser: string;
  browserVersion: string;
  screenResolution: string;
  colorDepth: number;
  timezone: string;
  language: string;
  cores: number;
  memory: number;
  platform: string;
  vendor: string;
  model: string;
  firstVisit: number;
  lastVisit: number;
  visitCount: number;
  isPrimary: boolean;
  isTrusted: boolean;
  trustLevel: "new" | "untrusted" | "trusted" | "verified";
}

export interface UserBinding {
  userId: string;
  email: string;
  nickname: string;
  boundDevices: DeviceInfo[];
  primaryDeviceId: string;
  bindingDate: number;
  lastActiveDate: number;
  bindingLevel: number;
  totalDevices: number;
  maxDevices: number;
  trustScore: number;
}

export class DeviceFingerprint {
  private static instance: DeviceFingerprint;
  private deviceInfo: DeviceInfo | null = null;
  private binding: UserBinding | null = null;

  private constructor() {}

  static getInstance(): DeviceFingerprint {
    if (!DeviceFingerprint.instance) {
      DeviceFingerprint.instance = new DeviceFingerprint();
    }
    return DeviceFingerprint.instance;
  }

  async generateFingerprint(): Promise<string> {
    const components: string[] = [];

    if (typeof window !== "undefined") {
      components.push(navigator.userAgent);
      components.push(navigator.language);
      components.push(String(navigator.hardwareConcurrency || 0));
      components.push(String((navigator as any).deviceMemory || 0));
      components.push(screen.colorDepth.toString());
      components.push(`${screen.width}x${screen.height}`);
      components.push(Intl.DateTimeFormat().resolvedOptions().timeZone);

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.textBaseline = "top";
        ctx.font = "14px 'Arial'";
        ctx.fillStyle = "#f60";
        ctx.fillRect(125, 1, 62, 20);
        ctx.fillStyle = "#069";
        ctx.fillText("Corgi Tools fingerprint", 2, 15);
        ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
        ctx.fillText("Corgi Tools", 4, 17);
        components.push(canvas.toDataURL());
      }

      try {
        const stored = localStorage.getItem("corgi_fingerprint");
        if (stored) {
          components.push(stored);
        }
      } catch (e) {}
    }

    const combined = components.join("|||");
    const fingerprint = await this.hashString(combined);
    return fingerprint;
  }

  private async hashString(str: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  async collectDeviceInfo(): Promise<DeviceInfo> {
    if (this.deviceInfo) return this.deviceInfo;

    const fingerprint = await this.generateFingerprint();
    const now = Date.now();

    let deviceType: DeviceInfo["deviceType"] = "desktop";
    if (typeof window !== "undefined") {
      const ua = navigator.userAgent.toLowerCase();
      if (/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua)) {
        deviceType = /ipad|tablet|playbook|silk/i.test(ua) ? "tablet" : "mobile";
      }
    }

    let os = "Unknown";
    let osVersion = "";
    if (typeof window !== "undefined") {
      const ua = navigator.userAgent;
      if (ua.includes("Win")) { os = "Windows"; osVersion = ua.match(/Windows NT ([\d.]+)/)?.[1] || ""; }
      else if (ua.includes("Mac")) { os = "macOS"; osVersion = ua.match(/Mac OS X ([\d_]+)/)?.[1]?.replace("_", ".") || ""; }
      else if (ua.includes("Android")) { os = "Android"; osVersion = ua.match(/Android ([\d.]+)/)?.[1] || ""; }
      else if (ua.includes("iOS") || ua.includes("iPhone") || ua.includes("iPad")) { os = "iOS"; osVersion = ua.match(/OS ([\d_]+)/)?.[1]?.replace("_", ".") || ""; }
      else if (ua.includes("Linux")) os = "Linux";
    }

    let browser = "Unknown";
    let browserVersion = "";
    if (typeof window !== "undefined") {
      const ua = navigator.userAgent;
      if (ua.includes("Firefox")) { browser = "Firefox"; browserVersion = ua.match(/Firefox\/([\d.]+)/)?.[1] || ""; }
      else if (ua.includes("Edg/")) { browser = "Edge"; browserVersion = ua.match(/Edg\/([\d.]+)/)?.[1] || ""; }
      else if (ua.includes("Chrome")) { browser = "Chrome"; browserVersion = ua.match(/Chrome\/([\d.]+)/)?.[1] || ""; }
      else if (ua.includes("Safari") && !ua.includes("Chrome")) { browser = "Safari"; browserVersion = ua.match(/Version\/([\d.]+)/)?.[1] || ""; }
    }

    const storedVisit = this.getStoredVisitCount(fingerprint);
    const storedFirstVisit = this.getStoredFirstVisit(fingerprint);

    this.deviceInfo = {
      fingerprint,
      deviceId: fingerprint.substring(0, 16),
      deviceName: this.generateDeviceName(os, deviceType),
      deviceType,
      os,
      osVersion,
      browser,
      browserVersion,
      screenResolution: typeof window !== "undefined" ? `${screen.width}x${screen.height}` : "unknown",
      colorDepth: typeof window !== "undefined" ? screen.colorDepth : 24,
      timezone: typeof window !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "unknown",
      language: typeof window !== "undefined" ? navigator.language : "unknown",
      cores: typeof window !== "undefined" ? (navigator.hardwareConcurrency || 0) : 0,
      memory: typeof window !== "undefined" ? ((navigator as any).deviceMemory || 0) : 0,
      platform: typeof window !== "undefined" ? navigator.platform : "unknown",
      vendor: typeof window !== "undefined" ? navigator.vendor : "unknown",
      model: typeof window !== "undefined" ? ((navigator as any).vendorSub || "") : "",
      firstVisit: storedFirstVisit || now,
      lastVisit: now,
      visitCount: storedVisit + 1,
      isPrimary: storedVisit === 0,
      isTrusted: storedVisit >= 5,
      trustLevel: storedVisit === 0 ? "new" : storedVisit < 5 ? "untrusted" : storedVisit < 20 ? "trusted" : "verified",
    };

    this.saveDeviceInfo(this.deviceInfo);
    return this.deviceInfo;
  }

  private generateDeviceName(os: string, type: DeviceInfo["deviceType"]): string {
    const types: Record<DeviceInfo["deviceType"], string> = {
      mobile: "手机",
      tablet: "平板",
      desktop: "电脑",
    };
    return `${os} ${types[type]}`;
  }

  private getStoredVisitCount(fingerprint: string): number {
    try {
      const key = `corgi_visits_${fingerprint}`;
      const stored = localStorage.getItem(key);
      if (stored) return parseInt(stored, 10);
    } catch (e) {}
    return 0;
  }

  private getStoredFirstVisit(fingerprint: string): number | null {
    try {
      const key = `corgi_first_visit_${fingerprint}`;
      const stored = localStorage.getItem(key);
      if (stored) return parseInt(stored, 10);
    } catch (e) {}
    return null;
  }

  private saveDeviceInfo(info: DeviceInfo): void {
    try {
      const fpKey = `corgi_fingerprint`;
      localStorage.setItem(fpKey, info.fingerprint);

      const visitKey = `corgi_visits_${info.fingerprint}`;
      localStorage.setItem(visitKey, String(info.visitCount));

      if (!this.getStoredFirstVisit(info.fingerprint)) {
        const firstKey = `corgi_first_visit_${info.fingerprint}`;
        localStorage.setItem(firstKey, String(info.firstVisit));
      }

      const deviceKey = `corgi_device_${info.deviceId}`;
      localStorage.setItem(deviceKey, JSON.stringify(info));
    } catch (e) {}
  }

  async loadBinding(): Promise<UserBinding | null> {
    try {
      const stored = localStorage.getItem("corgi_user_binding");
      if (stored) {
        this.binding = JSON.parse(stored);
        return this.binding;
      }
    } catch (e) {}
    return null;
  }

  async createOrUpdateBinding(userId: string, email: string, nickname: string): Promise<UserBinding> {
    const deviceInfo = await this.collectDeviceInfo();

    const existing = await this.loadBinding();

    if (existing && existing.userId === userId) {
      const existingDevice = existing.boundDevices.find(d => d.deviceId === deviceInfo.deviceId);
      if (!existingDevice) {
        existing.boundDevices.push(deviceInfo);
        existing.totalDevices = existing.boundDevices.length;
        existing.lastActiveDate = Date.now();
      } else {
        existingDevice.lastVisit = Date.now();
        existingDevice.visitCount += 1;
      }
      this.binding = existing;
    } else {
      this.binding = {
        userId,
        email,
        nickname,
        boundDevices: [deviceInfo],
        primaryDeviceId: deviceInfo.deviceId,
        bindingDate: Date.now(),
        lastActiveDate: Date.now(),
        bindingLevel: 1,
        totalDevices: 1,
        maxDevices: 5,
        trustScore: 50,
      };
    }

    this.saveBinding(this.binding);
    return this.binding;
  }

  async addDeviceToBinding(newDevice: DeviceInfo): Promise<boolean> {
    const binding = await this.loadBinding();
    if (!binding) return false;
    if (binding.totalDevices >= binding.maxDevices) return false;

    const exists = binding.boundDevices.find(d => d.deviceId === newDevice.deviceId);
    if (exists) return true;

    newDevice.isPrimary = false;
    binding.boundDevices.push(newDevice);
    binding.totalDevices = binding.boundDevices.length;
    binding.lastActiveDate = Date.now();

    this.saveBinding(binding);
    return true;
  }

  removeDevice(deviceId: string): boolean {
    if (!this.binding) return false;
    if (deviceId === this.binding.primaryDeviceId) return false;

    const idx = this.binding.boundDevices.findIndex(d => d.deviceId === deviceId);
    if (idx === -1) return false;

    this.binding.boundDevices.splice(idx, 1);
    this.binding.totalDevices = this.binding.boundDevices.length;
    this.binding.lastActiveDate = Date.now();

    this.saveBinding(this.binding);
    return true;
  }

  setPrimaryDevice(deviceId: string): boolean {
    if (!this.binding) return false;
    const device = this.binding.boundDevices.find(d => d.deviceId === deviceId);
    if (!device) return false;

    this.binding.boundDevices.forEach(d => d.isPrimary = d.deviceId === deviceId);
    this.binding.primaryDeviceId = deviceId;
    this.saveBinding(this.binding);
    return true;
  }

  private saveBinding(binding: UserBinding): void {
    try {
      localStorage.setItem("corgi_user_binding", JSON.stringify(binding));
    } catch (e) {}
  }

  getBinding(): UserBinding | null {
    return this.binding;
  }

  getDeviceInfo(): DeviceInfo | null {
    return this.deviceInfo;
  }

  getBindingStatus(): {
    isBound: boolean;
    deviceCount: number;
    maxDevices: number;
    trustLevel: string;
    daysSinceFirstVisit: number;
  } {
    if (!this.deviceInfo) {
      return { isBound: false, deviceCount: 0, maxDevices: 5, trustLevel: "new", daysSinceFirstVisit: 0 };
    }
    const days = Math.floor((Date.now() - this.deviceInfo.firstVisit) / (1000 * 60 * 60 * 24));
    return {
      isBound: !!this.binding,
      deviceCount: this.binding?.totalDevices || 1,
      maxDevices: this.binding?.maxDevices || 5,
      trustLevel: this.deviceInfo.trustLevel,
      daysSinceFirstVisit: days,
    };
  }

  async verifyDevice(): Promise<boolean> {
    const info = await this.collectDeviceInfo();
    if (!this.binding) return false;
    const device = this.binding.boundDevices.find(d => d.deviceId === info.deviceId);
    if (!device) return false;

    device.isTrusted = true;
    this.binding.trustScore = Math.min(100, this.binding.trustScore + 10);
    this.saveBinding(this.binding);
    return true;
  }
}

export const deviceFingerprint = DeviceFingerprint.getInstance();
