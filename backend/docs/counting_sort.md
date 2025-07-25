# 계수 정렬 / Counting Sort

## 📌 Definition

Counting Sort is a non-comparison-based sorting algorithm that sorts elements by counting the occurrences of each unique value. It is most effective when the range of input values is relatively small compared to the number of elements.

---

## 🧠 How It Works

1. **Find the maximum element** in the input array to determine the range.
2. **Initialize a count array** of size `(max + 1)` with all zeroes.
3. **Count the occurrences** of each element in the input array and store in the count array.
4. **Calculate the prefix sum** of the count array to determine the correct position of each element.
5. **Traverse the input array in reverse** and use the count array to place each element in the output array.
6. **Return the output array**, which will be sorted.

This algorithm maintains **stability** by traversing from the end of the input array, preserving the relative order of equal elements.

---

## ⏱ Time and Space Complexity

| Case         | Time Complexity   |
|--------------|-------------------|
| Best Case    | O(N + M)          |
| Average Case | O(N + M)          |
| Worst Case   | O(N + M)          |

- **N**: number of elements in the input array  
- **M**: range of input (max value)

- **Auxiliary Space**: O(N + M)

---

## ✅ Characteristics

### ➕ Advantages
- Faster than comparison-based sorts (e.g., Merge/Quick Sort) for small ranges.
- Stable sort.
- Simple to implement.

### ➖ Disadvantages
- Not efficient for large ranges of values.
- Not in-place (requires extra space).
- Cannot sort floating-point numbers or negative values directly.

---

## 🧭 When to Use

- When the range of input values is not significantly larger than the number of elements.
- For datasets like grades, small integers, dates, etc.
- As a **subroutine in Radix Sort** or **Bucket Sort**.

---

## 🔍 Related Topics

- Radix Sort (uses Counting Sort as a subroutine)
- Bucket Sort (related technique)
- Prefix Sum (used to determine placement in output array)