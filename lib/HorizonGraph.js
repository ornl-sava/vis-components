'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactAddonsTransitionGroup = require('react-addons-transition-group');

var _reactAddonsTransitionGroup2 = _interopRequireDefault(_reactAddonsTransitionGroup);

var _d = require('d3');

var d3 = _interopRequireWildcard(_d);

var _d2 = require('./util/d3');

var _SVGComponent = require('./SVGComponent');

var _SVGComponent2 = _interopRequireDefault(_SVGComponent);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var HorizonGraph = function (_React$Component) {
  _inherits(HorizonGraph, _React$Component);

  function HorizonGraph() {
    _classCallCheck(this, HorizonGraph);

    return _possibleConstructorReturn(this, (HorizonGraph.__proto__ || Object.getPrototypeOf(HorizonGraph)).apply(this, arguments));
  }

  _createClass(HorizonGraph, [{
    key: 'render',

    /*  constructor (props) {
        super(props)
      }
    */
    value: function render() {
      var data = this.props.data;
      var numBands = this.props.numBands;
      var xAccess = this.props.xAccessor;
      var yAccess = this.props.yAccessor;

      var w = this.props.chartWidth ? this.props.chartWidth : this.props.width;
      var h = this.props.chartHeight ? this.props.chartHeight : this.props.height;

      var xmin = Infinity;
      var xmax = -Infinity;
      var ymax = -Infinity;

      data.map(function (d, i) {
        var x = xAccess(d, i);
        var y = yAccess(d);
        if (x < xmin) {
          xmin = x;
        }
        if (x > xmax) {
          xmax = x;
        }
        if (Math.abs(y) > ymax) {
          ymax = Math.abs(y);
        }
      });

      var xScale = d3.scaleLinear().domain([xmin, xmax]).range([0, w]);
      var yScale = d3.scaleLinear().domain([0, ymax]).range([0, h * numBands]);

      var points = d3.area().curve(d3.curveLinear).x(function (d, i) {
        return xScale(xAccess(d, i));
      }).y0(h * numBands).y1(function (d) {
        return h * numBands - yScale(yAccess(d));
      })(data);

      var levels = d3.range(-1, -numBands - 1, -1).concat(d3.range(1, numBands + 1));

      var horizonTransform = this.props.mode === 'offset' ? function (d) {
        return 'translate(0,' + (d + (d < 0) - numBands) * h + ')';
      } : function (d) {
        return (d < 0 ? 'scale(1,-1)' : '') + 'translate(0,' + (d - numBands) * h + ')';
      };

      var colors = this.props.colors;
      var color = d3.scaleLinear().domain(numBands > 1 ? [-numBands, -1, 1, numBands] : [-1, 0, 0, 1]).range(numBands > 1 ? colors : [colors[1], colors[0], colors[3], colors[2]]);

      var pathTransition = { func: function func(transition, props) {
          transition.delay(0).duration(500).ease((0, _d2.setEase)('linear')).attr('d', props.d).attr('fill', props.fill);
          return transition;
        } };

      var boxTransition = { func: function func(transition, props) {
          transition.delay(0).duration(500).ease((0, _d2.setEase)('linear')).attr('x', props.x).attr('y', props.y).attr('width', props.width).attr('height', props.height).attr('fill', props.fill);
          return transition;
        } };

      return _react2.default.createElement(
        _reactAddonsTransitionGroup2.default,
        { component: 'g' },
        _react2.default.createElement(
          _SVGComponent2.default,
          { Component: 'svg',
            x: '0px',
            y: '0px',
            width: w + 'px',
            height: h + 'px',
            key: 'horizonSvg',
            onUpdate: boxTransition
          },
          _react2.default.createElement(_SVGComponent2.default, { Component: 'rect',
            x: '0px',
            y: '0px',
            width: w + 'px',
            height: h + 'px',
            fill: this.props.bgColor,
            key: 'horizonBackground',
            onUpdate: boxTransition
          }),
          levels.map(function (d) {
            return _react2.default.createElement(_SVGComponent2.default, { Component: 'path',
              key: '' + d,
              d: points,
              transform: horizonTransform(d),
              fill: color(d),
              onUpdate: pathTransition
            });
          })
        )
      );
    }
  }]);

  return HorizonGraph;
}(_react2.default.Component);

HorizonGraph.defaultProps = {
  mode: 'offset',
  numBands: 2,
  data: [],
  colors: ['#bdd7e7', '#08519c', '#006d2c', '#bae4b3'],
  bgColor: 'white',
  xAccessor: function xAccessor(d, i) {
    return i;
  },
  yAccessor: function yAccessor(d) {
    return d;
  }
};

HorizonGraph.propTypes = {
  width: _react.PropTypes.number,
  height: _react.PropTypes.number,
  chartWidth: _react.PropTypes.number,
  chartHeight: _react.PropTypes.number,
  numBands: _react.PropTypes.number,
  mode: _react.PropTypes.string,
  data: _react.PropTypes.array,
  colors: _react.PropTypes.array,
  bgColor: _react.PropTypes.string,
  xAccessor: _react.PropTypes.func,
  yAccessor: _react.PropTypes.func
};

exports.default = HorizonGraph;