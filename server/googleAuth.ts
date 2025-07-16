import passport from "passport";
import { Strategy as GoogleStrategy, Profile, StrategyOptions } from "passport-google-oauth20";
import session from "express-session";
import type { Express } from "express";
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

export function setupGoogleAuth(app: Express) {
  app.use(session({
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    cookie: {
      sameSite: "lax",
      secure: false,
    }
  }));
  app.use(passport.initialize());
  app.use(passport.session());

  const options: StrategyOptions = {
    clientID: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    callbackURL: "/api/callback",
    passReqToCallback: false,
  };

  passport.use(new GoogleStrategy(
    options as any,
    async function(accessToken: string, refreshToken: string, profile: Profile, done) {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) return done(new Error("No email found in Google profile"));

        // Check if user exists
        let user = (await db.select().from(users).where(eq(users.email, email)))[0];
        if (!user) {
          // Create new user
          const id = nanoid();
          await db.insert(users).values({
            id,
            email,
            firstName: profile.name?.givenName,
            lastName: profile.name?.familyName,
            profileImageUrl: profile.photos?.[0]?.value,
          });
          user = (await db.select().from(users).where(eq(users.email, email)))[0];
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  ));

  passport.serializeUser((user, done) => done(null, user as any));
  passport.deserializeUser((user, done) => done(null, user as any));

  app.get("/api/login", passport.authenticate("google", { scope: ["profile", "email"] }));
  app.get("/api/callback",
    passport.authenticate("google", { failureRedirect: "/" }),
    (req, res) => {
      res.redirect("/"); // or wherever you want after login
    }
  );
  app.get("/api/logout", (req, res) => {
    req.logout(() => res.redirect("/"));
  });
} 