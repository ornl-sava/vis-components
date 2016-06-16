import React, { PropTypes } from 'react'
import d3 from 'd3'

class Heatmap extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      colorScale: d3.scale.quantile(),
      xDomain: this.props.xDomain,
      yDomain: this.props.yDomain
    }

    this.onClick = this.onClick.bind(this)
    this.onEnter = this.onEnter.bind(this)
    this.onLeave = this.onLeave.bind(this)
    this.renderLoadAnimation = this.renderLoadAnimation.bind(this)
    this.renderHeatmap = this.renderHeatmap.bind(this)
  }

  // Update the domain for the shared scale
  componentWillReceiveProps (nextProps) {
    if (nextProps.data.length > 0) {
      // If xDomain is not predefined
      // NOTE: When determining domain for x the first bin is Used
      // Each bin should have matching x domain keys
      let xDomain = nextProps.xDomain
      if (xDomain.length === 0) {
        // NOTE: Computing offset so proper xDomain is given
        // Nth bin has a start time of it's key; so it's 'end time'
        // must be taken into consideration
        let offset = nextProps.data[0].bins[1][nextProps.xKeyField] -
          nextProps.data[0].bins[0][nextProps.xKeyField]
        if (nextProps.xScaleType === 'ordinal') {
          xDomain = nextProps.data[0].bins.map((d) => d[nextProps.xKeyField])
        } else {
          xDomain = d3.extent(nextProps.data[0].bins, (d) => d[nextProps.xKeyField])
        }
        xDomain[1] = xDomain[1] + offset
      }

      // If yDomain is not predefined
      let yDomain = nextProps.yDomain
      if (yDomain.length === 0) {
        if (nextProps.yScaleType === 'ordinal') {
          yDomain = nextProps.data.map((d) => d[nextProps.yKeyField])
        } else {
          yDomain = d3.extent(nextProps.data, (d) => d[nextProps.yKeyField])
        }
      }

      // Update state and scale if domains are new
      if (xDomain !== this.state.xDomain) {
        this.props.xScale.domain(xDomain)
        this.setState({xDomain: xDomain})
      }

      if (yDomain !== this.state.yDomain) {
        this.props.yScale.domain(yDomain)
        this.setState({yDomain: yDomain})
      }

      // Generate color scale
      let yMax = nextProps.colorPerRow
        ? d3.max(nextProps.data, (d, i) => {
          return d3.max(d.bins, (e, j) => e[nextProps.xValueField])
        })
        : d3.max(nextProps.data, (d, i) => d[nextProps.yValueField])

      let tempColorScale = d3.scale.linear()
        .domain([0, yMax])
        .range([nextProps.minColor, nextProps.maxColor])

      let colorDomain = [0, 1]
      let colorRange = [nextProps.minColor]
      let colorDomainBand = yMax / (nextProps.numColorCat - 1)
      for (var i = 2; i < nextProps.numColorCat + 1; i++) {
        let value = colorDomain[i - 1] + colorDomainBand
        if (i === 2) value--
        colorDomain.push(value)
        colorRange.push(tempColorScale(value))
      }

      this.state.colorScale
        .domain(colorDomain)
        .range(colorRange)
    }
  }

  onClick (event) {
    // Call this to remove tooltip
    this.props.onClick(event)
  }

  onEnter (event) {
    let node = event.target
    this.props.onEnter(this.tooltipData(node), node)
  }

  onLeave (event) {
    let node = event.target
    this.props.onLeave(this.tooltipData(node), node)
  }

  tooltipData (node) {
    let label = node.getAttribute('data-label')
    let count = node.getAttribute('data-count')
    return {
      label,
      count
    }
  }

  renderHeatmap (props) {
    return (
      <g className='heatmap'>
        {props.data.map((d, i) => {
          return d.bins.map((e, j) => {
            let rectProps = {
              'data-label': e[props.labelField],
              'data-count': e[props.xValueField],
              'x': props.xScale(e[props.xKeyField]),
              'y': props.yScale(d[props.yKeyField]),
              'width': props.chartWidth / d.bins.length,
              'height': props.chartHeight / props.data.length,
              'fill': this.state.colorScale(e[props.xValueField]),
              'onMouseEnter': this.onEnter,
              'onMouseLeave': this.onLeave,
              'onClick': this.onClick
            }
            return (
              <rect key={i + j} {...rectProps} />
            )
          })
        })}
      </g>
    )
  }

  renderLoadAnimation (props) {
    let {chartWidth, chartHeight} = props
    let xPos = Math.floor(chartWidth / 2)
    let yPos = Math.floor(chartHeight / 2)
    let messageText = 'Loading data...'
    if (!props.loading) {
      if (props.status === 'Failed to fetch') {
        messageText = 'Can\'t connect to API URL'
      } else if (props.status !== 'OK') {
        messageText = 'Error retrieving data: ' + props.status
      } else {
        messageText = 'No data returned!'
      }
    }
    return (
      <g className='loading-message'>
        <text x={xPos} y={yPos}>{messageText}</text>
      </g>
    )
  }

  render () {
    let renderEl = null
    renderEl = this.renderLoadAnimation(this.props)
    if (this.props.data.length > 0) {
      renderEl = this.renderHeatmap(this.props)
    }
    return renderEl
  }
}

Heatmap.defaultProps = {
  minColor: '#eff3ff',
  maxColor: '#2171b5',
  numColorCat: 11,
  colorPerRow: true,
  labelField: 'label',
  padding: 0.2,
  outerPadding: 0.4,
  chartHeight: 0,
  chartWidth: 0,
  className: 'histogram',
  data: [],
  xDomain: [],
  xKeyField: 'key',
  xValueField: 'value',
  yDomain: [],
  yKeyField: 'key',
  yValueField: 'key',
  dataLoading: false,
  status: '',
  type: '',
  onClick: () => {},
  onEnter: () => {},
  onLeave: () => {}
}

Heatmap.propTypes = {
  minColor: PropTypes.string,
  maxColor: PropTypes.string,
  numColorCat: PropTypes.number,
  colorPerRow: PropTypes.bool,
  labelField: PropTypes.string,
  xDomain: PropTypes.array,
  xKeyField: PropTypes.string,
  xValueField: PropTypes.string,
  yDomain: PropTypes.array,
  yKeyField: PropTypes.string,
  yValueField: PropTypes.string,
  padding: PropTypes.number.isRequired,
  outerPadding: PropTypes.number.isRequired,
  chartHeight: PropTypes.number.isRequired,
  chartWidth: PropTypes.number.isRequired,
  className: PropTypes.string.isRequired,
  data: PropTypes.array,
  dataLoading: PropTypes.bool,
  onClick: PropTypes.func,
  onEnter: PropTypes.func,
  onLeave: PropTypes.func,
  status: PropTypes.string,
  type: PropTypes.string,
  xScale: PropTypes.any,
  yScale: PropTypes.any
}

export default Heatmap
