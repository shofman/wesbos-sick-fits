import React, { Component } from 'react'
import { Mutation } from 'react-apollo'
import PropTypes from 'prop-types'
import gql from 'graphql-tag'
import { ALL_ITEMS_QUERY } from './Items'

const DELETE_ITEM_MUTATION = gql`
  mutation DELETE_ITEM_MUTATION($id: ID!) {
    deleteItem(id: $id) {
      id
    }
  }
`

class DeleteItem extends Component {
  update = (cache, payload) => {
    // manually update the cache on the client, so it matches the server
    // 1. Read the cache - can't reach directly in, so we use a graphql
    const data = cache.readQuery({ query: ALL_ITEMS_QUERY })

    // 2. Filter the deleted item out of the page
    data.items = data.items.filter(
      item => item.id !== payload.data.deleteItem.id,
    )

    // 3. Put the items back
    cache.writeQuery({ query: ALL_ITEMS_QUERY, data })
  }

  render() {
    const { id: itemId, children } = this.props
    return (
      <Mutation
        mutation={DELETE_ITEM_MUTATION}
        variables={{ id: itemId }}
        update={this.update}
      >
        {(deleteItem, { error }) => {
          if (error) return <p>Could not delete item</p>
          return (
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to delete?')) {
                  deleteItem().catch(e => {
                    alert(e.message)
                  })
                }
              }}
            >
              {children}
            </button>
          )
        }}
      </Mutation>
    )
  }
}

DeleteItem.propTypes = {
  id: PropTypes.string,
  children: PropTypes.node,
}

export default DeleteItem
