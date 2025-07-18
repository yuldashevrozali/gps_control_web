// utils/device.ts
import FingerprintJS from '@fingerprintjs/fingerprintjs';

export async function getDeviceId(): Promise<string> {
  const fp = await FingerprintJS.load();
  const result = await fp.get();
  const deviceId = result.visitorId;
  console.log("Device ID:", deviceId); // <- bu yerda logga chiqariladi
  return deviceId;
}
