# Chapter 1: The Foundation & The "Envelope" Model

**Date**: December 3, 2025
**The Goal**: "NetSuite for Personal Time"

## The Genesis
The idea wasn't to build a calendar. Calendars are for appointments. We wanted to build a *ledger*.

Most time management apps treat time as an infinite stream. You block out an hour here, an hour there, but there's no "double-entry accounting." If you overspend time on "Leisure," it doesn't automatically show a deficit in "Work" or "Sleep." We wanted to change that. We wanted to treat the 168 hours in a week exactly like a salary in a bank account.

## The Stack Selection: Speed Over Tradition
We stood at a crossroads before writing a single line of code.
*   **Option A**: Java Spring Boot. Robust, enterprise-grade, familiar.
*   **Option B**: Next.js (App Router) + TypeScript + Prisma. Fast, modern, full-stack in one repo.

We actually started down the Spring Boot path (Session 1 logs show a `pom.xml` generation), but we hit a wall of boilerplate. We realized that for a prototyping session where "visual feedback" was key, we couldn't spend 3 hours configuring generic controllers.

We pivoted hard to **Next.js**. It allowed us to define our backend logic (Server Actions) right next to our UI components. We chose **Prisma** with **SQLite** for the database because it meant we didn't need to spin up a Docker container for Postgres just to test a schema. It was a single file: `dev.db`. Zero friction.

## The Core Concept: The "Envelope"
In personal finance, the "Envelope Method" involves putting cash into physical envelopes for different expenses (Rent, Groceries, Dining Out). When the "Dining Out" envelope is empty, you stop eating out.

We applied this to time.
1.  **Total Asset**: 168 Hours (7 days * 24 hours).
2.  **Envelopes**: Arbitrary categories like `Work`, `Sleep`, `Study`, `Gaming`.
3.  **The Rule**: The sum of all envelopes MUST equal 168.

This constraints-based thinking was the "secret sauce." It forced a zero-sum game mentality.

## Visualizing the Invisible: The Charting Pivot
We needed a dashboard that smacked you in the face with reality. A list of numbers wouldn't cut it.

we wanted a **3D Pie Chart**.
*   *Why?* Because it looks cool. It feels tangible, like a physical object.
*   *The Problem*: Most modern React charting libraries (Recharts, Chart.js) have moved away from "cheesy" 3D effects towards flat, clean design.
*   *The Pivot*: We refused to compromise on the aesthetic. We dug up the **Google Charts** library. It’s an older library, relies on loading external scripts, and can be finicky with React's hydration, but it offered that specific, chunky 3D look we wanted.

We ended up with a **Hybrid Charting Architecture**:
*   **Google 3D Pie Chart**: For the high-level "Where is my time going?" breakdown.
*   **Recharts Bar Chart**: For the precise "Budgeted vs. Actual" comparison.

## The First "Roadblock": Hydration
One interesting technical hiccup we faced immediately was **Next.js Hydration Errors**.
Google Charts renders by injecting an `<iframe>` or generic `<div>` after the window loads. Next.js, doing server-side rendering, would try to generate the HTML on the server, but the Google Chart script wouldn't exist there.
*   *The Fix*: We had to wrap the charting components in `useEffect` hooks and explicitly disable SSR for those specific widgets, ensuring they only attempted to render once the client browser was fully active.

## Summary of Day 1
By the end of the first session, we didn't have user accounts. We didn't have multi-week history. We didn't even have a way to edit a transaction. But we had:
1.  A database schema that enforced the 168-hour limit.
2.  A dashboard that looked different from every other flat-design SaaS on the market.
3.  A proof of concept that "Time Budgeting" was a valid mental model.

The foundation was poured. The "Envelope" was sealed.
