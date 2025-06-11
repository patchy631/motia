# Motia

<p align="center">
  <img src="https://motia.dev/icon.png" alt="Motia Logo" width="200" />
</p>

<p align="center">
  <strong>🔥 A Modern Unified Backend Framework for APIs, Events and Agents 🔥</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/motia"><img src="https://img.shields.io/npm/v/motia.svg?style=for-the-badge" alt="npm version"></a>
  <a href="https://github.com/MotiaDev/motia/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg?style=for-the-badge" alt="license"></a>
  <a href="https://twitter.com/motiadev" target="_blank"><img src="https://img.shields.io/twitter/follow/motiadev.svg?style=for-the-badge&logo=twitter&color=1da1f2&label=Follow" alt="Twitter Follow"></a>
  <a href="https://discord.gg/7rXsekMK" target="_blank"><img src="https://img.shields.io/discord/1322278831184281721?style=for-the-badge&logo=discord&color=7289da&label=Discord" alt="Discord"></a>
</p>


<p align="center">
  <a href="https://www.motia.dev/manifesto">💡 Motia Manifesto</a> •
  <a href="https://www.motia.dev/docs/getting-started/quick-start">🚀 Quick Start</a> •
  <a href="https://www.motia.dev/docs/concepts/steps/defining-steps">📋 Defining Steps</a> •
  <a href="https://motia.dev/docs">📚 Docs</a>
</p>

---

## 🎯 What is Motia?

Motia is a **modern backend framework** that unifies APIs, background jobs, events, and AI agents into a single cohesive system. Eliminate runtime complexity and build unified backends where **JavaScript, TypeScript, Python, and more** work together in event-driven workflows, with built-in state management, observability, and one-click deployments.

Motia brings cohesion to the fragmented backend world with our core primitive: the **Step**. Think of Steps like React Components, but for backends.

