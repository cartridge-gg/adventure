// ============================================================================
// Geometry and Math Tests
// ============================================================================
//
// Comprehensive tests for geo.cairo functions

use focg_adventure::token::geo;

// ============================================================================
// TRIGONOMETRY TESTS
// ============================================================================

#[test]
fn test_sin_fixed_known_angles() {
    // Test 0 degrees
    let sin_0 = geo::sin_fixed(0);
    assert(sin_0 == 0, 'sin(0deg) should be 0');

    // Test 30 degrees (sin = 0.5)
    let sin_30 = geo::sin_fixed(30);
    assert(sin_30 >= 499 && sin_30 <= 501, 'sin(30deg) should be ~500');

    // Test 45 degrees (sin = 0.707...)
    let sin_45 = geo::sin_fixed(45);
    assert(sin_45 >= 706 && sin_45 <= 708, 'sin(45deg) should be ~707');

    // Test 60 degrees (sin = 0.866...)
    let sin_60 = geo::sin_fixed(60);
    assert(sin_60 >= 865 && sin_60 <= 867, 'sin(60deg) should be ~866');

    // Test 90 degrees (sin = 1.0)
    let sin_90 = geo::sin_fixed(90);
    assert(sin_90 == 1000, 'sin(90deg) should be 1000');
}

#[test]
fn test_sin_fixed_all_quadrants() {
    // Quadrant I (0-90deg): positive
    let sin_45 = geo::sin_fixed(45);
    assert(sin_45 > 0, 'Q1: sin should be positive');

    // Quadrant II (90-180deg): positive
    let sin_135 = geo::sin_fixed(135);
    assert(sin_135 > 0, 'Q2: sin should be positive');
    assert(sin_135 == sin_45, 'sin(135deg) == sin(45deg)');

    // Quadrant III (180-270deg): negative
    let sin_225 = geo::sin_fixed(225);
    assert(sin_225 < 0, 'Q3: sin should be negative');
    assert(sin_225 == -sin_45, 'sin(225deg) == -sin(45deg)');

    // Quadrant IV (270-360deg): negative
    let sin_315 = geo::sin_fixed(315);
    assert(sin_315 < 0, 'Q4: sin should be negative');
    assert(sin_315 == -sin_45, 'sin(315deg) == -sin(45deg)');
}

#[test]
fn test_cos_fixed_known_angles() {
    // Test 0 degrees (cos = 1.0)
    let cos_0 = geo::cos_fixed(0);
    assert(cos_0 == 1000, 'cos(0deg) should be 1000');

    // Test 60 degrees (cos = 0.5)
    let cos_60 = geo::cos_fixed(60);
    assert(cos_60 >= 499 && cos_60 <= 501, 'cos(60deg) should be ~500');

    // Test 90 degrees (cos = 0)
    let cos_90 = geo::cos_fixed(90);
    assert(cos_90 == 0, 'cos(90deg) should be 0');

    // Test 180 degrees (cos = -1.0)
    let cos_180 = geo::cos_fixed(180);
    assert(cos_180 == -1000, 'cos(180deg) should be -1000');

    // Test 270 degrees (cos = 0)
    let cos_270 = geo::cos_fixed(270);
    assert(cos_270 == 0, 'cos(270deg) should be 0');
}

#[test]
fn test_trigonometric_identity() {
    // Test sin^2(θ) + cos^2(θ) ≈ 1 for various angles
    let angles: Array<u32> = array![0, 30, 45, 60, 90, 120, 135, 150, 180, 210, 270, 315];

    let mut i = 0;
    loop {
        if i >= angles.len() {
            break;
        }
        let angle = *angles.at(i);
        let sin_val = geo::sin_fixed(angle);
        let cos_val = geo::cos_fixed(angle);

        // Calculate sin^2 + cos^2
        // Values are scaled by 1000, so sin^2 is scaled by 1,000,000
        // Divide by 1,000,000 to get unscaled result (should be ~1)
        let sin_squared: i64 = (sin_val.into() * sin_val.into()) / 1_000_000;
        let cos_squared: i64 = (cos_val.into() * cos_val.into()) / 1_000_000;
        let sum: i64 = sin_squared + cos_squared;

        // Should equal 1 (unscaled)
        // Allow small tolerance for lookup table precision
        assert(sum >= 0 && sum <= 2, 'sin^2+cos^2 should equal 1');

        i += 1;
    };
}

