import React from 'react'

const Loading = ({ className = '' }) =>
  <div>
    <i className={'fa fa-pulse fa-3x fa-fw ' + className}></i>
    <span className="sr-only">Loading...</span>
  </div>

export default Loading