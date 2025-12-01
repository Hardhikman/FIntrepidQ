
from chat import _extract_response_content

def test_extract_response_content():
    # Test case 1: String input (legacy behavior)
    assert _extract_response_content("Hello world") == "Hello world"
    
    # Test case 2: List input (new behavior)
    input_list = [
        {
            'text': 'According to the analysis report dated November 30, 2025, Apple (AAPL) has a **H',
            'extras': {'signature': '...'}
        },
        {
            'text': 'igh** rating.',
            'extras': {}
        }
    ]
    expected_output = "According to the analysis report dated November 30, 2025, Apple (AAPL) has a **High** rating."
    assert _extract_response_content(input_list) == expected_output
    
    print("All tests passed!")

if __name__ == "__main__":
    test_extract_response_content()