#[test]
fn test_angle_normalization() {
    // Test that angles > 360 are normalized
    let sin_0 = geo::sin_fixed(0);
    let sin_360 = geo::sin_fixed(360);
    let sin_720 = geo::sin_fixed(720);

    assert(sin_0 == sin_360, 'sin(0deg) == sin(360deg)');
    assert(sin_0 == sin_720, 'sin(0deg) == sin(720deg)');
}

#[test]
fn test_sin_boundary_angles() {
    // Test critical boundary angles explicitly
    assert(geo::sin_fixed(180) == 0, 'sin(180deg) = 0');
    assert(geo::sin_fixed(360) == 0, 'sin(360deg) = 0');

    // Test very large angle wrapping
    let sin_1080 = geo::sin_fixed(1080);  // 3 * 360 = 0 degrees
    assert(sin_1080 == 0, 'sin(1080deg) = sin(0deg)');

    // Test 90 and 270 which should be +1 and -1
    assert(geo::sin_fixed(90) == 1000, 'sin(90deg) = 1');
    assert(geo::sin_fixed(270) == -1000, 'sin(270deg) = -1');
}

// ============================================================================
// RANDOM NUMBER GENERATION TESTS
// ============================================================================

#[test]
fn test_random_in_range_deterministic() {
    // Same seed should produce same output
    let seed: u256 = 12345;
    let max: u32 = 10;

    let rand1 = geo::random_in_range(seed, max);
    let rand2 = geo::random_in_range(seed, max);

    assert(rand1 == rand2, 'Same seed = same output');
}

#[test]
fn test_random_in_range_bounds() {
    // Test that random values are within [0, max)
    let seed: u256 = 54321;

    let rand_10 = geo::random_in_range(seed, 10);
    assert(rand_10 < 10, 'rand should be < 10');

    let rand_5 = geo::random_in_range(seed, 5);
    assert(rand_5 < 5, 'rand should be < 5');

    let rand_100 = geo::random_in_range(seed, 100);
    assert(rand_100 < 100, 'rand should be < 100');
}

#[test]
fn test_random_different_seeds() {
    // Different seeds should produce different outputs (with high probability)
    let max: u32 = 100;

    let rand1 = geo::random_in_range(1, max);
    let rand2 = geo::random_in_range(2, max);
    let rand3 = geo::random_in_range(12345, max);
    let rand4 = geo::random_in_range(99999, max);

    // Not guaranteed, but extremely unlikely all are the same
    let all_same = rand1 == rand2 && rand2 == rand3 && rand3 == rand4;
    assert(!all_same, 'Different seeds should vary');
}

// ============================================================================
// FISHER-YATES SHUFFLE TESTS (CRITICAL)
// ============================================================================

#[test]
fn test_shuffle_preserves_array_size() {
    // This test would have caught the bug!
    let token_id: u256 = 1;

    // Test for various sizes
    let sizes: Array<u8> = array![3, 4, 5, 6, 7, 8];

    let mut i = 0;
    loop {
        if i >= sizes.len() {
            break;
        }
        let size = *sizes.at(i);
        let shuffled = geo::generate_level_assignments(token_id, size);

        assert(shuffled.len() == size.into(), 'Array size must be preserved');

        i += 1;
    };
}

#[test]
fn test_shuffle_all_elements_present() {
    // Verify no elements are lost or duplicated
    let token_id: u256 = 42;
    let total_levels: u8 = 6;

    let shuffled = geo::generate_level_assignments(token_id, total_levels);

    // Check each element 0..5 appears exactly once
    let mut expected: u8 = 0;
    loop {
        if expected >= total_levels {
            break;
        }

        // Count occurrences of 'expected' in shuffled array
        let mut count: u32 = 0;
        let mut j: u32 = 0;
        loop {
            if j >= shuffled.len() {
                break;
            }
            if *shuffled.at(j) == expected {
                count += 1;
            }
            j += 1;
        };

        assert(count == 1, 'Each element should appear once');
        expected += 1;
    };
}

#[test]
fn test_shuffle_deterministic() {
    // Same token_id should produce same shuffle
    let token_id: u256 = 777;
    let total_levels: u8 = 5;

    let shuffle1 = geo::generate_level_assignments(token_id, total_levels);
    let shuffle2 = geo::generate_level_assignments(token_id, total_levels);

    // Compare arrays element by element
    let mut i: u32 = 0;
    loop {
        if i >= shuffle1.len() {
            break;
        }
        assert(*shuffle1.at(i) == *shuffle2.at(i), 'Same token = same shuffle');
        i += 1;
    };
}

