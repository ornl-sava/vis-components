import React, { PropTypes } from 'react'
import { findDOMNode } from 'react-dom'
import { brushX, select, event as d3Event } from 'd3'
class BrushX extends React.Component {
  constructor (props) {
    super(props)
    this.selection = null
    this.state = {
      selection: this.selection
    }
  }
  _brush () {
    this.applySelection()
  }
  _end () {
    if (this.state.selection !== this.selection) {
      this.setState({selection: this.selection})
    }
  }
  componentDidUpdate (prevProps, prevState) {
    if (this.props.width !== prevProps.width || this.props.height !== prevProps.height) {
      this.count = 0
      let thisNode = findDOMNode(this)
      let selection = select(thisNode)
      this.brush = brushX()
        .handleSize(6)
        .extent([[0, 0], [this.props.width, this.props.height]])
        .on('brush', this._brush.bind(this))
        .on('end', this._end.bind(this))
      selection.call(this.brush)
    }
  }
  applySelection () {
    if (d3Event.sourceEvent.type === 'brush') return
    let domain = this.calculateSelection(d3Event.selection.map(this.props.scale.invert))
    let thisNode = findDOMNode(this)
    select(thisNode)
        .call(this.brush.move, domain.map(this.props.scale))
    this.selection = domain
  }
  calculateSelection (domain) {
    let dateScale = /time/.test(this.props.scale.type)
    if (dateScale) {
      domain[0] = domain[0].getTime()
      domain[1] = domain[1].getTime()
    }
    let interval = this.props.children[1].props.children[0].props.data.x - this.props.children[0].props.children[0].props.data.x
    let range = this.props.children.reduce((prev, current) => {
      let xVal = dateScale ? current.props.children[0].props.data.x.getTime() : current.props.children[0].props.data.x
      let begin = prev[0] >= xVal && prev[0] < xVal + interval ? xVal : prev[0]
      let end = prev[1] > xVal && prev[1] < xVal + interval ? xVal : prev[1]
      if (begin === end) {
        end += interval
      }
      return [new Date(begin), new Date(end)]
    }, domain)
    return range
  }
  render () {
    // console.log('brush selection is : ' + this.state.selection)
    return (
      <g className='brush'>{this.props.children}</g>
    )
  }
}

BrushX.defaultProps = {
}

BrushX.propTypes = {
  children: PropTypes.node,
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  scale: PropTypes.func.isRequired
}

export default BrushX
