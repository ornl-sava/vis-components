"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.toDOMAttribute = exports.toReactAttribute = exports.spreadExclude = exports.spreadRelated = void 0;

var spreadRelated = function spreadRelated(component, props) {
  // console.warn('This function may be deprecated in the future (src/util/react.js::spreadRelated)')
  var newProps = {};

  for (var p in props) {
    if (p in component.propTypes) {
      newProps[p] = props[p];
    }
  }

  return newProps;
};

exports.spreadRelated = spreadRelated;

var spreadExclude = function spreadExclude(props, exclude) {
  // console.warn('This function may be deprecated in the future (src/util/react.js::spreadExclude)')
  var newProps = {};

  for (var p in props) {
    if (!(p in exclude)) {
      newProps[p] = props[p];
    }
  }

  return newProps;
}; // Convert DOM attribute to React attribute


exports.spreadExclude = spreadExclude;

var toReactAttribute = function toReactAttribute(attribute) {
  // Check for classname
  if (attribute === 'classname') {
    return 'className';
  } else if (/-/.test(attribute)) {
    // Strip out '-' and capitalize each word after the 1st
    return attribute.split('-').map(function (s, i) {
      return i > 0 ? s.charAt(0).toUpperCase() + s.slice(1) : s;
    }).reduce(function (acc, curr) {
      return acc + curr;
    }, '');
  } else {
    return attribute;
  }
};

exports.toReactAttribute = toReactAttribute;

var toDOMAttribute = function toDOMAttribute(attribute) {
  // Check for classname
  if (attribute === 'className') {
    return 'classname';
  } else {
    // Convert camel case to dash
    return attribute.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
  }
};

exports.toDOMAttribute = toDOMAttribute;