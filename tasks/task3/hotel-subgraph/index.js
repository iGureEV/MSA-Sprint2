import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { buildSubgraphSchema } from '@apollo/subgraph';
import gql from 'graphql-tag';

const typeDefs = gql`
    type Hotel @key(fields: "id") {
        id: ID!
        operational: Boolean
        fullyBooked: Boolean
        city: String
        rating: Float
        description: String
    }

    type Query {
        hotel(id: ID!): Hotel
        hotelsByIds(ids: [ID!]!): [Hotel]
    }
`;

const MONOLITH_URL = process.env.MONOLITH_URL;

async function fetchHotelById(id) {
    const url = `${MONOLITH_URL}/hotels/${id}`;
    console.log('fetchHotelById url', url);

    const response = await fetch(url);

    if (response.ok) {
        const json = await response.json();
        console.log(json);
        return json;
    } else {
        console.error('Ошибка HTTP:', response.status);
        return null;
    }
}

const resolvers = {
    Hotel: {
        __resolveReference: async ({ id }) => {
            console.log(`Hotel.__resolveReference ids=${id}`);

            // вызов к hotel-сервису
            return await fetchHotelById(id);
        },
    },
    Query: {
        hotel: async (_, { id }) => {
            console.log('Query hotel by id', id)
            return await fetchHotelById(id);
        },
        hotelsByIds: async (_, { ids }) => {
            console.log(`Query.hotelsByIds ids=${ids}`);

            // rest-запрос
            const hotels = await Promise.all(ids.map((id) => fetchHotelById(id)));

            return hotels.filter((h) => h !== null);
        },
    },
};

const server = new ApolloServer({
    schema: buildSubgraphSchema([{ typeDefs, resolvers }]),
});

startStandaloneServer(server, {
    listen: { port: 4002 },
}).then(() => {
    console.log('✅ Hotel subgraph ready at http://localhost:4002/');
});