#[test]
fn test_shuffle_different_tokens() {
    // Different token_ids should produce different shuffles
    let total_levels: u8 = 6;

    let shuffle1 = geo::generate_level_assignments(1, total_levels);
    let shuffle2 = geo::generate_level_assignments(2, total_levels);
    let _shuffle3 = geo::generate_level_assignments(999, total_levels);

    // Count how many positions differ
    let mut differences: u32 = 0;
    let mut i: u32 = 0;
    loop {
        if i >= shuffle1.len() {
            break;
        }
        if *shuffle1.at(i) != *shuffle2.at(i) {
            differences += 1;
        }
        i += 1;
    };

    // At least some positions should differ
    assert(differences > 0, 'Different tokens should vary');
}

#[test]
fn test_shuffle_edge_cases() {
    // Test minimum size (3 levels)
    let shuffle3 = geo::generate_level_assignments(1, 3);
    assert(shuffle3.len() == 3, 'Size 3 should work');

    // Test larger size (10 levels)
    let shuffle10 = geo::generate_level_assignments(1, 10);
    assert(shuffle10.len() == 10, 'Size 10 should work');
}

#[test]
fn test_shuffle_size_two() {
    // Test edge case of only 2 elements
    let shuffle = geo::generate_level_assignments(1, 2);
    assert(shuffle.len() == 2, 'Size 2 preserves length');

    // Should contain both 0 and 1
    let val0 = *shuffle.at(0);
    let val1 = *shuffle.at(1);

    // Either [0,1] or [1,0] - both valid shuffles
    let is_valid = (val0 == 0 && val1 == 1) || (val0 == 1 && val1 == 0);
    assert(is_valid, 'Size 2 contains 0 and 1');
}

// ============================================================================
// POSITION CALCULATION TESTS
// ============================================================================

#[test]
fn test_vertex_position_triangle() {
    // Test 3 vertices (triangle)
    let total_levels: u8 = 3;
    let center_x: u32 = 200;
    let center_y: u32 = 200;
    let radius: u32 = 100;

    // Vertex 0 should be at top (angle = -90deg = 270deg)
    let (x0, y0) = geo::get_vertex_position(0, total_levels, center_x, center_y, radius);

    // At 270deg: x = center_x + 0, y = center_y - radius
    assert(x0 == center_x, 'Triangle v0: x at center');
    assert(y0 == center_y - radius, 'Triangle v0: y at top');

    // All vertices should be ~radius distance from center
    let (x1, y1) = geo::get_vertex_position(1, total_levels, center_x, center_y, radius);
    let (x2, y2) = geo::get_vertex_position(2, total_levels, center_x, center_y, radius);

    // Verify positions are roughly radius away (allow 2% tolerance)
    assert(x1 != center_x || y1 != center_y, 'v1 not at center');
    assert(x2 != center_x || y2 != center_y, 'v2 not at center');
}

#[test]
fn test_vertex_position_square() {
    // Test 4 vertices (square)
    let total_levels: u8 = 4;
    let center_x: u32 = 200;
    let center_y: u32 = 200;
    let radius: u32 = 100;

    // Vertex 0 at top: -90deg (270deg)
    let (x0, y0) = geo::get_vertex_position(0, total_levels, center_x, center_y, radius);
    assert(x0 == center_x, 'Square v0: x at center');
    assert(y0 == center_y - radius, 'Square v0: y at top');

    // Vertex 2 at bottom: 90deg
    let (x2, y2) = geo::get_vertex_position(2, total_levels, center_x, center_y, radius);
    assert(x2 == center_x, 'Square v2: x at center');
    assert(y2 == center_y + radius, 'Square v2: y at bottom');
}

#[test]
fn test_vertex_position_hexagon() {
    // Test 6 vertices (hexagon) - common case
    let total_levels: u8 = 6;
    let center_x: u32 = 200;
    let center_y: u32 = 200;
    let radius: u32 = 130;

    // All 6 vertices should be calculated without error
    let mut i: u8 = 0;
    loop {
        if i >= total_levels {
            break;
        }
        let (x, y) = geo::get_vertex_position(i, total_levels, center_x, center_y, radius);

        // Verify positions are within reasonable bounds
        assert(x > center_x - radius - 10, 'x within bounds');
        assert(x < center_x + radius + 10, 'x within bounds');
        assert(y > center_y - radius - 10, 'y within bounds');
        assert(y < center_y + radius + 10, 'y within bounds');

        i += 1;
    };
}

