# Wistro Documentation: MVP Overview

This document describes the **Wistro** platform at an MVP level—spanning describing the **Open Source** core (with the Workbench). It clarifies the foundational terminology, how local vs. production step registries work, and what features to expect from each offering.

---

## **1. Introduction**

**Wistro** is an event-driven flow framework that allows you to build, test, and run “Steps” (logic units) connected by **Events** (messages). You can start with the **Open Source** version, which includes the **Core** engine and a local **Workbench** UI for development and debugging. For production scenarios at scale, **WistroHub** provides a commercial solution with, versioning, deployment, enhanced security, observability, and collaboration features.

---

## **2. Terminology**

- **Steps**: Core building blocks of logic. Each step emits and/or subscribes to one or more events.
- **Flows**: Organizational groupings of steps, used for structure, UI grouping, and logging. They don’t mandate strict execution order; the event model remains loosely coupled.
- **Events**: Messages that carry payload data. Emitting an event on a topic causes all subscribing steps to execute.
- **Topics**: Identifiers for events. Each topic has an associated schema (or type) for its payload.
- **Messages**: The actual payload data within an event. Validated at compile time and/or runtime for type safety.
- **Triggers**: Configuration that start flows (e.g., REST endpoints, cron schedules).
- **Core**: The Wistro engine that orchestrates events, manages steps, and logs activity in either dev or prod.
- **Workbench**: **Local development** UI (open source). It visualizes flows, runs tests, and shows logs for debugging.
- **Step Registry**: An **in-memory** set of steps currently active in a given environment (local dev, production, etc.). Each environment (or instance) loads and maintains its own registry.

---

## **3. Wistro Core (Open Source)**

### 3.1 Features of the Core

1. **Quick Setup**
   - Minimal config for local or production usage.
   - Single commands to install dependencies, run dev mode (`wistro` or `pnpm run dev`), and see immediate results.
2. **Folder Structure**
   - Default `/src` folder (configurable).
   - Any file matching `*.step.*` automatically registers as a step in the Step Registry.
3. **Language Support**
   - Steps can be implemented in JavaScript, TypeScript, Python, or Go.
   - The engine loads them, so they can subscribe to and emit events in the environment.
4. **Configuration**
   - `wistro.yml.lock` for deterministic builds.
   - Optional `wistro.yml` or `wistro.json` to define endpoints, cron jobs, state adapters, flow metadata.
   - Defaults to a local file-based state adapter for small projects or quick dev use.
5. **Flow Management**
   - Flows give developers a clear, UI-friendly way to see groupings of steps.
   - Actual execution remains event-based (no enforced sequence).
   - **No-Op** components exist for external/human tasks.

### 3.2 Local vs. Production Step Registry

- **Active vs Inactive Registry** Users will have a way to activate or inactiveate steps
- **Local Registry**
  - When developing locally, the engine scans all `*.step.*` files, creating an in-memory list of active steps.
  - The **Workbench** can then display these steps, allowing you to run or debug them.
- **Production Registry**
  - In a production environment (Lambda, Docker, Kubernetes, not yet decided), Wistro again scans and loads the steps.
  - Large organizations may have hundreds or thousands of steps in a single environment. Each environment has its own registry, isolating step sets.

---

## **4. Eval, Test, and Data Sampling**

1. **Unit Testing**
   - Each step tested in isolation via mocks.
2. **Integration / E2E Testing**
   - Validate complete event flow across multiple steps.
   - Helps ensure correctness of entire flows.
3. **Evaluation**
   - Run sample datasets through flows for performance or scenario checks.
   - Compare outputs between versions or configurations.
4. **Flow-Level Testing**
   - Combine unit, integration, and scenario tests to thoroughly verify flows.

---

## **5. Workbench (Open Source UI)**

1. **Purpose**
   - A local, developer-focused UI for building, visualizing, and testing flows.
   - Facilitates quick iteration and real-time feedback as you code new steps.
2. **Features**
   - **Flow Management**: Create/update flows and trigger them from a graphical view.
   - **Observability**: Inspect event traces, logs, and any errors as they happen.
   - **Testing & Debugging**: Launch tests and debug failing runs directly in the UI, with step-by-step insights.
3. **Scope**
   - Workbench is primarily for **local development** and small-scale usage.
   - For large-scale, multi-environment, multi-user scenarios, see **WistroHub** below.

---

## **6. Conventions and Best Practices**

1. **Readable Names**
   - Use descriptive step/flow names (“Post Report to Slack”) instead of “api/slack/report”
2. **Technical Details**
   - Clearly document endpoints, payload structures, or any special logic in or near the step code.

---
