// Copyright (c) Microsoft Corporation and others. Licensed under the MIT license.
// SPDX-License-Identifier: MIT

import React, { Component } from 'react'
import ReactTable from 'react-table'
import 'react-table/react-table.css'
import transform from 'lodash/transform'
import isEqual from 'lodash/isEqual'
import treeTableHOC from './treeTable'
import FilterCustomComponent from './FilterCustomComponent'
import FacetsRenderer from '../FacetsRenderer'
import LicensesRenderer from '../LicensesRenderer'
import CopyrightsRenderer from '../CopyrightsRenderer'
import Contribution from '../../utils/contribution'

/**
 * A File List Tree-view, according to https://github.com/clearlydefined/website/issues/191
 *
 */
export default class FileList extends Component {
  state = {
    files: [],
    expanded: {},
    isFiltering: false
  }

  componentWillReceiveProps(nextProps) {
    // Data are parsed to create a tree-folder structure
    if (nextProps.files) {
      const files = parsePaths(nextProps.files, nextProps.component, nextProps.previewDefinition)
      nextProps.files && this.setState({ files, rawData: files }, () => this.forceUpdate())
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    return nextState.files.length !== this.state.files.length || !isEqual(nextProps.changes, this.props.changes)
  }

  generateColumns = columns => {
    return columns.concat([
      {
        Header: 'Name',
        accessor: 'name',
        resizable: false,
        style: {},
        Cell: row => <div style={{ paddingLeft: `${10 * (row.level - 1)}px` }}>{row.value}</div>,
        filterMethod: (filter, rows) =>
          rows.filter(
            item =>
              item._original ? item._original.path.toLowerCase().includes(filter.value.filterValue.toLowerCase()) : true
          ),
        filterAll: true
      },
      {
        Header: 'Facets',
        accessor: 'facets',
        resizable: false,
        Cell: row => <FacetsRenderer item={row} />,
        filterMethod: (filter, rows) => {
          const filterValue = filter.value.filterValue.toLowerCase()
          return rows.filter(item => {
            if (item && item.facets && item.facets.length) {
              // console.log(item.facets)
              return (
                item.facets.findIndex(f => {
                  return f.value.includes(filterValue)
                }) > -1
              )
            }
            return true
          })
        },
        filterAll: true
      },
      {
        Header: 'Licenses',
        id: 'license',
        accessor: 'license',
        resizable: false,
        Cell: row => <LicensesRenderer item={row} />,
        filterMethod: (filter, rows) =>
          filter.value.filterValue
            ? rows.filter(
                item =>
                  item._original && item._original.license
                    ? item._original.license
                        .toString()
                        .toLowerCase()
                        .includes(filter.value.filterValue.toLowerCase())
                    : true
              )
            : rows,
        filterAll: true
      },
      {
        Header: 'Copyrights',
        accessor: 'attributions',
        resizable: false,
        Cell: row => <CopyrightsRenderer item={row} showPopup={this.showPopup} />,
        filterMethod: (filter, rows) => {
          if (!filter.value.filterValue) return rows
          return rows.filter(item => {
            if (!item._original) return true
            if (!item._original.attributions) return false
            return item._original.attributions
              .toString()
              .toLowerCase()
              .includes(filter.value.filterValue.toLowerCase())
          })
        },
        filterAll: true
      }
    ])
  }

  render() {
    const { files, isFiltering } = this.state

    return (
      <div>
        <TreeTable
          showPagination={false}
          sortable={false}
          filterable
          freezeWhenExpanded={false}
          manual={false}
          onFilteredChange={() => this.setState({ isFiltering: true })}
          noDataText={
            isFiltering ? "Current filters didn't match any data" : 'There are currently no files for this definition'
          }
          data={files}
          pivotBy={pathColums}
          columns={this.generateColumns(columns)} // Merge columns array with other columns to show after the folders
          FilterComponent={props => {
            return (
              !String(props.column.id)
                .toLowerCase()
                .includes('folder_') && <FilterCustomComponent {...props} />
            )
          }}
        />
      </div>
    )
  }
}

// Import Custom TreeTable HOC
const TreeTable = treeTableHOC(ReactTable)

const pathColums = []
const columns = []

/**
 * Parse each file's path to retrieve the complete folder structure
 * @param  {} files The files object coming from the definition
 * @return {Object} Return a new object containing the files object modified
 */
const parsePaths = (files, component, preview) => {
  return transform(files, (result, file, key) => {
    const folders = file.path.split('/')

    // file.facets = ['core', 'data']
    if (preview.files && preview.files[key] && preview.files[key].facets) {
      file.facets = preview.files[key].facets.map((_, index) =>
        Contribution.getValueAndIfDifferent(component, preview, `files[${key}].facets[${index}]`)
      )
    } else {
      // TODO: check if file.facets is empty
      if (!files.facets) {
        file.facets = [
          {
            value: 'core',
            isDifferent: false
          }
        ]
      } else {
        file.facets = file.facets.map(f)
      }
    }

    // file.facets = Contribution.getValueAndIfDifferent(component, preview, `files[${key}].facets`)

    // if (file.name == 'package.json') console.log(file.facets)

    // If files are in the root folder, then they will grouped into a "/" folder
    if (folders.length === 1) {
      file['folder_0'] = '/'
    } else {
      folders.unshift('/')
    }

    // Add file[`folder_${index}`] to file object
    // If index is the last file, then is the name of the file
    folders.forEach((p, index) => {
      if (index + 1 === folders.length) file.name = p
      else {
        file[`folder_${index}`] = p
      }
    })

    folders.forEach((p, index) => {
      if (index + 1 < folders.length && pathColums.indexOf(`folder_${index}`) === -1) {
        // Add folders_${index} to patchColumns array
        pathColums.push(`folder_${index}`)

        // Add folders_${index} to columns array
        columns.push({
          accessor: `folder_${index}`,
          show: false,
          aggregated: true,
          resizable: false
        })
      }
    })
    result[key] = file
  })
}
