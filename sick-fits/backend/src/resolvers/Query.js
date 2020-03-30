// Source data can come from anywhere - txt file, db, cache, another service

const { forwardTo } = require('prisma-binding')
const { hasPermission } = require('../utils')

const Query = {
  items: forwardTo('db'),
  item: forwardTo('db'),
  itemsConnection: forwardTo('db'),
  me(parent, args, ctx, info) {
    // check if there is a current user id
    if (!ctx.request.userId) {
      return null
    }
    return ctx.db.query.user(
      {
        where: { id: ctx.request.userId },
      },
      info
    )
  },
  async users(parent, args, ctx, info) {
    // 1. Check if they are logged in
    if (!ctx.request.userId) {
      throw new Error('You must be logged in to perform this action')
    }
    // 2. Check if the user has the permissions to query all users
    hasPermission(ctx.request.user, ['ADMIN', 'PERMISSIONUPDATE'])

    // 3. Return the list of all users
    return ctx.db.query.users({}, info)
  },
  async order(parent, args, ctx, info) {
    // check they are logged in
    if (!ctx.request.userId) {
      throw new Error(`You must be logged in to perform this action`)
    }

    const order = await ctx.db.query.order(
      {
        where: { id: args.id },
      },
      info
    )

    if (!order) {
      throw new Error(`No order found`)
    }

    const ownsOrder = order.user.id === ctx.request.userId
    const hasPermissionToSeeOrder = ctx.request.user.permissions.includes(
      'ADMIN'
    )

    if (!ownsOrder && !hasPermissionToSeeOrder) {
      throw new Error(`You cannot view this order`)
    }

    return order
  },

  async orders(parent, args, ctx, info) {
    const { userId } = ctx.request
    if (!userId) {
      throw new Error(`You must be logged in`)
    }

    return ctx.db.query.orders(
      {
        where: {
          user: { id: userId },
        },
      },
      info
    )
  },
}

module.exports = Query
