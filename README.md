# Woki Brain – Booking Engine Challenge

This repository contains my implementation for the **Woki Backend Challenge**, focused on building a small yet robust **booking engine**.

---

## Challenge Reference

Original challenge description:  
https://github.com/AppeironGlobalSolutions/backend-challenges/blob/main/woki-brain.md

The project follows the suggested architecture:
- **Fastify** as the HTTP framework  
- **In-memory database** for simplicity  
- Clear separation of:  
  - `routes/`  
  - `domain/`  
  - `application logic (“brain”)`  
  - `infrastructure (store)`  

In this last case, I adjusted the structure to improve maintainability, although it could still be refined further.

---

### Combo Capacity Heuristic

For the combination of tables, I selected:

### Sum minus merge penalties” heuristic

You can see this calculation in the file wikibrain.ts, in the computeComboCapacity function.

This approach prevents unrealistic seat information when merging tables and keeps the capacity more realistic and aligned with typical restaurant logic.

## API reference

The API endpoints comply with all specifications defined in the original documentation. Also, the DELETE endpoint was added too.

## Installation & Running

The project requires **Node.js 24+**.

```bash
npm install
npm run dev