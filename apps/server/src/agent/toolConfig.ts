type ToolProperty = {
  type: 'string';
  description: string;
};

export type ChatCompletionTool = {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, ToolProperty>;
      required: string[];
      additionalProperties: false;
    };
  };
};

const sandboxPath = '/home/user/app';

export const toolsConfig: ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'read_file',
      description: 'Read file content from the sandbox project',
      parameters: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: `Absolute file path, e.g. ${sandboxPath}/src/App.jsx`,
          },
        },
        required: ['path'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'write_file',
      description: 'Write or update a file in the sandbox project',
      parameters: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: `Absolute file path, e.g. ${sandboxPath}/src/App.jsx`,
          },
          content: {
            type: 'string',
            description: 'Full file content to write',
          },
        },
        required: ['path', 'content'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_files',
      description: 'List files and folders in a sandbox directory',
      parameters: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: `Directory path to list, e.g. ${sandboxPath} or ${sandboxPath}/src`,
          },
        },
        required: ['path'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'run_command',
      description: 'Execute a shell command in the sandbox',
      parameters: {
        type: 'object',
        properties: {
          cmd: {
            type: 'string',
            description: 'Shell command to run, e.g. cd /home/user/app && npm run build',
          },
        },
        required: ['cmd'],
        additionalProperties: false,
      },
    },
  },
];
