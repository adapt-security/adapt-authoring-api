import { App } from 'adapt-authoring-core';
/**
 * Time-limited data cache
 */
class DataCache {
  /** @override */
  constructor({ enable, lifespan }) {
    this.isEnabled = enable !== false;
    this.lifespan = lifespan ?? App.instance.config.get('adapt-authoring-api.defaultCacheLifespan');
    this.cache = {};
  }
  async get(query, options, mongoOptions) {
    const key = JSON.stringify(query) + JSON.stringify(options) + JSON.stringify(mongoOptions);
    if(this.isCacheValid(key)) {
      return this.cache[key].data;
    }
    const mongodb = await App.instance.waitForModule('mongodb');
    const data = await mongodb.find(options.collectionName, query, mongoOptions);
    this.cache[key] = { data, timestamp: Date.now() };
    return data;
  }
  isCacheValid(key) {
    const cache = this.cache[key];
    return cache && Date.now() <= (cache.timestamp + this.lifespan);
  }
}

export default DataCache;