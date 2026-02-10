# Chat Operations Reference Guide

Guide for using the FIntrepidQ Equity Analysis interactive chat interface.

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
python chat.py start AAPL
```
This will automatically send an initial prompt: "Tell me about AAPL based on the analysis."

### Autonomous Analysis Mode

You can trigger a full multi-agent analysis directly from the command line without entering the chat loop:

```bash
python chat.py analyze AAPL
python chat.py analyze "Data Patterns" -> Resolves to DATAPATTNS
python chat.py analyze apple
first python chat.py start then You can ask-  analyze AAPL
```

#### Save Confirmation (Human-in-the-Loop)

After analysis completes, you will be prompted to save the report:

```
💾 Save this report?
  yes = Save to file AND database
  no = Save to file only
  cancel = Discard report
[yes/no/cancel] (yes):
```

- **yes**: Saves to both `reports/TICKER_TIMESTAMP.md` and the database
- **no**: Saves to file only (not added to database for chat queries)
- **cancel**: Discards the report entirely

#### Auto-Save Mode

Skip the confirmation prompt with `--auto-save`:

```bash
python chat.py analyze AAPL --auto-save
```
This automatically saves to both file and database.

#### Other Options

```bash
# Analyze without saving to file
python chat.py analyze AAPL --no-save-file

# Analyze with auto-save (no prompt)
python chat.py analyze AAPL --auto-save
```
This replaces the old `main.py` functionality.

---

## In-Chat Commands

Once inside the chat interface, you can use the following slash commands:

| Command | Description |
|---------|-------------|
| `analyze [TICKER]` | **NEW:** Trigger a full autonomous analysis for a stock (e.g., `analyze NVDA`). |
| `/compare [TICKER]` | **NEW:** Benchmark a stock against its sector peers and industry averages. |
| `/tickers` | List all tickers that have been analyzed and are available in the database. |
| `/help` | Show the list of available commands. |
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
