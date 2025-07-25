# 병합 정렬 / Merge Sort

## 📌 Definition

**Merge Sort** is a stable, comparison-based sorting algorithm that follows the **Divide and Conquer** paradigm. It works by recursively splitting an array into halves, sorting each half, and then merging the sorted halves to produce a fully sorted array.

---

## 🧠 How It Works

1. **Divide**: Recursively split the array into two halves until each subarray contains only one element.
2. **Conquer**: Recursively sort each half using Merge Sort.
3. **Merge**: Combine the sorted halves into a single sorted array using a merge operation.

### 🧩 Example

Sorting `[38, 27, 43, 10]`:
- Divide → `[38, 27]` and `[43, 10]`
- Divide again → `[38]`, `[27]`, `[43]`, `[10]`
- Merge → `[27, 38]`, `[10, 43]`
- Merge final → `[10, 27, 38, 43]`

---

## ⏱ Time and Space Complexity

| Case         | Time Complexity |
|--------------|-----------------|
| Best Case    | O(n log n)      |
| Average Case | O(n log n)      |
| Worst Case   | O(n log n)      |

- **Auxiliary Space**: O(n) (due to use of temporary arrays during merge)

### 📐 Recurrence Relation

T(n) = 2T(n/2) + Θ(n)  
(divide the array into two, then merge them in linear time)

---

## ✅ Characteristics

### ➕ Advantages
- **Stable**: Maintains order of equal elements.
- **Guaranteed Performance**: Always O(n log n), regardless of input order.
- **Parallelizable**: Each half can be sorted independently.
- **Preferred for Linked Lists**: No need for random access, unlike Quick Sort.

### ➖ Disadvantages
- **Not In-Place**: Requires O(n) additional memory.
- **Slower in Practice**: Due to extra memory and recursive overhead, it’s usually slower than QuickSort for in-memory arrays.
- **Cache Inefficient**: Does not benefit as much from CPU cache as in-place sorts.

---

## 🛠 When to Use

- When stable sort is required.
- For **large datasets** or when worst-case performance guarantees are needed.
- In external sorting (e.g., files larger than RAM).
- When sorting linked lists (pointer manipulation rather than shifting).

---

## 🔍 Related Topics

- **Quick Sort** – faster in practice but not stable.
- **TimSort** – hybrid of Merge + Insertion Sort, used in Python and Java.
- **Divide and Conquer** – algorithmic paradigm used by Merge Sort.
- **Inversion Count** – can be computed during merge step.
- **External Sorting** – merge sort is optimal for disk-based sorting.