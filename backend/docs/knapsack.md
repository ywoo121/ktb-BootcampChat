# 배낭문제 / 0/1 Knapsack Problem

## 📌 Definition
Given `n` items with `value[i]` and `weight[i]`, and a knapsack with capacity `W`, choose items to **maximize the total value** without exceeding the weight limit.  
Each item can be included **at most once**.

---

## 🧠 How It Works

1. **Recursive (Naïve)**
   - Either pick or don't pick each item.
   - Exponential time complexity due to overlapping subproblems.

2. **Top-Down DP (Memoization)**
   - Cache each state `(i, w)` in a 2D array.
   - Time & space: `O(n * W)`

3. **Bottom-Up DP (Tabulation)**
   - Fill `dp[i][w]`: max value using first `i` items and weight limit `w`.

4. **Space Optimized DP**
   - Only keep 1D array of size `W+1`.

---

## ⏱ Time and Space Complexity

| Approach        | Time Complexity | Space Complexity |
|-----------------|------------------|------------------|
| Recursive       | O(2ⁿ)            | O(n) (stack)     |
| Memoization     | O(n·W)           | O(n·W)           |
| Tabulation      | O(n·W)           | O(n·W)           |
| Space Optimized | O(n·W)           | O(W)             |

---

## ✅ Characteristics

### ➕ Advantages
- Optimal for bounded capacity problems.
- Works well with integer weights and values.

### ➖ Disadvantages
- Doesn’t scale well with large `W`.

---

## 🧭 When to Use
- Each item can be used only once.
- Budgeted selections (limited resources).

---

## 🔍 Typical Applications
- Investment decisions
- Bounded cargo selection
- Resource-constrained planning

---

# Unbounded Knapsack Problem

## 📌 Definition
Given `n` items with `value[i]` and `weight[i]`, and a knapsack with capacity `W`, choose items (with **unlimited repetitions**) to **maximize total value**.

---

## 🧠 How It Works

1. **Recursive (Naïve)**
   - Either pick the item and stay at the same index (repeat), or skip it.
   - Very slow due to repeated states.

2. **Top-Down DP (Memoization)**
   - Use memoization table `dp[i][w]` for state (item index, remaining capacity).

3. **Bottom-Up DP (Tabulation)**
   - For each item, update `dp[w] = max(dp[w], value[i] + dp[w - weight[i]])`.

4. **Space Optimized DP**
   - Only 1D array `dp[0...W]` is used.

---

## ⏱ Time and Space Complexity

| Approach        | Time Complexity | Space Complexity |
|-----------------|------------------|------------------|
| Recursive       | O(2ⁿ)            | O(n)             |
| Memoization     | O(n·W)           | O(n·W)           |
| Tabulation      | O(n·W)           | O(W)             |

---

## ✅ Characteristics

### ➕ Advantages
- Allows multiple copies of same item.
- Efficient tabulation with 1D DP array.

### ➖ Disadvantages
- Still pseudo-polynomial (depends on W).
- Cannot be used when fractional item selection is needed.

---

## 🧭 When to Use
- Unlimited copies of items are allowed.
- Problems like coin change, rod cutting.

---

## 🔍 Typical Applications
- Coin Change
- Rod Cutting
- Unlimited resource selection