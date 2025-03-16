---
title: Command Line Interface (CLI)
description: Learn how to use the Motia CLI to manage your projects and workflows
---

# Command Line Interface (CLI)

Motia provides a powerful Command Line Interface (CLI) to help you manage your projects and workflows. The CLI offers various commands for creating projects, generating steps, managing state, and more.

## Installation

The Motia CLI is automatically installed when you install the `motia` package. You can use it by running `npx motia` followed by the desired command.

## Commands

### `create`

Create a new Motia project.

```bash
npx motia create [options]
```

Options:
- `-n, --name <project name>`: The name for your project, used to create a directory. Use `.` or `./` to create it under the existing directory.
- `-t, --template <template name>`: The Motia template to use for your project. Run `npx motia templates` to see available templates.

### `templates`

Print the list of available project templates.

```bash
npx motia templates
```

### `dev`

Start the development server.

```bash
npx motia dev [options]
```

Options:
- `-p, --port <port>`: The port to run the server on (default: 3000).
- `-v, --verbose`: Enable verbose logging.
- `-d, --debug`: Enable debug logging.

### `get-config`

Get the generated config for your project.

```bash
npx motia get-config [options]
```

Options:
- `-o, --output <path>`: Path to write the generated config file.

### `emit`

Emit an event to the Motia server.

```bash
npx motia emit [options]
```

Options:
- `--topic <topic>` (required): Event topic/type to emit.
- `--message <message>` (required): Event payload as a JSON string.
- `-p, --port <number>`: Port number (default: 3000).

### `generate`

Generate Motia resources.

#### `generate step`

Create a new step with interactive prompts.

```bash
npx motia generate step [options]
```

Options:
- `-d, --dir <step file path>`: The path relative to the steps directory to create the step file.

### `state`

Manage application state.

#### `state list`

List the current file state.

```bash
npx motia state list
```

## Debugging

You can enable debug logging by passing the `-d` or `--debug` flag to the `dev` command:

```bash
npx motia dev --debug
```

This will set the `LOG_LEVEL` environment variable to `'debug'`, providing more detailed logging output.

## Next Steps

- Explore the [Core Concepts](/docs/core) to learn more about Steps, Flows, Events, and Topics.
- Check out the [Examples](/docs/examples) for common patterns and use cases.
- Join our [Community](/community) for help and discussions. 