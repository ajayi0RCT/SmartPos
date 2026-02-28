
import express from "express";
import { createServer as createViteServer } from "vite";
import { OAuth2Client } from "google-auth-library";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const getGoogleClient = () => {
  const clientId = process.env.VITE_GOOGLE_CLIENT_ID;
  if (!clientId || clientId === 'your_google_client_id_here') {
    return null;
  }
  return new OAuth2Client(clientId);
};

// In-memory store for user data (simulated cloud database)
const userCloudStore = new Map<string, any>();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json({ limit: '50mb' })); // Increase limit for large state objects
  app.use(cookieParser());

  // API Routes
  app.post("/api/auth/google", async (req, res) => {
    const { token } = req.body;
    const client = getGoogleClient();
    
    if (!client) {
      return res.status(500).json({ error: "Google Auth is not configured on the server." });
    }

    try {
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.VITE_GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      
      if (!payload) {
        return res.status(400).json({ error: "Invalid token" });
      }

      // In a real app, you'd find or create the user in your database here
      const user = {
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
        googleId: payload.sub,
      };

      // Log login activity (simulated)
      console.log(`User logged in: ${user.email} at ${new Date().toISOString()}`);

      // Try to load user data from "cloud" if it exists
      const cloudData = userCloudStore.get(user.email!);

      res.json({ user, cloudData });
    } catch (error) {
      console.error("Error verifying Google token:", error);
      res.status(401).json({ error: "Authentication failed" });
    }
  });

  // Cloud Sync Endpoints
  app.post("/api/sync/save", (req, res) => {
    const { email, state } = req.body;
    if (!email) return res.status(400).json({ error: "Email required" });
    
    userCloudStore.set(email, state);
    console.log(`Cloud Sync: Saved data for ${email}`);
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.get("/api/sync/load", (req, res) => {
    const { email } = req.query;
    if (!email) return res.status(400).json({ error: "Email required" });
    
    const state = userCloudStore.get(email as string);
    if (!state) return res.status(404).json({ error: "No data found" });
    
    res.json({ state });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
