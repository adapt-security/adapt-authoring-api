import { App } from 'adapt-authoring-core';
/**
 * Time-limited data cache
 * @memberof api
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
    this.prune();
    if(this.cache[key]) {
      return this.cache[key].data;
    }
    const mongodb = await App.instance.waitForModule('mongodb');
    const data = await mongodb.find(options.collectionName, query, mongoOptions);
    this.cache[key] = { data, timestamp: Date.now() };
    return data;
  }
  /**
   * Removes invalid cache data
   */
  prune() {
    Object.keys(this.cache).forEach(k => {
      const cache = this.cache[k];
      if(Date.now() > (cache.timestamp + this.lifespan)) {
        delete this.cache[k];
      }
    });
  }
}

export default DataCache;