![Motia combines APIs, background queues, and AI agents into one system](https://github.com/MotiaDev/motia/blob/main/assets/2.gif?raw=true)

### 🧱 The Step Philosophy

- **🎯 Single Purpose**: Each Step performs one task
- **🌍 Language agnostic**: Each Step can be in a different language, while being part of the same workflow
- **⚡ Versatile**: Steps can trigger APIs, background jobs, or even LLMs
- **👁️ Observable**: Everything is observable by default
- **🌊 Workflows**: Collections of connected steps that form complete processes
- **🏪 State Management**: Shared state across all steps with full traceability

---

## 🚧 The Problem

Backend teams juggle **fragmented runtimes** across APIs, background queues, and AI agents. This creates deployment complexity, debugging gaps, and cognitive overhead from context-switching between frameworks.

**This fragmentation demands a unified system.**

---

## ✅ The Unified System

Motia unifies your entire backend into a **unified state**. APIs, background jobs, and AI agents become interconnected Steps with shared state and integrated observability.

| **Before**                  | **After (Motia)**                            |
| --------------------------- | -------------------------------------------- |
| Multiple deployment targets | **Single unified deployment**                |
| Fragmented observability    | **End-to-end tracing**                       |
| Language dependant          | **JavaScript, TypeScript, Python, and more** |
| Context-switching overhead  | **Single intuitive model**                   |
| Complex error handling      | **Automatic retries & fault tolerance**      |

---

## 🔧 Supported Step Types

| Type        | Trigger               | Use Case                              |
| ----------- | --------------------- | ------------------------------------- |
| **`api`**   | HTTP Request          | Expose REST endpoints                 |
| **`event`** | Emitted Topics        | React to internal or external events  |
| **`cron`**  | Scheduled Time (cron) | Automate recurring jobs               |
| **`noop`**  | None                  | Placeholder for manual/external tasks |

---


## 🚀 Quickstart

Get up and running in **under 60 seconds**:

### 1. Create Your Project

```bash
npx motia@latest create -n my-motia-app
cd my-motia-app
```

### 2. Write Your First Step

Open `01-api.step.ts` and create a simple API endpoint:

```typescript
exports.config = {
  type: 'api',           // Step type: "api", "event", "cron", or "noop"
  path: '/hello-world',  // API endpoint path
  method: 'GET',         // HTTP method
  name: 'HelloWorld',    // Step identifier
  emits: ['test-state'], // Events this step emits
  flows: ['default'],    // Flow this step belongs to
}

exports.handler = async () => {
  return {
    status: 200,
    body: { message: 'Hello World from Motia!' },
  }
}
```

### 3. Launch the Workbench

Start the visual development environment:

```bash
npm run dev
# Opens at http://localhost:3000
```

🎉 **That's it!** You now have a fully functional Motia app with:
- ✅ API endpoint at `/hello-world`
- ✅ Visual debugger and flow inspector
- ✅ Built-in observability
- ✅ Hot reload for instant feedback

### 4. Explore the Workbench

From the Workbench, navigate to:

- **📊 Logs**: Structured logs for each step execution with inputs, outputs, and errors
- **🏪 States**: View internal state and data passed between steps using traceID
- **🔌 Endpoints**: Test all your API endpoints directly from the UI
- **🌊 Flows**: Visually inspect how your steps connect and what each step does

---

## 🗂 Examples

| [Finance Agent](https://github.com/MotiaDev/motia-examples/tree/main/examples/finance-agent) | [GitHub Agent](https://github.com/MotiaDev/motia-examples/tree/main/examples/github-integration-workflow) | [Gmail Manager](https://github.com/MotiaDev/motia-examples/tree/main/examples/gmail-workflow) |
| -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| ![Finance](assets/examples/finance-agent.png)<br>Financial insights                          | ![GitHub](assets/examples/github-pr-management.png)<br>PR automation                                      | ![Gmail](assets/examples/gmail-flow.png)<br>Email automation                                  |

| [Trello Automation](https://github.com/MotiaDev/motia-examples/tree/main/examples/trello-flow) | [RAG Agent](https://github.com/MotiaDev/motia-examples/tree/main/examples/rag_example) | [AI Image Gen](https://github.com/MotiaDev/motia-examples/tree/main/examples/vision-example) |
| ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| ![Trello](assets/examples/trello-manager.png)<br>Task automation                               | ![RAG](assets/examples/parse-embed-rag.png)<br>Knowledge retrieval                     | ![AI Image](assets/examples/generate-image.png)<br>Generate images                           |

---

## 🌐 Language Support

Write steps in your preferred language:

| Language       | Status        | Example           |
| -------------- | ------------- | ----------------- |
| **JavaScript** | ✅ Stable      | `handler.step.js` |
| **TypeScript** | ✅ Stable      | `handler.step.ts` |
| **Python**     | ✅ Stable      | `handler.step.py` |
| **Ruby**       | 🔄 Coming Soon | `handler.step.rb` |
| **Go**         | 🔄 Coming Soon | `handler.step.go` |
| **Rust**       | 🔄 Coming Soon | `handler.step.rs` |

---
### 💬 **Get Help**
- **📋 Questions**: Use our [Discord community](https://discord.gg/7rXsekMK)
- **🐛 Bug Reports**: [GitHub Issues](https://github.com/MotiaDev/motia/issues)
- **📖 Documentation**: [Official Docs](https://motia.dev/docs)
- **🎥 Blog**: [Motia Blog](https://dev.to/motiadev)

### 🤝 **Contributing**

We welcome contributions! Whether it's:
- 🐛 Bug fixes and improvements
- ✨ New features and step types
- 📚 Documentation and examples
- 🌍 Language support additions
- 🎨 Workbench UI enhancements

Check out our [Contributing Guide](https://github.com/MotiaDev/motia/blob/main/CONTRIBUTING.md) to get started.

---

<div align="center">

**🌟 Ready to unify your backend?**

[🚀 **Get Started Now**](https://motia.dev) • [📖 **Read the Docs**](https://motia.dev/docs) • [💬 **Join Discord**](https://discord.gg/7rXsekMK)

---

<sub>Built with ❤️ by the Motia team • **Star us on GitHub if you find Motia useful!** ⭐</sub>

</div>
