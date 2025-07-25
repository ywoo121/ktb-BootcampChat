# 그리디 알고리즘 / Greedy Algorithms

## 📌 Definition

**Greedy algorithms** are a class of algorithms that make the **locally optimal choice at each step** in the hope that these local choices lead to a **globally optimal solution**.  
They are often used in optimization problems where finding the best immediate option can lead to a correct or near-correct result.

---

## 🧠 How It Works

1. **Start with an initial state**.
2. **Evaluate all possible choices** from the current state.
3. **Choose the best local option** (greedy choice) without worrying about future consequences.
4. **Move to the next state** based on that choice.
5. **Repeat** until the goal is reached or no choices are available.

**Key properties** required for greedy to work:
- **Greedy Choice Property**: A global optimal solution can be arrived at by choosing the local optimum at each step.
- **Optimal Substructure**: A problem has optimal substructure if an optimal solution to the problem contains optimal solutions to its subproblems.

---

## ⏱ Time and Space Complexity

| Operation                | Typical Complexity     |
|--------------------------|------------------------|
| Time Complexity          | O(n log n) or O(n), often due to sorting |
| Space Complexity         | O(1) to O(n), problem-specific |

> Most greedy problems involve sorting or priority queue use (e.g., Dijkstra, Kruskal).

---

## ✅ Characteristics

### ➕ Advantages
- Simple to implement.
- Efficient (often linear or linearithmic time).
- Useful for approximating hard problems.
- Works well on problems with greedy-choice property and optimal substructure.

### ➖ Disadvantages
- Doesn't always yield the optimal solution.
- Must be proven to be correct for each specific problem.
- Can fail on problems like 0/1 Knapsack, Coin Change (unconventional denominations), etc.

---

## 🧭 When to Use

- When the problem **explicitly asks for optimal/maximum/minimum** result.
- When **choices can be sorted** or **prioritized**.
- When the **greedy-choice property** and **optimal substructure** are provable.
- For **approximate solutions** in NP-Hard problems (e.g., Traveling Salesman).

---

## 🔍 Typical Applications

- **Scheduling Problems** (e.g., activity selection, job sequencing)
- **Huffman Coding** (greedy construction of prefix-free codes)
- **Minimum Spanning Tree** (Prim’s, Kruskal’s algorithms)
- **Dijkstra’s Algorithm** (shortest path without negative weights)
- **Fractional Knapsack** (unlike 0/1 version)
- **Interval Partitioning**
- **Greedy coloring of graphs**
- **Greedy coin change** (when denominations allow)

---

## 🧪 Example: Coin Change (Greedy)

```python
def minCoins(coins, amount):
    coins.sort(reverse=True)
    res = 0
    for coin in coins:
        if amount >= coin:
            count = amount // coin
            res += count
            amount -= count * coin
        if amount == 0:
            break
    return res

coins = [1, 2, 5, 10]
amount = 39
print(minCoins(coins, amount))  # Output: 6
```

---

## ⚠️ Counter-Example

For `coins = [10, 1, 18]` and `amount = 20`, greedy picks `18 + 1 + 1 = 3 coins`,  
but optimal is `10 + 10 = 2 coins`.

Hence, greedy fails in certain configurations where **future consequences** matter.

---