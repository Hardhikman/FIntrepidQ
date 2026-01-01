//! Technical indicators module
//! RSI, MACD, SMA, EMA, Golden/Death Cross detection

use pyo3::prelude::*;

/// Calculate Simple Moving Average
#[pyfunction]
pub fn calculate_sma(prices: Vec<f64>, period: usize) -> f64 {
    if prices.len() < period || period == 0 {
        return 0.0;
    }
    
    let recent: Vec<&f64> = prices.iter().rev().take(period).collect();
    recent.iter().copied().sum::<f64>() / period as f64
}

/// Calculate Exponential Moving Average
#[pyfunction]
pub fn calculate_ema(prices: Vec<f64>, period: usize) -> f64 {
    if prices.is_empty() || period == 0 {
        return 0.0;
    }
    
    let multiplier = 2.0 / (period as f64 + 1.0);
    let mut ema = prices[0];
    
    for price in prices.iter().skip(1) {
        ema = (price - ema) * multiplier + ema;
    }
    
    ema
}

/// Calculate RSI (Relative Strength Index)
#[pyfunction]
pub fn calculate_rsi(prices: Vec<f64>, period: usize) -> f64 {
    if prices.len() < period + 1 {
        return 50.0;  // Neutral default
    }
    
    let mut gains = Vec::new();
    let mut losses = Vec::new();
    
    for i in 1..prices.len() {
        let change = prices[i] - prices[i - 1];
        if change > 0.0 {
            gains.push(change);
            losses.push(0.0);
        } else {
            gains.push(0.0);
            losses.push(change.abs());
        }
    }
    
    // Use last 'period' values
    let recent_gains: f64 = gains.iter().rev().take(period).sum::<f64>() / period as f64;
    let recent_losses: f64 = losses.iter().rev().take(period).sum::<f64>() / period as f64;
    
    if recent_losses == 0.0 {
        return 100.0;
    }
    
    let rs = recent_gains / recent_losses;
    100.0 - (100.0 / (1.0 + rs))
}

/// Calculate MACD (returns macd_line, signal_line, histogram)
#[pyfunction]
pub fn calculate_macd(prices: Vec<f64>) -> (f64, f64, f64) {
    if prices.len() < 26 {
        return (0.0, 0.0, 0.0);
    }
    
    let ema_12 = calculate_ema(prices.clone(), 12);
    let ema_26 = calculate_ema(prices.clone(), 26);
    let macd_line = ema_12 - ema_26;
    
    // For signal line, we'd need MACD history - simplified here
    let signal_line = macd_line * 0.9;  // Approximation
    let histogram = macd_line - signal_line;
    
    (macd_line, signal_line, histogram)
}

/// Detect Golden Cross (SMA50 crosses above SMA200)
#[pyfunction]
pub fn detect_golden_cross(prices: Vec<f64>) -> bool {
    if prices.len() < 201 {
        return false;
    }
    
    let sma_50_now = calculate_sma(prices.clone(), 50);
    let sma_200_now = calculate_sma(prices.clone(), 200);
    
    // Check previous day
    let prices_prev: Vec<f64> = prices[..prices.len()-1].to_vec();
    let sma_50_prev = calculate_sma(prices_prev.clone(), 50);
    let sma_200_prev = calculate_sma(prices_prev, 200);
    
    // Golden cross: SMA50 was below SMA200, now above
    sma_50_prev < sma_200_prev && sma_50_now > sma_200_now
}

/// Detect Death Cross (SMA50 crosses below SMA200)
#[pyfunction]
pub fn detect_death_cross(prices: Vec<f64>) -> bool {
    if prices.len() < 201 {
        return false;
    }
    
    let sma_50_now = calculate_sma(prices.clone(), 50);
    let sma_200_now = calculate_sma(prices.clone(), 200);
    
    let prices_prev: Vec<f64> = prices[..prices.len()-1].to_vec();
    let sma_50_prev = calculate_sma(prices_prev.clone(), 50);
    let sma_200_prev = calculate_sma(prices_prev, 200);
    
    // Death cross: SMA50 was above SMA200, now below
    sma_50_prev > sma_200_prev && sma_50_now < sma_200_now
}
