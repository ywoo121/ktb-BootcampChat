# 삽입 정렬 / Insertion Sort

## 📌 Definition

**Insertion Sort** is a simple, comparison-based, in-place, and stable sorting algorithm. It builds the final sorted array one element at a time by comparing each new element with those already sorted and inserting it into its correct position — similar to how people sort playing cards by hand.

---

## 🧠 How It Works

1. Start from the second element; assume the first element is already sorted.
2. Pick the current element and compare it with elements in the sorted portion to its left.
3. Shift elements that are greater than the current element one position to the right.
4. Insert the current element into the correct position.
5. Repeat until the end of the array is reached.

### 🃏 Example Analogy

Think of sorting cards in your hand: you pick a card and insert it in the correct spot among the sorted cards.

---

## ⏱ Time and Space Complexity

| Case         | Time Complexity |
|--------------|-----------------|
| Best Case    | O(n)            |
| Average Case | O(n²)           |
| Worst Case   | O(n²)           |

- **Auxiliary Space**: O(1) (in-place)

---

## ✅ Characteristics

### ➕ Advantages
- Simple and easy to understand.
- **Stable**: maintains relative order of equal elements.
- **In-place**: requires no additional memory.
- **Adaptive**: performs well on nearly sorted data.
- Used in hybrid sorting algorithms (e.g., TimSort, IntroSort) for small arrays.

### ➖ Disadvantages
- **Inefficient for large datasets** due to O(n²) time complexity.
- Performs many swaps and comparisons in worst-case scenarios (e.g., reverse order).

---

## 🛠 When to Use

- The array is **small** or **nearly sorted**.
- You require a **stable** and **in-place** sorting method.
- As a **subroutine** in other algorithms like Bucket Sort, TimSort, and IntroSort.

---

## 🔍 Related Topics

- Bubble Sort (similar concept but less efficient)
- Hybrid Algorithms: TimSort, IntroSort
- Stable Sorting
- Adaptive Sorting