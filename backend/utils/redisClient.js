// backend/utils/redisClient.js
const Redis = require('ioredis');
const { redisHost, redisPort } = require('../config/keys');

class MockRedisClient {
  constructor() {
    this.store = new Map();
    this.isConnected = true;
    console.log('Using in-memory Redis mock (Redis server not available)');
  }

  async connect() {
    return this;
  }

  async set(key, value, options = {}) {
    const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
    this.store.set(key, { value: stringValue, expires: options.ttl ? Date.now() + (options.ttl * 1000) : null });
    return 'OK';
  }

  async get(key) {
    const item = this.store.get(key);
    if (!item) return null;
    
    if (item.expires && Date.now() > item.expires) {
      this.store.delete(key);
      return null;
    }
    
    try {
      return JSON.parse(item.value);
    } catch {
      return item.value;
    }
  }

  async setEx(key, seconds, value) {
    return this.set(key, value, { ttl: seconds });
  }

  async del(key) {
    return this.store.delete(key) ? 1 : 0;
  }

  async expire(key, seconds) {
    const item = this.store.get(key);
    if (item) {
      item.expires = Date.now() + (seconds * 1000);
      return 1;
    }
    return 0;
  }

  async quit() {
    this.store.clear();
    console.log('Mock Redis connection closed');
  }
}

