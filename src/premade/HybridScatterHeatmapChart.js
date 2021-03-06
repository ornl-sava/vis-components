import React from 'react'
import PropTypes from 'prop-types'
import { set, interpolateHcl } from 'd3'

import { setScale } from '../util/d3'
import { spreadRelated } from '../util/react'
import Chart from '../Chart'
import Axis from '../Axis'
import Tooltip from '../Tooltip'
import Heatmap from '../Heatmap'
import Scatterplot from '../Scatterplot'
import ColumnMarkers from '../ColumnMarkers'

class HybridScatterHeatmapChart extends React.Component {
  constructor (props) {
    super(props)

    this.xScale = setScale(props.xScaleType) // Shared time scale
    this.syScale = setScale(props.yScaleType) // Scatterplot scale
    this.hyScale = setScale('linear') // Heatmap scale
    this.scatterColorScale = setScale('linear')
    this.heatmapColorScale = setScale('quantile')

    this.scatterSet = set()

    this.state = {
      scatterData: [],
      expandedSectionNumbers: [], // Section #s to divide at
      domainExpansionFactor: 1, // Factor of domain to be used
      rangeExpansionFactor: 2 // Factor to expand range by
    }

    this.endTime = this.props.startTime - this.props.timeWindow

    this.onColumnMarkerClick = this.onColumnMarkerClick.bind(this)

    this.onHeatmapClick = this.onHeatmapClick.bind(this)
    this.onHeatmapEnter = this.onHeatmapEnter.bind(this)
    this.onHeatmapLeave = this.onHeatmapLeave.bind(this)

    this.onScatterplotClick = this.onScatterplotClick.bind(this)
    this.onScatterplotEnter = this.onScatterplotEnter.bind(this)
    this.onScatterplotLeave = this.onScatterplotLeave.bind(this)

    this.onResize = this.onResize.bind(this)

    this.updateDomain = this.updateDomain.bind(this)
    this.updateRange = this.updateRange.bind(this)
    this.updateScatterData = this.updateScatterData.bind(this)

    this.tip = props.tipFunction
      ? new Tooltip().attr('className', 'd3-tip').html(props.tipFunction)
      : props.tipFunction

    this.updateDomain(props, this.state)
    this.generateColorScale(props, this.state)
  }

  shouldComponentUpdate (nextProps, nextState) {
    this.updateDomain(nextProps, nextState)
    this.updateRange(nextProps, nextState)
    this.generateColorScale(nextProps, nextState)

    return true
  }

  componentWillReceiveProps (nextProps) {
    this.updateScatterData(nextProps)
  }

  componentWillUnmount () {
    if (this.props.tipFunction) {
      this.tip.destroy()
    }
  }

  generateColorScale (props, state) {
    // Get min/max for scatterplot color scale range
    let yMax = -Infinity
    let yMin = Infinity
    if (props.yDomain !== null) {
      yMin = props.yDomain[0]
      yMax = props.yDomain[1]
    } else {
      for (let i = 0; i < props.data.length; i++) {
        for (let j = 0; j < props.data[i].bins.length; j++) {
          for (let k = 0; k < props.data[i].bins[j].data.length; k++) {
            if (props.data[i].bins[j].data[k][props.scatterYAccessor] > yMax) {
              yMax = props.data[i].bins[j].data[k][props.scatterYAccessor]
            }
            if (props.data[i].bins[j].data[k][props.scatterYAccessor] < yMin) {
              yMin = props.data[i].bins[j].data[k][props.scatterYAccessor]
            }
          }
        }
      }
    }

    // Set scatter color scale
    this.scatterColorScale
      .domain([yMin, yMax])
      .range([props.scatterMinColor, props.scatterMaxColor])
      .interpolate(interpolateHcl)

    // Generate temp linear color scale for heatmap color scale
    let tempColorScale = setScale('linear')
      .domain([0, props.heatmapNumColorCat])
      .range([props.heatmapMinColor, props.heatmapMaxColor])
      .interpolate(interpolateHcl)

    // Generate heatmap color scale range
    let colorRange = []
    for (let i = 0; i < props.heatmapNumColorCat + 1; i++) {
      colorRange.push(tempColorScale(i))
    }

    // Generate heatmap color scale domain
    let colorDomain = [0, 1]
    for (let i = 0; i < props.data.length; i++) {
      for (let j = 0; j < props.data[i].bins.length; j++) {
        let value = props.data[i].bins[j][props.heatmapXAccessor.value]
        colorDomain.push(value === 0 ? 1 : value)
      }
    }

    // Set heatmap color scale
    this.heatmapColorScale
      .domain(colorDomain)
      .range(colorRange)
  }

