// Main Imports
import React, { Component } from 'react'
import fetch from 'isomorphic-fetch'
import PropTypes from 'prop-types'
import { sortBy } from 'lodash'
import classNames from 'classnames'

// Components
import Loading from './components/spinners/Loading'
import Button from './components/buttons/button'


// Styling
import './App.css'


// Component Setup
const DEFAULT_QUERY = 'redux'
const DEFAULT_HPP   = '5'
//const PATH_BASE     = 'https://hn.foo.bar.com/api/v1' // For error testing
const PATH_BASE     = 'https://hn.algolia.com/api/v1'
const PATH_SEARCH   = '/search'
const PARAM_SEARCH  = 'query='
const PARAM_PAGE    = 'page='
const PARAM_HPP     = 'hitsPerPage='

const SORTS = {
  NONE      : list => list,
  TITLE     : list => sortBy(list, 'title'),
  AUTHOR    : list => sortBy(list, 'author'),
  COMMENTS  : list => sortBy(list, 'num_comments').reverse(),
  POINTS    : list => sortBy(list, 'points').reverse(),
}

// Class Component  
class App extends Component {

  constructor(props) {
    super(props)
  
    this.state = {
      results       : null,
      searchKey     : '',
      searchTerm    : DEFAULT_QUERY,
      error         : null,
      isLoading     : false,
      sortKey       : 'NONE',
      isSortReverse : false,
    }

    this.needsToSearchTopstories  = this.needsToSearchTopstories.bind(this)
    this.setSearchTopstories      = this.setSearchTopstories.bind(this)
    this.fetchSearchTopstories    = this.fetchSearchTopstories.bind(this)
    this.onSearchChange           = this.onSearchChange.bind(this)
    this.onSearchSubmit           = this.onSearchSubmit.bind(this)
    this.onDismiss                = this.onDismiss.bind(this)
    this.onSort                   = this.onSort.bind(this)
  }

  onSort(sortKey) {
    const isSortReverse = this.state.sortKey === sortKey && !this.state.isSortReverse
    this.setState({ sortKey, isSortReverse })
  }

  needsToSearchTopstories(searchTerm) {
    return !this.state.results[searchTerm]
  }
  
  
  onSearchSubmit(event) {
    const { searchTerm } = this.state
    this.setState({ searchKey: searchTerm })

    if (this.needsToSearchTopstories(searchTerm)) {
      this.fetchSearchTopstories(searchTerm)
    }

    event.preventDefault()
  }

  setSearchTopstories(result) {
    const { hits, page }          = result
    const { searchKey, results }  = this.state
    
    const oldHits = results && results[searchKey]
      ? results[searchKey].hits
      : []

    const updatedHits = [
      ...oldHits,
      ...hits
    ]  

    this.setState({
      results: {
        ...results,
        [searchKey]: { hits: updatedHits, page } 
      },
      isLoading: false 
    })
  }

  fetchSearchTopstories(searchTerm, page = 0) {
    this.setState({ isLoading: true })

    fetch(`${PATH_BASE}${PATH_SEARCH}?${PARAM_SEARCH}${searchTerm}&${PARAM_PAGE}${page}&${PARAM_HPP}${DEFAULT_HPP}`)
      .then(response => response.json())
      .then(result => this.setSearchTopstories(result))
      .catch(e => this.setState({ error: e }));
  }

  componentDidMount() {
    const { searchTerm }          = this.state
    this.setState({ searchKey: searchTerm })
    this.fetchSearchTopstories(searchTerm)
  }
  
  onSearchChange(event) {
    this.setState({ searchTerm: event.target.value })
  }

  onDismiss(id) {
    const { searchKey, results }  = this.state
    const { hits, page }          = results[searchKey]

    const isNotId = item => item.objectID !== id
    const updatedHits = hits.filter(isNotId)
    
    this.setState({ 
      results: { 
        ...results, 
       [searchKey]: { hits: updatedHits, page }
      } 
    })
  }

