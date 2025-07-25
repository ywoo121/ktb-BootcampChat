# 기수 정렬 / Radix Sort

## 📌 Definition

Radix Sort is a non-comparative, linear-time sorting algorithm that processes digits of numbers from the least significant digit (LSD) to the most significant digit (MSD). It works well for sorting integers or fixed-length strings, leveraging digit place values and bucket-based distribution.

---

## 🧠 How It Works

1. Determine the maximum number of digits (d) in the largest element.
2. Starting from the least significant digit, perform a **stable sort** (typically Counting Sort) based on the current digit.
3. Repeat the sorting process for each digit position (unit, tens, hundreds, ...).
4. After d iterations, the array will be fully sorted.

---

## ⏱ Time and Space Complexity

| Case         | Time Complexity      |
|--------------|----------------------|
| Best Case    | O(d * (n + b))       |
| Average Case | O(d * (n + b))       |
| Worst Case   | O(d * (n + b))       |

- **n**: number of elements  
- **d**: number of digits  
- **b**: base (e.g., 10 for decimal)

- **Auxiliary Space**: O(n + b)

---

## ✅ Characteristics

### ➕ Advantages
- Faster than comparison-based sorts (e.g., Quick Sort) for large keys with many digits.
- Stable sorting algorithm.
- Can outperform O(n log n) sorts in specific numeric cases.

### ➖ Disadvantages
- Not in-place (requires extra space).
- Limited to integer or fixed-size string keys.
- Performance depends on key length and base.

---

## 🧭 When to Use

- Sorting integers or fixed-length strings with known digit limits.
- Datasets with large volume and small key range.
- As a component of more complex sorting algorithms (e.g., radix-based bucket sort).

---

## 🔍 Related Topics

- Counting Sort (used as a subroutine)
- Bucket Sort
- LSD vs MSD Radix Sort