  updateDomain (props, state) {
    if (props.data.length > 0 && props.data[0].bins.length > 0) {
      let horzLength = props.data[0].bins.length
      let originalTimeSlice = props.timeWindow / horzLength
      let expandedTimeSlice = originalTimeSlice * state.domainExpansionFactor

      // Compute new end time for expanded slice
      let timeWindow = 0
      for (let i = 0; i < horzLength; i++) {
        if (state.expandedSectionNumbers.indexOf(i) > -1) {
          timeWindow += expandedTimeSlice
        } else {
          timeWindow += originalTimeSlice
        }
      }

      // Push on domain 'slices'
      this.endTime = props.startTime - timeWindow
      let xDomain = [this.endTime]
      for (let i = 0; i < horzLength - 1; i++) {
        let previous = xDomain[xDomain.length - 1]
        if (state.expandedSectionNumbers.indexOf(i) > -1) {
          xDomain.push(previous + expandedTimeSlice)
        } else {
          xDomain.push(previous + originalTimeSlice)
        }
      }
      xDomain.push(props.startTime)

      // Update window of time for x scale
      this.xScale
        .domain(xDomain)

      let yMax = 1
      let yMin = 0
      if (props.yDomain !== null) {
        yMin = props.yDomain[0]
        yMax = props.yDomain[1]
      } else {
        for (let i = 0; i < props.data.length; i++) {
          for (let j = 0; j < props.data[i].bins.length; j++) {
            for (let k = 0; k < props.data[i].bins[j].data.length; k++) {
              if (props.data[i].bins[j].data[k][props.scatterYAccessor] > yMax) {
                yMax = props.data[i].bins[j].data[k][props.scatterYAccessor]
              }
            }
          }
        }
      }

      // Update scatter y scale domain
      this.syScale
        .domain([yMin, yMax])

      // Update heatmap y scale domain
      this.hyScale
        .domain([0, props.data.length])
    }
  }

  updateRange (props, state) {
    let chartWidth = this.refs.chart.chartWidth
    let chartHeight = this.refs.chart.chartHeight
    let horzLength = props.data[0].bins.length

    let originalBlockSize = chartWidth * (1 / horzLength)
    let expandedBlockSize = originalBlockSize * state.rangeExpansionFactor
    let newBlockSize = (chartWidth - (state.expandedSectionNumbers.length * expandedBlockSize)) /
      (horzLength - state.expandedSectionNumbers.length)
    let xRange = [0]

    for (let i = 0; i < horzLength - 1; i++) {
      let previous = xRange[xRange.length - 1]
      if (state.expandedSectionNumbers.indexOf(i) > -1) {
        xRange.push(previous + expandedBlockSize)
      } else {
        xRange.push(previous + newBlockSize)
      }
    }
    xRange.push(chartWidth)

    this.xScale.range(xRange)
    this.syScale.range([chartHeight, 0])
    this.hyScale.range([chartHeight, 0])
  }

  updateScatterData (props, state) {
    // Flatten expanded bins
    let scatterData = []
    let heatmapKeys = this.scatterSet.values()
    for (let i = 0; i < heatmapKeys.length; i++) {
      let key = heatmapKeys[i].split('-')
      let points = props.data[key[0]].bins[key[1]].data
      for (let j = 0; j < points.length; j++) {
        scatterData.push(points[j])
      }
    }

    this.setState({
      scatterData
    })
  }

  // This onClick is private to premade
  onColumnMarkerClick (event, data, index) {
    if (event.shiftKey) {
      let heatmap = this.refs.heatmap
      for (let i = 0; i < this.props.data.length; i++) {
        let bin = heatmap.refs[i + '-' + index]
        console.log(index, bin)
      }
    } else {
      let i = this.state.expandedSectionNumbers.indexOf(index)
      let toExpand = null
      if (i > -1) {
        toExpand = this.state.expandedSectionNumbers
        toExpand.splice(i, 1)
      } else {
        let chartWidth = this.refs.chart.chartWidth
        let horzLength = this.props.data[0].bins.length

        let originalBlockSize = chartWidth * (1 / horzLength)
        let expandedBlockSize = originalBlockSize * this.state.rangeExpansionFactor
        let pending = (this.state.expandedSectionNumbers.length + 1) * expandedBlockSize
        if (pending >= chartWidth || this.state.expandedSectionNumbers.length + 1 === horzLength) {
          toExpand = this.state.expandedSectionNumbers
        } else {
          toExpand = this.state.expandedSectionNumbers
            .concat(index)
            .sort((a, b) => {
              return a - b
            })
        }
      }
      this.setState({
        expandedSectionNumbers: toExpand
      })
    }
  }

  onHeatmapClick (event, data, index) {
    // Flip fill opacity
    let fillOpacity = event.target.getAttribute('fill-opacity') !== null
      ? 1 - event.target.getAttribute('fill-opacity')
      : 0
    event.target.setAttribute('fill-opacity', fillOpacity)

    // Add heatmap index to scatter set
    if (this.scatterSet.has(index)) {
      this.scatterSet.remove(index)
    } else {
      this.scatterSet.add(index)
    }
    this.updateScatterData(this.props)

    this.props.onHeatmapClick(event, data, index)
  }

  onHeatmapEnter (event, data, index) {
    if (data && this.tip) {
      this.tip.show(event, data, index)
    }
    this.props.onHeatmapEnter(event, data, index)
  }

