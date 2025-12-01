# Chat Operations Reference Guide

Guide for using the Intrepidq Equity Analysis interactive chat interface.

---

## Table of Contents

1. [Overview](#overview)
2. [Starting the Chat](#starting-the-chat)
3. [In-Chat Commands](#in-chat-commands)
4. [Usage Examples](#usage-examples)

---

## Overview

The Chat Interface allows you to interactively query the database and perform hybrid research on stocks. It uses an AI agent to understand your questions and retrieve relevant information from the analyzed reports.

---

## Starting the Chat

To start the interactive chat session, run the following command from the project root:

```bash
python chat.py start
```

### With Initial Context

You can also start the chat with a specific ticker context to immediately ask for a summary:

```bash
python chat.py start --ticker AAPL
```
This will automatically send an initial prompt: "Tell me about AAPL based on the analysis."

---

## In-Chat Commands

Once inside the chat interface, you can use the following slash commands:

| Command | Description |
|---------|-------------|
| `/help` | Show the list of available commands. |
| `/tickers` | List all tickers that have been analyzed and are available in the database. |
| `/clear` | Clear the current conversation history (context). |
| `/exit` or `/quit` | Exit the chat interface. |

---

## Usage Examples

### Basic Query

```text
You: What is the risk analysis for Tesla?

AI: Based on the latest report for TSLA... [AI Response]
```

### Listing Tickers

```text
You: /tickers

AI: Here are the analyzed tickers:
- AAPL
- TSLA
- MSFT
...
```

### Clearing Context

If you want to switch topics completely and don't want previous messages to influence the AI:

```text
You: /clear
Conversation history cleared.

You: Tell me about Microsoft.
```
