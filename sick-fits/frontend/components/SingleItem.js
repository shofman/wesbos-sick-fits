import React, { Component } from 'react'
import gql from 'graphql-tag'
import PropTypes from 'prop-types'
import { Query } from 'react-apollo'
import styled from 'styled-components'
import Head from 'next/head'
import Error from './ErrorMessage'

const SingleItemStyles = styled.div`
  max-width: 1200px;
  margin: 2rem auto;
  box-shadow: ${props => props.theme.bs};
  display: grid;
  grid-auto-columns: 1fr;
  grid-auto-flow: column;
  min-height: 600px;
  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
  .details {
    margin: 3rem;
    font-size: 2rem;
  }
`

export const SINGLE_ITEM_QUERY = gql`
  query SINGLE_ITEM_QUERY($id: ID!) {
    item(where: { id: $id }) {
      id
      title
      description
      largeImage
      image
    }
  }
`

class SingleItem extends Component {
  render() {
    const { id } = this.props
    return (
      <Query query={SINGLE_ITEM_QUERY} variables={{ id }}>
        {({ error, loading, data }) => {
          if (error) return <Error error={error} />
          if (loading) return <p>Loading...</p>
          if (!data.item) return <p>No Item Found for {id}</p>

          const { item } = data
          return (
            <SingleItemStyles>
              <Head>
                <title>Sicks Fits | {item.title}</title>
              </Head>
              <img src={item.largeImage || item.image} alt={item.title} />
              <div className="details">
                <h2>Viewing {item.title}</h2>
                <p>{item.description}</p>
              </div>
            </SingleItemStyles>
          )
        }}
      </Query>
    )
  }
}

SingleItem.propTypes = {
  id: PropTypes.string,
}

export default SingleItem
