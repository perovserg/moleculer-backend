"use strict";
const express = require("express");
const bodyParser = require('body-parser');
const io = require('socket.io');

const noAvatar = 'https://png.pngtree.com/svg/20161027/631929649c.svg';

let socketIO;

module.exports = {
    name: "gateway",
    settings: {
        port: process.env.PORT || 3001,
    },
    methods: {
        initRoutes(app) {
            app.get("/totalDistance", this.getTotalDistance);
            app.get("/member/list", this.getMemberList);
            app.put("/member/:id/incrementDistance", this.incrementMemberDistance);
            app.post("/member", this.createMember);
        },
        getTotalDistance(req, res) {
            return Promise.resolve()
                .then(() => {
                    return this.broker.call("member.totalDistance").then(result => {
                        res.send(result.shift());
                    });
                })
                .catch(this.handleErr(res));
        },
        getMemberList(req, res) {
            return Promise.resolve()
                .then(() => {
                    return this.broker.call("member.listAll").then(members => {
                        res.send(members);
                    });
                })
                .catch(this.handleErr(res));
        },
        createMember(req, res) {
            let { name, email, distance, avatar} = req.body;
            if(!distance) distance = 0;
            if(!avatar) avatar = noAvatar;
            const member = { name, email, distance: parseInt(distance), avatar};
            return Promise.resolve()
                .then(() => {
                    return this.broker.call("member.create", { member }).then(member =>
                        res.send(member)
                    );
                })
                .catch(this.handleErr(res));
        },

        incrementMemberDistance(req, res) {
            const {id} = req.params;
            const {distance} = req.body;
            return Promise.resolve()
                .then(() => {
                    return this.broker.call("member.incrementDistance", { id, distance: parseInt(distance) })
                        .then(member =>
                            res.send(member)
                        );
                })
                .catch(this.handleErr(res));
        },
        handleErr(res) {
            return err => {
                this.logger.error("Request error!", err);
                res.status(err.code || 500).send(err.message);
            };
        }
    },
    events: {
        "socket-io.updateMemberList": {
            group: "other",
            handler() {
                socketIO.emit('UPDATE_MEMBER_LIST');
            }
        },
        "socket-io.updateTotalDistance": {
            group: "other",
            handler() {
                socketIO.emit('UPDATE_TOTAL_DISTANCE');
            }
        },
    },
    created() {
        const app = express();
        // noinspection JSValidateTypes
        app.server = require('http').Server(app);
        app.all('*', function(req, res, next) {
            res.header("Access-Control-Allow-Origin", "*");
            res.header("Access-Control-Allow-Credentials", "true");
            res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
            res.header("Access-Control-Allow-Headers", "Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers");
            next();
        });
        app.use(bodyParser.urlencoded({extended: true}));
        app.use(bodyParser.json());
        app.use(bodyParser.text());
        app.use(bodyParser.raw({limit: '2048kb'}));

        this.initRoutes(app);
        this.app = app;
    },
    started() {
        this.app.server.listen(Number(this.settings.port), err => {
            if (err) return this.broker.fatal(err);

            this.logger.info(`server started on port ${this.settings.port}`);

            socketIO = io(this.app.server).on('connection', () => {
                this.logger.info('new client connected by socket.io');
            });
        });

    },
    stopped() {
        if (this.app.listening) {
            this.app.close(err => {
                if (err) return this.logger.error("server close error!", err);

                this.logger.info("server stopped!");
            });
        }
    },
};
