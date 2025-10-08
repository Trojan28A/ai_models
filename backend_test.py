import requests
import sys
import json
from datetime import datetime

class AIModelsHubTester:
    def __init__(self, base_url="https://api-integration-24.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details="", expected_status=None, actual_status=None):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
            if expected_status and actual_status:
                print(f"   Expected status: {expected_status}, Got: {actual_status}")
        
        self.test_results.append({
            "test_name": name,
            "success": success,
            "details": details,
            "expected_status": expected_status,
            "actual_status": actual_status
        })

    def test_root_endpoint(self):
        """Test the root API endpoint"""
        try:
            response = requests.get(f"{self.api_url}/", timeout=10)
            success = response.status_code == 200
            details = response.json() if success else f"Status: {response.status_code}"
            self.log_test("Root API Endpoint", success, str(details), 200, response.status_code)
            return success
        except Exception as e:
            self.log_test("Root API Endpoint", False, f"Exception: {str(e)}")
            return False

    def test_models_endpoint(self):
        """Test the main models endpoint that should return 412 models"""
        try:
            response = requests.get(f"{self.api_url}/models", timeout=30)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                total_models = data.get('total_models', 0)
                models_list = data.get('models', [])
                categorized = data.get('categorized', {})
                
                # Check if we have the expected number of models (around 412)
                models_count_ok = total_models > 400 and len(models_list) > 400
                
                # Check categorization
                categories = ['text', 'image', 'audio', 'video', 'other']
                categorization_ok = all(cat in categorized for cat in categories)
                
                details = f"Total models: {total_models}, Categories: {list(categorized.keys())}"
                
                if models_count_ok and categorization_ok:
                    self.log_test("Models Endpoint (412 models)", True, details)
                    return True
                else:
                    self.log_test("Models Endpoint (412 models)", False, 
                                f"Expected >400 models, got {total_models}. Categorization OK: {categorization_ok}")
                    return False
            else:
                self.log_test("Models Endpoint (412 models)", False, 
                            f"Status: {response.status_code}", 200, response.status_code)
                return False
                
        except Exception as e:
            self.log_test("Models Endpoint (412 models)", False, f"Exception: {str(e)}")
            return False

    def test_models_by_plan(self):
        """Test models endpoints for different plans"""
        plans = ["free", "basic", "pro"]
        all_success = True
        
        for plan in plans:
            try:
                response = requests.get(f"{self.api_url}/models/{plan}", timeout=20)
                success = response.status_code == 200
                
                if success:
                    data = response.json()
                    models = data.get('models', [])
                    details = f"Plan {plan}: {len(models)} models"
                    self.log_test(f"Models Endpoint - {plan.upper()} plan", True, details)
                else:
                    self.log_test(f"Models Endpoint - {plan.upper()} plan", False, 
                                f"Status: {response.status_code}", 200, response.status_code)
                    all_success = False
                    
            except Exception as e:
                self.log_test(f"Models Endpoint - {plan.upper()} plan", False, f"Exception: {str(e)}")
                all_success = False
        
        return all_success

    def test_api_key_management(self):
        """Test API key management endpoints"""
        test_api_key = f"test_key_{datetime.now().strftime('%H%M%S')}"
        
        # Test saving API key
        try:
            response = requests.post(f"{self.api_url}/api-keys", 
                                   json={"api_key": test_api_key, "provider": "a4f"}, 
                                   timeout=10)
            save_success = response.status_code == 200
            self.log_test("Save API Key", save_success, 
                        f"Status: {response.status_code}", 200, response.status_code)
        except Exception as e:
            self.log_test("Save API Key", False, f"Exception: {str(e)}")
            save_success = False

        # Test retrieving API key
        try:
            response = requests.get(f"{self.api_url}/api-keys/a4f", timeout=10)
            get_success = response.status_code == 200
            if get_success:
                data = response.json()
                key_matches = data and data.get('api_key') == test_api_key
                self.log_test("Get API Key", key_matches, 
                            f"Retrieved key matches: {key_matches}")
            else:
                self.log_test("Get API Key", False, 
                            f"Status: {response.status_code}", 200, response.status_code)
                get_success = False
        except Exception as e:
            self.log_test("Get API Key", False, f"Exception: {str(e)}")
            get_success = False

        # Test deleting API key
        try:
            response = requests.delete(f"{self.api_url}/api-keys/a4f", timeout=10)
            delete_success = response.status_code == 200
            self.log_test("Delete API Key", delete_success, 
                        f"Status: {response.status_code}", 200, response.status_code)
        except Exception as e:
            self.log_test("Delete API Key", False, f"Exception: {str(e)}")
            delete_success = False

        return save_success and get_success and delete_success

    def test_chat_endpoint_real_api(self):
        """Test the chat endpoint with real A4F API"""
        # First save the API key
        api_key = "ddc-a4f-e3ce624cd8c148bea8d2d373ba29aa3d"
        try:
            # Save API key first
            requests.post(f"{self.api_url}/api-keys", 
                         json={"api_key": api_key, "provider": "a4f"}, 
                         timeout=10)
            
            # Test with deepseek-v3 model as specified in the request
            response = requests.post(f"{self.api_url}/chat", 
                                   json={
                                       "model_id": "deepseek-v3",
                                       "prompt": "Hello, how are you?",
                                       "temperature": 0.7,
                                       "max_tokens": 100
                                   }, 
                                   timeout=30)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                has_response = 'response' in data
                has_error = 'error' in data
                
                if has_error:
                    self.log_test("Chat Endpoint (Real A4F API)", False, 
                                f"API Error: {data['error']}")
                    return False
                elif has_response:
                    # Check if response looks like real AI content (not mock)
                    response_text = data['response']
                    is_mock = "mock" in response_text.lower() or "placeholder" in response_text.lower()
                    details = f"Response length: {len(response_text)}, Is mock: {is_mock}"
                    self.log_test("Chat Endpoint (Real A4F API)", not is_mock and len(response_text) > 10, details)
                    return not is_mock and len(response_text) > 10
                else:
                    self.log_test("Chat Endpoint (Real A4F API)", False, "No response field in data")
                    return False
            else:
                self.log_test("Chat Endpoint (Real A4F API)", False, 
                            f"Status: {response.status_code}", 200, response.status_code)
                return False
                
        except Exception as e:
            self.log_test("Chat Endpoint (Real A4F API)", False, f"Exception: {str(e)}")
            return False

    def test_image_generation_endpoint_real_api(self):
        """Test the image generation endpoint with real A4F API"""
        # API key should already be saved from previous test
        try:
            # Test with midjourney-v7 model as specified in the request
            response = requests.post(f"{self.api_url}/generate-image", 
                                   json={
                                       "model_id": "midjourney-v7",
                                       "prompt": "A sunset over mountains"
                                   }, 
                                   timeout=60)  # Longer timeout for image generation
            success = response.status_code == 200
            
            if success:
                data = response.json()
                has_image_url = 'image_url' in data
                has_error = 'error' in data
                
                if has_error:
                    self.log_test("Image Generation Endpoint (Real A4F API)", False, 
                                f"API Error: {data['error']}")
                    return False
                elif has_image_url:
                    # Check if image URL looks real (not mock)
                    image_url = data['image_url']
                    is_mock = "mock" in image_url.lower() or "placeholder" in image_url.lower() or "example.com" in image_url.lower()
                    is_valid_url = image_url.startswith(('http://', 'https://'))
                    details = f"Image URL: {image_url[:50]}..., Is mock: {is_mock}, Valid URL: {is_valid_url}"
                    self.log_test("Image Generation Endpoint (Real A4F API)", not is_mock and is_valid_url, details)
                    return not is_mock and is_valid_url
                else:
                    self.log_test("Image Generation Endpoint (Real A4F API)", False, "No image_url field in data")
                    return False
            else:
                self.log_test("Image Generation Endpoint (Real A4F API)", False, 
                            f"Status: {response.status_code}", 200, response.status_code)
                return False
                
        except Exception as e:
            self.log_test("Image Generation Endpoint (Real A4F API)", False, f"Exception: {str(e)}")
            return False

    def test_status_endpoints(self):
        """Test status check endpoints"""
        # Test creating status check
        try:
            response = requests.post(f"{self.api_url}/status", 
                                   json={"client_name": "test_client"}, 
                                   timeout=10)
            create_success = response.status_code == 200
            self.log_test("Create Status Check", create_success, 
                        f"Status: {response.status_code}", 200, response.status_code)
        except Exception as e:
            self.log_test("Create Status Check", False, f"Exception: {str(e)}")
            create_success = False

        # Test getting status checks
        try:
            response = requests.get(f"{self.api_url}/status", timeout=10)
            get_success = response.status_code == 200
            self.log_test("Get Status Checks", get_success, 
                        f"Status: {response.status_code}", 200, response.status_code)
        except Exception as e:
            self.log_test("Get Status Checks", False, f"Exception: {str(e)}")
            get_success = False

        return create_success and get_success

    def test_different_free_tier_models(self):
        """Test chat with different models from free tier (API key is on free plan)"""
        # Test multiple free tier models since API key is on free plan
        test_models = [
            "gpt-4o-mini",
            "llama-3.1-70b", 
            "qwen-2.5-72b"
        ]
        
        all_success = True
        for model_id in test_models:
            try:
                response = requests.post(f"{self.api_url}/chat", 
                                       json={
                                           "model_id": model_id,
                                           "prompt": "Say hello in one sentence",
                                           "temperature": 0.5,
                                           "max_tokens": 50
                                       }, 
                                       timeout=30)
                success = response.status_code == 200
                
                if success:
                    data = response.json()
                    has_response = 'response' in data and not 'error' in data
                    if has_response:
                        response_text = data['response']
                        is_real = len(response_text) > 5 and not 'mock' in response_text.lower()
                        details = f"Model: {model_id}, Real response: {is_real}, Length: {len(response_text)}"
                        self.log_test(f"Chat with {model_id}", is_real, details)
                        if not is_real:
                            all_success = False
                    else:
                        error_msg = data.get('error', 'No error message')
                        details = f"Model: {model_id}, Error: {error_msg}"
                        self.log_test(f"Chat with {model_id}", False, details)
                        all_success = False
                else:
                    self.log_test(f"Chat with {model_id}", False, 
                                f"Status: {response.status_code}", 200, response.status_code)
                    all_success = False
                    
            except Exception as e:
                self.log_test(f"Chat with {model_id}", False, f"Exception: {str(e)}")
                all_success = False
        
        return all_success

    def test_plan_restrictions(self):
        """Test that plan restrictions are properly enforced"""
        try:
            # Try to use a basic/pro tier model with free plan API key
            response = requests.post(f"{self.api_url}/chat", 
                                   json={
                                       "model_id": "gpt-4.1",  # Basic tier model
                                       "prompt": "This should be restricted",
                                       "temperature": 0.5,
                                       "max_tokens": 50
                                   }, 
                                   timeout=30)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                has_error = 'error' in data
                if has_error:
                    error_msg = data['error']
                    is_plan_restriction = 'not available for your current plan' in error_msg
                    details = f"Plan restriction properly enforced: {is_plan_restriction}, Error: {error_msg[:100]}..."
                    self.log_test("Plan Restriction Enforcement", is_plan_restriction, details)
                    return is_plan_restriction
                else:
                    # If no error, this might indicate a problem with plan enforcement
                    self.log_test("Plan Restriction Enforcement", False, 
                                "Expected plan restriction error but got response")
                    return False
            else:
                # Non-200 status is also acceptable for plan restrictions
                self.log_test("Plan Restriction Enforcement", True, 
                            f"Properly returned error status: {response.status_code}")
                return True
                
        except Exception as e:
            self.log_test("Plan Restriction Enforcement", False, f"Exception: {str(e)}")
            return False

    def test_invalid_model_error_handling(self):
        """Test error handling with invalid model names"""
        try:
            response = requests.post(f"{self.api_url}/chat", 
                                   json={
                                       "model_id": "invalid-model-name-12345",
                                       "prompt": "This should fail",
                                       "temperature": 0.7,
                                       "max_tokens": 100
                                   }, 
                                   timeout=30)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                has_error = 'error' in data
                details = f"Has error field: {has_error}"
                if has_error:
                    error_msg = data['error']
                    details += f", Error: {error_msg}"
                self.log_test("Invalid Model Error Handling", has_error, details)
                return has_error
            else:
                # Non-200 status is also acceptable for invalid model
                self.log_test("Invalid Model Error Handling", True, 
                            f"Properly returned error status: {response.status_code}")
                return True
                
        except Exception as e:
            self.log_test("Invalid Model Error Handling", False, f"Exception: {str(e)}")
            return False

    def test_api_key_authentication(self):
        """Test that API key is being used correctly for authentication"""
        # First test without API key (should fail or return error)
        try:
            # Delete any existing API key
            requests.delete(f"{self.api_url}/api-keys/a4f", timeout=10)
            
            response = requests.post(f"{self.api_url}/chat", 
                                   json={
                                       "model_id": "gpt-4o-mini",
                                       "prompt": "This should require API key",
                                       "temperature": 0.7,
                                       "max_tokens": 50
                                   }, 
                                   timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                has_error = 'error' in data
                error_mentions_key = has_error and 'api key' in data['error'].lower()
                self.log_test("No API Key Error Handling", error_mentions_key, 
                            f"Error mentions API key: {error_mentions_key}")
                return error_mentions_key
            else:
                # Non-200 status is acceptable when no API key
                self.log_test("No API Key Error Handling", True, 
                            f"Properly returned error status: {response.status_code}")
                return True
                
        except Exception as e:
            self.log_test("No API Key Error Handling", False, f"Exception: {str(e)}")
            return False

    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting AI Models Hub Backend Tests - A4F API Integration")
        print(f"Testing against: {self.base_url}")
        print("=" * 60)

        # Test basic connectivity
        root_ok = self.test_root_endpoint()
        
        # Test core functionality
        models_ok = self.test_models_endpoint()
        plans_ok = self.test_models_by_plan()
        
        # Test API key management
        api_key_ok = self.test_api_key_management()
        
        # Test status endpoints
        status_ok = self.test_status_endpoints()
        
        print("\n🔥 CRITICAL A4F API INTEGRATION TESTS:")
        print("-" * 40)
        
        # Test A4F API authentication and real responses
        auth_ok = self.test_api_key_authentication()
        chat_real_ok = self.test_chat_endpoint_real_api()
        image_real_ok = self.test_image_generation_endpoint_real_api()
        free_models_ok = self.test_different_free_tier_models()
        plan_restrictions_ok = self.test_plan_restrictions()
        error_handling_ok = self.test_invalid_model_error_handling()

        print("=" * 60)
        print(f"📊 Tests completed: {self.tests_passed}/{self.tests_run} passed")
        
        # Determine overall success - focus on A4F API integration
        critical_tests = [root_ok, models_ok, plans_ok]
        a4f_integration_tests = [chat_real_ok, image_real_ok, auth_ok]
        
        critical_success = all(critical_tests)
        a4f_success = all(a4f_integration_tests)
        
        print(f"\n🎯 A4F API Integration Status:")
        print(f"   Chat API: {'✅' if chat_real_ok else '❌'}")
        print(f"   Image API: {'✅' if image_real_ok else '❌'}")
        print(f"   Authentication: {'✅' if auth_ok else '❌'}")
        print(f"   Free Tier Models: {'✅' if free_models_ok else '❌'}")
        print(f"   Plan Restrictions: {'✅' if plan_restrictions_ok else '❌'}")
        print(f"   Error Handling: {'✅' if error_handling_ok else '❌'}")
        
        if critical_success and a4f_success:
            print("\n✅ All critical tests passed! A4F API integration is working correctly.")
        else:
            print("\n❌ Some critical tests failed!")
            if not a4f_success:
                print("   🚨 A4F API integration issues detected!")
            
        return {
            "total_tests": self.tests_run,
            "passed_tests": self.tests_passed,
            "success_rate": (self.tests_passed / self.tests_run) * 100 if self.tests_run > 0 else 0,
            "critical_success": critical_success,
            "a4f_integration_success": a4f_success,
            "detailed_results": self.test_results
        }

def main():
    tester = AIModelsHubTester()
    results = tester.run_all_tests()
    
    # Save results to file
    with open('/app/backend_test_results.json', 'w') as f:
        json.dump(results, f, indent=2)
    
    return 0 if results["critical_success"] else 1

if __name__ == "__main__":
    sys.exit(main())