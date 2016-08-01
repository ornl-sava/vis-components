import React, { PropTypes } from 'react'
import { select } from 'd3'

class ForceDirectedNode extends React.Component {
  constructor (props) {
    super(props)
    this.onClick = this._onClick.bind(this)
    this.onMouseEnter = this._onMouseEnter.bind(this)
    this.onMouseDown = this._onMouseDown.bind(this)
  }
  componentWillUnmount () {
    this._onMouseLeave()
  }
  _onClick (event) {
    if (this.props.tooltipData) {
      // console.log('click')
      this.props.onClick(event, this.props.tooltipData)
    }
  }
  _onMouseEnter (event) {
    if (this.props.tooltipData) {
      this.props.onEnter(event, this.props.tooltipData)
    }
  }
  _onMouseDown (event) {
    if (this.props.tooltipData) {
      let newEvent = new MouseEvent('mousedown', event)
      if (this.props.brushed) {
        let target = select('.selection')
        let leftMargin = select('.overlay').node().getBoundingClientRect().left
        let selectionWidth = parseFloat(target.attr('width'))
        let min = parseFloat(target.attr('x')) + leftMargin
        let max = parseFloat(target.attr('x')) + selectionWidth + leftMargin
        // console.log('min: ' + min + ', max: ' + max)
        if (target.style('display') === 'none' ||
        event.pageX < min || event.pageX > max) {
          target = select('.overlay').node()
        } else {
          target = target.node()
        }
        target.dispatchEvent(newEvent)
      }
    }
  }
  render () {
    let { y, x } = this.props
    return (
      <circle
        className={'circle'}
        id={this.props.radius}
        r={this.props.radius}
        cx={x}
        cy={y}
        fill={this.props.color}
     />)
  }
}

ForceDirectedNode.defaultProps = {
  brushed: false,
  height: 0,
  name: '',
  width: 0,
  onClick: () => null,
  tooltipData: null,
  y: 0,
  x: 0,
  style: {}
}

ForceDirectedNode.propTypes = {
  brushed: PropTypes.bool.isRequired,
  className: PropTypes.string,
  data: PropTypes.object,
  height: PropTypes.number.isRequired,
  name: PropTypes.string,
  width: PropTypes.number.isRequired,
  onClick: PropTypes.func,
  onEnter: PropTypes.func,
  onLeave: PropTypes.func,
  tooltipData: PropTypes.object,
  y: PropTypes.number.isRequired,
  x: PropTypes.number,
  style: PropTypes.object,
  radius: PropTypes.number,
  color: PropTypes.string
}

export default ForceDirectedNode