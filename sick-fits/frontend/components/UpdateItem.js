import React, { Component } from 'react'
import { Mutation, Query } from 'react-apollo'
import gql from 'graphql-tag'
import Router from 'next/router'
import Form from './styles/Form'
import formatMoney from '../lib/formatMoney'
import Error from './ErrorMessage'

export const UPDATE_ITEM_MUTATION = gql`
  mutation UPDATE_ITEM_MUTATION(
    $id: ID!
    $title: String
    $description: String
    $price: Int
  ) {
    updateItem(
      id: $id
      title: $title
      description: $description
      price: $price
    ) {
      id
      title
      description
      price
    }
  }
`

export const SINGLE_ITEM_QUERY = gql`
  query SINGLE_ITEM_QUERY($id: ID!) {
    item(where: { id: $id }) {
      id
      title
      description
      price
    }
  }
`

class UpdateItem extends Component {
  state = {}

  // Assigning value to state.title makes that there are two sources of truth
  // One in the input field, and one in the react input
  // Solution is to intercept the users input, and re-assign to state
  // so that react remains the source of truth

  // Creating an arrow function here binds
  // handleChange is now an Instance property (since it is an arrow function)
  // Allows for use of this
  // ES6 Classes do not bind methods to the instance property, so it doesn't have access to this
  handleChange = e => {
    const { name, type, value } = e.target
    console.log({ name, type, value })
    const val = type === 'number' ? parseFloat(value) : value
    this.setState({
      [name]: val,
    })
  }

  updateItem = async (e, updateItemMutation) => {
    e.preventDefault()
    console.log('Updating value this.state', this.state)
    console.log('this.props.id', this.props.id)
    const res = await updateItemMutation({
      variables: {
        id: this.props.id,
        ...this.state,
      },
    })
    console.log('res', res)
  }

  render() {
    return (
      <Query query={SINGLE_ITEM_QUERY} variables={{ id: this.props.id }}>
        {({ data: defaultItemData, loading: isItemFetching }) => {
          if (isItemFetching) return <p>Loading...</p>
          if (!defaultItemData.item) return <p>Item Not Found</p>
          return (
            <Mutation mutation={UPDATE_ITEM_MUTATION} variables={this.state}>
              {(updateItem, { loading, error }) => (
                <Form onSubmit={e => this.updateItem(e, updateItem)}>
                  <Error error={error} />
                  <fieldset disabled={loading} aria-busy={loading}>
                    <label htmlFor="title">
                      Title
                      <input
                        type="text"
                        id="title"
                        name="title"
                        placeholder="Title"
                        required
                        defaultValue={defaultItemData.item.title}
                        onChange={this.handleChange}
                      />
                    </label>

                    <label htmlFor="price">
                      Price
                      <input
                        type="number"
                        id="price"
                        name="price"
                        placeholder="Price"
                        required
                        defaultValue={defaultItemData.item.price}
                        onChange={this.handleChange}
                      />
                    </label>

                    <label htmlFor="description">
                      Description
                      <textarea
                        id="description"
                        name="description"
                        placeholder="Enter a description"
                        required
                        defaultValue={defaultItemData.item.description}
                        onChange={this.handleChange}
                      />
                    </label>

                    <button type="submit">
                      Sav{loading ? 'ing' : 'e'} Changes
                    </button>
                  </fieldset>
                </Form>
              )}
            </Mutation>
          )
        }}
      </Query>
    )
  }
}

export default UpdateItem
