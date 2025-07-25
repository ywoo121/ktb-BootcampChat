# 퀵 정렬 / Quick Sort

## 📌 Definition

**Quick Sort** is an efficient, comparison-based, divide-and-conquer sorting algorithm. It works by selecting a **pivot element** and partitioning the array around that pivot, such that all elements smaller than the pivot are placed to its left and all greater elements to its right. This process is applied recursively to the subarrays.

---

## 🧠 How It Works

1. **Choose a Pivot**:
   - Common strategies: first element, last element, random element, or median.
   - Most implementations choose the **last element**.

2. **Partition the Array**:
   - Rearrange elements so that:
     - Left side < pivot
     - Right side ≥ pivot
   - Return the index where the pivot finally lands.

3. **Recursively Apply**:
   - Apply the same logic to subarrays to the left and right of the pivot.

4. **Base Case**:
   - When a subarray has 1 or 0 elements, it's already sorted.

---

## ⏱ Time and Space Complexity

| Case         | Time Complexity |
|--------------|-----------------|
| Best Case    | O(n log n)      |
| Average Case | O(n log n)      |
| Worst Case   | O(n²)           |

- **Auxiliary Space**: O(log n) average (due to recursion), worst case O(n)

> Worst case occurs when the pivot always ends up as the smallest or largest element (e.g., already sorted array and picking first/last as pivot).

---

## ✅ Characteristics

### ➕ Advantages
- **Efficient** for large datasets.
- **Cache-friendly**, works in-place.
- **Low overhead**, no extra arrays required.
- Can be **tail-recursive** for optimization.

### ➖ Disadvantages
- Not **stable** (doesn't preserve order of equal elements).
- Worst-case time complexity is **O(n²)**.
- May not perform well on small datasets compared to Insertion Sort.

---

## 🛠 When to Use

- When fast average-case performance is crucial.
- When space usage needs to be minimized (in-place sort).
- When data does **not require stability**.

---

## 🔍 Related Topics

- **Merge Sort** – Stable, but more memory usage.
- **Heap Sort** – In-place and guaranteed O(n log n), but slower in practice.
- **Tail Recursion** – Optimizations possible in Quick Sort.
- **Hoare vs Lomuto Partition** – Different partitioning strategies.
