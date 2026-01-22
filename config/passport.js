const passport = require('passport');
const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { User } = require('../models');

const opts = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET || 'your_jwt_secret'
};

passport.use(
    new JwtStrategy(opts, async (jwt_payload, done) => {
        try {
            const user = await User.findByPk(jwt_payload.id);
            if (user) {
                return done(null, user);
            }
            return done(null, false);
        } catch (err) {
            return done(err, false);
        }
    })
);

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID || 'your_google_client_id',
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'your_google_client_secret',
            callbackURL: '/auth/google/callback'
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                // Check if user exists with this googleId
                let user = await User.findOne({ where: { googleId: profile.id } });

                if (!user) {
                    // Check if user exists with the same email
                    const email = profile.emails[0].value;
                    user = await User.findOne({ where: { email } });

                    if (user) {
                        // Link googleId to existing user
                        user.googleId = profile.id;
                        await user.save();
                    } else {
                        // Create new user
                        user = await User.create({
                            name: profile.displayName,
                            email: email,
                            googleId: profile.id,
                            api_key: require('uuid').v4()
                        });
                    }
                }
                return done(null, user);
            } catch (err) {
                return done(err, null);
            }
        }
    )
);

module.exports = passport;
