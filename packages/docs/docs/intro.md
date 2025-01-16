---
sidebar_position: 1
title: Introduction
---

# Introduction

Welcome to **Wistro**, an **event-driven** framework for orchestrating automated tasks by combining **Steps** (units of logic) into **Flows**. Whether you're automating a simple workflow or orchestrating a complex, multi-step pipeline, Wistro makes it easier to focus on application logic instead of building custom orchestration, routing, or logging from scratch.

## What Is Wistro?

Wistro is a developer-first framework where you define **Steps** in JavaScript, TypeScript, Python, Ruby, (more supported languages on the roadmap). Each **Step** subscribes to and/or emits **Topics**, which trigger an **Event**, enabling loosely coupled logic. You can also group Steps into **Flows**—this organization helps you visualize your application and track logs in the Wistro Workbench.

Under the hood, Wistro automates much of the infrastructure:

- **Event Management**: This layer is in charge of piping incoming event topics to step handlers, by executing the step handlers with the event payload (if present).
- **Routing & Scheduling**: Out of the box routing, through api steps, which are exposed through a public epi endpoint. Along with support for scheduled steps, all you have to do is defined the schedule configuration and Motia will take care of the rest.
- **Workbench & Logging**: Out of the box visualization of your flows with base monitoring features such as logs and tracing, all of this through Wistro Workbench.

Whether you're a solo dev scripting internal tasks or part of a large team building a production system, Wistro can simplify your event-driven workflows.

## Main Features

| Feature            | Description                                                                                                                |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| **Steps**          | Fundamental logic units. Each step has a config (type: `event`, `api`, or `cron`) plus a code handler.                     |
| **Flows**          | Logical groupings of steps for organization, visual exploration, and logging. Often used to separate domain areas.         |
| **Events**         | Events are the result of emitting a topic with a message as payload from a step.events.                                    |
| **Topics**         | Identifiers for events. Each topic has an associated schema (or type) for its payload.                                     |
| **API Steps**      | A specialized step type that automatically creates an HTTP route when Wistro starts (no manual server needed).             |
| **Cron Steps**     | Another specialized step type that automatically schedules itself based on cron expressions.                               |
| **Observability**  | Real-time logs, optional UI to visualize flows & steps, see event traces, and debug messages.                              |
| **Multi-language** | Write Steps in Node.js, Python, Ruby, etc. Wistro runs them in separate processes with a consistent event-based interface. |

## How to Use These Docs

- **Left Nav**: Topics are ordered from basic to advanced, so you can step through as you build your automation.
- **Right Nav**: Highlights sections on the current page for quick navigation.
- **Search**: Use the search bar (or <kbd>Ctrl+K</kbd> / <kbd>Cmd+K</kbd>) to find topics instantly.

If you’re just starting, head over to [**Installation**](./installation.md) to add Wistro to your Node.js project. Then learn how to create and configure Steps (including event, API, or cron ones) and see how flows can organize them.

## Prerequisite Knowledge

We aim to keep these docs beginner-friendly. However, familiarity with basic JavaScript/TypeScript is helpful. If you use Python or Ruby Steps, knowledge of those languages also helps.

## Join Our Community

If you have questions, issues, or want to share ideas:

- Visit our **GitHub Discussions** or open an **Issue** for bugs or feature requests.
- Join our **Discord** to chat with other Wistro devs.
- Follow us on **X (Twitter)** or **Reddit** for announcements and Q&A.

When you’re ready, continue to the [**Installation**](./installation.md) guide!
