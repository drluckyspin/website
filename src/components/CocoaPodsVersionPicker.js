// (c) Copyright 2022, SAP SE and ClearlyDefined contributors. Licensed under the MIT license.
// SPDX-License-Identifier: MIT

import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { getCocoaPodsRevisions } from '../api/clearlyDefined'
import Autocomplete from './Navigation/Ui/Autocomplete'
import searchSvg from '../images/icons/searchSvg.svg'

export default class CocoaPodsVersionPicker extends Component {
  static propTypes = {
    onChange: PropTypes.func,
    request: PropTypes.object.isRequired,
    defaultInputValue: PropTypes.string
  }

  constructor(props) {
    super(props)
    this.state = {
      customValues: [],
      options: [],
      focus: false
    }
    this.onChange = this.onChange.bind(this)
    this.filter = this.filter.bind(this)
  }

  componentDidMount() {
    this.getOptions('')
  }

  async getOptions(value) {
    try {
      const { name } = this.props.request
      const options = await getCocoaPodsRevisions(this.props.token, name)
      this.setState({ ...this.state, options })
    } catch (error) {
      this.setState({ ...this.state, options: [] })
    }
  }

  onChange(values) {
    const { onChange } = this.props
    if (!onChange) return
    let value = values.length === 0 ? null : values[0]
    if (!value) return onChange(value)
    if (value.customOption) {
      value = value.label
      this.setState({ ...this.state, customValues: [...this.state.customValues, value] })
    }
    onChange(value)
  }

  filter(option, props) {
    if (this.props.request.revision) return true
    return option.toLowerCase().indexOf(props.text.toLowerCase()) !== -1
  }

  render() {
    const { defaultInputValue, request } = this.props
    const selected = request.revision ? [request.revision] : []
    const { customValues, options, focus } = this.state
    const list = customValues.concat(options)
    return (
      <div className={`harvest-searchbar ${focus ? 'active' : ''}`}>
        <div className="search-logo">
          <img src={searchSvg} alt="search" />
        </div>{' '}
        <Autocomplete
          id="cocoapods-version-picker"
          selected={selected}
          options={list}
          defaultInputValue={defaultInputValue}
          placeholder={
            options.length === 0 ? 'Could not fetch versions, type a CocoaPod version' : 'Pick a CocoaPod version'
          }
          onChange={this.onChange}
          onFocus={() => this.setState({ ...this.state, focus: true })}
          onBlur={() => this.setState({ ...this.state, focus: false })}
          positionFixed
          clearButton
          allowNew
          newSelectionPrefix="Version:"
          emptyLabel=""
          filterBy={this.filter}
          selectHintOnEnter
        />
      </div>
    )
  }
}
