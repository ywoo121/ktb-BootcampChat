# 레드-블랙 트리 / Introduction to Red-Black Tree

## 📌 Definition
A **Red-Black Tree** is a self-balancing binary search tree in which each node carries an extra bit — its **color** (red or black) — and the tree enforces a set of properties that guarantee the path from root to leaves is always _O(log n)_ long. This ensures that search, insertion, and deletion all run in logarithmic time even in the worst case.

---

## 🧠 How It Works
1. **Node Colors & NIL Leaves**  
   - Every node is either **red** or **black**.  
   - All “null” children (leaf sentinels) are considered _black_.

2. **Balance Properties**  
   - **Root** is always black.  
   - **Red nodes** cannot have red children (no two reds in a row).  
   - Every path from a node to its descendant NILs contains the same number of black nodes (**black-depth**).

3. **Maintaining Balance**  
   - **Insertions**: Insert as in a BST, color the new node red, then fix any red-red violations by **recoloring** and/or **rotations** (left/right).  
   - **Deletions**: Delete as in a BST, then fix any “double-black” violations with a case analysis on the sibling’s color/children, again using recoloring and rotations.

4. **Rotations**  
   - **Left-rotate** and **right-rotate** local subtrees to restore properties while preserving the in-order sequence.

---

## ⏱ Time and Space Complexity

| Operation        | Worst-Case Time   | Space        |
|------------------|-------------------|--------------|
| Search           | O(log n)          | O(n) nodes   |
| Insert           | O(log n)          | +O(1) extra  |
| Delete           | O(log n)          | +O(1) extra  |

> _Space_ refers to the storage for the tree itself and a few auxiliary pointers per operation.

---

## ✅ Characteristics

- **Guaranteed Balance** via coloring and rotations  
- **Black-height** ensures no path is more than twice as long as any other  
- **Local fixes** (at most two rotations per insert/delete)

### ➕ Advantages
- **Stable O(log n)** performance for dynamic sets/maps  
- Fewer rotations on average than AVL trees during inserts/deletes  
- Widely used in libraries (e.g., C++ `std::map`, Java `TreeMap`)

### ➖ Disadvantages
- More complex to implement than AVL or Treaps  
- Slightly higher constant factors due to color checks and more cases  
- Not as strictly balanced as AVL, so slightly slower for purely read-heavy workloads

---

## 🧭 When to Use
- You need a _dynamic ordered set_ or _map_ with frequent inserts and deletes.  
- You require worst-case logarithmic guarantees (not just amortized).  
- You’re implementing a library or system where stable performance under adversarial input is critical.

---

## 🔍 Typical Applications
- **Associative arrays** / **ordered maps** / **sets**  
- **Multisets** and **multimaps**  
- **Priority scheduling** (e.g., Linux kernel’s CFS uses RBT)  
- **Event queues** in simulations or games  
- **In-memory databases** and **index structures**