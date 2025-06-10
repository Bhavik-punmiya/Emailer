import functions_framework
import json

@functions_framework.http
def test_function(request):
    """Simple test function to verify GCF deployment works"""
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    }
    
    if request.method == 'OPTIONS':
        return ('', 204, headers)
    
    return json.dumps({"message": "Test function working", "status": "success"}), 200, headers 