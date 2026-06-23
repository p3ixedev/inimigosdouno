#!/usr/bin/env python3
"""
Backend API Tests for Inimigos do Uno
Tests all /api/matches endpoints
"""

import requests
import json
import sys
from typing import Dict, Any, Optional

# Base URL from frontend/.env
BASE_URL = "https://game-night-hub-12.preview.emergentagent.com/api"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    RESET = '\033[0m'
    BOLD = '\033[1m'

def print_test(test_name: str):
    print(f"\n{Colors.BLUE}{Colors.BOLD}{'='*80}{Colors.RESET}")
    print(f"{Colors.BLUE}{Colors.BOLD}TEST: {test_name}{Colors.RESET}")
    print(f"{Colors.BLUE}{Colors.BOLD}{'='*80}{Colors.RESET}")

def print_success(message: str):
    print(f"{Colors.GREEN}✓ {message}{Colors.RESET}")

def print_error(message: str):
    print(f"{Colors.RED}✗ {message}{Colors.RESET}")

def print_info(message: str):
    print(f"{Colors.YELLOW}ℹ {message}{Colors.RESET}")

def make_request(method: str, endpoint: str, data: Optional[Dict[str, Any]] = None) -> tuple:
    """Make HTTP request and return (status_code, response_json, error)"""
    url = f"{BASE_URL}{endpoint}"
    try:
        if method == "GET":
            response = requests.get(url, timeout=10)
        elif method == "POST":
            response = requests.post(url, json=data, timeout=10)
        elif method == "DELETE":
            response = requests.delete(url, timeout=10)
        else:
            return None, None, f"Unsupported method: {method}"
        
        try:
            response_json = response.json()
        except:
            response_json = {"raw_text": response.text}
        
        return response.status_code, response_json, None
    except Exception as e:
        return None, None, str(e)

def test_get_matches_initial():
    """Test 1: GET /api/matches - should return array (may be empty)"""
    print_test("1. GET /api/matches - Initial fetch")
    
    status, data, error = make_request("GET", "/matches")
    
    if error:
        print_error(f"Request failed: {error}")
        return False
    
    print_info(f"Status Code: {status}")
    print_info(f"Response: {json.dumps(data, indent=2)}")
    
    if status != 200:
        print_error(f"Expected status 200, got {status}")
        return False
    
    if not isinstance(data, list):
        print_error(f"Expected array response, got {type(data)}")
        return False
    
    print_success(f"GET /api/matches returned array with {len(data)} items")
    return True

def test_post_match_with_note():
    """Test 2: POST /api/matches with note"""
    print_test("2. POST /api/matches - Create match with note")
    
    payload = {
        "played": ["emanuel", "jacyane", "renan"],
        "winners": ["renan"],
        "note": "test rivalidade"
    }
    
    status, data, error = make_request("POST", "/matches", payload)
    
    if error:
        print_error(f"Request failed: {error}")
        return False, None
    
    print_info(f"Status Code: {status}")
    print_info(f"Response: {json.dumps(data, indent=2)}")
    
    if status != 200:
        print_error(f"Expected status 200, got {status}")
        return False, None
    
    # Validate response structure
    required_fields = ["id", "played", "winners", "note", "ts"]
    for field in required_fields:
        if field not in data:
            print_error(f"Missing required field: {field}")
            return False, None
    
    # Validate field types and values
    if not isinstance(data["id"], str) or len(data["id"]) == 0:
        print_error(f"Invalid id field: {data.get('id')}")
        return False, None
    
    if data["played"] != payload["played"]:
        print_error(f"Played mismatch: {data['played']} != {payload['played']}")
        return False, None
    
    if data["winners"] != payload["winners"]:
        print_error(f"Winners mismatch: {data['winners']} != {payload['winners']}")
        return False, None
    
    if data["note"] != payload["note"]:
        print_error(f"Note mismatch: {data['note']} != {payload['note']}")
        return False, None
    
    if not isinstance(data["ts"], int) or data["ts"] <= 0:
        print_error(f"Invalid timestamp: {data.get('ts')}")
        return False, None
    
    print_success(f"Match created successfully with id: {data['id']}")
    return True, data["id"]

