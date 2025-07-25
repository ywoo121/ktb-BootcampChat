# 버킷 정렬 / Bucket Sort

## 📌 Definition

Bucket Sort is a sorting algorithm that distributes the elements of an array into a number of buckets. Each bucket is then sorted individually, either using another sorting algorithm or by recursively applying the bucket sort.

---

## 🧠 How It Works

1. **Initialization**:
   - Create `n` empty buckets (lists).

2. **Distribution**:
   - Iterate over the input array.
   - Use a hash function or scaling to assign each element to an appropriate bucket.
   - Example: `bucket_index = int(n * element_value)` (for elements in [0, 1)).

3. **Sorting Buckets**:
   - Sort each bucket individually.
   - Often insertion sort is used, but any stable sorting algorithm is applicable.

4. **Concatenation**:
   - Concatenate all buckets in order to get the final sorted array.

---

## ⏱ Time and Space Complexity

| Case         | Time Complexity     |
|--------------|---------------------|
| Best Case    | O(n + k)            |
| Average Case | O(n + k)            |
| Worst Case   | O(n²)               |

- **Auxiliary Space**: O(n + k)  
  Where `k` is the number of buckets.

---

## ✅ Characteristics

### ➕ Advantages
- Efficient for uniformly distributed data.
- Can be faster than comparison-based sorts in specific cases.
- Simple conceptually and easy to implement with stable sorting.

### ➖ Disadvantages
- Performance depends on the distribution of input.
- Poor choice for data that is not uniformly distributed.
- Requires extra space for buckets.

---

## 🧭 When to Use

- When the input is uniformly distributed over a known range.
- For floating-point numbers in the range [0, 1).
- When the input is large but evenly spread, and auxiliary memory is acceptable.

---

## 🔍 Related Topics

- Distribution Sorting
- Insertion Sort (used internally)
- Radix Sort and Counting Sort (related non-comparison sorts)