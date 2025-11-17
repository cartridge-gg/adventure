#!/usr/bin/env python3
"""Test randomness quality using token_id directly as seed (no scalar)"""

def lcg_next(seed):
    """Linear Congruential Generator"""
    a = 1103515245
    c = 12345
    m = 2147483648  # 2^31
    return (a * seed + c) % m

def generate_level_assignments(token_id, total_levels):
    """Generate level assignments using Fisher-Yates shuffle"""
    vertices = list(range(total_levels))

    # Use token_id with 5786 scalar multiplier
    seed = token_id * 5786

    # Fisher-Yates shuffle
    for i in range(total_levels - 1, 0, -1):
        seed = lcg_next(seed)
        j = seed % (i + 1)
        vertices[i], vertices[j] = vertices[j], vertices[i]

    return vertices

def hamming_distance(seq1, seq2):
    """Count positions where sequences differ"""
    return sum(a != b for a, b in zip(seq1, seq2))

# Test parameters
NUM_TOKENS = 50
TOTAL_LEVELS = 6

print("=" * 70)
print("RANDOMNESS TEST: Using token_id * 5786")
print("=" * 70)
print(f"\nTesting {NUM_TOKENS} tokens with {TOTAL_LEVELS} levels each\n")

# Generate paths for all tokens
paths = {}
for token_id in range(1, NUM_TOKENS + 1):
    path = generate_level_assignments(token_id, TOTAL_LEVELS)
    paths[token_id] = tuple(path)

# Check for collisions
unique_paths = len(set(paths.values()))
collision_rate = (1 - unique_paths / NUM_TOKENS) * 100

print(f"Total tokens:  {NUM_TOKENS}")
print(f"Unique paths:  {unique_paths}")
print(f"Collision rate: {collision_rate:.1f}%")

if unique_paths < NUM_TOKENS:
    print(f"\n⚠️  WARNING: Found {NUM_TOKENS - unique_paths} duplicate paths:")
    seen = {}
    for token_id, path in paths.items():
        if path in seen:
            path_str = '->'.join(map(str, path))
            print(f"  Token #{seen[path]} == Token #{token_id}: {path_str}")
        else:
            seen[path] = token_id
else:
    print(f"\n✅ SUCCESS: All {NUM_TOKENS} tokens have unique paths!")

# Calculate average Hamming distance between consecutive tokens
hamming_distances = []
for i in range(1, NUM_TOKENS):
    dist = hamming_distance(paths[i], paths[i + 1])
    hamming_distances.append(dist)

avg_hamming = sum(hamming_distances) / len(hamming_distances)
print(f"\nAverage Hamming distance between consecutive tokens: {avg_hamming:.2f}/{TOTAL_LEVELS}")
print(f"(Higher is better - indicates good mixing)")

# Show first 10 paths as examples
print(f"\nFirst 10 paths:")
for token_id in range(1, 11):
    path_str = '->'.join(map(str, paths[token_id]))
    print(f"  Token #{token_id}: {path_str}")

print("\n" + "=" * 70)
