﻿;
goog.provide('pn.ui.MessagePanel');

goog.require('goog.Timer');
goog.require('goog.dom');
goog.require('pn.log');



/**
 * @constructor
 * @extends {goog.Disposable}
 * @param {!Element} panel The panel to use to display the messages/errors.
 */
pn.ui.MessagePanel = function(panel) {
  goog.Disposable.call(this);

  /**
   * @private
   * @type {!Element}
   */
  this.panel_ = panel;

  /**
   * @private
   * @type {number}
   */
  this.timer_ = 0;

  /**
   * @private
   * @type {!Array.<string>}
   */
  this.messages_ = [];

  /**
   * @private
   * @type {goog.debug.Logger}
   */
  this.log_ = pn.log.getLogger('pn.ui.MessagePanel');
};
goog.inherits(pn.ui.MessagePanel, goog.Disposable);


/**
 * Clears the message panel and resets to original class.
 */
pn.ui.MessagePanel.prototype.clearMessage = function() {
  this.messages_ = [];
  if (this.timer_) goog.Timer.clear(this.timer_);
  this.panel_.innerHTML = '';
  pn.dom.show(this.panel_, false);
};


/**
 * @param {string} message The error to display.
 */
pn.ui.MessagePanel.prototype.showError = function(message) {
  pn.assStr(message);
  this.showList_([message], 'error');
};


/**
 * @param {Array.<string>} list The error list to display.
 */
pn.ui.MessagePanel.prototype.showErrors = function(list) {
  pn.assArr(list);
  this.showList_(list, 'error');
};


/**
 * @param {string} message The error to display.
 */
pn.ui.MessagePanel.prototype.showWarning = function(message) {
  pn.assStr(message);
  this.showList_([message], 'warning');
};


/**
 * @param {Array.<string>} list The error list to display.
 */
pn.ui.MessagePanel.prototype.showWarnings = function(list) {
  pn.assArr(list);
  this.showList_(list, 'warning');
};


/**
 * @param {string} message The message to display.
 */
pn.ui.MessagePanel.prototype.showMessage = function(message) {
  pn.assStr(message);
  this.showList_([message], 'info');
};


/**
 * @param {Array.<string>} list The message list to display.
 */
pn.ui.MessagePanel.prototype.showMessages = function(list) {
  pn.assArr(list);
  this.showList_(list, 'info');
};


/**
 * @private
 * @param {Array.<string>} list The message list to display.
 * @param {string} cls The class of the messages to displahy (error,
 *    warning, info)
 */
pn.ui.MessagePanel.prototype.showList_ = function(list, cls) {
  pn.ass(list.length);

  if (this.timer_) { goog.Timer.clear(this.timer_); }
  this.messages_ = this.messages_.pnconcat(list.pnmap(
      function(m) { return cls + '|:' + m; })).
      pnremoveDuplicates();

  this.log_.finest('Showing Messages:\n' + this.messages_.join('\n'));

  var html = '<ul>' + this.messages_.pnmap(function(m) {
    var tokens = m.split('|:');
    return '<li class="' + tokens[0] + '">' + tokens[1];
  }).join('</li>') + '</li></ul>';

  this.panel_.innerHTML = html;
  pn.dom.show(this.panel_, true);
  this.timer_ = goog.Timer.callOnce(this.clearMessage, 3000, this);
};


/** @override */
pn.ui.MessagePanel.prototype.disposeInternal = function() {
  pn.ui.MessagePanel.superClass_.disposeInternal.call(this);
  delete this.panel_;
};
