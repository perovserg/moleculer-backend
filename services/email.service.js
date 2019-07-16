"use strict";

module.exports = {
    name: "email",
    events: {
        "member.leaderHasChanged": {
            group: "other",
            handler(payload) {
                console.log('Recieved "member.leaderHasChanged" event in email service with payload: ', payload);
            }
        }
    },
};
