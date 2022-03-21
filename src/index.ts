import { port } from './constants';
import { ApolloServer } from 'apollo-server';
import { ApolloServerPluginLandingPageGraphQLPlayground } from 'apollo-server-core';
import { schema } from './schema';
import { context } from './context';

export const server = new ApolloServer({
  schema,
  introspection: true,
  plugins: [ApolloServerPluginLandingPageGraphQLPlayground],
  context,
});

server.listen({ port }).then(({ url }) => {
  console.log(`🚀  Server ready at ${url}`);
});
