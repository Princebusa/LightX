import type { SandboxTools } from '../tools';
import { APP_DIR, SANDBOX_ROOT } from '../tools';

const INIT_TIMEOUT_MS = 0;

const SANDBOX_VITE_CONFIG = `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: true,
  },
});
`;

export async function ensureSandboxViteAllowedHosts(tools: SandboxTools) {
  const configPath = `${APP_DIR}/vite.config.js`;

  try {
    const config = await tools.read_file({ path: configPath });
    if (config.includes('allowedHosts')) {
      return false;
    }

    const updated = config.replace(
      /port:\s*5173,?/,
      'port: 5173,\n    allowedHosts: true,',
    );

    if (updated === config) {
      await tools.write_file({ path: configPath, content: SANDBOX_VITE_CONFIG });
    } else {
      await tools.write_file({ path: configPath, content: updated });
    }

    return true;
  } catch {
    return false;
  }
}

async function scaffoldReactApp(tools: SandboxTools) {
  await tools.write_file({
    path: `${APP_DIR}/package.json`,
    content: JSON.stringify(
      {
        name: 'app',
        private: true,
        version: '0.0.0',
        type: 'module',
        scripts: {
          dev: 'vite',
          build: 'vite build',
          preview: 'vite preview',
        },
        dependencies: {
          react: '^19.0.0',
          'react-dom': '^19.0.0',
        },
        devDependencies: {
          '@vitejs/plugin-react': '^4.3.4',
          vite: '^6.0.0',
          tailwindcss: '^3.4.17',
          postcss: '^8.4.49',
          autoprefixer: '^10.4.20',
        },
      },
      null,
      2,
    ),
  });

  await tools.write_file({
    path: `${APP_DIR}/vite.config.js`,
    content: SANDBOX_VITE_CONFIG,
  });

  await tools.write_file({
    path: `${APP_DIR}/index.html`,
    content: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>LightX App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
`,
  });

  await tools.write_file({
    path: `${APP_DIR}/src/main.jsx`,
    content: `import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
`,
  });

  await tools.write_file({
    path: `${APP_DIR}/src/App.jsx`,
    content: `export default function App() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
      <div className="text-center">
        <h1 className="text-4xl font-bold">LightX</h1>
        <p className="mt-2 text-slate-300">Your app is ready to build.</p>
      </div>
    </main>
  );
}
`,
  });

  await tools.write_file({
    path: `${APP_DIR}/postcss.config.js`,
    content: `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
`,
  });

  await tools.write_file({
    path: `${APP_DIR}/tailwind.config.js`,
    content: `/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: { extend: {} },
  plugins: [],
};
`,
  });

  await tools.write_file({
    path: `${APP_DIR}/src/index.css`,
    content: `@tailwind base;
@tailwind components;
@tailwind utilities;
`,
  });
}

export async function initReactProject(tools: SandboxTools) {
  try {
    const pkg = await tools.read_file({ path: `${APP_DIR}/package.json` });
    if (pkg.includes('"vite"')) {
      return 'React project already initialized';
    }
  } catch {
    // not initialized yet
  }

  await tools.run_command({
    cmd: 'rm -rf app',
    cwd: SANDBOX_ROOT,
    timeoutMs: INIT_TIMEOUT_MS,
  });

  await scaffoldReactApp(tools);

  await tools.run_command({
    cmd: 'npm install',
    cwd: APP_DIR,
    timeoutMs: INIT_TIMEOUT_MS,
  });

  return 'React project initialized';
}
