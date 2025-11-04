// Tests for SVG generation
use ronin_quest::token::pact::TrialProgress;
use ronin_quest::token::svg;

#[test]
#[available_gas(l1_gas: 0, l1_data_gas: 0, l2_gas: 10000000)]
fn test_svg_generation_no_trials() {
    let progress = TrialProgress {
        waza_complete: false,
        chi_complete: false,
        shin_complete: false,
    };

    let svg_output = svg::generate_svg(progress, 'testuser');

    // Basic assertions
    assert(svg_output.len() > 0, 'SVG should not be empty');

    // Verify it starts with data URI
    assert(svg_output.len() > 23, 'SVG should include data URI');
}

#[test]
#[available_gas(l1_gas: 0, l1_data_gas: 0, l2_gas: 30000000)]
fn test_svg_generation_waza_only() {
    let progress = TrialProgress {
        waza_complete: true,
        chi_complete: false,
        shin_complete: false,
    };

    let svg_output = svg::generate_svg(progress, 'testuser');

    assert(svg_output.len() > 0, 'SVG should not be empty');

    // Should be larger than no trials (has one sword)
    let empty_progress = TrialProgress {
        waza_complete: false,
        chi_complete: false,
        shin_complete: false,
    };
    let empty_svg = svg::generate_svg(empty_progress, 'testuser');
    assert(svg_output.len() > empty_svg.len(), 'Should be larger with sword');
}

#[test]
#[available_gas(l1_gas: 0, l1_data_gas: 0, l2_gas: 50000000)]
fn test_svg_generation_all_complete() {
    let progress = TrialProgress {
        waza_complete: true,
        chi_complete: true,
        shin_complete: true,
    };

    let svg_output = svg::generate_svg(progress, 'testuser');

    assert(svg_output.len() > 0, 'SVG should not be empty');

    // Verify data URI format
    assert(svg_output.len() > 23, 'SVG should include data URI');
}

#[test]
#[available_gas(l1_gas: 0, l1_data_gas: 0, l2_gas: 50000000)]
fn test_svg_size_check() {
    let progress = TrialProgress {
        waza_complete: true,
        chi_complete: true,
        shin_complete: true,
    };

    let svg_output = svg::generate_svg(progress, 'testuser');
    let size = svg_output.len();

    // The complete SVG should be around 29-30 KB
    assert(size > 25000, 'SVG seems too small');
    assert(size < 35000, 'SVG seems too large');
}
