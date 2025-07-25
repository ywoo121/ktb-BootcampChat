# 허프만 코딩 / Huffman Coding

## 📌 Definition

**Huffman Coding** is a **lossless data compression** algorithm that assigns **variable-length binary codes** to input characters based on their frequencies. Characters that occur more frequently are assigned shorter codes, resulting in efficient compression.  
The generated codes are **prefix codes**, meaning no code is a prefix of another, ensuring **unambiguous decoding**.

---

## 🧠 How It Works

### Step 1: Build Huffman Tree
1. Create a **min-heap** of nodes where each node represents a character and its frequency.
2. Extract the two nodes with the **lowest frequencies**.
3. Create a new **internal node** with their combined frequency, and set the two nodes as its children.
4. Repeat steps 2–3 until the heap contains only one node (the root of the Huffman Tree).

### Step 2: Generate Codes
- Traverse the tree from the root:
  - Append `'0'` when going left.
  - Append `'1'` when going right.
  - Assign code when reaching a leaf node (character).

---

## ⏱ Time and Space Complexity

| Operation         | Complexity     |
|------------------|----------------|
| Time             | O(n log n)     |
| Space            | O(n)           |

- `n` is the number of **unique characters**.

---

## ✅ Characteristics

### ➕ Advantages
- **Optimal** for prefix code-based compression (among greedy methods).
- **Lossless**: guarantees exact recovery of original data.
- Works well with **skewed frequency distributions** (i.e., when some characters occur far more often).

### ➖ Disadvantages
- Needs **frequency table** to be shared for decompression.
- Compression ratio not always better than other algorithms on small or balanced input.
- Inefficient if symbol probabilities are nearly uniform (e.g., for encrypted data).

---

## 🧭 When to Use

- When characters or symbols have **varying frequencies**.
- When a **prefix-free, binary encoding** is acceptable.
- When **lossless compression** is required (e.g., text, logs, structured data).

---

## 🔍 Typical Applications

- **Data compression** utilities like **GZIP**, **PKZIP**.
- **Multimedia formats** such as **JPEG**, **PNG**, **MP3**.
- **Fax and modem transmission**.
- **Canonical Huffman Encoding** in standard compression libraries.
- Efficient **prefix-free encoding** in compiler/interpreter implementations.

---

## 🧪 Example

### Input:
Characters: `['a', 'b', 'c', 'd', 'e', 'f']`  
Frequencies: `[5, 9, 12, 13, 16, 45]`

### Output Huffman Codes:
```
f : 0
c : 100
d : 101
a : 1100
b : 1101
e : 111
```

---

## 🧾 Python Snippet

```python
import heapq

class Node:
    def __init__(self, freq):
        self.data = freq
        self.left = None
        self.right = None

    def __lt__(self, other):
        return self.data < other.data

def preOrder(root, ans, curr):
    if root is None:
        return
    if root.left is None and root.right is None:
        ans.append(curr)
        return
    preOrder(root.left, ans, curr + '0')
    preOrder(root.right, ans, curr + '1')

def huffmanCodes(freq):
    pq = [Node(f) for f in freq]
    heapq.heapify(pq)

    while len(pq) > 1:
        l = heapq.heappop(pq)
        r = heapq.heappop(pq)
        merged = Node(l.data + r.data)
        merged.left = l
        merged.right = r
        heapq.heappush(pq, merged)

    root = pq[0]
    codes = []
    preOrder(root, codes, "")
    return codes

# Example
freq = [5, 9, 12, 13, 16, 45]
codes = huffmanCodes(freq)
print(codes)  # ['1100', '1101', '100', '101', '111', '0']
```

---
