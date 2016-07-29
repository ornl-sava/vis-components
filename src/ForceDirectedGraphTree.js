import React, { PropTypes } from 'react'
import { setScale } from './util/d3'
import * as d3 from 'd3'
import Tooltip from './Tooltip'

const bezierLine = (node1, node2) => {
  return ('M' + node1.x + ',' + node1.y +
  'S' + node1.x + ',' + (node1.y + node2.y) / 2 +
  ' ' + node2.x + ',' + node2.y)
}

class ForceDirectedGraph extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      nodes: props.nodes,
      links: props.links
    }

    this.nodes = props.nodes
    this.links = props.links
    this.data = props.data
    this.rootNode = d3.hierarchy(this.data)
      .sum((d) => { return d.value })
      .sort((a, b) => { return b.height - a.height || b.value - a.value })

    this.colScale = d3.scaleOrdinal(d3.schemeCategory10)
    this.xScale = setScale('ordinalBand')

    this.aList = props.adjacencyList

    this.updateDR = this.updateDR.bind(this)
    this.updateDR(props)

    // this.falseStart(props)
    this.setTree(props)
    // console.log('FDG-c-nodes', this.links[0].source.x)

    this.simulation = d3.forceSimulation()
    this.setSim(props)

    this.onDClick = this.onDClick.bind(this)
    this.simOn = false

    this.tip = props.tipFunction
      ? new Tooltip().attr('className', 'd3-tip').html(props.tipFunction)
      : props.tipFunction
    this.onEnter = this.onEnter.bind(this)
    this.onLeave = this.onLeave.bind(this)

    this.pos = new Array(2)
    this.nodePos = new Array(2)
    this.isDrag = false
    this.onDrag = this.onDrag.bind(this)
    this.onDragStart = this.onDragStart.bind(this)
    this.onDragEnd = this.onDragEnd.bind(this)
    this.hidingNodes = []
  }

  componentWillMount () {
    // using the nodes with the x and y values attached in falseStart
    this.setState({nodes: this.nodes, links: this.links})
  }

  shouldComponentUpdate (nextProps, nextState) {
    // need to have a catch for if the props change rather than state...
    return true
  }

  componentWillUnmount () {
    this.simulation.stop()
  }

  onDClick (event) {
    if (this.simOn) {
      console.log('FDG-onDC-simOn')
      this.simOn = false
      // both don't need to be on... play with alpha
      this.setSim(this.props)
      this.simulation.restart()
      this.isDrag = false
    } else {
      console.log('FDG-onDC-simOff', this.links)
      this.simOn = true
      this.isDrag = false
      this.setState({nodes: this.nodes, links: this.links})
      this.simulation.stop()
      this.setTree(this.props)
    }
  }

  onEnter (event) {
    let target = this.getDatum(event.target)
    // console.log('FDGT-onE', target)
    let type = 'Node '
    if (target.data.events.indexOf('parent-') >= 0) {
      type = 'Parent '
    } else if (target.data.events.indexOf('root-') >= 0) {
      type = 'Root '
    }
    let tooltipD = {label: type + event.target.getAttribute('data-key') + ' at Hour ' + target.data.hour, counts: target.data.events.length}
    if (target && this.props.tipFunction) {
      this.tip.show(event, tooltipD)
    }
    this.props.onEnter(event, target)
  }
  onLeave (event) {
    let target = this.getDatum(event.target)
    let tooltipD = {label: 'Hour-' + target.data.hour, counts: target.data.events.length}
    if (target && this.props.tipFunction) {
      this.tip.hide(event, tooltipD)
    }
    this.props.onLeave(event, target)
  }

  onDragStart (event) {
    // console.log('FFG-oDStart-HERE')
    this.simulation.stop()
    let target = this.getDatum(event.target)
    let i = target.data.index
    if (target.children !== null) {
      target._children = target.children
      target.children = null
      this.reSet(this.props)
      if (this.simOn) {
        this.setState({nodes: this.nodes, links: this.links})
      } else {
        this.setSim(this.props)
        this.simulation.alphaTarget(0.3).restart()
      }
    } else if (target.children === null) {
      target.children = target._children
      target._children = null
      this.reSet(this.props)
      if (this.simOn) {
        this.setState({nodes: this.nodes, links: this.links})
      } else {
        this.setSim(this.props)
        this.simulation.alphaTarget(0.3).restart()
      }
    } else {
      this.pos = [event.clientX, event.clientY]
      this.isDrag = true
      let pos = [this.nodes[i].x, this.nodes[i].y]
      pos = pos.slice(0)
      // console.log('FFG-oDStart-i', i)
      this.nodes[i].fx = this.nodePos[0] = pos[0]
      this.nodes[i].fy = this.nodePos[1] = pos[1]
      this.simulation.alphaTarget(0.3).restart()
    }
  }
  onDrag (event) {
    if (this.isDrag) {
      let target = this.getDatum(event.target)
      let tooltipD = {label: ' ', counts: target.data.events.length}
      let i = this.getIndex(event.target)
      this.nodes[i].fx = (event.clientX - this.pos[0]) + this.nodePos[0]
      this.nodes[i].fy = (event.clientY - this.pos[1]) + this.nodePos[1]
      // hiding tool tip on drag
      if (target && this.props.tipFunction) {
        this.tip.hide(event, tooltipD)
      }
    }
  }
  onDragEnd (event) {
    this.isDrag = false
    this.pos = [0, 0]
    // console.log('FFG-oDE')
    let i = this.getIndex(event.target)
    this.nodes[i].fx = null
    this.nodes[i].fy = null
    this.simulation.alphaTarget(0)
  }

  updateDR (props) {
    this.colScale.domain(d3.range(0, props.numTData, 1))
    this.xScale
      .domain(d3.range(0, props.numTData, 1))
      .range([0, props.chartWidth])
      .padding(0.2)
  }

  getIndex (target) {
    return target.getAttribute('data-index')
  }

  getDatum (target) {
    let i = target.getAttribute('data-index')
    return this.nodes[i]
  }

  setSim (props) {
    this.simulation
      // .alphaTarget(0.4) // animation will not stop if the target is not 0
      // .alphaDecay(0.1) // slower start
      .alphaMin(0.01)
      .force('link', d3.forceLink().id(function (d, i) { return i }))
      .force('charge', d3.forceManyBody().strength(-30).distanceMax(500))
      .force('center', d3.forceCenter(props.chartWidth / 2, props.chartHeight / 2))

    this.simulation
        .nodes(this.nodes)
        .on('tick', (d, i) => {
          this.simUpdate(d, i)
        })

    this.simulation.force('link')
        .links(this.links)
  }
  simUpdate (d, i) {
    this.setState({nodes: this.nodes, links: this.links})
  }

  setTree (props) {
    let tree = d3.tree().size([props.chartWidth, props.chartHeight])
    tree(this.rootNode)
    this.nodes = this.rootNode.descendants()
    this.links = this.rootNode.links()
    // console.log('FDG-setTree')
  }
  reSet () {
    this.nodes = this.rootNode.descendants()
    this.links = this.rootNode.links()
  }

  drawSim (props) {
    // console.log('FDG-draw-props', props)
    let nodeList = []
    let linkList = []
    // console.log('FDG-draw-state', this.state)
    // console.log('FDG-draw-radius', props.radius)
    let events = {
      'onMouseMove': this.onDrag,
      'onMouseDown': this.onDragStart,
      'onMouseUp': this.onDragEnd,
      'onMouseEnter': this.onEnter,
      'onMouseLeave': this.onLeave
    }
    this.state.nodes.map((d, i) => {
      let circleProps = {
        'data-key': d.data.index,
        'data-index': i,
        'r': props.radius,
        'cx': d.x,
        'cy': d.y,
        'fill': this.colScale(d.data.hour),
        'events': d.events,
        'hour': d.hour
      }
      nodeList.push(
        <circle key={'cir-id' + d.data.index + '-hr-' + d.hour} {...events} {...circleProps} />
      )
    })
    this.state.links.map((data, index) => {
      if (props.isCurved) {
        linkList.push(
          <path key={'line-id-' + linkList.length} className='lineMatch' d={bezierLine(data.source, data.target)} style={{stroke: '#cdd5e4', strokeWidth: 2}} />
        )
      } else {
        let lineData = {
          x1: data.source.x,
          y1: data.source.y,
          x2: data.target.x,
          y2: data.target.y,
          style: {stroke: '#cdd5e4', strokeWidth: 2},
          data: data
        }
        linkList.push(
          <line key={'line-id' + linkList.length} {...lineData} />
        )
      }
    })
    return (
      <g onDoubleClick={this.onDClick}>
        {linkList}
        {nodeList}
      </g>
    )
  }

  render () {
    // console.log('FDG-r')
    let el = null
    let props = this.props
    el = this.drawSim(props)
    return (
      <g className={props.className + 'fdg'}>
        {el}
      </g>
    )
  }
}

ForceDirectedGraph.defaultProps = {
  xAccessor: 'x',
  yAccessor: 'y',
  radius: 7,
  onClick: () => {},
  onEnter: () => {},
  onLeave: () => {},
  className: '',
  tipFunction: () => {},
  isCurved: true
}

ForceDirectedGraph.propTypes = {
  chartHeight: PropTypes.number,
  chartWidth: PropTypes.number,
  className: PropTypes.string,
  radius: PropTypes.number,
  adjacencyList: PropTypes.any,
  tipFunction: PropTypes.func,
  nodes: PropTypes.array.isRequired,
  links: PropTypes.array.isRequired,
  xScale: PropTypes.any,
  yScale: PropTypes.any,
  data: PropTypes.object,
  onClick: PropTypes.func,
  onEnter: PropTypes.func,
  onLeave: PropTypes.func,
  isCurved: PropTypes.bool
}

export default ForceDirectedGraph
