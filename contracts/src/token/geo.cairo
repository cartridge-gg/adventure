// ============================================================================
// Geometry and Arithmetic for Adventure Map NFT
// ============================================================================
//
// Pure math functions separated from SVG rendering.
// Handles trigonometry, randomness, level assignments, and position calculations.

// ============================================================================
// MATH UTILITIES
// ============================================================================

/// Helper function to convert felt252 short string to ByteArray
pub fn felt252_to_bytearray(value: felt252) -> ByteArray {
    let value_u256: u256 = value.into();
    let mut len: usize = 0;
    let mut temp = value_u256;

    while temp != 0 {
        len += 1;
        temp = temp / 256;
    };

    if len == 0 {
        return "";
    }

    let mut result: ByteArray = "";
    result.append_word(value, len);
    result
}

/// Convert u32 to ByteArray (for coordinates, numbers, etc.)
pub fn u32_to_bytearray(mut value: u32) -> ByteArray {
    if value == 0 {
        return "0";
    }

    let mut result: ByteArray = "";
    let mut digits: Array<u8> = ArrayTrait::new();

    while value != 0 {
        let digit = (value % 10).try_into().unwrap();
        digits.append(digit + 48); // ASCII offset
        value = value / 10;
    };

    let mut i = digits.len();
    while i > 0 {
        i -= 1;
        let mut single_digit: ByteArray = "";
        single_digit.append_byte(*digits.at(i));
        result.append(@single_digit);
    };

    result
}

// ============================================================================
// TRIGONOMETRY (FIXED-POINT)
// ============================================================================

// Pre-computed sine lookup table (constant, 0-90 degrees)
// Values scaled by 1000 for fixed-point precision
const SIN_TABLE_0_9: [i32; 10] = [0, 17, 35, 52, 70, 87, 105, 122, 139, 156];
const SIN_TABLE_10_19: [i32; 10] = [174, 191, 208, 225, 242, 259, 276, 292, 309, 326];
const SIN_TABLE_20_29: [i32; 10] = [342, 358, 375, 391, 407, 423, 438, 454, 469, 485];
const SIN_TABLE_30_39: [i32; 10] = [500, 515, 530, 545, 559, 574, 588, 602, 616, 629];
const SIN_TABLE_40_49: [i32; 10] = [643, 656, 669, 682, 695, 707, 719, 731, 743, 755];
const SIN_TABLE_50_59: [i32; 10] = [766, 777, 788, 799, 809, 819, 829, 839, 848, 857];
const SIN_TABLE_60_69: [i32; 10] = [866, 875, 883, 891, 899, 906, 914, 921, 927, 934];
const SIN_TABLE_70_79: [i32; 10] = [940, 946, 951, 956, 961, 966, 970, 974, 978, 982];
const SIN_TABLE_80_90: [i32; 11] = [985, 988, 990, 993, 995, 996, 998, 999, 999, 1000, 1000];

/// Helper to get sin value from constant lookup tables
fn get_sin_value(angle: u32) -> i32 {
    if angle < 10 {
        return *SIN_TABLE_0_9.span().at(angle);
    } else if angle < 20 {
        return *SIN_TABLE_10_19.span().at(angle - 10);
    } else if angle < 30 {
        return *SIN_TABLE_20_29.span().at(angle - 20);
    } else if angle < 40 {
        return *SIN_TABLE_30_39.span().at(angle - 30);
    } else if angle < 50 {
        return *SIN_TABLE_40_49.span().at(angle - 40);
    } else if angle < 60 {
        return *SIN_TABLE_50_59.span().at(angle - 50);
    } else if angle < 70 {
        return *SIN_TABLE_60_69.span().at(angle - 60);
    } else if angle < 80 {
        return *SIN_TABLE_70_79.span().at(angle - 70);
    } else {
        return *SIN_TABLE_80_90.span().at(angle - 80);
    }
}

/// Fixed-point math for sine (scaled by 1000 for precision)
/// Returns values in range [-1000, 1000] representing [-1.0, 1.0]
pub fn sin_fixed(angle_deg: u32) -> i32 {
    // Normalize angle to 0-359
    let angle = angle_deg % 360;

    if angle <= 90 {
        return get_sin_value(angle);
    } else if angle <= 180 {
        return get_sin_value(180 - angle);
    } else if angle <= 270 {
        return -get_sin_value(angle - 180);
    } else {
        return -get_sin_value(360 - angle);
    }
}

/// Cosine using sine (cos(x) = sin(90 - x))
pub fn cos_fixed(angle_deg: u32) -> i32 {
    sin_fixed((angle_deg + 90) % 360)
}

// ============================================================================
// RANDOM NUMBER GENERATION
// ============================================================================

/// Linear Congruential Generator for seeded randomness
/// Returns value in range [0, m-1]
fn lcg_next(seed: u256) -> u256 {
    // LCG parameters: a = 1103515245, c = 12345, m = 2^31
    let a: u256 = 1103515245;
    let c: u256 = 12345;
    let m: u256 = 2147483648; // 2^31

    ((a * seed + c) % m)
}

