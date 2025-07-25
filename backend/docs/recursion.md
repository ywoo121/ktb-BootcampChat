# 재귀 / Recursive Algorithms

## 📌 Definition

A **Recursive Algorithm** is one that solves a problem by solving smaller instances of the same problem.  
It works by calling the same function within itself (directly or indirectly), and uses a **base case** to stop the recursion.

Recursion is particularly useful for problems that can be broken down into smaller, similar subproblems.

---

## 🧠 How It Works

1. **Base Case**: Define a condition where the recursion stops (e.g., when `n == 0`).
2. **Recursive Case**: Define the problem in terms of itself but with smaller input (e.g., `fact(n) = n * fact(n - 1)`).
3. **Progress Toward Base**: Each recursive call moves closer to the base case to ensure termination.
4. **Unwinding**: Once the base case is hit, the recursive calls return one by one, building the final result.

### Example (Factorial):
```python
def factorial(n):
    if n == 0:
        return 1
    return n * factorial(n - 1)
```

---

## ⏱ Time and Space Complexity

| Case          | Time Complexity         | Space Complexity         |
|---------------|--------------------------|---------------------------|
| Factorial     | O(n)                     | O(n) (call stack)         |
| Fibonacci     | O(2^n) naive, O(n) with memoization | O(n)           |
| Tree Traversal| O(n)                     | O(h), where h = height    |

Note: Recursive functions often use more memory due to the function call stack.

---

## ✅ Characteristics

### ➕ Advantages
- Simple and elegant for tree/graph traversal, divide-and-conquer, etc.
- Reduces code complexity by solving problems in a declarative manner.
- Enables concise definitions of self-similar problems (e.g., DFS, TOH, Fibonacci).

### ➖ Disadvantages
- High memory usage due to call stack.
- Risk of stack overflow if base case is not correctly defined.
- Less efficient for some problems unless optimized (e.g., via memoization or tail recursion).

---

## 🧭 When to Use

- When the problem has a **recursive structure** (e.g., trees, nested problems).
- When the problem can be defined in terms of **smaller subproblems**.
- When writing **divide-and-conquer** or **backtracking** algorithms.
- For problems like **factorial, Fibonacci, tree/graph traversals**, etc.

---

## 🔍 Typical Applications

- **Mathematical Computations**:
  - Factorial, GCD, Fibonacci Numbers
- **Tree and Graph Traversal**:
  - Inorder, Preorder, Postorder, DFS
- **Divide-and-Conquer**:
  - Merge Sort, Quick Sort, Binary Search
- **Backtracking**:
  - N-Queens, Sudoku Solver, Subset Sum
- **Dynamic Programming**:
  - Top-down (memoization) approach
- **Fractal/Pattern Generation**
- **Parsing/Expression Evaluation**

---