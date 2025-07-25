# 해시 맵 / Hashing

## 📌 Definition

Hashing is a technique used to **store and retrieve data efficiently** using a **hash function** that maps keys to specific indices in a **hash table**. It enables **average-case O(1)** time complexity for insertion, deletion, and search operations.

---

## 🧠 How It Works

1. **Key** is input to a **hash function**.
2. The **hash function** maps the key to a numeric index (hash index).
3. The value is stored in a **hash table** at the computed index.
4. On retrieval, the same hash function is applied to quickly locate the data.

For example, mapping `"ab"` to index:
- `a = 1, b = 2 → sum = 3 → 3 mod 7 = index 3`

---

## 🧩 Components

- **Key**: The data item used for indexing (e.g., integer, string).
- **Hash Function**: Maps key → index in table.
- **Hash Table**: Array or bucket-based structure holding the actual data.

---

## ⏱ Time and Space Complexity

| Operation | Average Case | Worst Case |
|-----------|--------------|------------|
| Insert    | O(1)         | O(n)       |
| Search    | O(1)         | O(n)       |
| Delete    | O(1)         | O(n)       |

- **Auxiliary Space**: O(n) for table of size n

---

## 💥 Collisions

A **collision** occurs when two different keys hash to the same index.

### Example:
- `"ab"` and `"ba"` both → hash = 3 (e.g., sum of letters)

### Collision Resolution Techniques:
- **Chaining**: Use a list at each index to store multiple values.
- **Open Addressing**:
  - **Linear Probing**: Move linearly to next available slot.
  - **Quadratic Probing**: Use quadratic function for interval.
  - **Double Hashing**: Use second hash function for probe sequence.

---

## 📈 Load Factor and Rehashing

- **Load Factor** = Number of elements / Table size
- High load factor ⇒ more collisions ⇒ performance drops
- **Rehashing**: When load factor exceeds threshold (e.g., 0.75), resize table (usually double) and re-insert all elements.

---

## ✅ Advantages

- Fast average-time complexity (O(1)) for basic operations.
- Simple implementation using arrays.
- Used in many real-world systems (dictionaries, caches, symbol tables, databases).

---

## ❌ Disadvantages

- Poor hash function leads to collisions and degraded performance.
- Not suitable for ordered data or prefix-based searches.
- Uses extra space even if keys are sparse.

---

## 🧭 When to Use

- Need **constant-time** insert, search, and delete.
- Storing sets (unique keys) or maps (key-value pairs).
- Applications: Caches, frequency counting, lookup tables.

---

## 🔍 Related Topics

- **Set / Map** in Python, Java, C++
- **Trie** for prefix operations
- **Self-Balancing BSTs** for ordered maps
- **Bloom Filters** for space-efficient probabilistic hashing