"use strict";
const express = require("express");
const bodyParser = require('body-parser');

module.exports = {
    name: "gateway",
    settings: {
        port: process.env.PORT || 3000,
    },
    methods: {
        initRoutes(app) {
            app.get("/overallResult", this.getOverallResult);
            app.get("/member/list", this.getMemberList);
            app.get("/member/:id", this.getMember);
            app.post("/member", this.createMember);
            app.put("/member/:id/result", this.updateMemberResult);
        },
        getOverallResult(req, res) {
            return Promise.resolve()
                .then(() => {
                    return this.broker.call("member.overallResult").then(result => {
                        res.send(result);
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
        getMember(req, res) {
            const id = req.params.id;
            return Promise.resolve()
                .then(() => {
                    return this.broker.call("member.getById", { id }).then(member => {
                        res.send(member);
                    });
                })
                .catch(this.handleErr(res));
        },
        createMember(req, res) {
            const payload = req.body;
            return Promise.resolve()
                .then(() => {
                    return this.broker.call("member.create", { payload }).then(member =>
                        res.send(member)
                    );
                })
                .catch(this.handleErr(res));
        },
        updateMemberResult(req, res) {
            const id = req.params.id;
            const payload = req.body;
            return Promise.resolve()
                .then(() => {
                    return this.broker.call("member.updateResult", { id, payload }).then(member =>
                        res.send(member)
                    );
                })
                .catch(this.handleErr(res));
        },
        handleErr(res) {
            return err => {
                res.status(err.code || 500).send(err.message);
            };
        }
    },
    created() {
        const app = express();
        app.use(bodyParser());
        this.initRoutes(app);
        this.app = app;
    }
};
