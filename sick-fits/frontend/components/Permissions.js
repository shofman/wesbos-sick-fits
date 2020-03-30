import React, { Component } from 'react'
import { Query, Mutation } from 'react-apollo'
import gql from 'graphql-tag'
import PropTypes from 'prop-types'
import Error from './ErrorMessage'
import Table from './styles/Table'
import SickButton from './styles/SickButton'

const ALL_USERS_QUERY = gql`
  query ALL_USERS_QUERY {
    users {
      id
      name
      email
      permissions
    }
  }
`

const UPDATE_PERMISSIONS_MUTATION = gql`
  mutation UPDATE_PERMISSIONS_MUTATION(
    $permissions: [Permission]
    $userId: ID!
  ) {
    updatePermissions(permissions: $permissions, userId: $userId) {
      id
      permissions
      name
      email
    }
  }
`

const possiblePermission = [
  'ADMIN',
  'USER',
  'ITEMCREATE',
  'ITEMUPDATE',
  'ITEMDELETE',
  'PERMISSIONUPDATE',
]

const Permissions = () => {
  return (
    <Query query={ALL_USERS_QUERY}>
      {({ data, loading, error }) => {
        if (error) return <Error error={error} />
        if (loading) return <p>Loading...</p>
        return (
          console.log(data) || (
            <div>
              <h2>Manage Permissions</h2>
              <Table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    {possiblePermission.map(permission => {
                      return <th key={permission}>{permission}</th>
                    })}
                    <th>Update</th>
                  </tr>
                </thead>
                <tbody>
                  {data.users.map(user => {
                    return <UserPermissions key={user.id} user={user} />
                  })}
                </tbody>
              </Table>
            </div>
          )
        )
      }}
    </Query>
  )
}

class UserPermissions extends Component {
  state = {
    permissions: this.props.user.permissions,
  }

  handlePermissionChange = e => {
    const checkbox = e.target
    // take current permissions
    let updatedPermissions = [...this.state.permissions]
    if (checkbox.checked) {
      updatedPermissions.push(checkbox.value)
    } else {
      updatedPermissions = updatedPermissions.filter(
        permission => permission !== checkbox.value
      )
    }

    this.setState({
      permissions: updatedPermissions,
    })
  }

  render() {
    const { user } = this.props
    const { permissions } = this.state

    return (
      <Mutation
        mutation={UPDATE_PERMISSIONS_MUTATION}
        variables={{
          permissions,
          userId: user.id,
        }}
      >
        {(updatePermissions, { error, loading }) => {
          return (
            <>
              {error && <Error error={error} />}
              <tr key={user.id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                {possiblePermission.map(permission => {
                  const id = `${user.id}-permission-${permission}`
                  return (
                    <td key={id}>
                      <label htmlFor={id}>
                        <input
                          id={id}
                          type="checkbox"
                          checked={permissions.includes(permission)}
                          value={permission}
                          onChange={this.handlePermissionChange}
                        />
                      </label>
                    </td>
                  )
                })}
                <td>
                  <SickButton
                    type="button"
                    disabled={loading}
                    onClick={updatePermissions}
                  >
                    Updat{loading ? 'ing' : 'e'}
                  </SickButton>
                </td>
              </tr>
            </>
          )
        }}
      </Mutation>
    )
  }
}

UserPermissions.propTypes = {
  user: PropTypes.shape({
    name: PropTypes.string,
    email: PropTypes.string,
    id: PropTypes.string,
    permissions: PropTypes.array,
  }).isRequired,
}

export default Permissions
