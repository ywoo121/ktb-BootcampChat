# 백트래킹 / Backtracking Algorithm

## 📌 Definition

**Backtracking** is a general algorithmic technique used for solving **constraint satisfaction problems** by **trying out all possible solutions** and **undoing choices** that lead to dead ends.  
It is an enhanced form of **recursion** that builds solutions incrementally and backtracks when constraints are violated.

---

## 🧠 How It Works

Backtracking builds a **solution space tree** where:
- Each node represents a **partial solution**.
- Each edge represents a **decision**.
- If a node **violates a constraint**, it backtracks to the previous node (decision point).

### Step-by-step:
1. Start with an **empty solution**.
2. At each step, **make a choice** among the available candidates.
3. If the choice leads to a **valid partial solution**, continue.
4. If the choice leads to a **dead end**, backtrack and try another.
5. Repeat until a full solution is found or all options are exhausted.

---

## ⏱ Time and Space Complexity

| Case           | Time Complexity         |
|----------------|--------------------------|
| General Case   | Exponential (O(K^N))     |
| Permutation    | O(N!)                    |
| Combinations   | O(2^N)                   |

- **Space Complexity**:  
  O(N) for recursion stack, where N is the depth of the decision tree.

---

## ✅ Characteristics

### ➕ Advantages
- Finds all feasible solutions or the optimal one (if needed).
- Naturally models problems with **multiple choices and constraints**.
- Clean recursive implementation.

### ➖ Disadvantages
- **Exponential time** in worst case.
- Not suitable for problems that can be solved greedily or via dynamic programming.
- Can be inefficient without pruning or heuristics.

---

## 🧭 When to Use

- Problem has **multiple candidates** or **branches** to explore.
- You need to **generate all combinations**, **permutations**, or **subsets**.
- You need to satisfy **complex constraints**.
- Greedy or DP fails due to interdependent decisions.

---

## 🔍 Typical Applications

- ✅ **N-Queens Problem**
- ✅ **Sudoku Solver**
- ✅ **Rat in a Maze / Maze Pathfinding**
- ✅ **Knight’s Tour**
- ✅ **Graph Coloring**
- ✅ **Subsets, Combinations, Permutations**
- ✅ **Backtracking in decision trees (e.g. AI, Chess Bots)**
- ✅ **Solving puzzles or layout problems**

---

## 💡 Example Pseudocode

```text
function BACKTRACK(current_state):
    if is_solution(current_state):
        save_solution(current_state)
        return

    for candidate in candidates(current_state):
        if is_valid(candidate):
            make_move(candidate)
            BACKTRACK(new_state)
            undo_move(candidate)
```

---

## 🔄 Backtracking vs Recursion

| Feature             | Recursion                          | Backtracking                               |
|---------------------|------------------------------------|---------------------------------------------|
| Purpose             | Solves subproblems                 | Explores decision space and constraints     |
| Structure           | Function calls                     | Recursive calls with **state rollback**     |
| Search Space        | Linear/subproblem-based            | Tree-based, **prunes invalid paths**        |
| Examples            | Merge sort, Fibonacci              | N-Queens, Maze Solving, Sudoku              |

---

## 📌 Types of Backtracking Problems

- **Decision Problems**: Is there *a* solution? (e.g. N-Queen)
- **Optimization Problems**: What’s the *best* solution? (e.g. Max score in Sudoku)
- **Enumeration Problems**: Generate *all* valid solutions. (e.g. All permutations)

---

## 📉 Complexity Analysis Summary

- Inherent **brute-force** nature: O(K^N) or O(N!)
- Performance improved with:
  - **Pruning** (cut off invalid paths early)
  - **Heuristics** (order choices to reach solution faster)

---

## 🎯 Summary

- Backtracking is a **depth-first search** with pruning.
- Especially effective for **constraint-heavy**, **combinatorial**, and **exploratory** problems.
- Backtracking = Recursion + Constraint Checking + Undoing decisions.

---