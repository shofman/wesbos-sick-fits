import React, { Component } from 'react'
import styled from 'styled-components'
import { Mutation } from 'react-apollo'
import gql from 'graphql-tag'
import PropTypes from 'prop-types'
import { CURRENT_USER_QUERY } from './User'

export const REMOVE_FROM_CART_MUTATION = gql`
  mutation REMOVE_FROM_CART($id: ID!) {
    removeFromCart(id: $id) {
      id
    }
  }
`

const BigButton = styled.button`
  font-size: 3rem;
  background: none;
  border: 0;
  &: hover {
    color: ${props => props.theme.red};
    cursor: pointer;
  }
`

class RemoveFromCart extends Component {
  // This gets called as soon as we get a response back from
  // the server after a mutation has been performed
  update = (cache, payload) => {
    // first read the cache
    const data = cache.readQuery({ query: CURRENT_USER_QUERY })

    // second remove that item from the cart
    const cartItemId = payload.data.removeFromCart.id
    data.me.cart = data.me.cart.filter(cartItem => cartItem.id !== cartItemId)

    // write it back to the cache
    cache.writeQuery({ query: CURRENT_USER_QUERY, data })
  }

  render() {
    return (
      <Mutation
        mutation={REMOVE_FROM_CART_MUTATION}
        variables={{ id: this.props.id }}
        update={this.update}
        optimisticResponse={{
          __typeName: 'Mutation',
          removeFromCart: {
            __typename: 'CartItem',
            id: this.props.id,
          },
        }}
      >
        {(removeFromCart, { error, loading }) => (
          <BigButton
            disabled={loading}
            title="Delete Item"
            onClick={() => {
              removeFromCart().catch(err => alert(err.message))
            }}
          >
            &times;
          </BigButton>
        )}
      </Mutation>
    )
  }
}

RemoveFromCart.propTypes = {
  id: PropTypes.string.isRequired,
}

export default RemoveFromCart
