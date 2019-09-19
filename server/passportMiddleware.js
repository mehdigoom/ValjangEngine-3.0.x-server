"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const passport = require("passport");
const passport_local_1 = require("passport-local");
// NOTE: The regex must match the pattern and min/max lengths in client/login/index.pug
const usernameRegex = /^[A-Za-z0-9_-]{3,20}$/;
passport.serializeUser((user, done) => { done(null, user.username); });
passport.deserializeUser((username, done) => { done(null, { username }); });
const strategy = new passport_local_1.Strategy((username, password, done) => {
    if (!usernameRegex.test(username))
        return done(null, false, { message: "invalidUsername" });
    done(null, { username });
});
passport.use(strategy);
exports.default = passport;
