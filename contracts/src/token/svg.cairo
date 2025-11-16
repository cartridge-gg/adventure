// ============================================================================
// SVG Generation for Adventure Map NFT
// ============================================================================
//
// Renders dynamic treasure map SVGs with progress tracking.
// Uses geo.cairo for all mathematical/geometric calculations.
// Uses art.cairo for all SVG asset data.

use focg_adventure::token::geo;
use focg_adventure::token::art;

// ============================================================================
// COLOR CONSTANTS
// ============================================================================

fn bg_color() -> ByteArray {
    "#fef3c7"
}

fn border_color() -> ByteArray {
    "#92400e"
}

fn path_color() -> ByteArray {
    "#8B4513"
}

fn complete_icon_color() -> ByteArray {
    "#5a8a5a"
}

fn incomplete_icon_color() -> ByteArray {
    "#8b6f47"
}

fn complete_badge_color() -> ByteArray {
    "#15803d"
}

fn incomplete_badge_color() -> ByteArray {
    "#78350f"
}

// ============================================================================
// SVG ELEMENT RENDERING
// ============================================================================

/// Render a waypoint circle with icon and level badge
fn render_waypoint(
    level_num: u8,
    is_complete: bool,
    x: u32,
    y: u32
) -> ByteArray {
    let mut svg: ByteArray = "";

    // Open group with translation
    svg.append(@"<g transform=\"translate(");
    svg.append(@geo::u32_to_bytearray(x));
    svg.append(@",");
    svg.append(@geo::u32_to_bytearray(y));
    svg.append(@")\">");

    // Circle background with appropriate color
    svg.append(@"<g fill=\"");
    if is_complete {
        svg.append(@complete_icon_color());
    } else {
        svg.append(@incomplete_icon_color());
    }
    svg.append(@"\" opacity=\"0.4\">");
    svg.append(@"<svg x=\"-25\" y=\"-25\" width=\"50\" height=\"50\" viewBox=\"0 0 319 325\">");
    svg.append(@art::get_circle_svg());
    svg.append(@"</svg></g>");

    // Icon overlay (check or question mark)
    svg.append(@"<g fill=\"");
    if is_complete {
        svg.append(@complete_icon_color());
    } else {
        svg.append(@incomplete_icon_color());
    }
    svg.append(@"\">");

    if is_complete {
        svg.append(@"<svg x=\"-18\" y=\"-40\" width=\"50\" height=\"50\" viewBox=\"0 0 62 63\">");
        svg.append(@art::get_check_svg());
    } else {
        svg.append(@"<svg x=\"-25\" y=\"-40\" width=\"50\" height=\"50\" viewBox=\"0 0 253 376\">");
        svg.append(@art::get_question_mark_svg());
    }
    svg.append(@"</svg></g>");

    // Level number badge
    svg.append(@"<g transform=\"translate(20, -20)\">");
    svg.append(@"<circle r=\"10\" fill=\"");
    if is_complete {
        svg.append(@complete_badge_color());
    } else {
        svg.append(@incomplete_badge_color());
    }
    svg.append(@"\" stroke=\"#fff\" stroke-width=\"2\"/>");
    svg.append(@"<text text-anchor=\"middle\" y=\"3.5\" fill=\"#fff\" font-size=\"10\" font-weight=\"bold\">");
    svg.append(@geo::u32_to_bytearray(level_num.into()));
    svg.append(@"</text></g>");

    // Close group
    svg.append(@"</g>");

    svg
}

/// Render a path line between two waypoints
fn render_path(x1: u32, y1: u32, x2: u32, y2: u32) -> ByteArray {
    let mut svg: ByteArray = "";

    svg.append(@"<line x1=\"");
    svg.append(@geo::u32_to_bytearray(x1));
    svg.append(@"\" y1=\"");
    svg.append(@geo::u32_to_bytearray(y1));
    svg.append(@"\" x2=\"");
    svg.append(@geo::u32_to_bytearray(x2));
    svg.append(@"\" y2=\"");
    svg.append(@geo::u32_to_bytearray(y2));
    svg.append(@"\" stroke=\"");
    svg.append(@path_color());
    svg.append(@"\" stroke-width=\"3\" stroke-dasharray=\"5,5\" opacity=\"0.7\"/>");

    svg
}

// ============================================================================
// MAIN SVG GENERATION
// ============================================================================

