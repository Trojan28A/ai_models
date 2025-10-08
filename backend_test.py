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

    def test_chat_endpoint(self):
        """Test the mocked chat endpoint"""
        try:
            response = requests.post(f"{self.api_url}/chat", 
                                   json={
                                       "model_id": "test-model",
                                       "prompt": "Hello, this is a test",
                                       "temperature": 0.7,
                                       "max_tokens": 100
                                   }, 
                                   timeout=10)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                has_response = 'response' in data
                has_usage = 'usage' in data
                details = f"Has response: {has_response}, Has usage: {has_usage}"
                self.log_test("Chat Endpoint (Mocked)", has_response and has_usage, details)
                return has_response and has_usage
            else:
                self.log_test("Chat Endpoint (Mocked)", False, 
                            f"Status: {response.status_code}", 200, response.status_code)
                return False
                
        except Exception as e:
            self.log_test("Chat Endpoint (Mocked)", False, f"Exception: {str(e)}")
            return False

    def test_image_generation_endpoint(self):
        """Test the mocked image generation endpoint"""
        try:
            response = requests.post(f"{self.api_url}/generate-image", 
                                   json={
                                       "model_id": "test-image-model",
                                       "prompt": "A beautiful sunset"
                                   }, 
                                   timeout=10)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                has_image_url = 'image_url' in data
                has_model = 'model' in data
                details = f"Has image_url: {has_image_url}, Has model: {has_model}"
                self.log_test("Image Generation Endpoint (Mocked)", has_image_url and has_model, details)
                return has_image_url and has_model
            else:
                self.log_test("Image Generation Endpoint (Mocked)", False, 
                            f"Status: {response.status_code}", 200, response.status_code)
                return False
                
        except Exception as e:
            self.log_test("Image Generation Endpoint (Mocked)", False, f"Exception: {str(e)}")
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

    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting AI Models Hub Backend Tests")
        print(f"Testing against: {self.base_url}")
        print("=" * 60)

        # Test basic connectivity
        root_ok = self.test_root_endpoint()
        
        # Test core functionality
        models_ok = self.test_models_endpoint()
        plans_ok = self.test_models_by_plan()
        
        # Test API key management
        api_key_ok = self.test_api_key_management()
        
        # Test mocked endpoints
        chat_ok = self.test_chat_endpoint()
        image_ok = self.test_image_generation_endpoint()
        
        # Test status endpoints
        status_ok = self.test_status_endpoints()

        print("=" * 60)
        print(f"📊 Tests completed: {self.tests_passed}/{self.tests_run} passed")
        
        # Determine overall success
        critical_tests = [root_ok, models_ok, plans_ok]
        critical_success = all(critical_tests)
        
        if critical_success:
            print("✅ All critical backend tests passed!")
        else:
            print("❌ Some critical backend tests failed!")
            
        return {
            "total_tests": self.tests_run,
            "passed_tests": self.tests_passed,
            "success_rate": (self.tests_passed / self.tests_run) * 100 if self.tests_run > 0 else 0,
            "critical_success": critical_success,
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