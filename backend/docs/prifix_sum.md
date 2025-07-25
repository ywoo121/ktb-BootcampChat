# 누적 합 / Prefix Sum Array - Implementation and Applications

## 📌 Definition

A **Prefix Sum Array** is an auxiliary array where each element at index `i` stores the sum of all elements from index `0` to `i` of the original array.  
It enables **efficient range sum queries** and **update operations** in many algorithms.

---

## 🧠 How It Works

Given an array `arr[]`, compute `prefixSum[]` such that:

```
prefixSum[i] = arr[0] + arr[1] + ... + arr[i]
```

---

## ✅ Example

### Input
```
arr = [10, 20, 10, 5, 15]
```

### Output
```
prefixSum = [10, 30, 40, 45, 60]
```

---

## 🛠 Implementation

```python
def findPrefixSum(arr):
    n = len(arr)
    prefixSum = [0] * n
    prefixSum[0] = arr[0]
    for i in range(1, n):
        prefixSum[i] = prefixSum[i - 1] + arr[i]
    return prefixSum

arr = [10, 20, 10, 5, 15]
prefixSum = findPrefixSum(arr)
print(*prefixSum)  # Output: 10 30 40 45 60
```

---

## ⏱ Time and Space Complexity

| Operation          | Complexity |
|-------------------|------------|
| Time              | O(n)       |
| Space (Auxiliary) | O(n)       |

---

## 🧭 Applications

### 📌 1. Range Sum Queries
Find sum from index `L` to `R` in O(1):
```python
sum_LR = prefix[R] - prefix[L-1]  # (L > 0)
```

### 📌 2. Maximum Value After Range Increments
Perform range updates with constant time difference array + prefix sum:
- Example:
  - `increment(1, 3, 100)` → `diff[1] += 100`, `diff[4] -= 100`
  - Then do prefix sum on `diff[]` to get result.

### 📌 3. Equilibrium Index
Index `i` such that:
```python
prefixSum[i-1] == totalSum - prefixSum[i]
```

### 📌 4. Subarray with 0 Sum
Use hash set with prefix sums:
- If same prefix sum appears twice → 0 sum subarray exists.

### 📌 5. Longest Span with Same Sum in Two Binary Arrays
Use difference of prefix sums and hash map to track first occurrence of difference.

### 📌 6. Max Subarray Sum Modulo m
Maintain prefix mod values and search for:
```python
(max(prefix[j] - min_prefix[i] + m) % m)
```

### 📌 7. Maximum Occurring Element in Ranges
Use prefix sum technique on frequency array after difference updates.

---

## 🔍 Related Topics

- Difference Array
- Sliding Window
- Binary Indexed Tree (Fenwick Tree)
- Segment Tree (for dynamic prefix sum)

---