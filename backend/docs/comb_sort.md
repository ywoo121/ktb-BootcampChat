# 콤 정렬 / Comb Sort

## 📌 Definition

Comb Sort is an improved version of Bubble Sort. It works by comparing elements with a gap, which initially starts large and shrinks by a fixed factor (typically 1.3) each pass, until the gap becomes 1. This method helps eliminate more inversions earlier and increases efficiency over Bubble Sort.

---

## 🧠 How It Works

1. Initialize the gap as the length of the array.
2. On each iteration:
   - Reduce the gap by the shrink factor (commonly 1.3).
   - Compare elements at each index `i` and `i + gap`, swapping them if out of order.
3. Repeat the process until the gap becomes 1 and no swaps occur in a full pass (similar to optimized Bubble Sort termination).

---

## ⏱ Time and Space Complexity

| Case         | Time Complexity              |
|--------------|-------------------------------|
| Best Case    | O(n log n)                    |
| Average Case | Ω(n² / 2^p) (empirical)       |
| Worst Case   | O(n²)                         |

- **Auxiliary Space**: O(1)

---

## ✅ Characteristics

### ➕ Advantages
- Faster than Bubble Sort due to wider initial comparisons.
- Simple to implement.
- In-place sort (no extra space needed).

### ➖ Disadvantages
- Still inefficient for large datasets compared to efficient sorts like Merge Sort or Quick Sort.
- Worst-case remains O(n²), same as Bubble Sort.

---

## 🧭 When to Use

- Educational purposes to understand sorting improvements.
- Cases where simplicity is preferred and dataset size is moderate.
- When Bubble Sort is already implemented and minor improvement is needed without major redesign.

---

## 🔍 Related Topics

- Bubble Sort (as Comb Sort is derived from it)
- Shrink factor tuning
- Optimization of simple sorts