"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _reactDom = _interopRequireDefault(require("react-dom"));

var _d = require("d3");

var _d2 = require("./util/d3");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

// Truncate labels based on maximum allowable characters, where
// characters should be estimated at 8-10 pixels per character.
var truncateLabel = function truncateLabel(d, maxChars) {
  if (d == null) {
    console.warn('No label to truncate, check and makes sure the container has the correct accessor.key specified');
    return '';
  }

  var replacementString = '...';

  if (d.length > maxChars + replacementString.length) {
    return d.substring(0, maxChars) + '...';
  }

  return d;
};

var Axis =
/*#__PURE__*/
function (_React$Component) {
  _inherits(Axis, _React$Component);

  function Axis(props) {
    var _this;

    _classCallCheck(this, Axis);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(Axis).call(this, props));
    _this.state = {
      range: 0,
      ticks: 0
    };
    _this.resizeAxis = _this.resizeAxis.bind(_assertThisInitialized(_this));
    _this.axis = (0, _d2.setAxis)(props.orient);

    _this.axis.scale(props.scale);

    return _this;
  }

  _createClass(Axis, [{
    key: "componentDidMount",
    value: function componentDidMount() {
      this.resizeAxis();
    }
  }, {
    key: "componentDidUpdate",
    value: function componentDidUpdate() {
      this.resizeAxis();
    } // Re-calculate postions of the chart based on the currently rendered position

  }, {
    key: "resizeAxis",
    value: function resizeAxis() {
      var _this2 = this;

      // let props = this.props
      var thisNode = _reactDom["default"].findDOMNode(this);

      var parentNode = thisNode.parentNode;
      var selector = '.' + this.props.className.replace(/ /g, '.');
      var selection = (0, _d.select)(parentNode).select(selector);
      var tickCount = 0;
      var tickValues = this.props.tickValues;
      var tickPreformatValues = [];
      var tickFormatter = null;

      if (this.props.scale.domain().length > 0) {
        // Use custom tick count if it exist
        if (this.props.tickCount) {
          tickCount = this.props.tickCount;
        } else {
          tickCount = this.props.type === 'y' ? 3 : this.props.scale.domain().length;
        } // Set tickFormatter to be used


        if ((0, _d2.isOrdinalScale)(this.props.scale.type)) {
          var maxWidth = 0;
          var fontSize = 12;

          if (this.props.orient === 'top' || this.props.orient === 'bottom') {
            var binWidth = Math.floor(this.props.scale.step());
            maxWidth = Math.floor(binWidth / fontSize);
          } else {
            if (this.props.orient === 'left') {
              maxWidth = this.props.margin.left;
            } else {
              maxWidth = this.props.margin.right;
            }
          }

          tickFormatter = function tickFormatter(d) {
            tickPreformatValues.push(d);
            return truncateLabel(d, maxWidth);
          };
        } else if (this.props.tickFormat) {
          tickFormatter = function tickFormatter(d, i) {
            tickPreformatValues.push(d);
            return _this2.props.tickFormat(d, i);
          };
        } else {
          tickFormatter = function tickFormatter(d, i) {
            // Default d3 method of formatting
            // Allows obtaining the real value for styling before it's formatted
            tickPreformatValues.push(d);
            var tick = typeof _this2.props.scale.tickFormat === 'function' ? _this2.props.scale.tickFormat()(d) : d;
            return tick;
          };
        }
      } // Setup axis


      this.axis.tickFormat(tickFormatter).tickValues(tickValues).ticks(tickCount); // Create and animate axis

      selection.transition().duration(this.props.animationDuration).call(this.axis); // Add styling to axis

      if (this.props.tickStyle) {
        var tickStyle = this.props.tickStyle;
        selection.selectAll('.tick text').each(function (d, i) {
          var tick = (0, _d.select)(this);
          tickStyle(tick, tickPreformatValues[i], i);
        });
      }

      if (this.props.onLabelClick) {
        selection.selectAll('.tick').style('cursor', 'pointer');
        selection.selectAll('.tick').on('click', function (d) {
          _this2.props.onLabelClick(d);
        });
      }
    }
  }, {
    key: "render",
    value: function render() {
      var transform = '';

      if (this.props.orient === 'bottom') {
        transform = 'translate(0,' + this.props.chartHeight + ')';
      } else if (this.props.orient === 'right') {
        transform = 'translate(' + this.props.chartWidth + ',0)';
      }

      return _react["default"].createElement("g", {
        className: this.props.className,
        transform: transform
      }, this.props.label != null ? _react["default"].createElement("text", {
        className: "label"
      }, this.props.label) : undefined);
    }
  }]);

  return Axis;
}(_react["default"].Component);

Axis.defaultProps = {
  type: 'x',
  orient: 'left',
  tickValues: null,
  tickCount: null,
  tickFormat: null,
  tickStyle: null,
  animationDuration: 0,
  label: null
};
Axis.propTypes = {
  chartHeight: _propTypes["default"].number,
  chartWidth: _propTypes["default"].number,
  className: _propTypes["default"].string,
  orient: _propTypes["default"].string.isRequired,
  margin: _propTypes["default"].object,
  type: _propTypes["default"].string.isRequired,
  animationDuration: _propTypes["default"].number,
  tickStyle: _propTypes["default"].oneOfType([_propTypes["default"].func, _propTypes["default"].bool]),
  tickValues: _propTypes["default"].oneOfType([_propTypes["default"].array, _propTypes["default"].bool]),
  tickCount: _propTypes["default"].oneOfType([_propTypes["default"].number, _propTypes["default"].bool]),
  tickFormat: _propTypes["default"].oneOfType([_propTypes["default"].func, _propTypes["default"].bool]),
  label: _propTypes["default"].string,
  scale: _propTypes["default"].any,
  onLabelClick: _propTypes["default"].func
};
var _default = Axis;
exports["default"] = _default;