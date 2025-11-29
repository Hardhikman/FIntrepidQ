import sys
import os

# Add project root to path
sys.path.append(os.getcwd())

from tools.definitions import get_deep_financials_tool

def test_financials():
    print("Testing get_deep_financials_tool for AAPL...")
    result = get_deep_financials_tool.func("AAPL")
    
    if result['status'] == 'success':
        data = result['data']
        print("\n--- Keys in Data ---")
        print(data.keys())
        
        print("\n--- Technicals ---")
        print(data.get('technicals'))
        
        print("\n--- Risk Metrics ---")
        print(data.get('risk_metrics'))
        
        print("\n--- Financial Trends ---")
        print(data.get('financial_trends'))
        
        print("\n✅ Test Passed")
    else:
        print(f"\n❌ Test Failed: {result.get('error_message')}")

if __name__ == "__main__":
    test_financials()
