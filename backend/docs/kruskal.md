# 크루스칼 / Kruskal’s Minimum Spanning Tree (MST) Algorithm

## 📌 Definition

**Kruskal’s Algorithm** is a **greedy algorithm** used to find the **Minimum Spanning Tree (MST)** of a **connected, undirected, and weighted graph**.  
The MST is a subset of the edges that connects all vertices in the graph with the **minimum possible total edge weight** and **no cycles**.

---

## 🧠 How It Works

Kruskal’s algorithm proceeds with the following steps:

1. **Sort all edges** in non-decreasing order of weight.
2. Initialize an empty MST and a **Disjoint Set Union (DSU)** structure to detect cycles.
3. Iterate through sorted edges:
   - For each edge `(u, v)` with weight `w`:
     - If `u` and `v` belong to **different components** (i.e., no cycle), **include** the edge in the MST.
     - Union the two components using DSU.
4. Repeat until the MST has `V - 1` edges (where `V` is the number of vertices).

---

## ⏱ Time and Space Complexity

| Operation        | Complexity            |
|------------------|------------------------|
| Time             | O(E log E) or O(E log V) |
| Space            | O(E + V)               |

- Sorting edges: `O(E log E)`
- DSU operations (`find`, `union`): `O(log V)` amortized with union by rank and path compression

---

## ✅ Characteristics

### ➕ Advantages
- Simple to implement with **greedy logic**.
- Efficient for **sparse graphs** (E ≈ V).
- Works well when edges are **pre-sorted**.

### ➖ Disadvantages
- May be **less efficient for dense graphs** compared to Prim’s algorithm.
- Requires a **disjoint set** structure to detect cycles.
- Cannot be directly used on **directed graphs** or **disconnected graphs** (MST is undefined in that case).

---

## 🧭 When to Use

- When the graph is **sparse** (fewer edges than vertices squared).
- When edge list is already available or pre-sorted.
- When using **edge-centric approach** is more natural than vertex-centric (as in Prim's).

---

## 🔍 Typical Applications

- **Network design** (e.g., laying cables, pipelines)
- **Clustering algorithms** (e.g., hierarchical clustering)
- **Approximation algorithms** for NP-hard problems
- **Image segmentation**
- **Circuit design** in VLSI

---

## 🧪 Example

### Input:
Graph with 4 vertices and edges:

```
edges = [
  [0, 1, 10],
  [1, 3, 15],
  [2, 3, 4],
  [2, 0, 6],
  [0, 3, 5]
]
```

### Output:
```
Edges in MST:
2 -- 3 == 4
0 -- 3 == 5
0 -- 1 == 10
Minimum Cost = 19
```

---

## 🧾 Python Snippet

```python
from heapq import heapify, heappop, heappush

class DSU:
    def __init__(self, n):
        self.parent = list(range(n))
        self.rank = [1] * n

    def find(self, i):
        if self.parent[i] != i:
            self.parent[i] = self.find(self.parent[i])
        return self.parent[i]

    def union(self, x, y):
        px = self.find(x)
        py = self.find(y)
        if px == py:
            return
        if self.rank[px] < self.rank[py]:
            self.parent[px] = py
        elif self.rank[px] > self.rank[py]:
            self.parent[py] = px
        else:
            self.parent[py] = px
            self.rank[px] += 1

def kruskal(V, edges):
    edges.sort(key=lambda x: x[2])
    dsu = DSU(V)
    cost = 0
    result = []
    for u, v, w in edges:
        if dsu.find(u) != dsu.find(v):
            dsu.union(u, v)
            result.append((u, v, w))
            cost += w
            if len(result) == V - 1:
                break
    return cost, result

# Example Usage
edges = [[0, 1, 10], [1, 3, 15], [2, 3, 4], [2, 0, 6], [0, 3, 5]]
cost, mst = kruskal(4, edges)
print("MST Edges:", mst)
print("Total Cost:", cost)
```

---