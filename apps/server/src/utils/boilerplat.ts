import type { SandboxTools } from '../tools';
import { APP_DIR, SANDBOX_ROOT } from '../tools';

const INIT_TIMEOUT_MS = 0;

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
    cmd: `rm -rf app`,
    cwd: SANDBOX_ROOT,
    timeoutMs: INIT_TIMEOUT_MS,
  });

  await tools.run_command({
    cmd: 'npm create vite@latest app -- --template react --no-interactive --no-immediate',
    cwd: SANDBOX_ROOT,
    timeoutMs: INIT_TIMEOUT_MS,
  });

  await tools.read_file({ path: `${APP_DIR}/package.json` });

  await tools.run_command({
    cmd: 'cd app && npm install',
    cwd: SANDBOX_ROOT,
    timeoutMs: INIT_TIMEOUT_MS,
  });

  await tools.run_command({
    cmd: 'cd app && npm install -D tailwindcss@3 postcss autoprefixer',
    cwd: SANDBOX_ROOT,
    timeoutMs: INIT_TIMEOUT_MS,
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

  return 'React project initialized';
}
