# 깊이 우선 탐색 / Depth-First Search (DFS) for a Graph

## 📌 Definition

**Depth-First Search (DFS)** is a graph traversal algorithm that explores **as far as possible along each branch** before backtracking.  
It uses a recursive or stack-based approach to dive deep into the graph from a given starting node, visiting each vertex and its neighbors recursively.

Unlike BFS, DFS goes deep along a path and only backtracks when no further neighbors remain.

---

## 🧠 How It Works

1. **Start from a source node** `s`.
2. **Mark `s` as visited** and process it.
3. **Recur for all unvisited neighbors** of `s`.
4. **Repeat** until all reachable nodes from the source are visited.
5. For **disconnected graphs**, apply DFS to all unvisited nodes.

DFS can be implemented in two ways:
- **Recursive** (using the call stack)
- **Iterative** (using an explicit stack)

---

## ⏱ Time and Space Complexity

| Metric             | Complexity     |
|--------------------|----------------|
| **Time**           | O(V + E)       |
| **Auxiliary Space**| O(V)           |

- `V`: Number of vertices  
- `E`: Number of edges  
- The space complexity accounts for both the visited array and recursion stack.

---

## ✅ Characteristics

### ➕ Advantages
- Simple and elegant recursive implementation.
- Useful for **topological sort**, **strongly connected components**, etc.
- Can be used to detect **cycles** in a graph.
- More memory efficient than BFS for **sparse graphs**.

### ➖ Disadvantages
- Can go deep and cause **stack overflow** on large graphs (in recursive form).
- Does **not** guarantee shortest paths in unweighted graphs (unlike BFS).
- May explore unnecessary paths in some use cases.

---

## 🧭 When to Use

- Exploring **all paths** in a graph or tree.
- Problems involving **backtracking** (e.g., maze, permutations).
- To find **connected components** or **detect cycles**.
- When **shortest path** is *not* required.

---

## 🔍 Typical Applications

- **Tree/Graph Traversals** (e.g., Preorder, Postorder)
- **Cycle Detection** in both directed and undirected graphs
- **Topological Sorting** in DAGs
- **Strongly Connected Components** (e.g., Kosaraju’s algorithm)
- **Pathfinding** in recursive backtracking problems
- **Word Search / Puzzle Solving**
- **Connected Component Detection** in social networks, grids, etc.

---