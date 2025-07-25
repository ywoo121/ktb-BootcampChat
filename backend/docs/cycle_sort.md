# 사이클 정렬 / Cycle Sort

## 📌 Definition

Cycle Sort is an in-place, unstable sorting algorithm that minimizes the number of memory writes. It is particularly optimal when writes are expensive, such as in EEPROM or flash memory. It was developed by W. D. Jones and introduced in 1963.

---

## 🧠 How It Works

1. Divide the array into **cycles**, where each cycle places elements into their correct sorted position.
2. For each cycle:
   - Identify the correct position for the current element.
   - If the element is not already in the correct position, swap it.
   - Continue rotating the cycle until all involved elements are correctly placed.
3. Repeat until all cycles are resolved.

This results in each element being moved directly to its final position with minimal writes.

---

## ⏱ Time and Space Complexity

| Case         | Time Complexity |
|--------------|-----------------|
| Best Case    | O(n²)           |
| Average Case | O(n²)           |
| Worst Case   | O(n²)           |

- **Auxiliary Space**: O(1) (in-place)

---

## ✅ Characteristics

### ➕ Advantages
- **Minimizes memory writes** — each element is written at most once.
- **In-place** — no extra space required.
- Good for memory-limited systems or write-sensitive environments.

### ➖ Disadvantages
- Not stable (relative order of equal elements not preserved).
- Time complexity is high (O(n²)) for large datasets.
- Rarely used in practice outside of memory-constrained scenarios.

---

## 🛠 When to Use

- When write operations are **costly or limited**.
- For **embedded systems**, flash memory, EEPROM, etc.
- When minimizing memory writes is more important than speed.

---

## 🔍 Related Topics

- **Cycle detection in arrays** (graph-based analogy of cycles).
- Comparison with in-place sorts like Selection Sort.
- Memory optimization in sorting algorithms.