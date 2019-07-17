"use strict";

const { MoleculerClientError } = require("moleculer").Errors;
const DbService = require("moleculer-db");
const MongooseAdapter = require("moleculer-db-adapter-mongoose");
const Member = require("../models/member.model");
const CacheCleaner = require("../mixins/cache.cleaner.mixin");
const Fakerator = require("fakerator");
const fake = new Fakerator();

const fakeMembers = [
    {name: 'John Doe', email: 'john.doe@somemail.ru', distance: 300, avatar: fake.internet.avatar()},
    {name: 'Jane Doe', email: 'jane.doe@somemail.ru', distance: 400, avatar: fake.internet.avatar()},
    {name: 'Luke Skywalker', email: 'luke.skywalker@somemail.ru', distance: 500, avatar: fake.internet.avatar()},
];

module.exports = {
    name: "member",
    mixins: [DbService, CacheCleaner(["member"])],
    adapter: new MongooseAdapter(process.env.MONGO_URI || "mongodb://localhost/moleculer-backend"),
    model: Member,

    settings: {
        fields: ["_id", "name", "email", "distance", "avatar"]
    },

    actions: {
        totalDistance: {
            cache: true,
            handler(ctx) {
                return Member.aggregate([
                    { $group: { _id: null, totalDistance: { $sum: '$distance' }}},
                    { $project: { _id: 0, totalDistance: 1 }}
                ]);
            }
        },
        listAll: {
            cache: true,
            handler(ctx) {
                return this.adapter.find({});
            }
        },
        create: {
            params:
                {
                    member: { type: "object", props: {
                            name: {type: "string"},
                            email: {type: "email"},
                            distance: {type: "number"},
                            avatar: {type: "string", optional: true}
                        }}
                },
            handler(ctx) {
                const { member } = ctx.params;
                return this.adapter.findOne({ email: member.email })
                    .then(found => {
                        if (found)
                            return this.Promise.reject(new MoleculerClientError(`Member (with email: ${member.email}) has already exist!`));

                        return this.adapter.insert({...member})
                            .then(json => {
                                this.app.io.emit('UPDATE_MEMBER_LIST');
                                return json;
                            });
                    });
            }
        },
        incrementDistance: {
            params: {id: {type: 'string'}, distance: {type: "number"}},
            handler(ctx) {
                const { id, distance } = ctx.params;
                return this.adapter.findById(id)
                    .then(member => {
                        if (!member)
                            return this.Promise.reject(new MoleculerClientError(`Member (with id: ${id}) doesn't found!`));

                        this.getLeaders().then(leaders => {
                            return this.adapter.updateById(id, {"$inc":{distance: distance}})
                                .then( json => {
                                    this.checkLeaderChange(leaders, json);
                                    this.app.io.emit('UPDATE_TOTAL_DISTANCE');
                                    return json;
                                });
                        });
                    });
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
        },
        getLeaders() {
            return Promise.resolve()
                .then(() => Member.aggregate([
                        { $group: { _id: null, maxDistance: { $max: '$distance' }}},
                        { $project: { _id: 0, maxDistance: 1 }}
                        ])
                )
                .then( agg => {
                    const {maxDistance} = agg.shift();
                    return Member.find({ distance: maxDistance })
                })
        },
        checkLeaderChange(leaders, member) {
            leaders.forEach(leader => {
                if (leader._id !== member._id && leader.distance < member.distance) {
                    this.broker.emit('member.leaderChanged', { prevLeader: leader, newLeader: member });
                }
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