  render() {
    const { 
      searchTerm, 
      results, 
      searchKey,
      error,
      isLoading,
      sortKey,
      isSortReverse,
    } = this.state
    
    const page = (
      results && 
      results[searchKey] &&
      results[searchKey].page
    ) || 0

    const list = (
      results &&
      results[searchKey] &&
      results[searchKey].hits
    ) || []

    return (
      <div className="page">
        <div className="interactions">
          <Search 
            value={searchTerm}
            onChange={this.onSearchChange}
            onSubmit={this.onSearchSubmit}
          >
            Search
          </Search>
        </div>
        { error 
          ? <div className="interactions">
            <span>
              <i className="fa fa-exclamation-circle" />
              {' '}Oops! Something went wrong
            </span>
          </div> 
          : <div>
            <Table
              list={list}
              sortKey={sortKey}
              isSortReverse={isSortReverse}
              onSort={this.onSort}
              onDismiss={this.onDismiss}
            />
          </div>
        }
        <div className="interactions">
          <ButtonWithLoading
            isLoading={isLoading}
            onClick={() => this.fetchSearchTopstories(searchKey, page + 1)}
          >    
            More
          </ButtonWithLoading>
        </div>
      </div>
    )
  }
}

const Search = ({ 
  value, 
  onChange, 
  onSubmit, 
  children 
}) =>  
  <form onSubmit={onSubmit}>
    {children}{' '}<input 
      type="text"
      value={value} 
      onChange={onChange}
    />
    <Button
      type="submit"
    >
      {children}
    </Button>
  </form>


Search.propTypes = {
  onSubmit  : PropTypes.func,
  onChange  : PropTypes.func,
  value     : PropTypes.string,
  children  : PropTypes.node,
}

const Table = ({ 
  list,
  sortKey,
  isSortReverse,
  onSort, 
  onDismiss, 
}) => {
  const sortedList = SORTS[sortKey](list)
  const reverseSortedList = isSortReverse
    ? sortedList.reverse()
    : sortedList

  return (
    <div className="table">
      <div className="table-header">
        <span style={{ width: '40%' }}>
          <Sort
            sortKey={'TITLE'}
            onSort={onSort}
            activeSortKey={sortKey}
          >
            Title
          </Sort>
        </span>
        <span style={{ width: '30%' }}>
          <Sort
            sortKey={'AUTHOR'}
            onSort={onSort}
            activeSortKey={sortKey}
          >
            Author
          </Sort>
        </span>
        <span style={{ width: '10%' }}>
          <Sort
            sortKey={'COMMENTS'}
            onSort={onSort}
            activeSortKey={sortKey}
          >
            Comments
          </Sort>
        </span>
        <span style={{ width: '10%' }}>
          <Sort
            sortKey={'POINTS'}
            onSort={onSort}
            activeSortKey={sortKey}
          >
            Points
          </Sort>
        </span>
        <span style={{ width: '10%' }}>
          Archive
        </span>
      </div>
      { reverseSortedList.map(item => 
        <div key={item.objectID} className="table-row">
          <span style={{ width: '40%' }} >
            <a href={item.url}>{item.title}</a>
          </span>
          <span style={{ width: '30%' }} >
            {' '}{item.author}
          </span>
          <span style={{ width: '10%' }} >
            {' '}{item.num_comments}
          </span>
          <span style={{ width: '10%' }} >
            {' '}{item.points}{' '}
          </span>
          <span style={{ width: '10%' }} >
            <Button
              onClick={() => onDismiss(item.objectID)}
              className="button-inline"
              type="button"
            >
              Dismiss
            </Button>
          </span>
        </div>
      )}
    </div>
  )
}


Table.propTypes = {
  list      : PropTypes.array.isRequired,
  onDismiss : PropTypes.func,
} 

const Sort = ({ 
  sortKey,
  activeSortKey, 
  onSort, 
  children 
}) => {
  const sortClass = classNames(
    'button-inline',
    { 'button-active': sortKey === activeSortKey }
  )
  
  return (
    <Button 
      onClick={() => onSort(sortKey)}
      className={sortClass}
    >
      {children}
    </Button>
  )
}

const withLoading = (Component) => ({ isLoading, ...rest }) =>
  isLoading
    ? <Loading className="fa-spinner"/>
    : <Component { ...rest } />

const ButtonWithLoading = withLoading(Button)


export default App

export {
  Search,
  Table,
}
