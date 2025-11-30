import { beforeAll, afterEach, afterAll, vi } from "vitest";
import { server } from "./mocks/server.js";

// Démarrer le MSW server
beforeAll(() => {
  server.listen({ onUnhandledRequest: "error" });
});

// Réinitialiser les handlers entre chaque test
afterEach(() => {
  server.resetHandlers();
  vi.clearAllMocks();
});

// Arrêter le serveur à la fin
afterAll(() => {
  server.close();
});

// Mock de l'environnement
process.env.INSTAGRAM_APP_ID = "test_app_id";
process.env.INSTAGRAM_APP_SECRET = "test_app_secret";
process.env.INSTAGRAM_REDIRECT_URI =
  "http://localhost:3000/auth/instagram/callback";
process.env.DATABASE_URL = "postgresql://test:test@localhost/test";
