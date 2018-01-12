// Copyright (c) Microsoft Corporation. All rights reserved.
// SPDX-License-Identifier: MIT

import { combineReducers } from 'redux'
import { PACKAGE_GET, PACKAGE_GET_PROPOSED, PACKAGE_PREVIEW, PACKAGE_LIST } from '../actions/packageActions'
import itemReducer from './itemReducer'
import listReducer from './listReducer'

export default combineReducers({
  current: new itemReducer(PACKAGE_GET),
  proposed: new itemReducer(PACKAGE_GET_PROPOSED),
  preview: new itemReducer(PACKAGE_PREVIEW),
  list: new listReducer(PACKAGE_LIST)
})
