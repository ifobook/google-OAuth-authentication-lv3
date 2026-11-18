// Import the web server, database, password-hashing, session, and Passport tools used below.
import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import bcrypt from "bcrypt";
import passport from "passport";
import { Strategy } from "passport-local";
import session from "express-session";
import env from "dotenv";
import GoogleStrategy from "passport-google-oauth2";

const app = express();
const port = 3000;
const saltRounds = 10;
// Load values from .env so credentials and secrets can be read from process.env.
env.config();

// Keep each visitor's login state in a signed session cookie.
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
  }),
);

// Parse submitted HTML forms and serve static files such as CSS from public/.
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// Enable Passport authentication and connect it to the session middleware.
app.use(passport.initialize());
app.use(passport.session());

// Connect to PostgreSQL using credentials supplied through environment variables.
const db = new pg.Client({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
});
db.connect();

// Render the application's main page.
app.get("/", (req, res) => {
  res.render("home.ejs");
});

// Render the local login form.
app.get("/login", (req, res) => {
  res.render("login.ejs");
});

// Render the account registration form.
app.get("/register", (req, res) => {
  res.render("register.ejs");
});

// End the current Passport session and return the visitor to the home page.
app.get("/logout", (req, res) => {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

// Only show the secrets page to visitors with an authenticated Passport session.
app.get("/secrets", (req, res) => {
  console.log(req.user);
  if (req.isAuthenticated()) {
    res.render("secrets.ejs");
  } else {
    res.redirect("/login");
  }
});

// Start Google sign-in and request permission to read the user's profile and email.
app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] }),
);

// Handle Google's redirect after sign-in, then send the visitor to the appropriate page.
app.get(
  "/auth/google/secrets",
  passport.authenticate("google", { 
    successRedirect: "/secrets",
    failureRedirect: "/login" 
  }),
)

// Authenticate a submitted email/password pair with the local Passport strategy.
app.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/secrets",
    failureRedirect: "/login",
  }),
);

// Register a local account, storing a bcrypt hash instead of the original password.
app.post("/register", async (req, res) => {
  const email = req.body.username;
  const password = req.body.password;

  try {
    // Avoid creating another account for an email already in the database.
    const checkResult = await db.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (checkResult.rows.length > 0) {
      req.redirect("/login");
    } else {
      // Hash the password before inserting the new account.
      bcrypt.hash(password, saltRounds, async (err, hash) => {
        if (err) {
          console.error("Error hashing password:", err);
        } else {
          const result = await db.query(
            "INSERT INTO users (email, password) VALUES ($1, $2) RETURNING *",
            [email, hash],
          );
          const user = result.rows[0];
          // Log in the new user so registration immediately creates a session.
          req.login(user, (err) => {
            console.log("success");
            res.redirect("/secrets");
          });
        }
      });
    }
  } catch (err) {
    console.log(err);
  }
});

// Look up local accounts and compare their submitted password with the stored bcrypt hash.
passport.use(
  "local",
  new Strategy(async function verify(username, password, cb) {
    try {
      const result = await db.query("SELECT * FROM users WHERE email = $1 ", [
        username,
      ]);
      if (result.rows.length > 0) {
        const user = result.rows[0];
        const storedHashedPassword = user.password;
        bcrypt.compare(password, storedHashedPassword, (err, valid) => {
          if (err) {
            //Error with password check
            console.error("Error comparing passwords:", err);
            return cb(err);
          } else {
            if (valid) {
              //Passed password check
              return cb(null, user);
            } else {
              //Did not pass password check
              return cb(null, false);
            }
          }
        });
      } else {
        return cb("User not found");
      }
    } catch (err) {
      console.log(err);
    }
  }),
);

// Find or create an account after Google returns the user's profile.
passport.use(
  "google",
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/secrets",
      userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
    },
    async (accessToken, refreshToken, profile, cb) => {
      try {
        console.log(profile);
        // Match Google accounts to app accounts by email.
        const result = await db.query("SELECT * FROM users WHERE email = $1", [
          profile.email,
        ]);
        if (result.rows.length === 0) {
          // Create a database record for a first-time Google user.
          const newUser = await db.query(
            "INSERT INTO users (email, password) VALUES ($1, $2)",
            [profile.email, "google"],
          );
          return cb(null, newUser.rows[0]);
        } else {
          return cb(null, result.rows[0]);
        }
      } catch (err) {
        return cb(err);
      }
    },
  ),
);

// Store the authenticated user in the session between requests.
passport.serializeUser((user, cb) => {
  cb(null, user);
});

// Restore the user from the session and attach it to each authenticated request.
passport.deserializeUser((user, cb) => {
  cb(null, user);
});

// Start the Express server so it can accept browser requests.
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
