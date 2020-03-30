import React, { Component } from 'react'
import StripeCheckout from 'react-stripe-checkout'
import { Mutation } from 'react-apollo'
import Router from 'next/router'
import PropTypes from 'prop-types'
import NProgress from 'nprogress'
import gql from 'graphql-tag'
import calcTotalPrice from '../lib/calcTotalPrice'
import Error from './ErrorMessage'
import User, { CURRENT_USER_QUERY } from './User'

function totalItems(cart) {
  return cart.reduce((tally, cartItem) => tally + cartItem.quantity, 0)
}

export const CREATE_ORDER_MUTATION = gql`
  mutation createOrder($token: String!) {
    createOrder(token: $token) {
      id
      charge
      total
      items {
        id
        title
      }
    }
  }
`

class TakeMyMoney extends Component {
  onToken = async (res, createOrder) => {
    NProgress.start()

    // manually call the mutation once we have the stripe token
    const order = await createOrder({
      variables: {
        token: res.id,
      },
    }).catch(err => alert(err.message))

    Router.push({
      pathname: '/order',
      query: {
        id: order.data.createOrder.id,
      },
    })
  }

  render() {
    return (
      <User>
        {({ data: { me }, loading }) => {
          if (loading) return null
          const { cart } = me

          return (
            <Mutation
              mutation={CREATE_ORDER_MUTATION}
              refetchQueries={[{ query: CURRENT_USER_QUERY }]}
            >
              {(createOrder, { error }) => {
                if (error) return <Error error={error} />
                return (
                  <StripeCheckout
                    name="Sick Fits"
                    description={`Order of ${totalItems(me.cart)} Items`}
                    amount={calcTotalPrice(me.cart)}
                    image={cart.length && cart[0].item && cart[0].item.image}
                    stripeKey="pk_test_95kahSCQVErtuQKSg7EfwioJ00R1HKK4d2"
                    currency="USD"
                    email={me.email}
                    token={res => this.onToken(res, createOrder)}
                  >
                    {this.props.children}{' '}
                  </StripeCheckout>
                )
              }}
            </Mutation>
          )
        }}
      </User>
    )
  }
}

TakeMyMoney.propTypes = {
  children: PropTypes.node,
}

export default TakeMyMoney
