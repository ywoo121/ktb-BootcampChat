# 세그먼트 트리 / Segment Trees

## 📌 Definition

A **Segment Tree** is a binary-tree data structure that stores information about **intervals** (segments) of an array.  
It supports **range queries** and **point/range updates** in **O(log n)** time on a fixed-size array of length *n*.

---

## 🧠 How It Works

1. **Structure**  
   - The tree is built over the index range `[0…n−1]`.  
   - Each node covers a segment `[L…R]`.  
   - **Leaf nodes** store single array elements.  
   - **Internal nodes** store the result of merging their two children (e.g. sum, min, max).

2. **Building**  
   - Recursively split `[L…R]` at `mid = (L+R)//2`.  
   - Build left child on `[L…mid]` and right on `[mid+1…R]`.  
   - Store `merge(left.value, right.value)` at the parent.  
   - **Time**: O(n).

3. **Range Query** (`query(ql, qr)`)  
   - If node’s `[L…R]` is completely outside `[ql…qr]`, return neutral element (0 for sum, +∞ for min, etc.).  
   - If completely inside, return node’s value.  
   - Otherwise, recurse on both children and merge their answers.  
   - **Time**: O(log n).

4. **Point Update** (`update(idx, Δ)`)  
   - Find the leaf for index `idx`.  
   - Update its stored value.  
   - Recurse back up, re-computing each parent’s merge.  
   - **Time**: O(log n).

---

## ⏱ Time & Space Complexity

| Operation      | Time       | Space         |
|----------------|------------|---------------|
| Build          | O(n)       | O(1) (aux.)   |
| Range Query    | O(log n)   | O(log n) (recursion) |
| Point Update   | O(log n)   | O(log n) (recursion) |
| **Overall**    | —          | O(4 n)        |

- **Space**: Represented in an array of size up to `4*n` to accommodate a non-power-of-two leaf count.

---

## ✅ Characteristics

### ➕ Advantages
- **Fast** range queries & updates in O(log n).  
- **Flexible**: support sum, min, max, gcd, bitwise ops, etc.  
- **Deterministic** performance.

### ➖ Disadvantages
- **Complex** to implement vs. Fenwick Tree.  
- **Higher** memory overhead (O(4 n)).  
- Recursive approach may need careful stack management.

---

## 🧭 When to Use

- You need **both** range queries and point (or range) updates.  
- Your array size is fixed and you want **online** (interleaved) queries & updates.  
- The query operation **associates** over subranges, allowing divide‐and‐conquer.

---

## 🔍 Typical Applications

- **Range sum** / **range minimum** / **range maximum** queries.  
- **Interval scheduling** & **resource allocation**.  
- **2D** segment trees for image processing or GIS.  
- **Lazy propagation** for efficient range updates.

---

## 🛠 Example: Range Sum & Point Update

```python
# Build, query and point-update on a zero-based array A of size n.

class SegmentTree:
    def __init__(self, A):
        self.n = len(A)
        self.st = [0] * (4 * self.n)
        self._build(1, 0, self.n - 1, A)

    def _build(self, node, l, r, A):
        if l == r:
            self.st[node] = A[l]
        else:
            m = (l + r) // 2
            self._build(2*node,   l,   m, A)
            self._build(2*node+1, m+1, r, A)
            self.st[node] = self.st[2*node] + self.st[2*node+1]

    def update(self, idx, delta):
        self._update(1, 0, self.n - 1, idx, delta)

    def _update(self, node, l, r, idx, delta):
        if l == r:
            self.st[node] += delta
        else:
            m = (l + r) // 2
            if idx <= m:
                self._update(2*node,   l,   m, idx, delta)
            else:
                self._update(2*node+1, m+1, r, idx, delta)
            self.st[node] = self.st[2*node] + self.st[2*node+1]

    def query(self, ql, qr):
        return self._query(1, 0, self.n - 1, ql, qr)

    def _query(self, node, l, r, ql, qr):
        if qr < l or r < ql:
            return 0
        if ql <= l and r <= qr:
            return self.st[node]
        m = (l + r) // 2
        return (self._query(2*node,   l,   m, ql, qr)
              + self._query(2*node+1, m+1, r, ql, qr))

# Usage
A = [1, 3, 5, 7, 9, 11]
st = SegmentTree(A)
print(st.query(1, 3))    # sum A[1..3] = 3+5+7 = 15
st.update(1, 100)        # A[1] += 100 → 103
print(st.query(1, 3))    # new sum = 103+5+7 = 115