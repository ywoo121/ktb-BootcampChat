# 너비 우선 탐색 / Breadth-First Search (BFS) for a Graph

## 📌 Definition

**Breadth-First Search (BFS)** is a fundamental **graph traversal algorithm** used to explore nodes and edges of a graph.  
It follows a **level-order traversal**, exploring **all neighbors of a node before moving to the next level**.

BFS is typically implemented using a **queue** and a **visited array** to prevent revisiting nodes, especially in cyclic or disconnected graphs.

---

## 🧠 How It Works

1. **Initialize**:
   - A queue `q`
   - A visited array `visited[]`
   - Start with a source node `s`, mark `visited[s] = True`, and enqueue it.

2. **Traversal Loop**:
   - While the queue is not empty:
     - Dequeue the front node `u`
     - Visit `u`
     - For each unvisited neighbor `v` of `u`:
       - Mark `v` as visited
       - Enqueue `v`

3. **Disconnected Graphs**:
   - For full traversal in disconnected graphs, repeat BFS from every unvisited node.

---

## ⏱ Time and Space Complexity

| Metric             | Complexity     |
|--------------------|----------------|
| **Time**           | O(V + E)       |
| **Auxiliary Space**| O(V)           |

- `V`: Number of vertices  
- `E`: Number of edges  
- Each node and edge is visited at most once.

---

## ✅ Characteristics

### ➕ Advantages
- Finds **shortest path** in **unweighted graphs**.
- Can detect **connected components**.
- Simple to implement using queue.
- Naturally explores graphs **level by level**.

### ➖ Disadvantages
- Requires extra **space for visited[] and queue[]**.
- Not suitable for **deep traversal** or recursive problems (e.g., backtracking).

---

## 🧭 When to Use

- To find the **shortest path** in an unweighted graph.
- When you need to traverse **all vertices level by level**.
- When detecting **connected components**, **cycles**, or **bipartite property**.

---

## 🔍 Typical Applications

- **Shortest Path in Unweighted Graphs**
- **Cycle Detection** (in both directed and undirected graphs)
- **Connected Components Identification**
- **Topological Sorting** (Kahn’s algorithm)
- **Level Order Traversal** in Binary Trees
- **Network Routing Algorithms**
- **AI Pathfinding** (e.g., in grids or mazes)

---