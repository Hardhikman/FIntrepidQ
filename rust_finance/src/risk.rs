//! Risk calculations module
//! VaR, Sharpe Ratio, Volatility, Max Drawdown, Beta

use pyo3::prelude::*;

/// Calculate annualized volatility from daily returns
#[pyfunction]
pub fn calculate_volatility(returns: Vec<f64>) -> f64 {
    if returns.is_empty() {
        return 0.0;
    }
    
    let n = returns.len() as f64;
    let mean = returns.iter().sum::<f64>() / n;
    let variance = returns.iter().map(|r| (r - mean).powi(2)).sum::<f64>() / n;
    let std_dev = variance.sqrt();
    
    // Annualize (252 trading days)
    std_dev * (252.0_f64).sqrt()
}

/// Calculate Sharpe Ratio
#[pyfunction]
pub fn calculate_sharpe_ratio(returns: Vec<f64>, risk_free_rate: f64) -> f64 {
    if returns.is_empty() {
        return 0.0;
    }
    
    let n = returns.len() as f64;
    let mean_return = returns.iter().sum::<f64>() / n;
    let annualized_return = mean_return * 252.0;
    
    let volatility = calculate_volatility(returns);
    
    if volatility == 0.0 {
        return 0.0;
    }
    
    (annualized_return - risk_free_rate) / volatility
}

/// Calculate Value at Risk at 95% confidence
#[pyfunction]
pub fn calculate_var_95(returns: Vec<f64>) -> f64 {
    if returns.is_empty() {
        return 0.0;
    }
    
    let mut sorted_returns = returns.clone();
    sorted_returns.sort_by(|a, b| a.partial_cmp(b).unwrap());
    
    // 5th percentile index
    let index = ((returns.len() as f64) * 0.05).floor() as usize;
    sorted_returns[index.min(sorted_returns.len() - 1)]
}

/// Calculate Maximum Drawdown from prices
#[pyfunction]
pub fn calculate_max_drawdown(prices: Vec<f64>) -> f64 {
    if prices.is_empty() {
        return 0.0;
    }
    
    let mut max_drawdown = 0.0;
    let mut peak = prices[0];
    
    for price in prices.iter() {
        if *price > peak {
            peak = *price;
        }
        let drawdown = (peak - price) / peak;
        if drawdown > max_drawdown {
            max_drawdown = drawdown;
        }
    }
    
    -max_drawdown  // Return as negative value
}

/// Calculate Beta (stock vs market correlation)
#[pyfunction]
pub fn calculate_beta(stock_returns: Vec<f64>, market_returns: Vec<f64>) -> f64 {
    if stock_returns.len() != market_returns.len() || stock_returns.is_empty() {
        return 1.0;  // Default to market beta
    }
    
    let n = stock_returns.len() as f64;
    let stock_mean = stock_returns.iter().sum::<f64>() / n;
    let market_mean = market_returns.iter().sum::<f64>() / n;
    
    let covariance: f64 = stock_returns.iter()
        .zip(market_returns.iter())
        .map(|(s, m)| (s - stock_mean) * (m - market_mean))
        .sum::<f64>() / n;
    
    let market_variance: f64 = market_returns.iter()
        .map(|m| (m - market_mean).powi(2))
        .sum::<f64>() / n;
    
    if market_variance == 0.0 {
        return 1.0;
    }
    
    covariance / market_variance
}