/// Generate random number in range [0, max)
pub fn random_in_range(seed: u256, max: u32) -> u32 {
    let rand = lcg_next(seed);
    (rand % max.into()).try_into().unwrap()
}

// ============================================================================
// POLYGON LAYOUT & LEVEL ASSIGNMENT
// ============================================================================

/// Generate deterministic level-to-vertex assignments using Fisher-Yates shuffle
/// Returns array where index is level (0-indexed), value is vertex position
///
/// Uses token_id as the shuffle seed to create unique paths for each NFT.
/// Fisher-Yates ensures each permutation has equal probability.
pub fn generate_level_assignments(token_id: u256, total_levels: u8) -> Array<u8> {
    // Start with identity permutation [0, 1, 2, ..., n-1]
    let mut vertices: Array<u8> = ArrayTrait::new();
    for i in 0..total_levels {
        vertices.append(i);
    };

    // Fisher-Yates shuffle using token_id as seed
    let mut seed = token_id * 5786;

    // Shuffle from end to start
    let mut i = total_levels;
    while i > 1 {
        i -= 1;

        // Generate random index in range [0, i]
        seed = lcg_next(seed);
        let j = (seed % (i + 1).into()).try_into().unwrap();

        // Swap vertices[i] and vertices[j]
        // Since we can't modify Array elements directly, rebuild the array
        let mut new_vertices: Array<u8> = ArrayTrait::new();
        let mut k: u8 = 0;
        while k < total_levels {
            let idx = k.into();
            let val = if k == i {
                *vertices.at(j.into())
            } else if k == j {
                *vertices.at(i.into())
            } else {
                *vertices.at(idx)
            };
            new_vertices.append(val);
            k += 1;
        };
        vertices = new_vertices;
    };

    vertices
}

/// Calculate X,Y coordinates for a vertex on the polygon
/// Returns (x, y) as (u32, u32) scaled by 100 for sub-pixel precision
pub fn get_vertex_position(
    vertex_index: u8,
    total_levels: u8,
    center_x: u32,
    center_y: u32,
    radius: u32
) -> (u32, u32) {
    // Convert vertex to angle: (360 * vertex_index / total_levels) - 90
    // Subtract 90 to start at top instead of right
    // Use u32 arithmetic to avoid felt252 division issues
    let vertex_u32: u32 = vertex_index.into();
    let total_u32: u32 = total_levels.into();
    let angle_deg_u32 = (360 * vertex_u32) / total_u32;
    let angle_deg: i32 = angle_deg_u32.try_into().unwrap();
    let adjusted_angle: i32 = angle_deg - 90;
    let adjusted_angle = if adjusted_angle < 0 { adjusted_angle + 360 } else { adjusted_angle };

    // Get sin and cos (scaled by 1000)
    let sin_val = sin_fixed(adjusted_angle.try_into().unwrap());
    let cos_val = cos_fixed(adjusted_angle.try_into().unwrap());

    // Calculate x = center_x + radius * cos(angle)
    // Calculate y = center_y + radius * sin(angle)
    // (sin/cos are scaled by 1000, so divide by 1000)
    // Use i64 for signed arithmetic
    let radius_i64: i64 = radius.into();
    let cos_i64: i64 = cos_val.into();
    let sin_i64: i64 = sin_val.into();

    let x_offset = (radius_i64 * cos_i64) / 1000;
    let y_offset = (radius_i64 * sin_i64) / 1000;

    // Convert offsets to i32 and add to center coordinates
    let x = if x_offset >= 0 {
        center_x + x_offset.try_into().unwrap()
    } else {
        center_x - ((-x_offset).try_into().unwrap())
    };

    let y = if y_offset >= 0 {
        center_y + y_offset.try_into().unwrap()
    } else {
        center_y - ((-y_offset).try_into().unwrap())
    };

    (x, y)
}

// ============================================================================
// PROGRESS CHECKING
// ============================================================================

/// Check if a level is completed (bit is set in progress bitmap)
/// Level N maps to bit N (simpler convention, bit 0 unused)
pub fn is_level_complete(progress: u64, level_num: u8) -> bool {
    let shift_amount: u64 = level_num.into();
    let bit_mask: u64 = pow2(shift_amount);
    (progress & bit_mask) != 0
}

/// Check if all levels are completed
/// Returns true if bits 1 through total_levels are all set
/// Formula: 2^(total_levels+1) - 2
pub fn is_map_complete(progress: u64, total_levels: u8) -> bool {
    let expected: u64 = pow2((total_levels + 1).into()) - 2;
    progress == expected
}

/// Helper to compute 2^n (for bit operations)
pub fn pow2(n: u64) -> u64 {
    if n == 0 {
        return 1_u64;
    }
    let mut result: u64 = 1_u64;
    for _ in 0..n {
        result = result * 2_u64;
    };
    result
}
