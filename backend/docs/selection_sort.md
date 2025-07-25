# 선택 정렬 / Selection Sort

## 📌 Definition

Selection Sort is a comparison-based sorting algorithm that repeatedly selects the smallest (or largest) element from the unsorted portion of the array and swaps it with the first unsorted element. It gradually builds a sorted portion from left to right.

---

## 🧠 How It Works

1. Start from the first element and assume it is the minimum.
2. Scan the rest of the array to find the actual minimum element.
3. Swap the minimum element with the first unsorted element.
4. Move to the next unsorted element and repeat the process.
5. Continue until the array is completely sorted.

---

## ⏱ Time and Space Complexity

| Case         | Time Complexity |
|--------------|-----------------|
| Best Case    | O(n²)           |
| Average Case | O(n²)           |
| Worst Case   | O(n²)           |

- **Auxiliary Space**: O(1)  
  (In-place sort: no extra memory is used except for temporary swap variable.)

---

## ✅ Characteristics

### ➕ Advantages
- Very simple to understand and implement.
- Requires only O(1) extra space.
- Performs the **minimum number of swaps**, which is useful when memory writes are expensive.
- Deterministic: behaves consistently regardless of input.

### ➖ Disadvantages
- Inefficient for large datasets due to its O(n²) time complexity.
- **Not stable** — equal elements may change relative order.

---

## 🧭 When to Use

- For small datasets or when code simplicity is more important than speed.
- When the cost of memory writes/swaps is high (e.g., in EEPROM or flash memory).
- In educational contexts to demonstrate sorting concepts.

---

## 🔍 Related Topics

- Bubble Sort (simpler but less swap-efficient)
- Insertion Sort (better for nearly-sorted arrays)
- Heap Sort (selection-based but optimized with binary heap)
- Cycle Sort (minimizes writes even more than Selection Sort)