class RedisClient {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.connectionAttempts = 0;
    this.maxRetries = 3;
    this.retryDelay = 2000;
    this.useMock = false;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) {
      return this.client;
    }

    try {
      await this.connect();
      this.initialized = true;
      return this.client;
    } catch (error) {
      console.warn('Redis initialization failed, using mock client:', error.message);
      this.client = new MockRedisClient();
      this.isConnected = true;
      this.useMock = true;
      this.initialized = true;
      return this.client;
    }
  }

  async connect() {
    if (this.isConnected && this.client) {
      return this.client;
    }

    // Check if Redis configuration is available
    if (!redisHost || !redisPort) {
      console.log('Redis configuration not found, using in-memory mock');
      this.client = new MockRedisClient();
      this.isConnected = true;
      this.useMock = true;
      return this.client;
    }

    try {
      console.log('Attempting to connect to Redis...');

      // Redis Cluster 설정 체크
      if (redisHost.includes(',')) {
        console.log('Detected Redis Cluster configuration');

        const redisHosts = redisHost.split(',').map(host => {
          return { host: host.trim(), port: parseInt(redisPort) };
        });

        console.log('Redis Cluster hosts:', redisHosts);

        this.client = new Redis.Cluster(redisHosts, {
          redisOptions: {
            connectTimeout: 2000,
            commandTimeout: 2000,
            retryDelayOnFailover: 100,
            maxRetriesPerRequest: 2,
          },
          enableOfflineQueue: false,
          retryDelayOnFailover: 100,
          retryDelayOnClusterDown: 300,
          maxRetriesPerRequest: 2,
          scaleReads: 'slave',
          clusterRetryDelayOnClusterDown: 300,
          clusterRetryDelayOnFailover: 100,
          lazyConnect: true
        });

        this.client.on('connect', () => {
          console.log('Redis Cluster Connected');
          this.isConnected = true;
          this.connectionAttempts = 0;
          this.useMock = false;
        });

        this.client.on('error', (err) => {
          console.error('Redis Cluster Error:', err.message);
          this.connectionAttempts++;

          if (!this.useMock && this.connectionAttempts >= this.maxRetries) {
            console.log('Max Redis reconnection attempts reached, switching to in-memory mock');
            this.client = new MockRedisClient();
            this.isConnected = true;
            this.useMock = true;
          }
        });

        this.client.on('node error', (err, node) => {
          const nodeInfo = node?.options ? `${node.options.host}:${node.options.port}` : 'unknown node';
          console.error(`Redis Node Error on ${nodeInfo}:`, err.message);
        });

        // 연결 테스트 (타임아웃 적용)
        const connectTimeout = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Connection timeout')), 3000);
        });

        await Promise.race([
          this.client.ping(),
          connectTimeout
        ]);

        console.log('Redis Cluster ping successful');

      } else {
        // 단일 Redis 모드
        console.log('Using single Redis instance');

        this.client = new Redis({
          host: redisHost,
          port: redisPort,
          connectTimeout: 2000,
          commandTimeout: 2000,
          retryDelayOnFailover: 100,
          maxRetriesPerRequest: 2,
          lazyConnect: true
        });

        this.client.on('connect', () => {
          console.log('Redis Client Connected');
          this.isConnected = true;
          this.connectionAttempts = 0;
          this.useMock = false;
        });

        this.client.on('error', (err) => {
          console.error('Redis Client Error:', err.message);
          this.connectionAttempts++;

          if (this.connectionAttempts >= this.maxRetries && !this.useMock) {
            console.log('Switching to in-memory mock Redis');
            this.client = new MockRedisClient();
            this.isConnected = true;
            this.useMock = true;
          }
        });

        // 연결 테스트
        await this.client.ping();
        console.log('Redis ping successful');
      }

      this.isConnected = true;
      return this.client;

    } catch (error) {
      console.error('Redis connection failed:', error.message);
      console.log('Using in-memory mock Redis instead');
      this.client = new MockRedisClient();
      this.isConnected = true;
      this.useMock = true;
      return this.client;
    }
  }

  async ensureConnection() {
    if (!this.initialized) {
      await this.initialize();
    }
    return this.client;
  }

  async set(key, value, options = {}) {
    try {
      const client = await this.ensureConnection();

      if (this.useMock) {
        return await client.set(key, value, options);
      }

      let stringValue;
      if (typeof value === 'object') {
        stringValue = JSON.stringify(value);
      } else {
        stringValue = String(value);
      }

      if (options.ttl) {
        return await client.setEx(key, options.ttl, stringValue);
      }
      return await client.set(key, stringValue);
    } catch (error) {
      console.error('Redis set error:', error);
      throw error;
    }
  }

  async get(key) {
    try {
      const client = await this.ensureConnection();

      if (this.useMock) {
        return await client.get(key);
      }

      const value = await client.get(key);
      if (!value) return null;

      try {
        return JSON.parse(value);
      } catch (parseError) {
        return value;
      }
    } catch (error) {
      console.error('Redis get error:', error);
      throw error;
    }
  }

  async setEx(key, seconds, value) {
    try {
      const client = await this.ensureConnection();

      if (this.useMock) {
        return await client.setEx(key, seconds, value);
      }

      let stringValue;
      if (typeof value === 'object') {
        stringValue = JSON.stringify(value);
      } else {
        stringValue = String(value);
      }

      return await client.setEx(key, seconds, stringValue);
    } catch (error) {
      console.error('Redis setEx error:', error);

      // Fallback to mock if Redis fails
      if (!this.useMock) {
        console.log('Falling back to mock Redis client');
        this.client = new MockRedisClient();
        this.isConnected = true;
        this.useMock = true;
        return await this.client.setEx(key, seconds, value);
      }
      throw error;
    }
  }

  async del(key) {
    try {
      const client = await this.ensureConnection();
      return await client.del(key);
    } catch (error) {
      console.error('Redis del error:', error);
      throw error;
    }
  }

  async expire(key, seconds) {
    try {
      const client = await this.ensureConnection();
      return await client.expire(key, seconds);
    } catch (error) {
      console.error('Redis expire error:', error);
      throw error;
    }
  }

  async quit() {
    if (this.client) {
      try {
        await this.client.quit();
        this.isConnected = false;
        this.client = null;
        this.initialized = false;
        console.log('Redis connection closed successfully');
      } catch (error) {
        console.error('Redis quit error:', error);
      }
    }
  }
}

const redisClient = new RedisClient();
module.exports = redisClient;