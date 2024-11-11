const express = require("express");
const methodOverride = require("method-override");
const app = express();
const path = require("path");
const session = require("express-session");
const passport = require("passport");
const { v4: uuidv4 } = require("uuid");
const nocache = require("nocache");
require("dotenv").config();
const connectDB = require("./connection/connection");
const userRouter = require("./routes/userRoutes");
const adminRouter = require("./routes/adminRoutes");
const flash = require("connect-flash");
const passportConfig = require("./config/passport");

connectDB();

app.set("view engine", "ejs");

app.use(methodOverride("_method"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static("uploads"));

app.use(flash());
app.use(nocache());

const day = 1000 * 60 * 60 * 24;
app.use(
  session({
    secret: uuidv4(),
    resave: false,
    cookie: { maxAge: day },
    saveUninitialized: true,
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use("/", userRouter);
app.use("/admin", adminRouter);

app.use((req, res) => {
  res.render("user/404");
});

app.listen(3000, () => {
  console.log("http://localhost:3000");
});
