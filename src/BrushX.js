import React, { PropTypes } from 'react'
import { findDOMNode } from 'react-dom'
import { brushX, select, event as d3Event } from 'd3'

class BrushX extends React.Component {
  constructor (props) {
    super(props)
    this.brushSelection = props.brushSelection ? props.brushSelection : []
    if (!props.brushSelection) {
      this.state = {
        brushSelection: this.brushSelection
      }
    }
  }
  componentDidMount () {
    this.initBrush()
  }
  initBrush () {
    let thisNode = findDOMNode(this)
    let selection = select(thisNode)
    this.brush = brushX()
      .extent([[0, 0], [this.props.width, this.props.height]])
      .on('start', this._start.bind(this))
      .on('brush', this._brush.bind(this))
      .on('end', this._end.bind(this))
    selection.call(this.brush)
  }
  _start () {
    this.applySelection()
  }
  _brush () {
    this.applySelection()
  }
  _end () {
    let newSelection = this.brushSelection.toString()
    let oldSelection = this.props.brushSelection ? this.props.brushSelection.toString() : this.state.brushSelection.toString()
    if (newSelection !== oldSelection) {
      // console.log('Selected : ' + this.brushSelection.toString())
      this.props.onBrush(this.brushSelection)
      if (!this.props.brushSelection) {
        // console.log('Brush Selection not defined using state')
        this.setState({brushSelection: this.brushSelection})
      }
    }
  }
  clearBrush () {
    // console.log('clearing brush')
    if (this.brushSelection.length === 2) {
      let thisNode = findDOMNode(this)
      let selection = select(thisNode)
      this.brushSelection = []
      selection.call(this.brush.move, null)
    }
  }

  componentDidUpdate (prevProps, prevState) {
    if (this.props.width !== prevProps.width || this.props.height !== prevProps.height) {
      this.initBrush()
    }
    if (this.props.brushSelection && this.props.brushSelection.toString() !== prevProps.brushSelection.toString()) {
      this.brushSelection = this.props.brushSelection
    }
    this.clearBrush()
  }
  applySelection () {
    if (!d3Event.sourceEvent || d3Event.sourceEvent.type === 'brush' || !d3Event.selection) return
    let domain = this.calculateSelection(d3Event.selection.map(this.props.scale.invert))
    let thisNode = findDOMNode(this)
    select(thisNode)
        .call(this.brush.move, domain.map(this.props.scale))
    this.brushSelection = domain
  }
  calculateSelection (domain) {
    let { interval, scale } = this.props
    let dateScale = /time/.test(scale.type)
    if (dateScale) {
      domain = domain.map((val) => { return val.getTime() })
    }
    let nIntervals = Math.abs(scale.domain()[1] - scale.domain()[0]) / interval
    let out = domain.slice()
    for (let i = 0; i < nIntervals; i++) {
      let xVal = dateScale ? scale.domain()[0].getTime() : scale.domain()[0]
      xVal += interval * i
      if (domain[0] >= xVal && domain[0] < xVal + interval) {
        out[0] = xVal
      }
      if (domain[1] > xVal && domain[1] < xVal + interval) {
        out[1] = xVal
      }
    }
    if (out[0] === out[1]) {
      out[1] += interval
    }
    return dateScale ? [new Date(out[0]), new Date(out[1])] : out
  }
  render () {
    // console.log('brush selection is : ' + this.state.selection)
    return (
      <g className='brush'>{this.props.children}</g>
    )
  }
}

BrushX.defaultProps = {
  showHandles: false
}

BrushX.propTypes = {
  brushSelection: PropTypes.array,
  children: PropTypes.node,
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  interval: PropTypes.number.isRequired,
  scale: PropTypes.func.isRequired,
  showHandles: PropTypes.bool.isRequired,
  onBrush: PropTypes.func
}

export default BrushX
