# Motia Mermaid Plugin

This package provides Mermaid diagram visualization for Motia workflows as a plugin.

## Installation

```bash
pnpm add @motiadev/mermaid
```

## How it Works

The Mermaid plugin is automatically discovered and loaded by the Motia core plugin system.

All you need to do is install the package - the plugin system will:
1. Discover the plugin during server startup
2. Initialize it with the Express app
3. Register endpoints for Mermaid diagrams
4. Keep the diagrams updated as flows change

## Features

- Automatic flow visualization using Mermaid diagrams
- Interactive diagram viewer in the Workbench UI
- Support for all Motia step types
- Visual styling based on step type
- Connection visualization based on emit/subscribe relationships

## Configuration

The plugin stores diagrams in a `motia-mermaid.json` file in your project directory.

## Manual Registration (Optional)

If needed, you can manually register the plugin:

```typescript
import { PluginManager } from '@motiadev/core';
import { MermaidPlugin } from '@motiadev/mermaid';

// With an existing plugin manager
const mermaidPlugin = new MermaidPlugin();
pluginManager.registerPlugin(mermaidPlugin, {
  baseDir: process.cwd() // Optional: override diagram storage location
});
```

## Plugin API

The Mermaid plugin exposes the following API:

```typescript
// Access the plugin from the plugin manager
const mermaidPlugin = pluginManager.getPlugin('mermaid') as MermaidPlugin;

// Get the service to work with diagrams directly
const service = mermaidPlugin.getMermaidService();

// Use service methods
service.getDiagram('myFlow');
service.updateFlow('myFlow', flow);
service.removeDiagram('myFlow');
```
