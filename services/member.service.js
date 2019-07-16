"use strict";

const DbService = require("moleculer-db");
const MongooseAdapter = require("moleculer-db-adapter-mongoose");
const Member = require("../models/member.model");
const CacheCleaner = require("../mixins/cache.cleaner.mixin");
const Fakerator = require("fakerator");
const fake = new Fakerator();

const fakeMembers = [
    {name: 'John Doe', email: 'john.doe@somemail.ru', result: 300, avatar: fake.internet.avatar()},
    {name: 'Jane Doe', email: 'jane.doe@somemail.ru', result: 400, avatar: fake.internet.avatar()},
    {name: 'Luke Skywalker', email: 'luke.skywalker@somemail.ru', result: 500, avatar: fake.internet.avatar()},
];

module.exports = {
    name: "members",
    mixins: [DbService, CacheCleaner(["members"])],
    adapter: new MongooseAdapter(process.env.MONGO_URI || "mongodb://localhost/moleculer-backend"),
    model: Member,

    settings: {
        fields: ["_id", "name", "email", "result", "avatar"]
    },

    actions: {
        authors: {
            cache: true,
            handler(ctx) {
                return this.adapter.find({ query: { author: true }});
            }
        }
    },

    methods: {
        seedDB() {
            this.logger.info("Seed Members DB...");
            // Create members
            return Promise.resolve()
                .then(() => this.adapter.insertMany(fakeMembers.map( (member) => ({...member}))))
                .then(members => {
                    this.logger.info(`Generated ${members.length} members!`);
                    this.clearCache();
                });
        }
    },

    afterConnected() {
        return this.adapter.count().then(count => {
            if (count === 0) {
                this.seedDB();
            } else {
                this.logger.info(`There are ${count} members in DB!`);
            }
        });
    }

};



// const movies = [
//     {id: 1, title: 'Sharknado'},
//     {id: 2, title: 'Roma'},
// ];
//
// module.exports = {
//     name: "movies",
//
//     actions: {
//         listAll(ctx) {
//             return Promise.resolve({ movies: movies });
//         },
//         getById(ctx) {
//             const id = Number(ctx.params.id);
//             return Promise.resolve(movies.find(movie => movie.id === id ));
//         },
//         create(ctx) {
//             const lastId = Math.max(...movies.map(movie => movie.id));
//             const movie = {
//                 id: lastId + 1,
//                 ...ctx.params.payload,
//             };
//             movies.push(movie);
//             this.broker.emit("movie.created", movie);
//             return Promise.resolve(movie);
//         }
//     },
// };
