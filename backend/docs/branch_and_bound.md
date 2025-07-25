# 분기한정 / Branch and Bound Algorithm

## 📌 Definition

**Branch and Bound** is a **systematic search algorithm** used for solving **combinatorial optimization problems**. It works by:
- **Branching**: Dividing the solution space into smaller subproblems.
- **Bounding**: Computing bounds (upper/lower limits) for subproblems to estimate their potential.
- **Pruning**: Eliminating branches that cannot yield better results than the current best solution.

It is particularly effective for **NP-Hard problems** like:
- Traveling Salesman Problem (TSP)
- 0/1 Knapsack Problem
- Job Assignment
- N-Queens
- Integer Programming

---

## 🧠 Core Concepts

### 1. **State Space Tree**
- A tree representing the entire solution space.
- Each **node** represents a partial solution.
- Nodes are expanded into **children** (branching).
- Nodes not worth exploring further are **pruned**.

### 2. **Bounding Function**
- A heuristic or cost function used to **estimate** the best possible outcome from a node.
- If the bound is worse than the current best, the node is pruned.

### 3. **E-node (Expanded node)**
- A node currently being expanded to generate children.

---

## 🔎 Search Strategies

| Strategy           | Data Structure | Order     | Description                                                  |
|-------------------|----------------|-----------|--------------------------------------------------------------|
| **FIFO**          | Queue          | BFS       | Explores nodes level by level                                |
| **LIFO**          | Stack          | DFS       | Explores deep paths before backtracking                      |
| **Least-Cost (LC)** | Min-Heap       | Best-First| Selects node with the **least cost** estimate for expansion |

---

## 🔁 Algorithm Workflow

1. **Initialize** the best solution and a queue of nodes to explore.
2. **Branch**: Select a node and generate children.
3. **Bound**: Estimate cost for each child.
4. **Prune**: If bound ≥ best (for minimization), discard.
5. **Repeat** until all promising nodes are explored or optimal solution found.

---

## ✅ Characteristics

- Guarantees **optimal solution**
- Uses **upper/lower bounds** to limit search space
- Applies **backtracking** and **pruning**
- Explores **partial solutions** systematically

---

## 🧪 Example: Traveling Salesman Problem (TSP)

- Goal: Visit all cities once, return to start with minimum distance.
- Each node represents a partial path.
- Bounding: Use reduced cost matrix to estimate minimal future cost.
- Prune if estimated cost ≥ current best path.

---

## 🧮 Complexity

| Aspect              | Value               |
|---------------------|---------------------|
| **Worst Case Time** | Exponential (O(n!)) |
| **Best Case Time**  | Much lower due to pruning |
| **Space Complexity**| High (due to storing state space tree) |

---

## 💡 When to Use

- When the problem is a **discrete optimization** (e.g., 0/1 Knapsack)
- When exact solutions are required for **combinatorial** problems
- When **heuristic bounding functions** are effective

---

## 📚 Applications

- Traveling Salesman Problem
- 0/1 Knapsack Problem
- Job Assignment
- Integer Programming
- N-Queens Problem
- Game Tree Solving (e.g., chess, 8-puzzle)

---

## 🧭 Comparison with Backtracking

| Feature         | Backtracking           | Branch and Bound              |
|-----------------|------------------------|-------------------------------|
| Objective       | Feasibility             | Optimality                    |
| Pruning         | Constraint violation    | Bound-based estimation        |
| Use of Bound    | ❌ Not used             | ✅ Used                       |
| Goal            | Find any/all valid     | Find the **best** valid       |

---

## 🟢 Advantages

- **Finds optimal solution**
- Reduces **search space** via bounding
- **No redundant search paths**
- Can terminate early if bound is tight

## 🔴 Disadvantages

- **Exponential time complexity** in worst case
- **High memory usage** (stores large trees)
- Depends on the **quality of bounding function**
- May not scale well for large problems

---

## 🧠 Summary

**Branch and Bound** is a powerful algorithmic paradigm used to solve **hard optimization problems** by:
- Exploring partial solutions (branching)
- Eliminating non-promising paths early (bounding/pruning)
- Guaranteeing **optimal results** when other heuristics might fail

It is widely used in AI, operations research, and combinatorial problem-solving.