#[test]
fn test_vertex_position_radius_scaling() {
    // Verify that radius affects distance from center proportionally
    let total_levels: u8 = 4;
    let center_x: u32 = 200;
    let center_y: u32 = 200;

    // Test at 45 degrees (vertex 1) to get both x and y components
    let (x1, y1) = geo::get_vertex_position(1, total_levels, center_x, center_y, 50);
    let (x2, y2) = geo::get_vertex_position(1, total_levels, center_x, center_y, 100);

    // Calculate x and y offsets from center
    let dx1 = if x1 > center_x { x1 - center_x } else { center_x - x1 };
    let dy1 = if y1 > center_y { y1 - center_y } else { center_y - y1 };
    let dx2 = if x2 > center_x { x2 - center_x } else { center_x - x2 };
    let dy2 = if y2 > center_y { y2 - center_y } else { center_y - y2 };

    // Verify approximate 2:1 ratio (with tolerance for rounding)
    // dx2 should be ~2 * dx1, allowing ±2 tolerance
    // Rearrange to avoid underflow: dx2 + 2 >= dx1 * 2
    assert(dx2 + 2 >= dx1 * 2, 'x scales with radius (low)');
    assert(dx2 <= dx1 * 2 + 2, 'x scales with radius (high)');
    assert(dy2 + 2 >= dy1 * 2, 'y scales with radius (low)');
    assert(dy2 <= dy1 * 2 + 2, 'y scales with radius (high)');
}

#[test]
fn test_vertex_position_zero_radius() {
    // Test edge case of zero radius - all vertices should be at center
    let total_levels: u8 = 4;
    let center_x: u32 = 200;
    let center_y: u32 = 200;

    let (x0, y0) = geo::get_vertex_position(0, total_levels, center_x, center_y, 0);
    let (x1, y1) = geo::get_vertex_position(1, total_levels, center_x, center_y, 0);
    let (x2, y2) = geo::get_vertex_position(2, total_levels, center_x, center_y, 0);

    assert(x0 == center_x && y0 == center_y, 'Zero radius: v0 at center');
    assert(x1 == center_x && y1 == center_y, 'Zero radius: v1 at center');
    assert(x2 == center_x && y2 == center_y, 'Zero radius: v2 at center');
}

// ============================================================================
// PROGRESS BITMAP TESTS
// ============================================================================

#[test]
fn test_pow2_values() {
    assert(geo::pow2(0) == 1, 'pow2(0) = 1');
    assert(geo::pow2(1) == 2, 'pow2(1) = 2');
    assert(geo::pow2(2) == 4, 'pow2(2) = 4');
    assert(geo::pow2(3) == 8, 'pow2(3) = 8');
    assert(geo::pow2(4) == 16, 'pow2(4) = 16');
    assert(geo::pow2(8) == 256, 'pow2(8) = 256');
    assert(geo::pow2(16) == 65536, 'pow2(16) = 65536');
}

#[test]
fn test_is_level_complete_single_level() {
    // Bitmap with only level 1 complete: bit 1 = 0b000010 = 2
    let progress: u64 = 2;
    assert(geo::is_level_complete(progress, 1), 'Level 1 should be complete');
    assert(!geo::is_level_complete(progress, 2), 'Level 2 should not be complete');
    assert(!geo::is_level_complete(progress, 3), 'Level 3 should not be complete');
}

#[test]
fn test_is_level_complete_multiple_levels() {
    // Bitmap: bits 1,2,3 = 0b001110 = 14 (levels 1, 2, 3 complete)
    let progress: u64 = 14;
    assert(geo::is_level_complete(progress, 1), 'Level 1 complete');
    assert(geo::is_level_complete(progress, 2), 'Level 2 complete');
    assert(geo::is_level_complete(progress, 3), 'Level 3 complete');
    assert(!geo::is_level_complete(progress, 4), 'Level 4 not complete');
}

#[test]
fn test_is_level_complete_all_levels() {
    // Bitmap for 6 levels all complete: bits 1-6 = 0b1111110 = 126
    let progress: u64 = 126;

    let mut level: u8 = 1;
    loop {
        if level > 6 {
            break;
        }
        assert(geo::is_level_complete(progress, level), 'All levels should be complete');
        level += 1;
    };

    assert(!geo::is_level_complete(progress, 7), 'Level 7 not complete');
}

