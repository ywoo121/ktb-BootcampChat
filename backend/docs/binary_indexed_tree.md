# 펜윅 트리 / Fenwick Tree (Binary Indexed Tree)

A **Fenwick Tree**, also known as a **Binary Indexed Tree (BIT)**, is a powerful data structure that supports efficient **prefix sum queries** and **point or range updates** in logarithmic time. It is widely used in **competitive programming** due to its ease of implementation and performance.

---

## 📌 Why Use Fenwick Tree?

Given an array and a series of queries:
- Type 1: Sum of range [L, R]
- Type 2: Update value at index I

Fenwick Tree provides:
- **O(log N)** time for both **query** and **update**
- Faster and simpler than Segment Tree for prefix sums
- Requires **O(N)** space and can be built in **O(N)** time

---

## 🧠 Core Idea

Let `F[i]` store the **partial sum** from index `i - (i & -i) + 1` to `i`. Using this pattern:
- To **get prefix sum**: move *backwards* by subtracting the rightmost set bit
- To **update value**: move *forwards* by adding the rightmost set bit

---

## 🔧 Bitwise Operation

To compute the rightmost set bit:
```python
right_most_set_bit = i & -i
```

---

## 📘 Fenwick Tree Operations

### 1. Prefix Sum Query
```python
def sum(idx, F):
    result = 0
    while idx > 0:
        result += F[idx]
        idx -= idx & -idx
    return result
```

### 2. Point Update
```python
def add(idx, x, F):
    while idx < len(F):
        F[idx] += x
        idx += idx & -idx
```

### 3. Range Query [L, R]
```python
def range_query(l, r, F):
    return sum(r, F) - sum(l - 1, F)
```

---

## ⚙ Full Example (Point Update & Range Query)

```python
def main():
    n = 5
    arr = [-1e9, 1, 2, 3, 4, 5]  # 1-based indexing
    F = [0] * (n + 1)

    for i in range(1, n + 1):
        add(i, arr[i], F)

    print(range_query(1, 3, F))  # Output: 6
    print(range_query(2, 5, F))  # Output: 14

    # Update index 3 to 7
    i, X = 3, 7
    add(i, X - arr[i], F)

    print(range_query(1, 3, F))  # Output: 10
    print(range_query(2, 5, F))  # Output: 18
```

---

## ⏱ Building Tree in O(N)

```cpp
void buildTree(vector<int>& arr, vector<int>& F, int n) {
    for (int i = 1; i <= n; i++) {
        F[i] += arr[i];
        if (i + (i & -i) <= n)
            F[i + (i & -i)] += F[i];
    }
}
```

---

## 🧩 Use Cases

### 1. **Point Update & Range Query**
Classic case (see above)

---

### 2. **Range Update & Point Query**
```python
def range_update(l, r, x, F):
    add(l, x, F)
    add(r + 1, -x, F)

def point_query(idx, F):
    return sum(idx, F)
```

---

### 3. **Range Update & Range Query**
Use two BITs `F1` and `F2`:

```python
def pref_sum(i, F1, F2):
    return sum(i, F1) * i - sum(i, F2)

def range_query(l, r, F1, F2):
    return pref_sum(r, F1, F2) - pref_sum(l - 1, F1, F2)

def range_update(l, r, x, F1, F2):
    add(l, x, F1)
    add(r + 1, -x, F1)
    add(l, x * (l - 1), F2)
    add(r + 1, -x * r, F2)
```

---

## 📊 Output Example

```text
Input:
arr = [1, 2, 3, 4, 5]
range_query(1, 3) => 6
range_query(2, 5) => 14
Update index 3 to 7
range_query(1, 3) => 10
range_query(2, 5) => 18
```

---

## 🧱 2D/3D Fenwick Trees

2D and 3D BITs work by maintaining prefix sums in higher-dimensional submatrices:
- 2D BIT supports updates/queries on submatrices
- Useful in competitive programming for **grid sum** problems

---

## 🚀 Advantages

- Efficient for problems involving:
  - Prefix/range sums
  - Point/range updates
- Lower memory & faster than Segment Tree in certain use cases
- Easier to implement

---

## 🚧 Limitations

- Doesn't support non-associative operations (e.g., min, max)
- Requires adaptation for range min/max/bitwise queries
- Fixed on cumulative operations like addition

---

## ✅ Summary

| Operation Type              | Structure Required | Time Complexity |
|----------------------------|--------------------|-----------------|
| Point Update + Range Query | 1 Fenwick Tree     | O(log N)        |
| Range Update + Point Query | 1 Fenwick Tree     | O(log N)        |
| Range Update + Range Query | 2 Fenwick Trees    | O(log N)        |

Fenwick Tree is a **must-know** for any serious competitive programmer dealing with **prefix sums**, **dynamic arrays**, or **frequent updates and queries**.