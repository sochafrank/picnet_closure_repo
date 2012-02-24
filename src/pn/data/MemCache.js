﻿;
goog.provide('pn.data.MemCache');

goog.require('goog.net.XhrManager');

goog.require('pn.LogUtils');
goog.require('pn.rcdb.MediatorEvent');



/**
 * @constructor
 * @extends {goog.Disposable}
 * @param {number} maxAgeMinutes The maximum age of entities in the MemCache
 *    before they are considered stale and invalidated.
 */
pn.data.MemCache = function(maxAgeMinutes) {
  goog.Disposable.call(this);

  goog.asserts.assert(maxAgeMinutes > 0);

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
  this.log_ = pn.LogUtils.getLogger('pn.data.MemCache');

  // Check every 10 seconds for invalid entities
  setInterval(goog.bind(this.invalidateCache_, this), 10000);
};
goog.inherits(pn.data.MemCache, goog.Disposable);


/**
 * @param {string} type The type of entity list to load.
 */
pn.data.MemCache.prototype.invalidateCache = function(type) {
  delete this.cache_[type];
};


/**
 * @param {string} type The type of entity list to load.
 * @param {Array} lst The loaded list from the server.
 */
pn.data.MemCache.prototype.updateList = function(type, lst) {
  if (type === 'Rc') return;

  this.cache_[type] = lst;
  this.cache_[type].lastUpdate = goog.now();
};


/**
 * Gets an object map of all the specified types and their cached lists.
 * @param {Array.<string>} types The types of entities to load.
 * @param {function(Object.<Array>):undefined} cb A success callback.
 * @param {string=} opt_parentField The optional parent field to check for a
 *    parentId match.
 * @param {number=} opt_parentId The optional parent id to check for a match.
 */
pn.data.MemCache.prototype.getCachedLists =
    function(types, cb, opt_parentField, opt_parentId) {
  goog.asserts.assert(goog.isDefAndNotNull(types));
  goog.asserts.assert(cb);

  goog.array.removeDuplicates(types);
  var cached = {};
  var unloaded = goog.array.filter(types, function(type) {
    if (goog.isDefAndNotNull(this.cache_[type])) {
      cached[type] = goog.array.filter(this.cache_[type], function(e) {
        return !opt_parentField || !opt_parentId || !e[opt_parentField] ||
            e[opt_parentField] === opt_parentId;
      });
      return false;
    } else { return true; }
  }, this);

  if (!unloaded.length) {
    cb(cached);
    return;
  }
  pn.rcdb.Global.pub(pn.rcdb.MediatorEvent.LOAD_ENTITY_LISTS, unloaded,
      goog.bind(function(loaded) {
        for (var type in loaded) {
          this.updateList(type, cached[type] = loaded[type]);
        }
        cb(cached);
      }, this), false, opt_parentField, opt_parentId);
};


/** @private */
pn.data.MemCache.prototype.invalidateCache_ = function() {
  var now = goog.now();
  var max = now - (this.maxAgeMinutes_ * 60 * 1000);
  for (var type in this.cache_) {
    if (this.cache_[type].lastUpdate < max) {
      this.log_.info('invalidating ' + type + ' from the client cache');
      delete this.cache_[type];
    }
  }
};