const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const userDB = require("../models/user");
const WalletDB = require("../models/wallet");
const wishlistDB = require("../models/wishlist");

const generateReferralCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await userDB.findOne({ email: profile.emails[0].value });

        if (user) {
          if (user.password) {
            return done(null, false, {
              message:
                "This email is already registered with user details. Please use email and password login.",
            });
          }

          return done(null, user);
        } else {
          const referralCode = generateReferralCode();

          const newUser = new userDB({
            firstname: profile.name.givenName,
            lastname: profile.name.familyName,
            email: profile.emails[0].value,
            password: null,
            referralCode,
          });

          user = await newUser.save();

          const wallet = new WalletDB({
            user: user._id,
            balance: 0,
            transactions: [],
          });
          await wallet.save();

          const wishlist = new wishlistDB({
            user: user._id,
            items: [],
          });
          await wishlist.save();

          return done(null, user);
        }
      } catch (err) {
        return done(err, false, { message: "Something went wrong" });
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await userDB.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;