/// Generate the complete Adventure Map SVG with cached assignments
///
/// # Arguments
/// * `progress` - Bitmap of completed levels (bit N = level N complete)
/// * `username` - Player's username (felt252)
/// * `assignments` - Level assignments (as Span)
///
/// # Returns
/// * `ByteArray` - Complete SVG string with data URI prefix
pub fn generate_adventure_map_svg(
    progress: u64,
    username: felt252,
    assignments: Span<u8>
) -> ByteArray {
    let total_levels: u8 = assignments.len().try_into().unwrap();
    let mut svg: ByteArray = "";

    // Data URI prefix
    svg.append(@"data:image/svg+xml;utf8,");

    // SVG header
    svg.append(@"<svg viewBox='0 0 400 500' xmlns='http://www.w3.org/2000/svg'>");

    // Background with paper texture pattern
    svg.append(@"<defs><pattern id='paper-texture' x='0' y='0' width='100' height='100' patternUnits='userSpaceOnUse'>");
    svg.append(@"<rect width='100' height='100' fill='");
    svg.append(@bg_color());
    svg.append(@"'/>");
    svg.append(@"<circle cx='10' cy='10' r='1' fill='#d97706' opacity='0.1'/>");
    svg.append(@"<circle cx='50' cy='50' r='1' fill='#d97706' opacity='0.1'/>");
    svg.append(@"<circle cx='90' cy='30' r='1' fill='#d97706' opacity='0.1'/>");
    svg.append(@"</pattern></defs>");

    svg.append(@"<rect width='400' height='500' fill='url(#paper-texture)'/>");

    // Border
    svg.append(@"<rect x='10' y='10' width='380' height='480' fill='none' stroke='");
    svg.append(@border_color());
    svg.append(@"' stroke-width='3'/>");

    // LAYER 1: Background decorations
    svg.append(@"<g opacity='0.2'><svg x='50' y='150' width='300' height='300' viewBox='0 0 326 448'>");
    svg.append(@art::get_river_svg());
    svg.append(@"</svg></g>");

    // LAYER 2: Top decorations
    // Dojo at top with yellow glow when complete
    if geo::is_map_complete(progress, total_levels) {
        svg.append(@"<svg x='120' y='-10' width='160' height='160' viewBox='0 0 160 160'>");
        svg.append(@art::get_glow_svg());
        svg.append(@"</svg>");
    }

    svg.append(@"<g transform='translate(150, 20)'><svg width='100' height='100' viewBox='0 0 370 418'>");
    svg.append(@art::get_dojo_svg());
    svg.append(@"</svg></g>");

    // Mountains (left side - main)
    svg.append(@"<svg x='20' y='10' width='150' height='150' viewBox='0 0 405 180'>");
    svg.append(@art::get_mountain_svg());
    svg.append(@"</svg>");

    // Mountains (left side - inner with opacity)
    svg.append(@"<g opacity='0.2'><svg x='80' y='20' width='100' height='100' viewBox='0 0 405 180'>");
    svg.append(@art::get_mountain_svg());
    svg.append(@"</svg></g>");

    // Mountains (right side - main, mirrored)
    svg.append(@"<g transform='scale(-1, 1)'><svg x='-380' y='10' width='150' height='150' viewBox='0 0 405 180'>");
    svg.append(@art::get_mountain_svg());
    svg.append(@"</svg></g>");

    // Mountains (right side - inner with opacity, mirrored)
    svg.append(@"<g transform='scale(-1, 1)' opacity='0.2'><svg x='-320' y='20' width='100' height='100' viewBox='0 0 405 180'>");
    svg.append(@art::get_mountain_svg());
    svg.append(@"</svg></g>");

    // Compass
    svg.append(@"<g transform='translate(330, 20)'><svg width='50' height='50' viewBox='0 0 309 385'>");
    svg.append(@art::get_compass_svg());
    svg.append(@"</svg></g>");

    // LAYER 3: Map path (waypoints and connections)
    // Two-pass rendering required for proper SVG layering:
    // - Pass 1: Draw all paths (background layer)
    // - Pass 2: Draw all waypoints (foreground layer)
    let center_x: u32 = 200;
    let center_y: u32 = 310;
    let radius: u32 = 130;

    // Pass 1: Draw all connection paths (must be rendered BEFORE waypoints for correct layering)
    let mut prev_x: u32 = 0;
    let mut prev_y: u32 = 0;
    let mut prev_complete: bool = false;

    for level in 0..total_levels {
        // Calculate position for this level (use cached assignments)
        let vertex_idx = *assignments.at(level.into());
        let (x, y) = geo::get_vertex_position(vertex_idx, total_levels, center_x, center_y, radius);

        // Check completion status
        let level_num = level + 1;
        let is_complete = geo::is_level_complete(progress, level_num);

        // Draw connection path from previous level (if both are complete)
        if level > 0 && prev_complete && is_complete {
            svg.append(@render_path(prev_x, prev_y, x, y));
        }

        // Store current position and completion for next iteration
        prev_x = x;
        prev_y = y;
        prev_complete = is_complete;
    };

    // Pass 2: Draw all waypoint markers (rendered AFTER paths so they appear on top)
    for level in 0..total_levels {
        // Calculate position for this level (use cached assignments)
        let vertex_idx = *assignments.at(level.into());
        let (x, y) = geo::get_vertex_position(vertex_idx, total_levels, center_x, center_y, radius);

        // Check completion status
        let level_num = level + 1;
        let is_complete = geo::is_level_complete(progress, level_num);

        // Render waypoint marker
        svg.append(@render_waypoint(level_num, is_complete, x, y));
    };

    // Username in lower-right corner
    svg.append(@"<text x='375' y='475' text-anchor='end' fill='");
    svg.append(@border_color());
    svg.append(@"' font-size='14' font-family='serif' font-style='italic'>");
    svg.append(@geo::felt252_to_bytearray(username));
    svg.append(@"</text>");

    // Close SVG
    svg.append(@"</svg>");

    svg
}
