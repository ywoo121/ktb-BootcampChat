# 벨만-포드 / Bellman–Ford Algorithm

## 📌 Definition  
Given a **weighted directed graph** with **V vertices** and **E edges**, and a **source node `src`**, the **Bellman-Ford Algorithm** computes the shortest distances from `src` to all vertices.  
- It **handles negative weights**.
- If any node is **unreachable**, set its distance to `1e8` (or a sufficiently large value).
- If a **negative weight cycle** is detected, return `[-1]`.

---

## 🧠 How It Works

### 🔄 Relaxation Principle  
For an edge `u → v` with weight `w`:
```text
if dist[u] + w < dist[v]:
    dist[v] = dist[u] + w
```
- Repeat this **V-1 times** to ensure all shortest paths are considered.
- Perform **one more pass (Vth)** to check for **negative cycles**. If any distance is still updated, a cycle exists.

### Why V - 1 Iterations?
A shortest path can contain at most **V - 1 edges**. More edges would imply a cycle.

---

## ⏱ Time and Space Complexity

| Operation      | Complexity |
|----------------|------------|
| Time           | O(V·E)     |
| Space          | O(V)       |

---

## ✅ Characteristics

### ➕ Advantages
- Works for **graphs with negative weights**
- **Detects negative weight cycles**
- Conceptually **simple** and easy to implement

### ➖ Disadvantages
- Slower than Dijkstra’s algorithm for graphs with non-negative weights
- Does **not use priority queue**, so no early exit

---

## 🧭 When to Use
- Graph contains **negative edge weights**
- You need to **detect a negative weight cycle**
- Graph is **sparse** (fewer edges than V²)

---

## 🔍 Typical Applications
- **Currency arbitrage** detection (negative cycles in exchange rates)
- **Routing algorithms** (e.g. RIP protocol in networks)
- **Planning problems** with penalties/rewards
- **Shortest path in time-travel problems** (with time gain/loss edges)

---

## 💡 Example

### Input  
```python
V = 5
edges = [
  [0, 1, 5],
  [1, 2, 1],
  [1, 3, 2],
  [2, 4, 1],
  [4, 3, -1]
]
src = 0
```

### Output  
```
[0, 5, 6, 6, 7]
```

### Explanation  
- 0 → 1: 5  
- 0 → 1 → 2: 6  
- 0 → 1 → 2 → 4 → 3: 6  
- 0 → 1 → 2 → 4: 7  

---

## 🚫 Negative Weight Cycle Example  
```python
V = 4
edges = [
  [0, 1, 4],
  [1, 2, -6],
  [2, 3, 5],
  [3, 1, -2]
]
src = 0
```

**Output:** `[-1]`  
**Reason:** Negative cycle: 1 → 2 → 3 → 1 with total weight -3

---

## 🧪 Python Implementation

```python
def bellmanFord(V, edges, src):
    INF = 10**8
    dist = [INF] * V
    dist[src] = 0

    for i in range(V):
        for u, v, wt in edges:
            if dist[u] != INF and dist[u] + wt < dist[v]:
                if i == V - 1:
                    return [-1]  # Negative weight cycle
                dist[v] = dist[u] + wt
    return dist
```

### Sample Usage
```python
if __name__ == '__main__':
    V = 5
    edges = [[1, 3, 2], [4, 3, -1], [2, 4, 1], [1, 2, 1], [0, 1, 5]]
    src = 0
    result = bellmanFord(V, edges, src)
    print(result)
```

**Output:**  
```
[0, 5, 6, 6, 7]
```

---

## 🔗 Related Problems
- Shortest Path in Directed Acyclic Graph
- Detect and print negative weight cycle
- Word Ladder (shortest path in word transformations)
- Minimum steps in grid or maze problems
- Snake and Ladder game modeling