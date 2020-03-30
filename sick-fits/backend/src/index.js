require('dotenv').config({ path: 'variables.env' })
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
const createServer = require('./createServer')
const db = require('./db')

// Startup the node server

const server = createServer()

// Use express middleware to handle cookies (JWT)
server.express.use(cookieParser())

// Decode the JWT so we can grab the userId for each reqest
server.express.use((req, res, next) => {
  const { token } = req.cookies

  if (token) {
    const { userId } = jwt.verify(token, process.env.APP_SECRET)
    // place userId onto the req for future use
    req.userId = userId
  }
  console.log('token', token)
  return next()
})

// Middleware to populate the user on each request
server.express.use(async (req, res, next) => {
  // if they aren't logged in, skip
  const id = req.userId
  if (!id) return next()

  const user = await db.query.user(
    { where: { id } },
    '{ id, permissions, email, name }',
  )

  req.user = user
  return next()
})

server.start(
  {
    cors: {
      credentials: true,
      origin: process.env.FRONTEND_URL,
    },
  },
  deets => {
    console.log(`Server is now running on port http://localhost:${deets.port}`)
  },
)
