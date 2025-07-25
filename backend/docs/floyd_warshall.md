# 플로이드-워셜 / Floyd–Warshall Algorithm

## 📌 Definition  
The **Floyd–Warshall Algorithm** finds the **shortest distances between all pairs of vertices** in a weighted graph.  
- It can handle **negative weights**, but **not negative weight cycles**.
- Input is a matrix `dist[][]` where `dist[i][j]` is the weight of the edge from vertex `i` to vertex `j`. If no edge exists, `dist[i][j] = INF (e.g. 1e8)`.

---

## 🧠 How It Works

The idea is to **iteratively improve** the shortest path between all pairs `(i, j)` by **including intermediate vertices** `k`.  
At each iteration, we check if going through `k` offers a shorter path:  
```text
dist[i][j] = min(dist[i][j], dist[i][k] + dist[k][j])
```
Repeat this for every `k` from `0` to `V-1`.

---

## ⏱ Time and Space Complexity

| Metric             | Complexity    |
|--------------------|---------------|
| Time Complexity    | O(V³)         |
| Space Complexity   | O(1) (in-place update) |

---

## ✅ Characteristics

### ➕ Advantages
- Works with **directed and undirected** graphs
- Handles **negative edges** (as long as no negative cycles)
- Simple **dynamic programming** structure
- Allows detection of **negative cycles** if `dist[i][i] < 0`

### ➖ Disadvantages
- Not suitable for **sparse graphs** (better use Dijkstra or Johnson)
- Does not return the **actual path** unless path reconstruction is added

---

## 🧭 When to Use
- You need **shortest paths between all pairs**
- The graph is **dense**
- The graph contains **negative weights** but no negative cycles
- You're solving problems like **routing tables**, **flight networks**, or **all-pairs reachability**

---

## 🔍 Typical Applications
- **Network Routing** (e.g., in computer networks)
- **Flight Planning** (shortest hops between airports)
- **Geographic Systems** (finding all-pairs shortest distances in road networks)
- **Kleene’s Algorithm** for computing regular expressions from automata
- **Game Maps**, **multi-agent planning**, etc.

---

## 🧪 Example

### Input
```python
dist = [
  [0,   4,  INF, 5,   INF],
  [INF, 0,  1,   INF, 6],
  [2,   INF, 0,  3,   INF],
  [INF, INF, 1,   0,  2],
  [1,   INF, INF, 4,   0]
]
```

### Output
```text
[0, 4, 5, 5, 7]
[3, 0, 1, 4, 6]
[2, 6, 0, 3, 5]
[3, 7, 1, 0, 2]
[1, 5, 5, 4, 0]
```

---

## 💻 Python Implementation

```python
def floydWarshall(dist):
    V = len(dist)
    for k in range(V):
        for i in range(V):
            for j in range(V):
                if dist[i][k] != 1e8 and dist[k][j] != 1e8:
                    dist[i][j] = min(dist[i][j], dist[i][k] + dist[k][j])
```

### Usage
```python
INF = int(1e8)
dist = [
    [0,   4,  INF, 5,   INF],
    [INF, 0,  1,   INF, 6],
    [2,   INF, 0,  3,   INF],
    [INF, INF, 1,   0,  2],
    [1,   INF, INF, 4,   0]
]

floydWarshall(dist)
for row in dist:
    print(row)
```

---

## ⚠️ Detecting Negative Cycle
After running Floyd–Warshall, if any `dist[i][i] < 0`, then a **negative weight cycle** exists.

---

## 📚 Related Interview Questions
- How do you detect a negative cycle using Floyd–Warshall?
- How is Floyd–Warshall different from Dijkstra’s algorithm?
- When is Floyd–Warshall preferred over Bellman-Ford?
- How do you print the actual shortest path using this algorithm?

---

## 🔗 Related Problems
- All Pairs Shortest Path
- Print Negative Cycle
- Minimum Cost Path in Grid
- Shortest Distance from Every Node to Every Other Node
- Shortest path in Binary Maze
- Word Ladder
- Snake and Ladder Minimum Dice Throws