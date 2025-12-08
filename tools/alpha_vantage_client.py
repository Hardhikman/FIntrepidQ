import requests
from typing import Optional, Dict, Any
from langchain_core.tools import StructuredTool
from utils import config


class AlphaVantageAPIKeyError(Exception):
    """Raised when Alpha Vantage API key is missing."""
    pass


class AlphaVantageClient:
    """
    Client for interacting with the Alpha Vantage API.
    """
    BASE_URL = "https://www.alphavantage.co/query"

    def __init__(self, api_key: Optional[str] = None, raise_on_missing_key: bool = False):
        self.api_key = api_key or config.ALPHA_VANTAGE_API_KEY
        self.raise_on_missing_key = raise_on_missing_key
        if not self.api_key:
            if raise_on_missing_key:
                raise AlphaVantageAPIKeyError("ALPHA_VANTAGE_API_KEY not found. Set it in .env file.")
            print("Warning: ALPHA_VANTAGE_API_KEY not found. Alpha Vantage features will be disabled.")

    def _make_request(self, function: str, symbol: str, **kwargs) -> Dict[str, Any]:
        """
        Helper to make API requests.
        """
        if not self.api_key:
            return {"error": "API key missing"}

        params = {
            "function": function,
            "symbol": symbol,
            "apikey": self.api_key,
            **kwargs
        }
        
        try:
            response = requests.get(self.BASE_URL, params=params)
            response.raise_for_status()
            data = response.json()
            
            # Check for API error messages
            if "Error Message" in data:
                return {"error": data["Error Message"]}
            if "Note" in data:
                # API limit reached or similar note
                print(f"Alpha Vantage Note: {data['Note']}")
                
            return data
        except requests.RequestException as e:
            return {"error": f"Network error: {str(e)}"}
        except (ValueError, KeyError) as e:
            return {"error": f"Data parsing error: {str(e)}"}

    def get_company_overview(self, symbol: str) -> Dict[str, Any]:
        return self._make_request("OVERVIEW", symbol)

    def get_income_statement(self, symbol: str) -> Dict[str, Any]:
        return self._make_request("INCOME_STATEMENT", symbol)

    def get_balance_sheet(self, symbol: str) -> Dict[str, Any]:
        return self._make_request("BALANCE_SHEET", symbol)

    def get_cash_flow(self, symbol: str) -> Dict[str, Any]:
        return self._make_request("CASH_FLOW", symbol)

    def get_global_quote(self, symbol: str) -> Dict[str, Any]:
        return self._make_request("GLOBAL_QUOTE", symbol)
        
    def get_news_sentiment(self, symbol: str) -> Dict[str, Any]:
        return self._make_request("NEWS_SENTIMENT", symbol, tickers=symbol)

# --- Tool Definitions ---

def _get_alpha_vantage_data(ticker: str) -> Dict[str, Any]:
    """
    Fetch comprehensive financial data from Alpha Vantage.
    """
    client = AlphaVantageClient()
    ticker = ticker.upper().strip()
    
    print(f" [Alpha Vantage] Fetching data for {ticker}...")
    
    overview = client.get_company_overview(ticker)
    quote = client.get_global_quote(ticker)
    income = client.get_income_statement(ticker)
    balance = client.get_balance_sheet(ticker)
    cash_flow = client.get_cash_flow(ticker)
    
    # Normalize data structure to be somewhat compatible/comparable with other sources
    data = {
        "overview": overview,
        "quote": quote.get("Global Quote", {}),
        "income_statement": income,
        "balance_sheet": balance,
        "cash_flow": cash_flow
    }
    
    # Check all responses for errors (not just overview)
    errors = []
    for name, response in [("overview", overview), ("quote", quote), 
                           ("income", income), ("balance", balance), 
                           ("cash_flow", cash_flow)]:
        if isinstance(response, dict) and "error" in response:
            errors.append(f"{name}: {response['error']}")
    
    if errors:
        return {
            "status": "error",
            "errors": errors,
            "data": data  # Still return partial data that may be usable
        }
    
    return {
        "status": "success",
        "data": data
    }

def _get_alpha_vantage_news(ticker: str) -> Dict[str, Any]:
    """
    Fetch news and sentiment data from Alpha Vantage.
    """
    client = AlphaVantageClient()
    ticker = ticker.upper().strip()
    
    print(f" [Alpha Vantage] Fetching news for {ticker}...")
    
    news_data = client.get_news_sentiment(ticker)
    
    return {
        "status": "success" if "error" not in news_data else "error",
        "data": news_data
    }

get_alpha_vantage_data_tool = StructuredTool.from_function(
    name="get_alpha_vantage_data",
    description="Fetch comprehensive financial data (Overview, Income, Balance Sheet, Cash Flow, Quote) from Alpha Vantage.",
    func=_get_alpha_vantage_data,
)

get_alpha_vantage_news_tool = StructuredTool.from_function(
    name="get_alpha_vantage_news",
    description="Fetch news sentiment and articles from Alpha Vantage.",
    func=_get_alpha_vantage_news,
)
