# 이분 탐색 / Binary Search

## 📌 Definition

Binary Search is an efficient search algorithm used on sorted arrays.  
It works by repeatedly dividing the search space in half and comparing the middle element with the target.  
If the target matches the middle element, the index is returned. Otherwise, the search continues in the left or right half depending on the comparison.

This technique drastically reduces the time complexity compared to linear search.

---

## 🧠 How It Works

1. Start with the full search interval [low, high].
2. Calculate the middle index: `mid = (low + high) // 2`.
3. Compare the middle element `arr[mid]` with the target:
   - If equal: return `mid`.
   - If target < arr[mid]: repeat on the left half.
   - If target > arr[mid]: repeat on the right half.
4. Repeat until the element is found or the search space is exhausted.

**Variants**:
- Iterative implementation
- Recursive implementation

---

## ⏱ Time and Space Complexity

| Case         | Time Complexity |
|--------------|------------------|
| Best Case    | O(1)             |
| Average Case | O(log n)         |
| Worst Case   | O(log n)         |

- **Auxiliary Space**:  
  - Iterative: O(1)  
  - Recursive: O(log n) (due to call stack)

---

## ✅ Characteristics

### ➕ Advantages
- Much faster than linear search for large sorted datasets.
- Simple logic with logarithmic performance.
- Widely used in system-level applications and optimized libraries.

### ➖ Disadvantages
- Only applicable to sorted collections.
- Requires random access structure (e.g., arrays).
- Recursive version uses extra stack space.

---

## 🧭 When to Use

- The dataset is sorted in advance.
- You need fast search over large datasets.
- Random access to elements is available.

---

## 🔍 Typical Applications

- Searching in sorted arrays or files.
- Finding square roots, boundaries, frequency counts, etc.
- Used as a subroutine in:
  - Rotated array search
  - Peak element problems
  - Binary Search on the answer (e.g., minimum/max value problems)