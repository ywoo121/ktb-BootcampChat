# 다익스트라 / Dijkstra's Algorithm

## 📌 Definition
Given a **weighted undirected graph** with `V` vertices and `E` edges, and a source node `src`, compute the **shortest distance** from the source to **all other vertices**.  
Note: Graph must have **non-negative edge weights**.

---

## 🧠 How It Works

Dijkstra’s algorithm finds the shortest paths using a **greedy approach** with a **min-heap (priority queue)**:

1. **Initialize**:
   - `dist[src] = 0`, all others = ∞
   - Push `(0, src)` to min-heap

2. **While the heap is not empty**:
   - Pop node `u` with minimum distance
   - For each neighbor `v` of `u`:
     - If `dist[v] > dist[u] + weight(u,v)`:
       - Update `dist[v]`
       - Push `(dist[v], v)` into the heap

3. **Repeat** until all nodes are processed.

---

## ⏱ Time and Space Complexity

| Metric            | Value                   |
|-------------------|-------------------------|
| Time Complexity   | O(E * log V)            |
| Space Complexity  | O(V)                    |

---

## ✅ Characteristics

### ➕ Advantages
- Efficient for **non-negative weighted graphs**
- Works for **sparse graphs**

### ➖ Disadvantages
- **Fails with negative weights** (use Bellman-Ford instead)

---

## 🧭 When to Use
- Need shortest path from a **single source** to all nodes
- Graph has **no negative edge weights**

---

## 🔍 Typical Applications
- **Navigation systems** (e.g., GPS)
- **Network routing protocols** (e.g., OSPF)
- **Game development** (pathfinding AI)
- **Maps**, **logistics**, **road optimization**

---

## 💻 Python Example (Using Min-Heap)

```python
import sys
import heapq

def constructAdj(edges, V):
    adj = [[] for _ in range(V)]
    for u, v, wt in edges:
        adj[u].append((v, wt))
        adj[v].append((u, wt))  # undirected
    return adj

def dijkstra(V, edges, src):
    adj = constructAdj(edges, V)
    pq = []
    dist = [sys.maxsize] * V
    dist[src] = 0
    heapq.heappush(pq, (0, src))

    while pq:
        d, u = heapq.heappop(pq)

        for v, wt in adj[u]:
            if dist[v] > d + wt:
                dist[v] = d + wt
                heapq.heappush(pq, (dist[v], v))
    
    return dist

# Example
V = 5
edges = [[0, 1, 4], [0, 2, 8], [1, 4, 6], [2, 3, 2], [3, 4, 10]]
src = 0
print(dijkstra(V, edges, src))
# output:
[0, 4, 8, 10, 10]
```

## 🔗 Related Problems
- Shortest Path in DAG
- Bellman-Ford (handles negative edges)
- Floyd-Warshall (all-pairs)
- 0/1 BFS (with edge weights 0 or 1)
- Word Ladder (graph BFS)