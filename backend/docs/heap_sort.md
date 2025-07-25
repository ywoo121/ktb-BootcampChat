# 힙 정렬 / Heap Sort

## 📌 Definition

Heap Sort is a comparison-based, in-place sorting algorithm that uses a **Binary Heap** data structure. It improves on selection sort by using a heap to find the maximum (or minimum) element more efficiently. The key idea is to first build a max-heap and then extract the maximum element one by one to sort the array.

---

## 🧠 How It Works

1. **Build a Max Heap** from the input array.
2. Repeat until the heap is reduced to one element:
   - Swap the root (largest) element with the last element of the heap.
   - Reduce the heap size by one.
   - Heapify the root to maintain the max heap property.
3. After all iterations, the array becomes sorted in ascending order.

This approach allows maximum element selection in `O(log n)` time, enabling an overall `O(n log n)` complexity.

---

## ⏱ Time and Space Complexity

| Case         | Time Complexity |
|--------------|-----------------|
| Best Case    | O(n log n)      |
| Average Case | O(n log n)      |
| Worst Case   | O(n log n)      |

- **Auxiliary Space**:  
  - Recursive Heapify: O(log n)  
  - Iterative Heapify: O(1) (in-place)

---

## ✅ Characteristics

### ➕ Advantages
- **Efficient** for large data: consistent `O(n log n)` performance.
- **In-place**: requires only a constant amount of additional space.
- **Simple to implement** compared to QuickSort or MergeSort.

### ➖ Disadvantages
- **Not stable**: the relative order of equal elements may change.
- **Poor locality of reference**: tends to be slower in practice than QuickSort.
- **Higher constant factors** than some other O(n log n) algorithms.

---

## 🛠 When to Use

- When consistent performance is needed across all input types.
- When **in-place** sorting is a requirement.
- For teaching purposes or scenarios where recursion is undesirable.

---

## 🔍 Related Topics

- Binary Heap (used internally)
- Priority Queues
- Selection Sort (conceptually similar)
- In-place sorting algorithms