# 피보나치 수 / Nth Fibonacci Number

## 📌 Definition
The **nth Fibonacci number** is the term at position n in the Fibonacci sequence defined by:
- **F(0) = 0**, **F(1) = 1**  
- For **n > 1**:  
  \[F(n) = F(n − 1) + F(n − 2)\]  
The sequence begins:  
0, 1, 1, 2, 3, 5, 8, 13, 21, …

---

## 🧠 How It Works
Common techniques to compute F(n):

1. **Recursive (Naive):**  
   Directly apply the recurrence.  
2. **Memoization:**  
   Cache results of subproblems to avoid recomputation.  
3. **Bottom-Up DP:**  
   Build an array `dp[0…n]` iteratively.  
4. **Space-Optimized DP:**  
   Keep only two variables for the last two values.  
5. **Matrix Exponentiation:**  
   Raise the “Fibonacci matrix”  
   \[\begin{pmatrix}1 & 1\\1 & 0\end{pmatrix}^{n-1}\]  
   in O(log n) via exponentiation by squaring; the top-left entry is F(n).  
6. **Binet’s Formula:**  
   Use the closed form  
   \[F(n)=\frac{\phi^n - \psi^n}{\sqrt5},\quad \phi=\frac{1+\sqrt5}2,\;\psi=1-\phi.\]

---

## ⏱ Time and Space Complexity

| Method                      | Time             | Space                 |
|-----------------------------|------------------|-----------------------|
| Recursive (naive)           | O(2ⁿ)            | O(n) (call stack)     |
| Memoization                 | O(n)             | O(n)                  |
| Bottom-Up DP                | O(n)             | O(n)                  |
| Space-Optimized DP          | O(n)             | O(1)                  |
| Matrix Exponentiation       | O(log n)         | O(log n) (stack)      |
| Binet’s Formula (float)     | O(1)             | O(1)                  |

---

## ✅ Characteristics

### ➕ Advantages
- **DP versions** turn exponential recursion into linear time.  
- **Space-optimized** uses just two variables.  
- **Matrix** and **fast-doubling** achieve logarithmic time.  
- **Binet’s formula** is constant-time (with floating-point).

### ➖ Disadvantages
- **Naive recursion** blows up for n > 40.  
- **Binet’s formula** loses precision for large n.  
- **Matrix methods** require careful modular arithmetic when numbers overflow.

---

## 🧭 When to Use
- **Learning**: illustrate recursion vs. dynamic programming.  
- **CP & interviews**: fast methods under time/memory limits.  
- **High-precision**: use fast-doubling or big-integer matrix expo.  
- **Modular arithmetic**: compute F(n) mod M in O(log n).

---

## 🔍 Typical Applications
- **Algorithm design**: a canonical DP example.  
- **Combinatorics**: counting tilings, paths, partitions.  
- **Data structures**: Fibonacci heaps, skip lists.  
- **Modeling**: population growth, phyllotaxis (nature’s spirals).  
- **Cryptography & PRNGs**: pseudo-random sequences.