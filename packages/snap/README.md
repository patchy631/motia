# Motia

<p align="center">
  <img src="https://motia.dev/icon.png" alt="Motia Logo" width="200" />
</p>

<p align="center">
  <strong>A modern, declarative workflow framework for multiple programming languages</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/motia"><img src="https://img.shields.io/npm/v/motia.svg" alt="npm version"></a>
  <a href="https://github.com/MotiaDev/motia/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="license"></a>
</p>

## What is Motia?

Motia is a lightweight, flexible framework for building complex workflows and business processes across multiple programming languages. It allows you to define, visualize, and execute workflows with a clean, declarative API in JavaScript, TypeScript, Ruby, Python, and more languages coming soon.

Key features:
- 🔄 **Declarative Workflows**: Define complex processes with a simple, readable syntax
- 🛠️ **Type-Safe**: Built with strong typing support for all supported languages
- 🔍 **Visualizable**: Inspect and debug your workflows with Motia Workbench
- 🧩 **Composable**: Build complex workflows from reusable components
- 🚀 **Multi-Language Support**: Works with JavaScript, TypeScript, Ruby, Python, with more languages coming soon
- 🌐 **Framework Agnostic**: Integrates with any framework in your language of choice

## Installation

### JavaScript/TypeScript
```sh
npm install motia
# or
yarn add motia
# or
pnpm add motia
```

## Quick Start

Ready to get started in minutes? Follow these simple steps using **pnpm** and the automated project creation:

1.  **Create a new project using the Motia CLI:**

    ```bash
    npx motia create --name my-motia-project --cursor
    ```
    *(Replace `my-motia-project` with your desired project name)*

    This command will:
    * Create a new folder `my-motia-project`
    * Set up a basic Motia project with example steps
    * Install dependencies using pnpm
    * Include the `.cursor` folder for enhanced development experience (with `-c` flag)

2.  **Navigate into your new project directory:**

    ```bash
    cd my-motia-project
    ```

3.  **Start the Motia development server:**

    ```bash
    pnpm run dev
    ```

    This will launch the Motia server and the Workbench UI (typically at `http://localhost:3000`).

4.  **Open the Motia Workbench in your browser (usually `http://localhost:3000`)**. You should see a pre-built flow named "default" with example steps visualized.

5.  **Test an example API Step:** In your terminal, use `curl` to trigger the example API endpoint (often `/default` in the default template):

    ```bash
    curl -X POST http://localhost:3000/default \
    -H "Content-Type: application/json" \
    -d '{}'
    ```

    Alternatively, use the Motia CLI to emit an event (for event-based steps in the template):

    ```bash
    npx motia emit --topic test-state --message '{}'
    ```

    Check the Workbench logs – you should see logs indicating the step execution and event flow!

**Congratulations! You've just created and run your first Motia workflow using the automated project setup.**
## CLI Commands

Motia comes with a powerful CLI to help you manage your projects:

### `motia init`

Initializes a new Motia project in the current directory.

```sh
motia init
```

### `motia install`

Sets up your project's dependencies and environment. For Python projects, this will create and configure a virtual environment.

```sh
motia install
```

### `motia build`

Builds a lock file based on your current project setup which is then used by the Motia ecosystem.

```sh
motia build
```

### `motia dev`

Initiates a dev environment for your project allowing you to use Motia Workbench (visualization tool for your flows). For Python projects, this will automatically use the configured virtual environment.

```sh
motia dev [options]

Options:
  -p, --port <port>     The port to run the server on (default: 3000)
  -v, --verbose         Enable verbose logging
  -d, --debug          Enable debug logging
  -m, --mermaid        Enable mermaid diagram generation
```

## Visualizing Workflows

Motia Workbench provides a visual interface to inspect and debug your workflows:

```sh
motia dev
```

Then open your browser at `http://localhost:3000` to see your workflows in action.

## Language Support

Motia currently supports:
- JavaScript
- TypeScript
- Ruby
- Python

With more languages coming soon!

## Help

For more information on a specific command, you can use the `--help` flag:

```sh
motia <command> --help
```

## Documentation

For full documentation, visit [https://motia.dev/docs](https://motia.dev/docs)

## Contributing

We welcome contributions! Please see our [Contributing Guide](https://github.com/MotiaDev/motia/blob/main/CONTRIBUTING.md) for details.

## License

This project is licensed under the MIT License.
