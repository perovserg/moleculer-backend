"use strict";

const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: 'smtp.mail.ru',
    port: 465,
    auth: {
        user: 'test.task.test.task@bk.ru',
        pass: 'ASDqwe123@'
    }
});

module.exports = {
    name: "email",
    events: {
        "member.leaderChanged": {
            group: "other",
            handler({ prevLeader, newLeader }) {
                transporter.sendMail({
                    from: 'test.task.test.task@bk.ru',
                    to: process.env.TEST_MAIL,
                    subject: `Leader has changed! (${prevLeader.name}) => (${newLeader.name})`,
                    text: `Leader has changed!
                        Previous leader name: ${prevLeader.name}, distance: ${prevLeader.distance} 
                        New leader name: ${newLeader.name}, distance: ${newLeader.distance}`
                })
                .then(info => {
                    this.logger.info(`Email sent: ${info.response}`);
                })
                .catch( error => {
                    this.logger.error(`Something went wrong with sending email => ${error}`);
                });
            }
        }
    },
};
