const express = require('express');
const bodyParser = require('body-parser');
const graphqlHttp = require('express-graphql');
const { buildSchema } = require('graphql');
const mongoose = require('mongoose');
const mongooseSrv = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASS}@${process.env.MONGO_CLUSTER}/${process.env.MONGO_DBNAME}?retryWrites=true`;
const moment = require('moment');
const app = express();
const Product = require('./models/product');

app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.send("OK");
});

app.use('/graphql', graphqlHttp({
    schema: buildSchema(`
        type Product {
            _id: ID!
            title: String!
            price: Float!
            description: String
            date: String
        }

        input ProductInput {
            title: String!
            price: Float!
            description: String
            date: String
        }

        type RootQuery {
            products: [Product!]!
        }

        type RootMutation {
            createProduct(ProductInput: ProductInput): Product
        }

        schema {
            query: RootQuery
            mutation: RootMutation
        }
    `),
    rootValue: {
        products: () => {
            return Product.find()
                .then(products => {
                    return products.map(product => {
                        return { ...product._doc, _id: product._doc._id.toString(), date:moment(product.date).format('YYYY-MM-DD HH:mm').toString() }
                    })
                })
                .catch(err => {
                    throw err;
                });
        },
        createProduct: (args) => {
            const product = new Product({
                title: args.ProductInput.title,
                price: +args.ProductInput.price,
                description: args.ProductInput.description ? args.ProductInput.description : '',
                date: args.ProductInput.date ? new Date(args.ProductInput.date) : moment().toDate()
            });
            
            return product.save()
                .then(products => {
                    console.log(products);
                    return { ...products._doc, _id: products._doc._id.toString() };
                })
                .catch(err => {
                    console.log(err);
                    throw err;
                });
        }
    },
    graphiql: true
}));

mongoose.connect(
    mongooseSrv, { useNewUrlParser: true }
).then(() => {
    console.log('Connecting Successfully')
    app.listen(3000);
}).catch(err => { 
    console.log('Failed bro!: \n');
    console.log(err);
    throw err;
});
