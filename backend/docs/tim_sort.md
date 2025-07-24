# 팀 정렬 / Tim Sort

## 📌 Definition

Tim Sort is a hybrid stable sorting algorithm derived from **Merge Sort** and **Insertion Sort**. It was designed to perform efficiently on real-world data and is the default sorting algorithm in Python (`list.sort()` and `sorted()`).

---

## 🧠 How It Works

1. **Divide** the array into small subarrays called **runs**.
2. Sort each run using **Insertion Sort** (efficient for small or nearly sorted segments).
3. Merge the sorted runs using an optimized **Merge Sort**.
4. Gradually double the run size and repeat merging until the array is fully sorted.

Tim Sort exploits existing order in the data and minimizes memory writes, comparisons, and swaps.

---

## ⏱ Time and Space Complexity

| Case         | Time Complexity |
|--------------|-----------------|
| Best Case    | O(n)            |
| Average Case | O(n log n)      |
| Worst Case   | O(n log n)      |

- **Auxiliary Space**: O(n)
- **Stable**: ✅ Yes
- **In-place**: ❌ No (uses temporary arrays for merging)

---

## ✅ Characteristics

### ➕ Advantages
- Very **fast** for real-world data due to combining insertion and merge sort.
- **Stable sort**: maintains order of equal elements.
- **Optimized for partially sorted data**.
- Used as the **default sorting** algorithm in Python and Java (for objects).

### ➖ Disadvantages
- Not in-place (requires O(n) extra space).
- Slightly **more complex** than simpler algorithms like Quick Sort or Merge Sort.

---

## 🧭 When to Use

- Built-in sorting in Python or Java for general-purpose needs.
- When **stability is required** (e.g., sorting by multiple keys).
- For **large datasets** that may already have partial order.
- In hybrid sorting algorithms like **IntroSort** or **TimSort** (used in real-world systems).

---

## 🔍 Related Topics

- Merge Sort (used for merging runs)
- Insertion Sort (used for sorting small runs)
- IntroSort (another hybrid sort used in C++ STL)
- Real-world sorting algorithms (Java, Python standard library)