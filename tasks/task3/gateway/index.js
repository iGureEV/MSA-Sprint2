import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { ApolloGateway, RemoteGraphQLDataSource } from '@apollo/gateway';

const gateway = new ApolloGateway({
    serviceList: [
        { name: 'booking', url: 'http://booking-subgraph:4001' },
        { name: 'hotel', url: 'http://hotel-subgraph:4002' }
    ],
    buildService: ({url}) => new RemoteGraphQLDataSource({
        url,
        willSendRequest: ({ request, context }) => {
            console.log(context);
            if (context.userid) {
                request.http.headers.set('userid', context.userid);
            }
        }
    })
});

const server = new ApolloServer({ gateway, subscriptions: false });

startStandaloneServer(server, {
    listen: { port: 4000 },
    context: async ({ req }) => {         // headers пробрасываются
        console.info('server my-user');
        console.info(req.headers);
        return req.headers;
    },
}).then(({ url }) => {
    console.log(`🚀 Gateway ready at ${url}`);
});
