﻿;
goog.provide('pn.data.Query');

goog.require('goog.asserts');
goog.require('pn.json');



/**
 * @constructor
 * @param {string} type The entity type of this query.
 * @param {string=} opt_linq The optional linq query text to filter the query.
 */
pn.data.Query = function(type, opt_linq) {
  pn.assStr(type);
  pn.ass(!goog.isDef(opt_linq) || goog.isString(opt_linq));

  /**
   * @type {string}
   * @const
   * @expose
   */
  this.Type = type;

  /**
   * @type {string}
   * @const
   * @expose
   */
  this.Linq = opt_linq || '';
};


/** @override */
pn.data.Query.prototype.toString = function() {
  pn.assStr(this.Type);
  pn.assStr(this.Linq);

  return this.Type + ':' + this.Linq;
};


/**
 * @param {string} str A string representation of a Query object.
 * @return {!pn.data.Query} The parsed query object.
 */
pn.data.Query.fromString = function(str) {
  pn.assStr(str);

  var tokens = str.split(':');
  return new pn.data.Query(tokens[0], tokens[1]);
};
