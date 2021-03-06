"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _d = require("./util/d3");

var d3 = _interopRequireWildcard(require("d3"));

var _Tooltip = _interopRequireDefault(require("./Tooltip"));

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj["default"] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _extends() { _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

var bezierLine = function bezierLine(node1, node2) {
  return 'M' + node1.x + ',' + node1.y + 'S' + node1.x + ',' + (node1.y + node2.y) / 2 + ' ' + node2.x + ',' + node2.y;
};

var ForceDirectedGraph =
/*#__PURE__*/
function (_React$Component) {
  _inherits(ForceDirectedGraph, _React$Component);

  function ForceDirectedGraph(props) {
    var _this;

    _classCallCheck(this, ForceDirectedGraph);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(ForceDirectedGraph).call(this, props));
    _this.state = {
      nodes: [],
      links: []
    };
    _this.nodes = [];
    _this.links = [];
    _this.data = props.data;
    _this.rootNode = d3.hierarchy(_this.data, function (d) {
      for (var i = 0; i < props.childAccessors.length; i++) {
        var data = d[props.childAccessors[i]];

        if (data != null && _typeof(data) === 'object') {
          return data;
        }
      }

      return d.children;
    }).sum(function (d) {
      return d.value;
    }).sort(function (a, b) {
      return b.height - a.height || b.value - a.value;
    });

    _this.setTree(props);

    _this.colScale = d3.scaleOrdinal(d3.schemeCategory10);
    _this.xScale = (0, _d.setScale)('band');
    _this.updateDR = _this.updateDR.bind(_assertThisInitialized(_this));

    _this.updateDR(props);

    _this.simulation = d3.forceSimulation();

    _this.setSim(props);

    _this.onDClick = _this.onDClick.bind(_assertThisInitialized(_this));
    _this.simOn = false;
    _this.tip = props.tipFunction ? new _Tooltip["default"]().attr('className', 'd3-tip').html(props.tipFunction) : props.tipFunction;
    _this.onEnter = _this.onEnter.bind(_assertThisInitialized(_this));
    _this.onLeave = _this.onLeave.bind(_assertThisInitialized(_this));
    _this.pos = new Array(2);
    _this.nodePos = new Array(2);
    _this.isDrag = false;
    _this.onDragStart = _this.onDragStart.bind(_assertThisInitialized(_this));
    _this.hidingNodes = [];
    return _this;
  }

  _createClass(ForceDirectedGraph, [{
    key: "componentWillMount",
    value: function componentWillMount() {
      // using the nodes with the x and y values attached in falseStart
      this.nodes.map(function (d, i) {
        d.key = i;
      });
      this.setState({
        nodes: this.nodes,
        links: this.links
      });
    }
  }, {
    key: "shouldComponentUpdate",
    value: function shouldComponentUpdate(nextProps, nextState) {
      // need to have a catch for if the props change rather than state...
      return true;
    }
  }, {
    key: "componentWillUnmount",
    value: function componentWillUnmount() {
      this.simulation.stop();
    }
  }, {
    key: "onDClick",
    value: function onDClick(event) {
      if (this.simOn) {
        console.log('FDG-onDC-simOn');
        this.simOn = false; // both don't need to be on... play with alpha

        this.setSim(this.props);
        this.simulation.restart();
        this.isDrag = false;
      } else {
        console.log('FDG-onDC-simOff');
        this.simOn = true;
        this.isDrag = false;
        this.setState({
          nodes: this.nodes,
          links: this.links
        });
        this.simulation.stop();
        this.setTree(this.props);
      }
    }
  }, {
    key: "onEnter",
    value: function onEnter(event) {
      var target = this.getDatum(event.target);

      if (target && this.props.tipFunction) {
        this.tip.show(event, target);
      }

      this.props.onEnter(event, target);
    }
  }, {
    key: "onLeave",
    value: function onLeave(event) {
      var target = this.getDatum(event.target);
      var tooltipD = {};

      if (target && this.props.tipFunction) {
        this.tip.hide(event, tooltipD);
      }

      this.props.onLeave(event, target);
    }
  }, {
    key: "onDragStart",
    value: function onDragStart(event) {
      // console.log('FFG-oDStart-HERE')
      this.simulation.stop();
      var target = this.getDatum(event.target); // let i = target.data.index

      if (target.children !== null) {
        target._children = target.children;
        target.children = null; // need to fix

        if (this.simOn) {
          this.setTree(this.props);
          this.setState({
            nodes: this.nodes,
            links: this.links
          });
        } else {
          this.reSet(this.props);
          this.setSim(this.props);
          this.simulation.alphaTarget(0.3).restart();
        }
      } else if (target.children === null) {
        target.children = target._children;
        target._children = null;

        if (this.simOn) {
          this.setTree(this.props);
          this.setState({
            nodes: this.nodes,
            links: this.links
          });
        } else {
          this.reSet(this.props);
          this.setSim(this.props);
          this.simulation.alphaTarget(0.3).restart();
        }
      }
    }
  }, {
    key: "updateDR",
    value: function updateDR(props) {
      this.colScale.domain(d3.range(0, props.numTData, 1));
      this.xScale.domain(d3.range(0, props.numTData, 1)).range([0, props.chartWidth]).padding(0.2);
    }
  }, {
    key: "getIndex",
    value: function getIndex(target) {
      return target.getAttribute('data-index');
    }
  }, {
    key: "getDatum",
    value: function getDatum(target) {
      var i = target.getAttribute('data-index'); // console.log('FDGT-gD-i', i)

      return this.nodes[i];
    }
  }, {
    key: "setSim",
    value: function setSim(props) {
      var _this2 = this;

      this.simulation // .alphaTarget(0.4) // animation will not stop if the target is not 0
      // .alphaDecay(0.1) // slower start
      .alphaMin(0.01).force('link', d3.forceLink().id(function (d, i) {
        return i;
      })).force('charge', d3.forceManyBody().strength(-30).distanceMax(500)).force('center', d3.forceCenter(props.chartWidth / 2, props.chartHeight / 2));
      this.simulation.nodes(this.nodes).on('tick', function (d, i) {
        _this2.simUpdate(d, i);
      });
      this.simulation.force('link').links(this.links);
    }
  }, {
    key: "simUpdate",
    value: function simUpdate(d, i) {
      this.setState({
        nodes: this.nodes,
        links: this.links
      });
    }
  }, {
    key: "setTree",
    value: function setTree(props) {
      var tree = d3.tree().size([props.chartWidth, props.chartHeight]);
      tree(this.rootNode);
      this.nodes = this.rootNode.descendants();
      this.links = this.rootNode.links();
      console.log('FDGT-nodes-', this.nodes.length, '-links-', this.links.length);
    }
  }, {
    key: "reSet",
    value: function reSet() {
      this.nodes = this.rootNode.descendants();
      this.links = this.rootNode.links();
    }
  }, {
    key: "drawSim",
    value: function drawSim(props) {
      var _this3 = this;

      // console.log('FDG-draw-props', props)
      var nodeList = [];
      var linkList = []; // console.log('FDG-draw-state', this.state)
      // console.log('FDG-draw-radius', props.radius)

      var events = {
        'onMouseDown': this.onDragStart,
        'onMouseEnter': this.onEnter,
        'onMouseLeave': this.onLeave
      };
      this.state.nodes.map(function (d, i) {
        var circleProps = {
          'data-key': d.key,
          'data-index': i,
          'r': props.radius,
          'cx': d.x,
          'cy': d.y,
          'fill': _this3.colScale(d.data.hour),
          'data-events': d.events,
          'data-hour': d.hour
        };
        var key = d.key;

        if (key == null) {
          key = 'root';
        }

        nodeList.push(_react["default"].createElement("circle", _extends({
          key: 'cir-id' + key + '-hr-' + d.hour
        }, events, circleProps)));
      });
      this.state.links.map(function (data, index) {
        if (props.isCurved) {
          linkList.push(_react["default"].createElement("path", {
            key: 'line-id-' + linkList.length,
            className: "lineMatch",
            d: bezierLine(data.source, data.target),
            style: {
              stroke: '#cdd5e4',
              strokeWidth: 2
            }
          }));
        } else {
          var lineData = {
            x1: data.source.x,
            y1: data.source.y,
            x2: data.target.x,
            y2: data.target.y,
            style: {
              stroke: '#cdd5e4',
              strokeWidth: 2
            },
            data: data
          };
          linkList.push(_react["default"].createElement("line", _extends({
            key: 'line-id' + linkList.length
          }, lineData)));
        }
      });
      return _react["default"].createElement("g", {
        onDoubleClick: this.onDClick
      }, linkList, nodeList);
    }
  }, {
    key: "render",
    value: function render() {
      // console.log('FDG-r')
      var el = null;
      var props = this.props;
      el = this.drawSim(props);
      return _react["default"].createElement("g", {
        className: props.className + 'fdg'
      }, el);
    }
  }]);

  return ForceDirectedGraph;
}(_react["default"].Component);

