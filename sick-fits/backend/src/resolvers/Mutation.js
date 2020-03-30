const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { randomBytes } = require('crypto')
const { promisify } = require('util')
const stripe = require('../stripe')

const { hasPermission } = require('../utils')
const { transport, makeANiceEmail } = require('../mail')

const setToken = (ctx, id) => {
  const token = jwt.sign({ userId: id }, process.env.APP_SECRET)

  ctx.response.cookie('token', token, {
    httpOnly: true,
    maxAge: 1000 * 60 * 24 * 2,
  })
}

const PASSWORD_RESET_TIME = 1000 * 60 * 3

const Mutations = {
  async createItem(parent, args, ctx, info) {
    if (!ctx.request.userId) {
      throw new Error(`You must be logged in to do that`)
    }

    const item = await ctx.db.mutation.createItem(
      {
        data: {
          ...args,
          user: {
            connect: { id: ctx.request.userId }, // This is how you can associate different items as a relationship
          },
        },
      },
      info // Info here is what information does the user want
    )

    return item
  },
  updateItem(parent, args, ctx, info) {
    // first take a copy of the updates
    const updates = { ...args }
    // remove the ID from the list of entries to update
    delete updates.id
    // run the update method
    return ctx.db.mutation.updateItem(
      {
        data: updates,
        where: {
          id: args.id,
        },
      },
      info
    )
  },
  async deleteItem(parent, args, ctx, info) {
    const where = { id: args.id }
    // 1. Find item
    const item = await ctx.db.query.item({ where }, `{ id title user { id } }`) // Raw graphQL at the end instead of info
    // 2. Check if they own that item, or have the permissions
    const ownsItem = item.user.id === ctx.request.userId
    const hasPermissions = ctx.request.user.permissions.some(permission =>
      ['ADMIN', 'ITEMDELETE'].includes(permission)
    )

    if (!ownsItem && !hasPermissions) {
      throw new Error(`You cannot perform this action`)
    }

    // 3. Delete it
    return ctx.db.mutation.deleteItem({ where }, info)
  },

  async signup(parent, args, ctx, info) {
    const loweredEmail = args.email.toLowerCase()
    // hash their password for security

    const passwordHash = await bcrypt.hash(args.password, 10)

    // create the user in the db
    const user = await ctx.db.mutation.createUser(
      {
        data: {
          name: args.name,
          email: loweredEmail,
          password: passwordHash,
          permissions: { set: ['USER'] },
        },
      },
      info
    )

    setToken(ctx, user.id)

    return user
  },

  async signin(parent, args, ctx, info) {
    const { email, password } = args

    // 1. check if there is a user with that email
    const user = await ctx.db.query.user({ where: { email } })
    if (!user) {
      throw new Error(`No such user found for email ${email}`)
    }

    // 2. check that the password is correct
    const validPassword = await bcrypt.compare(password, user.password)
    if (!validPassword) {
      throw new Error('Invalid password')
    }

    // 3. generate the jwt token for that user
    setToken(ctx, user.id)

    return user
  },

  signout(parent, args, ctx, info) {
    ctx.response.clearCookie('token')
    return { message: 'Goodbye' }
  },

  async requestReset(parent, args, ctx, info) {
    // 1. check if this is a real user
    const user = await ctx.db.query.user({
      where: {
        email: args.email,
      },
    })
    if (!user) {
      throw new Error(`No such user found for email ${args.email}`)
    }
    // 2. set a reset token and expiry for that user
    const randomBytesPromise = promisify(randomBytes)
    const resetToken = (await randomBytesPromise(20)).toString('hex')
    console.log('resetToken', resetToken)
    const resetTokenExpiry = Date.now() + PASSWORD_RESET_TIME

    await ctx.db.mutation.updateUser({
      where: { email: args.email },
      data: { resetToken, resetTokenExpiry },
    })

    // 3 email them that reset token
    const resetLink = `${process.env.FRONTEND_URL}/reset?resetToken=${resetToken}`

    const mailResponse = await transport.sendMail({
      from: 'scott.a.hofman@gmail.com',
      to: user.email,
      subject: 'Your Password Reset Token',
      html: makeANiceEmail(
        `Your Password Reset Token is here!\n\n<a href="${resetLink}">Click here to reset your account</a>`
      ),
    })

    console.log('mailResponse', mailResponse)

    return { message: 'Sending an email with help now!' }
  },

  async resetPassword(parent, args, ctx, info) {
    // 1. check if passwords match
    const { password, confirmPassword, resetToken } = args
    if (password !== confirmPassword) {
      throw new Error(`Passwords do not match`)
    }

    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters')
    }

    // 2. check if it is a legit reset token
    const [user] = await ctx.db.query.users({
      where: {
        resetToken,
        resetTokenExpiry_gte: Date.now() - PASSWORD_RESET_TIME,
      },
    })
    if (!user) {
      throw new Error(`Token not found or expired`)
    }

    // 4. hash new password
    const passwordHash = await bcrypt.hash(password, 10)

    // 5. save new password to user and remove old resetToken fields
    const newUser = await ctx.db.mutation.updateUser({
      data: {
        password: passwordHash,
        resetToken: null,
        resetTokenExpiry: null,
      },
      where: {
        id: user.id,
      },
    })

    // 6. Generate jwt and set the cookie
    setToken(ctx, newUser.id)

    // 8. return the new user
    return newUser
  },

  async updatePermissions(parent, args, ctx, info) {
    // 1. Check that the user is logged in
    if (!ctx.request.userId) {
      throw new Error('You must be logged in to perform this action')
    }

    // 2. Check if the user has the permissions to query all users
    const currentUser = await ctx.db.query.user(
      {
        where: { id: ctx.request.userId },
      },
      info
    )
    hasPermission(currentUser, ['ADMIN', 'PERMISSIONUPDATE'])

    // 3. Update the user who we want to change

    const { permissions, userId } = args
    const updatedUser = await ctx.db.mutation.updateUser(
      {
        data: {
          permissions: {
            set: permissions,
          },
        },
        where: {
          id: userId,
        },
      },
      info
    )

    return updatedUser
  },

  async addToCart(parent, args, ctx, info) {
    // Make sure that they are signed in
    const { userId } = ctx.request
    if (!userId) {
      throw new Error('Must be logged in to perform that action')
    }

    // Query the users current cart
    const [existingCartItem] = await ctx.db.query.cartItems(
      {
        where: {
          user: { id: userId },
          item: { id: args.id },
        },
      },
      info
    )

    // Check if the item is in the cart. If it is, increment by one and return
    if (existingCartItem) {
      console.log('we have an item already')
      return ctx.db.mutation.updateCartItem({
        where: { id: existingCartItem.id },
        data: { quantity: existingCartItem.quantity + 1 },
      })
    }

    // Create a fresh CartItem for that user
    return ctx.db.mutation.createCartItem(
      {
        data: {
          user: {
            connect: { id: userId },
          },
          item: {
            connect: { id: args.id },
          },
        },
      },
      info
    )
  },

  async removeFromCart(parent, args, ctx, info) {
    // 1. Find the cart item
    const cartItem = await ctx.db.query.cartItem(
      {
        where: {
          id: args.id,
        },
      },
      `{ id, user { id }}`
    )
    // Make sure that we found an item
    if (!cartItem) throw new Error('No CartItem found')

    // 2. Make sure that they own the item
    if (cartItem.user.id !== ctx.request.userId) {
      throw new Error('Invalid user')
    }

    // 2. Delete that cart item
    return ctx.db.mutation.deleteCartItem(
      {
        where: { id: args.id },
      },
      info
    )
  },

  async createOrder(parent, args, ctx, info) {
    // Query current user and make sure they are signed in
    const { userId } = ctx.request
    if (!userId) throw new Error('You must be signed in to complete this order')
    const user = await ctx.db.query.user(
      { where: { id: userId } },
      `{
        id
        name
        email
        cart {
          id
          quantity
          item {
            title
            price
            id
            description
            image
            largeImage
          }
        }
      }`
    )

    // Recalculate the total for the price (server side should be source of truth)
    const amount = user.cart.reduce(
      (tally, cartItem) => tally + cartItem.item.price * cartItem.quantity,
      0
    )

    // Create the stripe charge
    const charge = await stripe.charges.create({
      amount,
      currency: 'USD',
      source: args.token,
    })

    // Convert the CartItems to OrderItems
    const orderItems = user.cart.map(cartItem => {
      const orderItem = {
        ...cartItem.item,
        quantity: cartItem.quantity,
        user: { connect: { id: userId } },
      }
      // We want a new ID to be auto-created by prisma for this order
      delete orderItem.id
      return orderItem
    })

    // Create the order
    const order = await ctx.db.mutation.createOrder({
      data: {
        total: charge.amount,
        charge: charge.id,
        items: { create: orderItems },
        user: { connect: { id: userId } },
      },
    })

    // Clean up the users cart, delete cartItems
    const cartItemIds = user.cart.map(cartItem => cartItem.id)
    await ctx.db.mutation.deleteManyCartItems({
      where: {
        id_in: cartItemIds,
      },
    })

    // Return the Order to the client
    return order
  },
}

module.exports = Mutations