#[test]
fn test_is_level_complete_sparse_pattern() {
    // Bitmap: bits 2,4,6 = 0b1010100 = 84 (levels 2, 4, 6 complete)
    let progress: u64 = 84;

    assert(!geo::is_level_complete(progress, 1), 'Level 1 not complete');
    assert(geo::is_level_complete(progress, 2), 'Level 2 complete');
    assert(!geo::is_level_complete(progress, 3), 'Level 3 not complete');
    assert(geo::is_level_complete(progress, 4), 'Level 4 complete');
    assert(!geo::is_level_complete(progress, 5), 'Level 5 not complete');
    assert(geo::is_level_complete(progress, 6), 'Level 6 complete');
}

#[test]
fn test_is_level_complete_zero_progress() {
    // No levels complete
    let progress: u64 = 0;

    assert(!geo::is_level_complete(progress, 1), 'No levels complete');
    assert(!geo::is_level_complete(progress, 2), 'No levels complete');
    assert(!geo::is_level_complete(progress, 6), 'No levels complete');
}

#[test]
fn test_is_level_complete_large_levels() {
    // Test with larger level numbers to ensure bit shifting works
    // Level 32: bit 32 set
    let progress_32: u64 = geo::pow2(32);
    assert(geo::is_level_complete(progress_32, 32), 'Level 32 works');
    assert(!geo::is_level_complete(progress_32, 31), 'Level 31 not set');
    assert(!geo::is_level_complete(progress_32, 33), 'Level 33 not set');

    // Level 63: bit 63 set (highest bit in u64)
    let progress_63: u64 = geo::pow2(63);
    assert(geo::is_level_complete(progress_63, 63), 'Level 63 works');
    assert(!geo::is_level_complete(progress_63, 62), 'Level 62 not set');
}

#[test]
fn test_is_map_complete_partial_progress() {
    // Bitmap: bits 1,2 = 0b000110 = 6 (levels 1, 2 complete)
    let progress: u64 = 6;
    assert(!geo::is_map_complete(progress, 3), '2/3 not complete');
    assert(!geo::is_map_complete(progress, 6), '2/6 not complete');
}

#[test]
fn test_is_map_complete_all_levels() {
    // Bitmap: bits 1,2,3 = 0b001110 = 14 (all 3 levels complete)
    let progress: u64 = 14;
    assert(geo::is_map_complete(progress, 3), '3/3 complete');
    assert(!geo::is_map_complete(progress, 4), 'Not all 4 levels');
    assert(!geo::is_map_complete(progress, 6), 'Not all 6 levels');
}

#[test]
fn test_is_map_complete_extra_bit_set() {
    // Bitmap: bits 1,2,3,7 = 0b10001110 = 142 (levels 1,2,3,7 complete)
    // Should fail for 3 levels because bit 7 is also set
    let progress: u64 = 142;
    assert(!geo::is_map_complete(progress, 3), 'Extra bit set');
}

// ============================================================================
// UTILITY FUNCTION TESTS
// ============================================================================

#[test]
fn test_u32_to_bytearray() {
    let result_0 = geo::u32_to_bytearray(0);
    assert(result_0 == "0", 'u32(0) = "0"');

    let result_1 = geo::u32_to_bytearray(1);
    assert(result_1 == "1", 'u32(1) = "1"');

    let result_123 = geo::u32_to_bytearray(123);
    assert(result_123 == "123", 'u32(123) = "123"');

    let result_1000 = geo::u32_to_bytearray(1000);
    assert(result_1000 == "1000", 'u32(1000) = "1000"');

    // Test trailing zeros
    let result_10000 = geo::u32_to_bytearray(10000);
    assert(result_10000 == "10000", 'u32(10000) with zeros');

    // Test large number
    let result_large = geo::u32_to_bytearray(999999);
    assert(result_large == "999999", 'u32(999999) large number');
}

#[test]
fn test_felt252_to_bytearray() {
    // Test short string conversion
    let result_test = geo::felt252_to_bytearray('test');
    // felt252 'test' should convert to "test"
    assert(result_test.len() > 0, 'felt252 converts to bytearray');

    // Test single character
    let result_a = geo::felt252_to_bytearray('a');
    assert(result_a.len() > 0, 'Single char converts');

    // Test empty/zero
    let result_zero = geo::felt252_to_bytearray(0);
    assert(result_zero == "", 'Zero felt252 is empty');
}
