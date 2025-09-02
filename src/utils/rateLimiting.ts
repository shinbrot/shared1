import { getRateLimit, createRateLimit, updateRateLimit } from './firestore';

export const checkRateLimit = async (ipAddress: string): Promise<{ allowed: boolean; remainingUploads: number }> => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Get rate limit record
    const rateLimit = await getRateLimit(ipAddress);

    if (!rateLimit) {
      // First upload for this IP
      await createRateLimit(ipAddress);
      return { allowed: true, remainingUploads: 9 }; // 10 total - 1 used = 9 remaining
    }

    // Check if it's a new day
    if (rateLimit.last_upload_date !== today) {
      // Reset count for new day
      await updateRateLimit(rateLimit.id, 1, today);
      return { allowed: true, remainingUploads: 9 };
    }

    // Check if limit exceeded
    if (rateLimit.upload_count >= 10) {
      return { allowed: false, remainingUploads: 0 };
    }

    // Increment count
    await updateRateLimit(rateLimit.id, rateLimit.upload_count + 1);

    return { 
      allowed: true, 
      remainingUploads: 10 - (rateLimit.upload_count + 1) 
    };
  } catch (error) {
    console.error('Rate limiting error:', error);
    // Allow upload on error to avoid blocking legitimate users
    return { allowed: true, remainingUploads: 10 };
  }
};

export const getUserIP = async (): Promise<string> => {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.error('Failed to get IP:', error);
    return '0.0.0.0';
  }
};