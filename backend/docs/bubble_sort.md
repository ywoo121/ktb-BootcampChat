# 버블 정렬 / Bubble Sort

## 📌 Definition

Bubble Sort is one of the simplest comparison-based sorting algorithms.  
It works by repeatedly comparing and swapping adjacent elements if they are in the wrong order.  
After each pass, the largest unsorted element "bubbles up" to its correct position at the end of the array.

---

## 🧠 How It Works

1. Iterate over the array multiple times.
2. On each pass, compare adjacent elements.
3. Swap them if they are in the wrong order.
4. After each full pass, the next largest element is placed correctly.
5. Continue until no swaps are needed.

**Optimization**:  
If no swaps occur during a pass, the array is already sorted, and the algorithm can stop early.

---

## ⏱ Time and Space Complexity

| Case         | Time Complexity |
|--------------|------------------|
| Best Case    | O(n)             |
| Average Case | O(n²)            |
| Worst Case   | O(n²)            |

- **Auxiliary Space**: O(1)

---

## ✅ Characteristics

### ➕ Advantages
- Very easy to implement and understand.
- Requires no extra space (in-place sort).
- Stable sort: maintains relative order of equal elements.

### ➖ Disadvantages
- Poor performance for large datasets due to quadratic time complexity.
- Rarely used in practical applications.

---

## 🧭 When to Use

- When simplicity of implementation is more important than performance.
- In educational settings to demonstrate basic sorting logic.

---

## 🔍 Related Topics

- Comparison-Based Sorting
- Stable vs. Unstable Sorting
- Optimized vs. Unoptimized Bubble Sort