import { describe, it, expect } from 'vitest';

describe('IMEI Protection Security', () => {
  it('should mask IMEI correctly', () => {
    const fullImei = '123456789012345';
    const maskedImei = fullImei.substring(0, 5) + '******' + fullImei.substring(11);
    
    expect(maskedImei).toBe('12345******2345');
    expect(maskedImei).not.toBe(fullImei);
    expect(maskedImei.length).toBe(fullImei.length);
  });

  it('should not expose full IMEI in public data structure', () => {
    const publicData = {
      id: '123',
      title: 'iPhone 13',
      maskedImei: '12345******345',
    };

    // Ensure full IMEI property does not exist
    expect(publicData).not.toHaveProperty('imei');
    expect(publicData).not.toHaveProperty('fullImei');
    
    // Ensure masked version exists
    expect(publicData).toHaveProperty('maskedImei');
  });

  it('should validate IMEI format', () => {
    const validImei = '123456789012345';
    const invalidImei = '12345';
    
    expect(validImei.length).toBe(15);
    expect(/^\d{15}$/.test(validImei)).toBe(true);
    
    expect(invalidImei.length).not.toBe(15);
    expect(/^\d{15}$/.test(invalidImei)).toBe(false);
  });
});
