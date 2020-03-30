const { GraphQLServer } = require('graphql-yoga')
const Mutation = require('./resolvers/Mutation')
const Query = require('./resolvers/Query')
const db = require('./db')

// create the graphql yoga server - wrapper around express with
// middlewares in addition to having the apollo client
// for communicating with graphql

function createServer() {
    // both prisma and yoga need their own schemas for this to work
    return new GraphQLServer({
        typeDefs: 'src/schema.graphql',
        resolvers: {
            Mutation,
            Query,
        },
        resolverValidationOptions: {
            requireResolversForResolveType: false,
        },
        context: req => ({ ...req, db }),
    })
}

// Query resolvers = pull data
// Mutation resolvers = push data

module.exports = createServer