import { supabase } from './supabase';

export const checkRateLimit = async (ipAddress: string): Promise<{ allowed: boolean; remainingUploads: number }> => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Get or create rate limit record
    const { data: rateLimit, error } = await supabase
      .from('upload_rate_limits')
      .select('*')
      .eq('ip_address', ipAddress)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!rateLimit) {
      // First upload for this IP
      await supabase
        .from('upload_rate_limits')
        .insert({
          ip_address: ipAddress,
          upload_count: 1,
          last_upload_date: today
        });
      
      return { allowed: true, remainingUploads: 2 };
    }

    // Check if it's a new day
    if (rateLimit.last_upload_date !== today) {
      // Reset count for new day
      await supabase
        .from('upload_rate_limits')
        .update({
          upload_count: 1,
          last_upload_date: today
        })
        .eq('ip_address', ipAddress);
      
      return { allowed: true, remainingUploads: 2 };
    }

    // Check if limit exceeded
    if (rateLimit.upload_count >= 15) {
      return { allowed: false, remainingUploads: 0 };
    }

    // Increment count
    await supabase
      .from('upload_rate_limits')
      .update({
        upload_count: rateLimit.upload_count + 1
      })
      .eq('ip_address', ipAddress);

    return { 
      allowed: true, 
      remainingUploads: 15 - (rateLimit.upload_count + 1) 
    };
  } catch (error) {
    console.error('Rate limiting error:', error);
    // Allow upload on error to avoid blocking legitimate users
    return { allowed: true, remainingUploads: 3 };
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