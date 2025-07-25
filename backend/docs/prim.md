# 프림 / Prim’s Algorithm for Minimum Spanning Tree (MST)

## 📌 Definition

**Prim’s Algorithm** is a **greedy algorithm** used to find the **Minimum Spanning Tree (MST)** of a **connected, undirected, and weighted graph**.  
Unlike Kruskal’s algorithm, which grows the MST edge by edge, Prim’s algorithm grows the MST **vertex by vertex**, always choosing the **minimum-weight edge** that connects a vertex in the MST to a vertex outside.

---

## 🧠 How It Works

1. Start with any arbitrary vertex (usually vertex `0`).
2. Maintain two sets:
   - `MST Set`: vertices included in the MST.
   - `Fringe`: vertices not yet in the MST.
3. Initialize `key[v] = ∞` for all vertices, except the start vertex (set `key[start] = 0`).
4. Use a **priority queue** (min-heap) to select the vertex `u` with the **minimum key value** not yet in the MST.
5. Add `u` to the MST set.
6. For each neighbor `v` of `u`, if `v` is not in MST and `weight(u, v) < key[v]`, update `key[v]`.
7. Repeat steps 4–6 until all vertices are included.

---

## ⏱ Time and Space Complexity

| Operation | Complexity |
|-----------|-------------|
| Time      | O((V + E) log V) with binary heap |
| Space     | O(V + E)                         |

---

## ✅ Characteristics

### ➕ Advantages
- Always produces the correct MST.
- Works well for **dense graphs** (faster than Kruskal when edges are abundant).
- Can be efficiently implemented using heaps or Fibonacci heaps.

### ➖ Disadvantages
- Requires a **priority queue**, which adds memory overhead.
- Slower than Kruskal’s for **sparse graphs**.
- Result can vary slightly based on **starting vertex**.

---

## 🧭 When to Use

- When the input graph is **dense** (more edges).
- When you want a **vertex-based** greedy approach.
- When edge sorting (used in Kruskal) is expensive or unavailable.

---

## 🔍 Typical Applications

- **Network design** (fiber optics, telecommunication lines)
- **Maze generation algorithms**
- **Clustering problems**
- **Approximation algorithms** for NP-Hard problems

---

## 🧾 Python Example

```python
import heapq

def prim_mst(graph, V):
    visited = [False] * V
    min_heap = [(0, 0)]  # (weight, vertex)
    mst_weight = 0
    count = 0

    while min_heap and count < V:
        weight, u = heapq.heappop(min_heap)
        if visited[u]:
            continue
        visited[u] = True
        mst_weight += weight
        count += 1

        for v, wt in graph[u]:
            if not visited[v]:
                heapq.heappush(min_heap, (wt, v))

    return mst_weight

# Example usage
V = 5
graph = {
    0: [(1, 2), (3, 6)],
    1: [(0, 2), (2, 3), (3, 8), (4, 5)],
    2: [(1, 3), (4, 7)],
    3: [(0, 6), (1, 8)],
    4: [(1, 5), (2, 7)]
}

print("Total weight of MST:", prim_mst(graph, V))
```

---

## 🧠 Key Idea

Prim's algorithm incrementally builds the MST by **always selecting the cheapest edge** from the tree to a new vertex, ensuring the result is **cycle-free** and connects all nodes with **minimum total cost**.

---