# 최장 공통 부분 수열 / Longest Common Subsequence (LCS)

## 📌 Definition  
Given two strings **s₁** (length _m_) and **s₂** (length _n_), the **Longest Common Subsequence** is the longest sequence of characters that appears in both strings **in the same relative order**, but not necessarily contiguously.  
- If no characters match, the LCS length is 0.  

**Examples**  
- s₁ = `"AGGTAB"`, s₂ = `"GXTXAYB"` → LCS = `"GTAB"`, length = 4  
- s₁ = `"ABC"`,   s₂ = `"CBA"`     → LCS length = 1 (`"A"`, `"B"`, or `"C"`)

---

## 🧠 How It Works  

### 1. Memoization (Top-Down DP)  
```python
def lcs(s1, s2):
    m, n = len(s1), len(s2)
    memo = [[-1] * (n+1) for _ in range(m+1)]

    def dp(i, j):
        if i == 0 or j == 0:
            return 0
        if memo[i][j] != -1:
            return memo[i][j]
        if s1[i-1] == s2[j-1]:
            memo[i][j] = 1 + dp(i-1, j-1)
        else:
            memo[i][j] = max(dp(i-1, j), dp(i, j-1))
        return memo[i][j]

    return dp(m, n)
```
- **Time & Space**: O(m·n)

---

### 2. Bottom-Up DP (Tabulation)  
```python
def lcs(s1, s2):
    m, n = len(s1), len(s2)
    dp = [[0] * (n+1) for _ in range(m+1)]

    for i in range(1, m+1):
        for j in range(1, n+1):
            if s1[i-1] == s2[j-1]:
                dp[i][j] = dp[i-1][j-1] + 1
            else:
                dp[i][j] = max(dp[i-1][j], dp[i][j-1])
    return dp[m][n]
```
- **Time & Space**: O(m·n)

---

### 3. Space Optimized DP  
```python
def lcs(s1, s2):
    m, n = len(s1), len(s2)
    prev = [0] * (n+1)
    curr = [0] * (n+1)

    for i in range(1, m+1):
        for j in range(1, n+1):
            if s1[i-1] == s2[j-1]:
                curr[j] = prev[j-1] + 1
            else:
                curr[j] = max(prev[j], curr[j-1])
        prev, curr = curr, [0] * (n+1)

    return prev[n]
```
- **Time**: O(m·n), **Space**: O(n)

---

## ⏱ Time and Space Complexity

| Approach                  | Time          | Space           |
|---------------------------|---------------|------------------|
| Recursive (Naïve)         | O(2^min(m,n)) | O(min(m,n))      |
| Memoization (Top-Down DP) | O(m·n)        | O(m·n)           |
| Bottom-Up DP              | O(m·n)        | O(m·n)           |
| Space-Optimized DP        | O(m·n)        | O(n)             |

---

## ✅ Characteristics  

### ➕ Advantages  
- Optimal substructure and overlapping subproblems → suitable for DP  
- Finds the **exact** LCS length  
- Can reconstruct one of the actual subsequences  

### ➖ Disadvantages  
- High space/time for large inputs (e.g., m, n ≥ 10⁵)  
- Not applicable for contiguous substrings (see LCS vs. Longest Common Substring)  
- Tabulation method requires O(m·n) memory unless optimized

---

## 🧭 When to Use  
- Need to compare or align sequences in the same relative order  
- When solving problems involving:
  - Minimum insertions/deletions to match two sequences  
  - Edit distance  
  - Data deduplication  
  - Diff tools

---

## 🔍 Typical Applications  
- **Diff tools** (e.g., Unix `diff`, `git diff`)  
- **Version control**: Merging changes, patch generation  
- **Bioinformatics**: DNA/RNA/protein sequence alignment  
- **Plagiarism detection**  
- **File system comparison**  
- **Compiler construction**

---

## 🔗 Related Problems & Variants  
- Print the actual LCS  
- Shortest Common Supersequence  
- Edit Distance (Levenshtein Distance)  
- Longest Palindromic Subsequence  
- Minimum Insertions to make Palindrome  
- Longest Common Substring  
- Regular Expression Matching  