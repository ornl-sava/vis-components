import React from 'react'
import PropTypes from 'prop-types'
import { TransitionGroup } from 'react-transition-group'
import * as d3 from 'd3'

import { setEase } from './util/d3'
import SVGComponent from './SVGComponent'
import BrushX from './BrushX'

class SummaryTimeline extends React.Component {
  constructor (props) {
    super(props)

    if (props.brushed && props.brushID === 'default') {
      console.warn('SummaryTimeline is set to be brushed but no brushID is provided! The brushID should be set to the data-name of the underlying class object')
    }
  }

  render () {
    let data = this.props.data

    if (this.props.showRange1Area) {
      var stdevRangeArea = d3.area()
        .curve(d3.curveStepAfter)
        .x((d) => { return this.props.xScale(d.date) })
        .y0((d) => { return this.props.yScale(d.innerRangeMin) })
        .y1((d) => { return this.props.yScale(d.innerRangeMax) })(data)
    }
    if (this.props.showRange2Area) {
      var extentRangeArea = d3.area()
        .curve(d3.curveStepAfter)
        .x((d) => { return this.props.xScale(d.date) })
        .y0((d) => { return this.props.yScale(d.outerRangeMin) })
        .y1((d) => { return this.props.yScale(d.outerRangeMax) })(data)
    }
    let pathTransition = { func: (transition, props) => {
      transition
        .delay(0)
        .duration(500)
        .ease(setEase('linear'))
        .attr('d', props.d)
        .attr('fill', props.fill)
      return transition
    } }

    let { keyFunction, ...props } = this.props

    let interval = Math.abs(data[1].date - data[0].date)

    return (
      <BrushX
        brushID={props.brushID}
        hideBrushSelection={false}
        width={props.xScale.range()[1]}
        height={props.yScale.range()[0]}
        interval={interval}
        scale={props.xScale}
        onBrush={props.onBrush}>
        <TransitionGroup component='g'>
          {this.props.showRange2Area &&
          <SVGComponent Component='path'
            key='extentRange2'
            fill={this.props.range2FillColor}
            d={extentRangeArea}
            onUpdate={pathTransition}
          />
          }
          {this.props.showRange1Area &&
          <SVGComponent Component='path'
            key='extentRange1'
            fill={this.props.range1FillColor}
            d={stdevRangeArea}
            onUpdate={pathTransition}
          />
          }
          {this.props.data.map((d, i) => {
            let opacityValue = 1.0
            if (props.useOpacityScale && d.opacityValue !== undefined) {
              opacityValue = props.opacityScale(d.opacityValue)
            }
            return (
              <SVGComponent Component='circle' key={keyFunction(d, i)}
                data={d}
                index={i}
                onUpdate={{
                  func: (transition, props) => {
                    transition
                      .delay(0)
                      .duration(500)
                      .ease(setEase('linear'))
                      .attr('r', props.r)
                      .attr('cx', props.cx)
                      .attr('cy', props.cy)
                      .style('fill-opacity', props.fillOpacity)
                    return transition
                  }
                }}
                r={props.meanCircleRadius}
                cx={props.xScale(d.date)}
                cy={props.yScale(d.avg)}
                fillOpacity={opacityValue}
                fill={this.props.meanFillColor}
                stroke='none' />
            )
          })}
        </TransitionGroup>
      </BrushX>
    )
  }
}

SummaryTimeline.defaultProps = {
  keyFunction: (d, i) => i,
  range1FillColor: '#9ecae1',
  range2FillColor: '#c6dbef',
  meanFillColor: 'black',
  meanCircleRadius: 1.0,
  useOpacityScale: true,
  showRange1Area: true,
  showRange2Area: true,
  brushID: 'default',
  onBrush: () => {}
}

SummaryTimeline.propTypes = {
  useOpacityScale: PropTypes.bool,
  showRange1Area: PropTypes.bool,
  showRange2Area: PropTypes.bool,
  bgColor: PropTypes.string,
  range1FillColor: PropTypes.string,
  range2FillColor: PropTypes.string,
  meanCircleRadius: PropTypes.number,
  meanFillColor: PropTypes.string,
  width: PropTypes.number,
  height: PropTypes.number,
  chartWidth: PropTypes.number,
  chartHeight: PropTypes.number,
  data: PropTypes.array,
  keyFunction: PropTypes.func,
  opacityScale: PropTypes.any,
  xScale: PropTypes.any,
  yScale: PropTypes.any,
  brushed: PropTypes.bool,
  brushID: PropTypes.string,
  onBrush: PropTypes.func
}

export default SummaryTimeline
