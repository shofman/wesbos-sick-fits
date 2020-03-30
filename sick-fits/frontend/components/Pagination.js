import React from 'react'
import gql from 'graphql-tag'
import { Query } from 'react-apollo'
import PropTypes from 'prop-types'
import Head from 'next/head'
import Link from 'next/link'
import PaginationStyles from './styles/PaginationStyles'
import { perPage } from '../config'
import ErrorMessage from './ErrorMessage'

export const PAGINATION_QUERY = gql`
  query PAGINATION_QUERY {
    itemsConnection {
      aggregate {
        count
      }
    }
  }
`

const Pagination = props => {
  const { page } = props
  return (
    <Query query={PAGINATION_QUERY}>
      {({ data, loading, error }) => {
        if (error) return <ErrorMessage error={error} />
        if (loading) return <p>Loading...</p>

        const { count } = data.itemsConnection.aggregate
        const totalPages = Math.ceil(count / perPage)
        return (
          <PaginationStyles data-test="pagination">
            <Head>
              <title>
                Sicks Fits! Page {page} of {totalPages}
              </title>
            </Head>
            <Link
              prefetch
              href={{
                pathname: 'items',
                query: { page: page - 1 },
              }}
            >
              <a className="prev" aria-disabled={page <= 1}>{'<- Prev'}</a>
            </Link>
            <p>
              Page {page} of {totalPages}
            </p>
            <p>{count} Items Total</p>
            <Link
              prefetch
              href={{
                pathname: 'items',
                query: { page: page + 1 },
              }}
            >
              <a className="prev" aria-disabled={page >= totalPages}>{'Next ->'}</a>
            </Link>
          </PaginationStyles>
        )
      }}
    </Query>
  )
}

Pagination.propTypes = {
  page: PropTypes.number,
}

export default Pagination
