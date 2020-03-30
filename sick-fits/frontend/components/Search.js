/* eslint-disable react/jsx-props-no-spreading */
import React, { Component } from 'react'
import Downshift, { resetIdCounter } from 'downshift'
import Router from 'next/router'
import { ApolloConsumer } from 'react-apollo'
import gql from 'graphql-tag'
import debounce from 'lodash.debounce'
import { DropDown, DropDownItem, SearchStyles } from './styles/DropDown'

const SEARCH_ITEMS_QUERY = gql`
  query SEARCH_ITEMS_QUERY($searchTerm: String!) {
    items(
      where: {
        OR: [
          { title_contains: $searchTerm }
          { description_contains: $searchTerm }
        ]
      }
    ) {
      id
      image
      title
    }
  }
`

function routeToItem(item) {
  Router.push({
    pathname: '/item',
    query: {
      id: item.id,
    },
  })
}

class Search extends Component {
  state = {
    items: [],
    loading: false,
  }

  onChange = debounce(async (e, client) => {
    this.setState({ loading: true })

    if (e.target.value.length === 0) {
      this.setState({
        items: [],
        loading: false,
      })
      return
    }

    const res = await client.query({
      query: SEARCH_ITEMS_QUERY,
      variables: { searchTerm: e.target.value },
    })

    this.setState({
      items: res.data.items,
      loading: false,
    })
  }, 350)

  render() {
    resetIdCounter()
    return (
      <SearchStyles>
        <Downshift
          onChange={routeToItem}
          itemToString={item => (item === null ? '' : item.title)}
        >
          {({
            getInputProps,
            getItemProps,
            isOpen,
            inputValue,
            highlightedIndex,
          }) => {
            return (
              <div>
                <ApolloConsumer>
                  {client => {
                    return (
                      <input
                        type="search"
                        {...getInputProps({
                          type: 'search',
                          placeholder: 'Search For An Item',
                          className: this.state.loading ? 'loading' : '',
                          id: 'search',
                          onChange: e => {
                            e.persist()
                            this.onChange(e, client)
                          },
                        })}
                      />
                    )
                  }}
                </ApolloConsumer>
                {isOpen && (
                  <DropDown loading={this.state.loading}>
                    {this.state.items.map((item, index) => {
                      return (
                        <DropDownItem
                          key={item.id}
                          {...getItemProps({ item })}
                          highlighted={index === highlightedIndex}
                        >
                          <img width="50" src={item.image} alt={item.title} />
                          {item.title}
                        </DropDownItem>
                      )
                    })}
                    {!this.state.items.length &&
                      !this.state.loading &&
                      inputValue !== '' && (
                        <DropDownItem>
                          Nothing found for {inputValue}
                        </DropDownItem>
                      )}
                  </DropDown>
                )}
              </div>
            )
          }}
        </Downshift>
      </SearchStyles>
    )
  }
}

export default Search