ForceDirectedGraph.defaultProps = {
  radius: 7,
  onClick: function onClick() {},
  onEnter: function onEnter() {},
  onLeave: function onLeave() {},
  className: '',
  tipFunction: function tipFunction() {},
  isCurved: true,
  childAccessors: [] // The following proptyes are needed for the linter
  // They have been commented out for expediency
  // ForceDirectedGraph.propTypes = {
  //   chartHeight: PropTypes.number,
  //   chartWidth: PropTypes.number,
  //   className: PropTypes.string,
  //   radius: PropTypes.number,
  //   tipFunction: PropTypes.func,
  //   xScale: PropTypes.any,
  //   yScale: PropTypes.any,
  //   data: PropTypes.object,
  //   onClick: PropTypes.func,
  //   onEnter: PropTypes.func,
  //   onLeave: PropTypes.func,
  //   isCurved: PropTypes.bool,
  //   childAccessors: PropTypes.array
  // }

};
ForceDirectedGraph.propTypes = {
  tipFunction: _propTypes["default"].func,
  data: _propTypes["default"].object,
  onEnter: _propTypes["default"].func,
  onLeave: _propTypes["default"].func,
  childAccessors: _propTypes["default"].array
};
var _default = ForceDirectedGraph;
exports["default"] = _default;