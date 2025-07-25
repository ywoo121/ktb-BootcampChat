# 분할정복 / Divide and Conquer Algorithm

## 📌 Definition

Divide and Conquer is a **problem-solving paradigm** that works by recursively breaking a problem into **non-overlapping subproblems**, solving each subproblem independently, and **combining their solutions** to solve the original problem.

This method is especially effective when subproblems are **independent and smaller**, leading to **efficient and elegant** solutions.

---

## 🧠 How It Works

Divide and Conquer consists of three fundamental steps:

1. **Divide**:  
   - Split the input problem into two or more **independent subproblems**.
   - Continue dividing until subproblems become simple enough (base case).

2. **Conquer**:  
   - Solve each subproblem **recursively**.
   - If the subproblem is small, solve it **directly**.

3. **Combine**:  
   - Merge the solutions of the subproblems to form the solution to the **original problem**.

Example: In **Merge Sort**, an array is divided until each subarray has one element, each is sorted individually, and the sorted arrays are merged.

---

## ⏱ Time and Space Complexity

The typical recurrence relation for Divide and Conquer algorithms is:

```
T(n) = aT(n/b) + f(n)
```

| Symbol | Meaning |
|--------|---------|
| `a`    | Number of subproblems |
| `n/b`  | Size of each subproblem |
| `f(n)` | Cost of divide and combine steps |

### Master Theorem gives:
- If `f(n) = O(n^c)`:
  - If `a < b^c`: `T(n) = Θ(n^c)`
  - If `a = b^c`: `T(n) = Θ(n^c * log n)`
  - If `a > b^c`: `T(n) = Θ(n^log_b a)`

**Space Complexity** varies by implementation, typically `O(log n)` to `O(n)` depending on recursion depth and auxiliary storage.

---

## ✅ Characteristics

### ➕ Advantages
- **Efficiency**: Often improves time complexity compared to brute-force approaches.
- **Parallelism**: Subproblems can be solved concurrently on multi-core systems.
- **Cache optimization**: Subproblems are smaller and fit well in fast memory caches.
- **Simplicity**: Breaks complex problems into easier-to-understand components.

### ➖ Disadvantages
- **Overhead**: Recursive calls and combining steps can add overhead.
- **Not always optimal**: If subproblems overlap, **Dynamic Programming** may be better.
- **Implementation complexity**: Some problems are hard to divide meaningfully.
- **Memory use**: Recursive stack and intermediate results may increase space usage.

---

## 🧭 When to Use

- Problem can be **recursively broken into independent subproblems**.
- Combine step is **simple or efficient**.
- Subproblems do **not share overlapping computations**.
- Performance is critical (e.g., large datasets, low-latency environments).

---

## 🔍 Typical Applications

- **Sorting**:
  - Merge Sort: O(n log n)
  - Quick Sort: O(n log n) average
- **Searching**:
  - Binary Search: O(log n)
- **Geometric Algorithms**:
  - Closest Pair of Points: O(n log n)
- **Matrix Operations**:
  - Strassen’s Matrix Multiplication: O(n^2.807)
- **Signal Processing**:
  - Fast Fourier Transform (FFT): O(n log n)
- **Large Number Multiplication**:
  - Karatsuba Algorithm: O(n^1.585)

---

## 🧩 Summary

- Divide and Conquer breaks a big problem into smaller independent ones, solves each recursively, and merges the solutions.
- It is the foundation of many classical algorithms and widely used in **sorting, searching, computational geometry, signal processing**, and more.
- **Efficiency** comes from reducing problem size and using **logarithmic** recursion depth.

---
