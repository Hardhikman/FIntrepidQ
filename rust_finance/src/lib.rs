//! Rust Finance Library
//! High-performance financial calculations for IntrepidQ
//!
//! Modules:
//! - risk: VaR, Sharpe, Volatility, Max Drawdown, Beta
//! - technicals: RSI, MACD, SMA, EMA, Golden/Death Cross
//! - utils: Trend detection, CAGR, percentage changes

use pyo3::prelude::*;

mod risk;
mod technicals;
mod utils;

/// Python module entry point
#[pymodule]
fn rust_finance(m: &Bound<'_, PyModule>) -> PyResult<()> {
    // Risk calculations
    m.add_function(wrap_pyfunction!(risk::calculate_volatility, m)?)?;
    m.add_function(wrap_pyfunction!(risk::calculate_sharpe_ratio, m)?)?;
    m.add_function(wrap_pyfunction!(risk::calculate_var_95, m)?)?;
    m.add_function(wrap_pyfunction!(risk::calculate_max_drawdown, m)?)?;
    m.add_function(wrap_pyfunction!(risk::calculate_beta, m)?)?;
    
    // Technical indicators
    m.add_function(wrap_pyfunction!(technicals::calculate_sma, m)?)?;
    m.add_function(wrap_pyfunction!(technicals::calculate_ema, m)?)?;
    m.add_function(wrap_pyfunction!(technicals::calculate_rsi, m)?)?;
    m.add_function(wrap_pyfunction!(technicals::calculate_macd, m)?)?;
    m.add_function(wrap_pyfunction!(technicals::detect_golden_cross, m)?)?;
    m.add_function(wrap_pyfunction!(technicals::detect_death_cross, m)?)?;
    
    // Utility functions
    m.add_function(wrap_pyfunction!(utils::detect_trend, m)?)?;
    m.add_function(wrap_pyfunction!(utils::calculate_cagr, m)?)?;
    m.add_function(wrap_pyfunction!(utils::calculate_pct_change, m)?)?;
    m.add_function(wrap_pyfunction!(utils::detect_volume_spike, m)?)?;
    
    Ok(())
}
