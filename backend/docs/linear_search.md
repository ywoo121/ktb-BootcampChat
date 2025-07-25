# 선형 탐색 / Linear Search

## 📌 Definition

Linear Search (also known as Sequential Search) is a basic searching algorithm used to find the position of a target element within an array or list. It works by scanning each element in the array sequentially until the desired element is found or the end of the array is reached.

It is most commonly used for unsorted arrays, as it does not require any assumptions about the data structure.

---

## 🧠 How It Works

1. Start from the first element of the array.
2. Compare the current element with the target.
3. If they match, return the index.
4. If not, move to the next element.
5. If the end of the array is reached without a match, return -1.

This algorithm does not skip any elements and performs a one-by-one comparison.

---

## ⏱ Time and Space Complexity

| Case         | Time Complexity |
|--------------|------------------|
| Best Case    | O(1)             |
| Average Case | O(n)             |
| Worst Case   | O(n)             |

- **Auxiliary Space**: O(1) — No extra space is used aside from a few variables.

---

## ✅ Characteristics

### ➕ Advantages
- Works on both sorted and unsorted data.
- Easy to implement and understand.
- No additional memory required.
- Can be used on various data structures (arrays, linked lists, etc).

### ➖ Disadvantages
- Inefficient for large datasets.
- Linear time complexity makes it slower compared to binary search on sorted data.

---

## 🧭 When to Use

- The dataset is small.
- The data is unsorted.
- Simplicity and quick implementation are prioritized over performance.
- The structure is not array-based (e.g., linked list), where random access is not feasible.