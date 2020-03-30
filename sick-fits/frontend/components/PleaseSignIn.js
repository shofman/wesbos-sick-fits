import React from 'react'
import { Query } from 'react-apollo'
import PropTypes from 'prop-types'
import { CURRENT_USER_QUERY } from './User'
import SignIn from './Signin'

const PleaseSignIn = props => {
  return (
    <Query query={CURRENT_USER_QUERY}>
      {({ data, loading }) => {
        if (loading) return <p>Loading...</p>

        if (!data.me) {
          return (
            <>
              <p>Please Sign in before continuing</p>
              <SignIn />
            </>
          )
        }
        return props.children
      }}
    </Query>
  )
}

PleaseSignIn.propTypes = {
  children: PropTypes.node,
}

export default PleaseSignIn
