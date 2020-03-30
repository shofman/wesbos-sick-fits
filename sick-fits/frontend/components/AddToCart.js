import React, { Component } from 'react'
import { Mutation } from 'react-apollo'
import gql from 'graphql-tag'
import PropTypes from 'prop-types'
import { CURRENT_USER_QUERY } from './User'

export const ADD_TO_CART_MUTATION = gql`
  mutation addToCart($id: ID!) {
    addToCart(id: $id) {
      id
      quantity
    }
  }
`

class AddToCart extends Component {
  render() {
    const { id } = this.props
    return (
      <Mutation
        mutation={ADD_TO_CART_MUTATION}
        variables={{ id }}
        refetchQueries={[{ query: CURRENT_USER_QUERY }]}
      >
        {(addToCart, { error, loading }) => {
          if (error) alert(error)
          return (
            <button disabled={loading} onClick={addToCart}>
              Add{loading ? 'ing' : ''} to Cart
            </button>
          )
        }}
      </Mutation>
    )
  }
}

AddToCart.propTypes = {
  id: PropTypes.string,
}

export default AddToCart
