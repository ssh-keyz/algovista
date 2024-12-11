// frontend/src/services/cache.js

/**
 * Cache implementation for AlgoVista
 * Supports both in-memory and localStorage caching with TTL
 */

export class Cache {
  constructor(options = {}) {
    this.cache = new Map();
    this.ttl = options.ttl || 3600000; // 1 hour default
    this.maxSize = options.maxSize || 1000;
    this.prefix = options.prefix || 'math_';
    this.persistToStorage = options.persistToStorage || false;
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0
    };

    if (this.persistToStorage) {
      this.loadFromStorage();
    }
  }

  async get(key) {
    const prefixedKey = this.prefix + key;
    const item = this.cache.get(prefixedKey);

    if (!item) {
      this.stats.misses++;
      return null;
    }

    if (Date.now() > item.expiry) {
      this.cache.delete(prefixedKey);
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    return item.value;
  }

  async set(key, value) {
    const prefixedKey = this.prefix + key;
    const expiry = Date.now() + this.ttl;

    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(prefixedKey, { value, expiry });
    this.stats.sets++;

    if (this.persistToStorage) {
      this.saveToStorage();
    }
  }

  getStats() {
    return {
      ...this.stats,
      size: this.cache.size,
      hitRate: this.stats.hits / (this.stats.hits + this.stats.misses)
    };
  }

  loadFromStorage() {
    try {
      const stored = localStorage.getItem(this.prefix + 'cache');
      if (stored) {
        const data = JSON.parse(stored);
        data.forEach(([key, item]) => {
          if (Date.now() <= item.expiry) {
            this.cache.set(key, item);
          }
        });
      }
    } catch (error) {
      console.error('Error loading cache from storage:', error);
    }
  }

  saveToStorage() {
    try {
      const data = Array.from(this.cache.entries());
      localStorage.setItem(this.prefix + 'cache', JSON.stringify(data));
    } catch (error) {
      console.error('Error saving cache to storage:', error);
    }
  }
}
