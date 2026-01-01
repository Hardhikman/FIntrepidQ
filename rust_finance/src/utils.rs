//! Utility functions for trend detection and data processing

use pyo3::prelude::*;

/// Detect trend direction from a series of values
/// Returns: "increasing", "decreasing", or "stable"
#[pyfunction]
pub fn detect_trend(values: Vec<f64>) -> String {
    if values.len() < 2 {
        return "stable".to_string();
    }
    
    let first_half: f64 = values[..values.len()/2].iter().sum::<f64>() / (values.len()/2) as f64;
    let second_half: f64 = values[values.len()/2..].iter().sum::<f64>() / (values.len() - values.len()/2) as f64;
    
    let change_pct = (second_half - first_half) / first_half.abs().max(1.0);
    
    if change_pct > 0.05 {
        "increasing".to_string()
    } else if change_pct < -0.05 {
        "decreasing".to_string()
    } else {
        "stable".to_string()
    }
}

/// Calculate compound annual growth rate
#[pyfunction]
pub fn calculate_cagr(start_value: f64, end_value: f64, years: f64) -> f64 {
    if start_value <= 0.0 || years <= 0.0 {
        return 0.0;
    }
    
    (end_value / start_value).powf(1.0 / years) - 1.0
}

/// Calculate percentage change
#[pyfunction]
pub fn calculate_pct_change(old_value: f64, new_value: f64) -> f64 {
    if old_value == 0.0 {
        return 0.0;
    }
    
    (new_value - old_value) / old_value * 100.0
}

/// Detect volume spike (current volume > 1.5x average)
#[pyfunction]
pub fn detect_volume_spike(current_volume: f64, avg_volume: f64) -> bool {
    current_volume > avg_volume * 1.5
}