def test_post_match_without_note():
    """Test 3: POST /api/matches without note"""
    print_test("3. POST /api/matches - Create match without note")
    
    payload = {
        "played": ["emanuel", "mayara"],
        "winners": ["emanuel"]
    }
    
    status, data, error = make_request("POST", "/matches", payload)
    
    if error:
        print_error(f"Request failed: {error}")
        return False, None
    
    print_info(f"Status Code: {status}")
    print_info(f"Response: {json.dumps(data, indent=2)}")
    
    if status != 200:
        print_error(f"Expected status 200, got {status}")
        return False, None
    
    # Validate note is null
    if data.get("note") is not None:
        print_error(f"Expected note to be null, got: {data.get('note')}")
        return False, None
    
    # Validate ts is populated
    if not isinstance(data.get("ts"), int) or data["ts"] <= 0:
        print_error(f"Invalid timestamp: {data.get('ts')}")
        return False, None
    
    print_success(f"Match created successfully without note, id: {data['id']}")
    return True, data["id"]

def test_validation_errors():
    """Test 4: Validation tests - should return 400"""
    print_test("4. Validation Tests - Should return 400")
    
    all_passed = True
    
    # Test 4a: Only 1 player
    print_info("\n4a. Testing: played has only 1 player")
    payload = {"played": ["emanuel"], "winners": ["emanuel"]}
    status, data, error = make_request("POST", "/matches", payload)
    
    if error:
        print_error(f"Request failed: {error}")
        all_passed = False
    elif status != 400:
        print_error(f"Expected status 400, got {status}. Response: {data}")
        all_passed = False
    else:
        print_success("Correctly rejected: played with only 1 player")
    
    # Test 4b: Empty winners
    print_info("\n4b. Testing: winners is empty")
    payload = {"played": ["emanuel", "renan"], "winners": []}
    status, data, error = make_request("POST", "/matches", payload)
    
    if error:
        print_error(f"Request failed: {error}")
        all_passed = False
    elif status != 400:
        print_error(f"Expected status 400, got {status}. Response: {data}")
        all_passed = False
    else:
        print_success("Correctly rejected: empty winners array")
    
    # Test 4c: Winner not in played
    print_info("\n4c. Testing: winner not in played list")
    payload = {"played": ["emanuel", "renan"], "winners": ["mayara"]}
    status, data, error = make_request("POST", "/matches", payload)
    
    if error:
        print_error(f"Request failed: {error}")
        all_passed = False
    elif status != 400:
        print_error(f"Expected status 400, got {status}. Response: {data}")
        all_passed = False
    else:
        print_success("Correctly rejected: winner not in played list")
    
    return all_passed

def test_get_matches_with_data(expected_count: int = 2):
    """Test 5: GET /api/matches - should contain created matches"""
    print_test(f"5. GET /api/matches - Should contain at least {expected_count} matches")
    
    status, data, error = make_request("GET", "/matches")
    
    if error:
        print_error(f"Request failed: {error}")
        return False
    
    print_info(f"Status Code: {status}")
    print_info(f"Response: {json.dumps(data, indent=2)}")
    
    if status != 200:
        print_error(f"Expected status 200, got {status}")
        return False
    
    if not isinstance(data, list):
        print_error(f"Expected array response, got {type(data)}")
        return False
    
    if len(data) < expected_count:
        print_error(f"Expected at least {expected_count} matches, got {len(data)}")
        return False
    
    # Check if sorted by ts descending (newest first)
    if len(data) >= 2:
        for i in range(len(data) - 1):
            if data[i]["ts"] < data[i + 1]["ts"]:
                print_error(f"Matches not sorted by ts descending: {data[i]['ts']} < {data[i+1]['ts']}")
                return False
        print_success("Matches correctly sorted by ts descending (newest first)")
    
    print_success(f"GET /api/matches returned {len(data)} matches")
    return True

def test_delete_match(match_id: str):
    """Test 6: DELETE /api/matches/{id} - should return deleted: 1"""
    print_test(f"6. DELETE /api/matches/{match_id}")
    
    status, data, error = make_request("DELETE", f"/matches/{match_id}")
    
    if error:
        print_error(f"Request failed: {error}")
        return False
    
    print_info(f"Status Code: {status}")
    print_info(f"Response: {json.dumps(data, indent=2)}")
    
    if status != 200:
        print_error(f"Expected status 200, got {status}")
        return False
    
    if data.get("deleted") != 1:
        print_error(f"Expected deleted: 1, got {data}")
        return False
    
    print_success(f"Match {match_id} deleted successfully")
    return True