  onHeatmapLeave (event, data, index) {
    if (data && this.tip) {
      this.tip.hide(event, data, index)
    }
    this.props.onHeatmapLeave(event, data, index)
  }

  onScatterplotClick (event, data, index) {
    this.props.onScatterplotClick(event, data, index)
  }

  onScatterplotEnter (event, data, index) {
    if (data && this.tip) {
      this.tip.show(event, data, index)
    }
    this.props.onScatterplotEnter(event, data, index)
  }

  onScatterplotLeave (event, data, index) {
    if (data && this.tip) {
      this.tip.hide(event, data, index)
    }
    this.props.onScatterplotLeave(event, data, index)
  }

  onResize () {
    this.updateRange(this.props, this.state)
  }

  render () {
    let { data, ...props } = this.props

    return (
      <Chart ref='chart' {...spreadRelated(Chart, props)} resizeHandler={this.onResize}>
        <ColumnMarkers data={data} xAccessor={props.heatmapXAccessor}
          colorScale={this.heatmapColorScale} xScale={this.xScale} onClick={this.onColumnMarkerClick} />

        <Heatmap ref='heatmap' className='heatmap' data={data}
          xScale={this.xScale} yScale={this.hyScale} colorScale={this.heatmapColorScale}
          xAccessor={props.heatmapXAccessor} yAccessor={props.heatmapYAccessor}
          onEnter={this.onHeatmapEnter} onLeave={this.onHeatmapLeave} onClick={this.onHeatmapClick} />

        <Scatterplot ref='scatter' className='scatter' data={this.state.scatterData} keyFunction={props.scatterKeyFunction}
          xScale={this.xScale} yScale={this.syScale} colorScale={this.scatterColorScale}
          xAccessor={props.scatterXAccessor} yAccessor={props.scatterYAccessor}
          onEnter={this.onScatterplotEnter} onLeave={this.onScatterplotLeave} onClick={this.onScatterplotClick} />

        <Axis className='x axis' {...props.xAxis} scale={this.xScale} />
        <Axis className='y axis' {...props.yAxis} scale={this.syScale} />
      </Chart>
    )
  }
}

// Manually define and ovveride scatterplot/heatmap accessors
HybridScatterHeatmapChart.defaultProps = {
  // Premade default
  data: [],
  xDomain: null,
  yDomain: null,
  yScaleType: 'linear',
  xScaleType: 'time',
  scatterMinColor: '#F1F5E9',
  scatterMaxColor: '#7C9B27',
  heatmapMinColor: '#eff3ff',
  heatmapMaxColor: '#2171b5',
  heatmapNumColorCat: 11,
  heatmapXAccessor: Heatmap.defaultProps.xAccessor,
  heatmapYAccessor: Heatmap.defaultProps.yAccessor,
  scatterXAccessor: Scatterplot.defaultProps.xAccessor,
  scatterYAccessor: Scatterplot.defaultProps.yAccessor,
  scatterKeyFunction: Scatterplot.defaultProps.keyFunction,
  onHeatmapClick: () => {},
  onHeatmapEnter: () => {},
  onHeatmapLeave: () => {},
  onScatterplotClick: () => {},
  onScatterplotEnter: () => {},
  onScatterplotLeave: () => {},
  // Spread chart default
  ...Chart.defaultProps,
  margin: { top: 20, right: 10, bottom: 20, left: 80 },
  // Spread scatter & heatmap default
  // ...Heatmap.defaultProps,
  // ...Scatterplot.defaultProps,
  xAxis: {
    type: 'x',
    orient: 'bottom',
    innerPadding: null,
    outerPadding: null,
    animationDuration: 500
  },
  yAxis: {
    type: 'y',
    orient: 'left',
    innerPadding: null,
    outerPadding: null,
    animationDuration: 500
  }
}

// xScaleType - tested to work with time and utc scales
// yScaleType - tested to work with linear scales
// yDomain - can gain a bit of a speedup by manually setting the yDomain
HybridScatterHeatmapChart.propTypes = {
  startTime: PropTypes.number.isRequired,
  timeWindow: PropTypes.number.isRequired,
  scatterMinColor: PropTypes.string,
  scatterMaxColor: PropTypes.string,
  heatmapMinColor: PropTypes.string,
  heatmapMaxColor: PropTypes.string,
  heatmapNumColorCat: PropTypes.number,
  ...Heatmap.propTypes,
  ...Scatterplot.propTypes,
  ...Chart.propTypes,
  onClick: PropTypes.func,
  onEnter: PropTypes.func,
  onLeave: PropTypes.func,
  tipFunction: PropTypes.func,
  xScaleType: PropTypes.string,
  yScaleType: PropTypes.string,
  xDomain: PropTypes.array,
  yDomain: PropTypes.array,
  xAccessor: PropTypes.any,
  yAccessor: PropTypes.any,
  xAxis: PropTypes.object,
  yAxis: PropTypes.object
}

export default HybridScatterHeatmapChart
