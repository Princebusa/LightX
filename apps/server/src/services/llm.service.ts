import type { GeneratedFile } from "comman/types";

function escapeForTemplate(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/`/g, "\\`")
    .replace(/\$/g, "\\$");
}

export async function generateProjectFiles(
  prompt: string,
): Promise<{ message: string; files: GeneratedFile[] }> {
  const safePrompt = escapeForTemplate(prompt);

  const files: GeneratedFile[] = [
    {
      name: "package.json",
      path: "package.json",
      language: "json",
      content: JSON.stringify(
        {
          name: "lightx-preview",
          private: true,
          version: "0.0.0",
          type: "module",
          scripts: {
            dev: "vite --host 0.0.0.0 --port 5173",
            build: "vite build",
            preview: "vite preview",
          },
          dependencies: {
            react: "^19.1.0",
            "react-dom": "^19.1.0",
          },
          devDependencies: {
            "@types/react": "^19.1.2",
            "@types/react-dom": "^19.1.2",
            "@vitejs/plugin-react": "^4.4.1",
            typescript: "^5.8.3",
            vite: "^6.3.5",
          },
        },
        null,
        2,
      ),
    },
    {
      name: "index.html",
      path: "index.html",
      language: "html",
      content: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>LightX Preview</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`,
    },
    {
      name: "vite.config.ts",
      path: "vite.config.ts",
      language: "typescript",
      content: `import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 5173,
    strictPort: true,
  },
});`,
    },
    {
      name: "tsconfig.json",
      path: "tsconfig.json",
      language: "json",
      content: JSON.stringify(
        {
          compilerOptions: {
            target: "ES2022",
            lib: ["ES2022", "DOM", "DOM.Iterable"],
            module: "ESNext",
            moduleResolution: "bundler",
            jsx: "react-jsx",
            strict: true,
            skipLibCheck: true,
            noEmit: true,
          },
          include: ["src"],
        },
        null,
        2,
      ),
    },
    {
      name: "main.tsx",
      path: "src/main.tsx",
      language: "typescript",
      content: `import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);`,
    },
    {
      name: "App.tsx",
      path: "src/App.tsx",
      language: "typescript",
      content: `export default function App() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        fontFamily: "system-ui, sans-serif",
        background: "linear-gradient(135deg, #0f172a, #1e293b)",
        color: "#f8fafc",
        padding: "2rem",
      }}
    >
      <section style={{ maxWidth: 720, textAlign: "center" }}>
        <p style={{ opacity: 0.7, marginBottom: "0.5rem" }}>LightX preview</p>
        <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>
          Your app is running
        </h1>
        <p style={{ lineHeight: 1.6, opacity: 0.9 }}>
          Prompt: ${safePrompt}
        </p>
      </section>
    </main>
  );
}`,
    },
  ];

  return {
    message: `Generated a React preview for: "${prompt}". Plug in your LLM provider in llm.service.ts to replace this stub.`,
    files,
  };
}
