#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Base directory for the documentation
const baseDir = 'packages/docs/content/docs';

// Function to create directory if it doesn't exist
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`Created directory: ${dirPath}`);
  }
}

// Function to create a placeholder file with valid markdown content
function createPlaceholderFile(filePath, title) {
  // Create a description based on the title
  const description = `Information about ${title.toLowerCase()}`;
  
  // Create valid markdown content with frontmatter
  // Wrap title and description in quotes to handle special characters like colons
  const content = `---
title: "${title}"
description: "${description}"
---

# ${title}

This page will contain information about ${title.toLowerCase()}.

## Overview

Placeholder content for the ${title} page. This section will provide an overview of the topic.

## Key Concepts

- First key concept related to ${title}
- Second key concept related to ${title}
- Third key concept related to ${title}

## Additional Resources

- Resource 1
- Resource 2
- Resource 3
`;
  
  // Always write the file, overwriting if it exists
  fs.writeFileSync(filePath, content);
  console.log(`Created/Updated file: ${filePath}`);
}

// Define the documentation structure
// This is based on the directory structure in docs-redone.md
const docStructure = [
  // Root files
  { path: 'index.mdx', title: 'Documentation Home/Landing Page' },
  { path: 'quickstart.mdx', title: 'Quickstart Page' },
  
  // Concepts - Getting Started
  { path: 'concepts/getting-started/index.mdx', title: 'Concepts - Getting Started Index' },
  { path: 'concepts/getting-started/what-is-motia.mdx', title: 'What is Motia?' },
  { path: 'concepts/getting-started/event-driven-basics.mdx', title: 'Event-Driven Basics' },
  { path: 'concepts/getting-started/steps-intro.mdx', title: 'Steps Intro' },
  { path: 'concepts/getting-started/flows-intro.mdx', title: 'Flows Intro' },
  
  // Concepts - Core Components
  { path: 'concepts/core-components/index.mdx', title: 'Concepts - Core Components Index' },
  { path: 'concepts/core-components/step-types/api-steps.mdx', title: 'API Steps' },
  { path: 'concepts/core-components/step-types/event-steps.mdx', title: 'Event Steps' },
  { path: 'concepts/core-components/step-types/cron-steps.mdx', title: 'Cron Steps' },
  { path: 'concepts/core-components/step-types/noop-steps.mdx', title: 'NOOP Steps' },
  { path: 'concepts/core-components/flows.mdx', title: 'Flows' },
  { path: 'concepts/core-components/topics-and-routing.mdx', title: 'Topics and Routing' },
  { path: 'concepts/core-components/state-management.mdx', title: 'State Management' },
  { path: 'concepts/core-components/logging.mdx', title: 'Logging' },
  { path: 'concepts/core-components/workbench.mdx', title: 'Workbench' },
  
  // Journeys - Start Your Motia Journey
  { path: 'journeys/start-your-motia-journey/index.mdx', title: 'Journeys - Start Your Motia Journey Index' },
  { path: 'journeys/start-your-motia-journey/exploring-example.mdx', title: 'Exploring Example' },
  { path: 'journeys/start-your-motia-journey/using-workbench.mdx', title: 'Using Workbench' },
  { path: 'journeys/start-your-motia-journey/simple-modifications.mdx', title: 'Simple Modifications' },
  
  // Journeys - Deterministic Flows
  { path: 'journeys/deterministic-flows/index.mdx', title: 'Journeys - Deterministic Flows Index' },
  { path: 'journeys/deterministic-flows/basic-flow.mdx', title: 'Basic Flow' },
  { path: 'journeys/deterministic-flows/flow-control.mdx', title: 'Flow Control' },
  { path: 'journeys/deterministic-flows/testing.mdx', title: 'Testing' },
  
  // Journeys - LLM Integration
  { path: 'journeys/llm-integration/index.mdx', title: 'Journeys - LLM Integration Index' },
  { path: 'journeys/llm-integration/adding-llms.mdx', title: 'Adding LLMs' },
  { path: 'journeys/llm-integration/prompt-engineering.mdx', title: 'Prompt Engineering' },
  { path: 'journeys/llm-integration/response-handling.mdx', title: 'Response Handling' },
  { path: 'journeys/llm-integration/chaining-llms.mdx', title: 'Chaining LLMs' },
  
  // Journeys - Agentic Workflows
  { path: 'journeys/agentic-workflows/index.mdx', title: 'Journeys - Agentic Workflows Index' },
  { path: 'journeys/agentic-workflows/dynamic-emits.mdx', title: 'Dynamic Emits' },
  { path: 'journeys/agentic-workflows/dynamic-reasoning.mdx', title: 'Dynamic Reasoning' },
  { path: 'journeys/agentic-workflows/agent-orchestration.mdx', title: 'Agent Orchestration' },
  
  // Guides - Setup
  { path: 'guides/setup.mdx', title: 'Guides - Setup' },
  
  // Guides - Step Creation
  { path: 'guides/step-creation/event-steps.mdx', title: 'Event Steps Guide' },
  { path: 'guides/step-creation/api-steps.mdx', title: 'API Steps Guide' },
  { path: 'guides/step-creation/cron-steps.mdx', title: 'Cron Steps Guide' },
  { path: 'guides/step-creation/noop-steps.mdx', title: 'NOOP Steps Guide' },
  
  // Guides - Workbench
  { path: 'guides/workbench/overview.mdx', title: 'Workbench Overview' },
  { path: 'guides/workbench/debugging.mdx', title: 'Workbench Debugging' },
  { path: 'guides/workbench/state-management.mdx', title: 'Workbench State Management' },
  { path: 'guides/workbench/custom-ui.mdx', title: 'Workbench Custom UI' },
  
  // Guides - Patterns
  { path: 'guides/patterns/hello-world.mdx', title: 'Hello World Pattern' },
  { path: 'guides/patterns/parallel-processing.mdx', title: 'Parallel Processing Pattern' },
  { path: 'guides/patterns/error-handling.mdx', title: 'Error Handling Pattern' },
  { path: 'guides/patterns/state-management.mdx', title: 'State Management Pattern' },
  { path: 'guides/patterns/testing-strategies.mdx', title: 'Testing Strategies Pattern' },
  
  // Guides - Deployment
  { path: 'guides/deployment/deploying.mdx', title: 'Deploying Guide' },
  
  // Real-World Tutorials - GitHub Integration
  { path: 'real-world-tutorials/github-integration/index.mdx', title: 'GitHub Integration Tutorial Index' },
  { path: 'real-world-tutorials/github-integration/step-1-auth.mdx', title: 'GitHub Integration Step 1: Authentication' },
  { path: 'real-world-tutorials/github-integration/step-2-webhooks.mdx', title: 'GitHub Integration Step 2: Webhooks' },
  { path: 'real-world-tutorials/github-integration/step-3-processing.mdx', title: 'GitHub Integration Step 3: Event Processing' },
  { path: 'real-world-tutorials/github-integration/step-4-actions.mdx', title: 'GitHub Integration Step 4: GitHub Actions' },
  
  // Real-World Tutorials - Email Automation
  { path: 'real-world-tutorials/email-automation/index.mdx', title: 'Email Automation Tutorial Index' },
  { path: 'real-world-tutorials/email-automation/step-1-connection.mdx', title: 'Email Automation Step 1: Email Service Connection' },
  { path: 'real-world-tutorials/email-automation/step-2-triggers.mdx', title: 'Email Automation Step 2: Email Triggers' },
  { path: 'real-world-tutorials/email-automation/step-3-processing.mdx', title: 'Email Automation Step 3: Email Processing' },
  { path: 'real-world-tutorials/email-automation/step-4-actions.mdx', title: 'Email Automation Step 4: Automated Actions' },
  
  // Real-World Tutorials - Task Management
  { path: 'real-world-tutorials/task-management/index.mdx', title: 'Task Management Tutorial Index' },
  { path: 'real-world-tutorials/task-management/step-1-connection.mdx', title: 'Task Management Step 1: Service Connection' },
  { path: 'real-world-tutorials/task-management/step-2-events.mdx', title: 'Task Management Step 2: Event Handling' },
  { path: 'real-world-tutorials/task-management/step-3-automation.mdx', title: 'Task Management Step 3: Automation Rules' },
  { path: 'real-world-tutorials/task-management/step-4-reporting.mdx', title: 'Task Management Step 4: Reporting and Analytics' },
  
  // Real-World Tutorials - Financial Analysis
  { path: 'real-world-tutorials/financial-analysis/index.mdx', title: 'Financial Analysis Tutorial Index' },
  { path: 'real-world-tutorials/financial-analysis/step-1-sources.mdx', title: 'Financial Analysis Step 1: Data Sources' },
  { path: 'real-world-tutorials/financial-analysis/step-2-processing.mdx', title: 'Financial Analysis Step 2: Data Processing' },
  { path: 'real-world-tutorials/financial-analysis/step-3-analysis.mdx', title: 'Financial Analysis Step 3: Analysis Algorithms' },
  { path: 'real-world-tutorials/financial-analysis/step-4-reporting.mdx', title: 'Financial Analysis Step 4: Reporting and Visualization' },
  
  // Reference - API
  { path: 'reference/api/index.mdx', title: 'API Reference Index' },
  { path: 'reference/api/configuration.mdx', title: 'API Configuration' },
  { path: 'reference/api/core-functions.mdx', title: 'API Core Functions' },
  { path: 'reference/api/utilities.mdx', title: 'API Utilities' },
  
  // Reference - CLI
  { path: 'reference/cli/index.mdx', title: 'CLI Reference Index' },
  { path: 'reference/cli/commands.mdx', title: 'CLI Commands' },
  { path: 'reference/cli/configuration.mdx', title: 'CLI Configuration' },
  
  // Reference - Language Specific
  { path: 'reference/language-specific/javascript.mdx', title: 'JavaScript-specific Features' },
  { path: 'reference/language-specific/typescript.mdx', title: 'TypeScript-specific Features' },
  { path: 'reference/language-specific/python.mdx', title: 'Python-specific Features' },
  { path: 'reference/language-specific/ruby.mdx', title: 'Ruby-specific Features' },
  
  // AI Tools
  { path: 'ai-tools/index.mdx', title: 'AI Tools Integration Overview' },
  { path: 'ai-tools/llms-context.mdx', title: 'Documentation Context for LLMs' },
  { path: 'ai-tools/cursor/index.mdx', title: 'Cursor Integration Overview' },
  { path: 'ai-tools/cursor/rules.md', title: 'Cursor Rules' },
  { path: 'ai-tools/windsurf/index.mdx', title: 'Windsurf Integration Overview' },
  { path: 'ai-tools/windsurf/rules.md', title: 'Windsurf Rules' },
  { path: 'ai-tools/cline/index.mdx', title: 'Cline Integration Overview' },
  { path: 'ai-tools/cline/rules.mdc', title: 'Cline Rules' },
  { path: 'ai-tools/claude-code/index.mdx', title: 'Claude Code Integration Overview' },
  { path: 'ai-tools/claude-code/rules.md', title: 'Claude Code Rules' },
  
  // Community
  { path: 'community/index.mdx', title: 'Community Overview' },
  { path: 'community/contributing.mdx', title: 'Contribution Guidelines' },
  { path: 'community/showcase.mdx', title: 'Community Project Showcase' },
  { path: 'community/support.mdx', title: 'Getting Help and Support' }
];

// Create all directories and files
docStructure.forEach(doc => {
  const filePath = path.join(baseDir, doc.path);
  const dirPath = path.dirname(filePath);
  
  // Ensure the directory exists
  ensureDirectoryExists(dirPath);
  
  // Create the placeholder file
  createPlaceholderFile(filePath, doc.title);
});

console.log('Documentation structure created successfully!');
