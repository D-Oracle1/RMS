import { api, getImageUrl } from '../api';

// Mock auth-storage
jest.mock('../auth-storage', () => ({
  getToken: jest.fn(),
}));

const { getToken } = require('../auth-storage');

// Mock global fetch
global.fetch = jest.fn();

describe('API Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ data: 'test' }),
    });
  });

  describe('getHeaders', () => {
    it('should include Authorization header when token exists', () => {
      getToken.mockReturnValue('test-token-123');

      const headers = api.getHeaders();

      expect(headers).toEqual(
        expect.objectContaining({
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-token-123',
        }),
      );
    });

    it('should not include Authorization header when no token', () => {
      getToken.mockReturnValue(null);

      const headers = api.getHeaders();

      expect(headers).toEqual({
        'Content-Type': 'application/json',
      });
      expect(headers).not.toHaveProperty('Authorization');
    });
  });

  describe('get', () => {
    it('should make GET request with correct URL', async () => {
      getToken.mockReturnValue(null);

      await api.get('/properties');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/properties'),
        expect.objectContaining({ method: 'GET' }),
      );
    });

    it('should throw on non-ok response', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => ({ message: 'Not found' }),
      });

      await expect(api.get('/nonexistent')).rejects.toThrow('Not found');
    });
  });

  describe('post', () => {
    it('should make POST request with body', async () => {
      getToken.mockReturnValue('token');
      const body = { title: 'Test Property' };

      await api.post('/properties', body);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/properties'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(body),
        }),
      );
    });
  });

  describe('delete', () => {
    it('should make DELETE request', async () => {
      getToken.mockReturnValue('token');

      await api.delete('/properties/123');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/properties/123'),
        expect.objectContaining({ method: 'DELETE' }),
      );
    });
  });
});

describe('getImageUrl', () => {
  it('should return empty string for empty path', () => {
    expect(getImageUrl('')).toBe('');
  });

  it('should return full URL as-is', () => {
    const url = 'https://example.com/image.jpg';
    expect(getImageUrl(url)).toBe(url);
  });

  it('should prepend API base URL for relative paths', () => {
    const result = getImageUrl('/uploads/gallery/image.jpg');
    expect(result).toContain('/uploads/gallery/image.jpg');
    expect(result).toMatch(/^https?:\/\//);
  });
});
