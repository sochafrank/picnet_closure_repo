
goog.provide('pn.schema.Schema');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('pn.schema.EntitySchema');
goog.require('pn.schema.Enumeration');
goog.require('pn.schema.FieldSchema');



/**
 * @constructor
 * @extends {goog.Disposable}
 * @param {!Array} description The description of the schema from the server (
 *   i.e. Use object property string identifiers.).
 */
pn.schema.Schema = function(description) {
  goog.Disposable.call(this);

  goog.asserts.assert(description);

  /**
   * @private
   * @type {!Object.<!pn.schema.EntitySchema>}
   */
  this.entities_ = {};

  /**
   * @private
   * @type {!Object.<!pn.schema.Enumeration>}
   */
  this.enumerations_ = {};

  goog.array.forEach(description['entities'], this.parseEntity_, this);
  goog.array.forEach(description['enumerations'], this.parseEnumeration_, this);
};
goog.inherits(pn.schema.Schema, goog.Disposable);


/**
 * @param {pn.data.Type} type The type of entities we are ordering.
 * @param {!Array.<!Object>} list The entities to order.
 */
pn.schema.Schema.prototype.orderEntities = function(type, list) {
  goog.asserts.assert(goog.isFunction(type));

  var stype = type.type;
  var entitySchema = this.entities_[stype];
  var orderp = stype + 'Order';
  var namep = stype + 'Name';
  var order = entitySchema.fieldSchemas[orderp];
  var name = entitySchema.fieldSchemas[namep];

  if (order && order.type === 'Int32') {
    goog.array.sort(list, function(a, b) { return a[orderp] - b[orderp]; });
  } else if (name && name.type === 'String') {
    goog.array.sort(list, function(a, b) {
      return goog.string.caseInsensitiveCompare(a[namep], b[namep]);
    });
  }
};


/**
 * @param {pn.data.Type} type The type of the entity schema to retreive.
 * @return {!pn.schema.EntitySchema} The entity schema for the given type.
 */
pn.schema.Schema.prototype.getEntitySchema = function(type) {
  goog.asserts.assert(goog.isFunction(type));
  goog.asserts.assert(this.entities_[type.type]);

  return this.entities_[type.type];
};


/**
 * @param {!pn.ui.BaseFieldSpec} fieldSpec The field spec for the field being
 *     queried.
 * @return {pn.schema.FieldSchema} The field schema for the specified field.
 */
pn.schema.Schema.prototype.getFieldSchema = function(fieldSpec) {
  var type = fieldSpec.entitySpec.type;
  var prop = fieldSpec.dataProperty;
  var entity = this.entities_[type.type];
  if (!entity) throw new Error('Could not find the entity schema for: ' + type);
  return entity.fieldSchemas[prop];
};


/**
 * @param {!pn.ui.edit.FieldCtx} fctx The field context for the field being
 *    validated.
 * @param {!(Element|goog.ui.Component)} control The control for this field.
 * @return {!Array.<string>} Any errors (if any) for the specified field.
 */
pn.schema.Schema.prototype.getValidationErrors = function(fctx, control) {
  var schema = this.getFieldSchema(fctx.spec);
  if (!schema) {
    var desc = fctx.spec.entitySpec.type + '.' + fctx.id;
    throw new Error('Could not find the schema of ' + desc);
  }
  var validator = new pn.ui.edit.ValidateInfo();
  validator.required = !schema.allowNull;
  if (fctx.length) {
    validator.maxLength = schema.length;
  }
  if (this.isNumericalTypeField_(schema)) {
    validator.isNumber = true;
  }
  var error = validator.validateField(fctx, control);
  return error ? [error] : [];
};


/**
 * @param {pn.schema.FieldSchema} fieldSchema The field to determine
 *    the enumeration for.
 * @return {!pn.schema.Enumeration} The enumeration for the given field.
 */
pn.schema.Schema.prototype.getEnum = function(fieldSchema) {
  goog.asserts.assert(fieldSchema);
  goog.asserts.assert(goog.string.startsWith(fieldSchema.type, 'enum:'));

  var type = fieldSchema.type.split(':')[1];
  return this.enumerations_[type];
};


/**
 * @private
 * @param {!pn.schema.FieldSchema} fieldSchema The field to determine
 *    wether its a number type.
 * @return {boolean} Wether the specified field is a number.
 */
pn.schema.Schema.prototype.isNumericalTypeField_ = function(fieldSchema) {
  var t = fieldSchema.type;
  return t === 'Byte ' ||
      t === 'Int16' ||
      t === 'Int32' ||
      t === 'Int64' ||
      t === 'Single' ||
      t === 'Double' ||
      t === 'Decimal';
};


/**
 * @private
 * @param {Object} entity The description of the entity from the server (
 *   i.e. Use object property string identifiers.).
 */
pn.schema.Schema.prototype.parseEntity_ = function(entity) {
  goog.asserts.assert(entity);

  var name = entity['name'];
  var fields = {};
  goog.array.forEach(entity['fields'], function(f) {
    var fieldSchema = this.parseFieldSchema_(f);
    fields[fieldSchema.name] = fieldSchema;
  }, this);
  var e = new pn.schema.EntitySchema(name, fields);
  this.entities_[name] = e;
};


/**
 * @private
 * @param {!Object} f The description of the field from the server (
 *   i.e. Use object property string identifiers.).
 * @return {!pn.schema.FieldSchema} The parsed field.
 */
pn.schema.Schema.prototype.parseFieldSchema_ = function(f) {
  goog.asserts.assert(f);

  var entityType = f['entityType'] ? 
      pn.data.Entity.fromName(f['entityType']) : null;
  return new pn.schema.FieldSchema(
      f['name'], f['type'], entityType, f['allowNull'], f['length']);

};


/**
 * @private
 * @param {Object} enumeration The description of the enumeration from the
 *    server (i.e. Use object property string identifiers.).
 */
pn.schema.Schema.prototype.parseEnumeration_ = function(enumeration) {
  goog.asserts.assert(enumeration);

  var type = enumeration['type'];
  var names = enumeration['names'];
  var values = enumeration['values'];
  this.enumerations_[type] = new pn.schema.Enumeration(type, names, values);
};