def test_delete_nonexistent():
    """Test 7: DELETE /api/matches/non-existent-id - should return deleted: 0"""
    print_test("7. DELETE /api/matches/non-existent-id")
    
    fake_id = "non-existent-uuid-12345"
    status, data, error = make_request("DELETE", f"/matches/{fake_id}")
    
    if error:
        print_error(f"Request failed: {error}")
        return False
    
    print_info(f"Status Code: {status}")
    print_info(f"Response: {json.dumps(data, indent=2)}")
    
    if status != 200:
        print_error(f"Expected status 200, got {status}")
        return False
    
    if data.get("deleted") != 0:
        print_error(f"Expected deleted: 0, got {data}")
        return False
    
    print_success("Correctly returned deleted: 0 for non-existent match")
    return True

def test_verify_deletion(deleted_id: str, remaining_id: str):
    """Test 8: Final GET - verify deletion"""
    print_test("8. Final GET /api/matches - Verify deletion")
    
    status, data, error = make_request("GET", "/matches")
    
    if error:
        print_error(f"Request failed: {error}")
        return False
    
    print_info(f"Status Code: {status}")
    print_info(f"Response: {json.dumps(data, indent=2)}")
    
    if status != 200:
        print_error(f"Expected status 200, got {status}")
        return False
    
    # Check deleted match is gone
    deleted_found = any(match["id"] == deleted_id for match in data)
    if deleted_found:
        print_error(f"Deleted match {deleted_id} still present in results")
        return False
    
    print_success(f"Deleted match {deleted_id} is gone")
    
    # Check remaining match is still there
    remaining_found = any(match["id"] == remaining_id for match in data)
    if not remaining_found:
        print_error(f"Remaining match {remaining_id} not found in results")
        return False
    
    print_success(f"Remaining match {remaining_id} is still present")
    return True

def main():
    print(f"\n{Colors.BOLD}{'='*80}{Colors.RESET}")
    print(f"{Colors.BOLD}Inimigos do Uno - Backend API Tests{Colors.RESET}")
    print(f"{Colors.BOLD}Base URL: {BASE_URL}{Colors.RESET}")
    print(f"{Colors.BOLD}{'='*80}{Colors.RESET}\n")
    
    results = []
    
    # Test 1: Initial GET
    results.append(("GET /api/matches (initial)", test_get_matches_initial()))
    
    # Test 2: POST with note
    success, match_id_1 = test_post_match_with_note()
    results.append(("POST /api/matches (with note)", success))
    
    # Test 3: POST without note
    success, match_id_2 = test_post_match_without_note()
    results.append(("POST /api/matches (without note)", success))
    
    # Test 4: Validation errors
    results.append(("Validation tests (400 errors)", test_validation_errors()))
    
    # Test 5: GET with data
    results.append(("GET /api/matches (with data)", test_get_matches_with_data(2)))
    
    # Test 6: DELETE existing match
    if match_id_1:
        results.append(("DELETE existing match", test_delete_match(match_id_1)))
    else:
        print_error("Skipping DELETE test - no match_id_1 available")
        results.append(("DELETE existing match", False))
    
    # Test 7: DELETE non-existent
    results.append(("DELETE non-existent match", test_delete_nonexistent()))
    
    # Test 8: Verify deletion
    if match_id_1 and match_id_2:
        results.append(("Verify deletion", test_verify_deletion(match_id_1, match_id_2)))
    else:
        print_error("Skipping verification test - missing match IDs")
        results.append(("Verify deletion", False))
    
    # Summary
    print(f"\n{Colors.BOLD}{'='*80}{Colors.RESET}")
    print(f"{Colors.BOLD}TEST SUMMARY{Colors.RESET}")
    print(f"{Colors.BOLD}{'='*80}{Colors.RESET}\n")
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        if result:
            print_success(f"{test_name}")
        else:
            print_error(f"{test_name}")
    
    print(f"\n{Colors.BOLD}Total: {passed}/{total} tests passed{Colors.RESET}")
    
    if passed == total:
        print(f"{Colors.GREEN}{Colors.BOLD}✓ ALL TESTS PASSED{Colors.RESET}\n")
        return 0
    else:
        print(f"{Colors.RED}{Colors.BOLD}✗ SOME TESTS FAILED{Colors.RESET}\n")
        return 1

if __name__ == "__main__":
    sys.exit(main())
