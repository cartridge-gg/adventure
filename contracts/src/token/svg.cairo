// ============================================================================
// SVG Generation for Adventure Map NFT
// ============================================================================
//
// Generates dynamic treasure map SVG based on progress bitmap and total levels.
// STUB IMPLEMENTATION - Basic functionality for compilation
// TODO: Implement full treasure map design in next phase

/// Helper function to convert felt252 short string to ByteArray
/// Calculates the length of the string and uses append_word
fn felt252_to_bytearray(value: felt252) -> ByteArray {
    // Convert to u256 for easier manipulation
    let value_u256: u256 = value.into();

    // Calculate the length of the short string (max 31 bytes)
    let mut len: usize = 0;
    let mut temp = value_u256;

    // Count bytes by dividing by 256 until we reach 0
    loop {
        if temp == 0 {
            break;
        }
        len += 1;
        temp = temp / 256;
    };

    // Handle empty string case
    if len == 0 {
        return "";
    }

    // Create ByteArray and append the word
    let mut result: ByteArray = "";
    result.append_word(value, len);
    result
}

/// Generate Adventure Map SVG
///
/// # Arguments
/// * `progress` - Bitmap of completed levels
/// * `username` - Player's username (felt252)
/// * `total_levels` - Total number of levels in the adventure
///
/// # Returns
/// * `ByteArray` - SVG string with data URI prefix
pub fn generate_adventure_map_svg(
    progress: u256,
    username: felt252,
    total_levels: u8
) -> ByteArray {
    // STUB: Return simple placeholder SVG
    // TODO: Implement full treasure map with waypoints, paths, progress indicators
    //
    // See IMPL.md section 5 for full implementation details:
    // - Calculate waypoints based on total_levels
    // - Render path between waypoints
    // - Highlight completed levels in green
    // - Show progress percentage
    // - Display username
    // - Final state shows treasure chest

    let mut svg: ByteArray = "";
    svg.append(@"data:image/svg+xml;utf8,");
    svg.append(@"<svg viewBox='0 0 400 500' xmlns='http://www.w3.org/2000/svg'>");
    svg.append(@"<rect width='400' height='500' fill='%23fef3c7'/>");
    svg.append(@"<text x='200' y='250' text-anchor='middle' font-size='20' fill='%2378350f'>");
    svg.append(@"FOCG Adventure Map");
    svg.append(@"</text>");

    // Add username text
    svg.append(@"<text x='200' y='280' text-anchor='middle' font-size='16' fill='%2392400e'>");
    svg.append(@felt252_to_bytearray(username));
    svg.append(@"</text>");

    svg.append(@"</svg>");

    svg
}
