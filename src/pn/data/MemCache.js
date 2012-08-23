﻿;
goog.provide('pn.data.MemCache');

goog.require('goog.net.XhrManager');

goog.require('pn.log');



/**
 * @constructor
 * @extends {goog.Disposable}
 * @param {number} maxAgeMinutes The maximum age of entities in the MemCache
 *    before they are considered stale and invalidated.
 */
pn.data.MemCache = function(maxAgeMinutes) {
  goog.Disposable.call(this);

  /**
   * @private
   * @const
   * @type {number}
   */
  this.maxAgeMinutes_ = maxAgeMinutes;

  /**
   * @private
   * @type {Object.<Array>}
   */
  this.cache_ = {};

  /**
   * @private
   * @type {goog.debug.Logger}
   */
  this.log_ = pn.log.getLogger('pn.data.MemCache');

  // Check every 10 seconds for invalid entities
  setInterval(goog.bind(this.invalidateCache_, this), 10000);
};
goog.inherits(pn.data.MemCache, goog.Disposable);


/**
 * @param {pn.data.Type} type The type of entity list to retreive.
 * @return {Array} The cached list or null/undefined if its not cached.
 */
pn.data.MemCache.prototype.getCachedList = function(type) {
  goog.asserts.assert(goog.isFunction(type));
  return this.cache_[type.type];
};


/**
 * @param {pn.data.Type} type The type of entity list to load.
 */
pn.data.MemCache.prototype.invalidateCache = function(type) {
  goog.asserts.assert(goog.isFunction(type));

  delete this.cache_[type.type];
};


/**
 * @param {pn.data.Type} type The type of entity list to load.
 * @param {Array} lst The loaded list from the server.
 */
pn.data.MemCache.prototype.updateList = function(type, lst) {
  goog.asserts.assert(goog.isFunction(type));
  goog.asserts.assert(lst);

  this.cache_[type.type] = lst;
  this.cache_[type.type].lastUpdate = goog.now();
};


/**
 * Gets an object map of all the specified types and their cached lists.
 * @param {Array.<string>} types The types of entities to load.
 * @return {!Object.<!Array.<!Object>>} The cached lists in the current cache.
 */
pn.data.MemCache.prototype.getLists = function(types) {
  goog.asserts.assert(goog.isDefAndNotNull(types));

  goog.array.removeDuplicates(types);
  var cached = {};
  goog.array.forEach(types, function(type) {
    if (goog.isDef(this.cache_[type])) { cached[type] = this.cache_[type]; }
  }, this);
  return cached;
};


/** @private */
pn.data.MemCache.prototype.invalidateCache_ = function() {
  if (this.maxAgeMinutes_ < 0) return;

  var now = goog.now();
  var max = now - (this.maxAgeMinutes_ * 60 * 1000);
  for (var type in this.cache_) {
    var arr = this.cache_[type];
    if (arr && arr.lastUpdate < max) {
      this.log_.info('invalidating ' + type + ' from the client cache');
      delete this.cache_[type];
    }
  }
};
