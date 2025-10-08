from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
import aiohttp
import json


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")  # Ignore MongoDB's _id field
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

class APIKey(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    api_key: str
    provider: str = "a4f"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class APIKeyCreate(BaseModel):
    api_key: str
    provider: str = "a4f"

class ModelRequest(BaseModel):
    model_id: str
    prompt: str
    temperature: Optional[float] = 0.7
    max_tokens: Optional[int] = 1000
    api_key: Optional[str] = None

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "AI Models Hub API"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    
    # Convert to dict and serialize datetime to ISO string for MongoDB
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    _ = await db.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    # Exclude MongoDB's _id field from the query results
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    
    # Convert ISO string timestamps back to datetime objects
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    
    return status_checks

# API Key management endpoints
@api_router.post("/api-keys", response_model=APIKey)
async def save_api_key(input: APIKeyCreate):
    api_key_dict = input.model_dump()
    api_key_obj = APIKey(**api_key_dict)
    
    # Convert to dict and serialize datetime to ISO string for MongoDB
    doc = api_key_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    # Remove existing API keys for the same provider
    await db.api_keys.delete_many({"provider": input.provider})
    
    _ = await db.api_keys.insert_one(doc)
    return api_key_obj

@api_router.get("/api-keys/{provider}")
async def get_api_key(provider: str):
    api_key = await db.api_keys.find_one({"provider": provider}, {"_id": 0})
    if api_key:
        if isinstance(api_key['created_at'], str):
            api_key['created_at'] = datetime.fromisoformat(api_key['created_at'])
        return api_key
    return None

@api_router.delete("/api-keys/{provider}")
async def delete_api_key(provider: str):
    result = await db.api_keys.delete_many({"provider": provider})
    return {"deleted_count": result.deleted_count}

# A4F Models endpoints
@api_router.get("/models/{plan}")
async def get_models(plan: str):
    """Fetch models from A4F API for the specified plan (free, basic, pro)"""
    try:
        # Default headers for A4F API
        headers = {
            'accept': '*/*',
            'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8',
            'priority': 'u=1, i',
            'referer': 'https://www.a4f.co/models',
            'sec-ch-ua': '"Not;A=Brand";v="99", "Google Chrome";v="139", "Chromium";v="139"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"Windows"',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'same-origin',
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36'
        }

        # Check if user has stored API key or use default endpoint
        stored_key = await db.api_keys.find_one({"provider": "a4f"}, {"_id": 0})
        
        url = f"https://www.a4f.co/api/get-display-models?plan={plan}"
        
        async with aiohttp.ClientSession() as session:
            async with session.get(url, headers=headers) as response:
                if response.status == 200:
                    data = await response.json()
                    return data
                else:
                    raise HTTPException(status_code=response.status, detail=f"Failed to fetch models from A4F API")
    
    except Exception as e:
        logger.error(f"Error fetching models: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching models: {str(e)}")

@api_router.get("/models")
async def get_all_models():
    """Fetch all models from all plans"""
    try:
        all_models = []
        plans = ["free", "basic", "pro"]
        
        for plan in plans:
            try:
                plan_data = await get_models(plan)
                if plan_data and "models" in plan_data:
                    for model in plan_data["models"]:
                        model["plan"] = plan  # Add plan info to each model
                        all_models.append(model)
            except Exception as e:
                logger.warning(f"Failed to fetch {plan} models: {str(e)}")
                continue
        
        # Categorize models by type
        categorized = {
            "text": [],
            "image": [],
            "audio": [],
            "video": [],
            "other": []
        }
        
        for model in all_models:
            model_type = model.get("type", "").lower()
            model_name = model.get("name", "").lower()
            
            if "chat" in model_type or "completion" in model_type or "text" in model_type:
                categorized["text"].append(model)
            elif "image" in model_type or "vision" in model_type or "dall" in model_name or "imagen" in model_name:
                categorized["image"].append(model)
            elif "audio" in model_type or "speech" in model_type or "whisper" in model_name:
                categorized["audio"].append(model)
            elif "video" in model_type or "sora" in model_name:
                categorized["video"].append(model)
            else:
                categorized["other"].append(model)
        
        return {
            "total_models": len(all_models),
            "models": all_models,
            "categorized": categorized
        }
    
    except Exception as e:
        logger.error(f"Error fetching all models: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching all models: {str(e)}")

def parse_a4f_error(error_response: str) -> str:
    """Parse A4F API error response and return user-friendly message"""
    try:
        if isinstance(error_response, str):
            error_data = json.loads(error_response)
        else:
            error_data = error_response
            
        # Handle different A4F error types
        if "detail" in error_data and "error" in error_data["detail"]:
            error_info = error_data["detail"]["error"]
            error_code = error_info.get("code", "")
            error_message = error_info.get("message", "")
            error_type = error_info.get("type", "")
            
            # Model not found or invalid
            if "provider_prefix_missing_or_model_not_found" in error_code:
                return f"❌ Model '{error_info.get('param', 'unknown')}' not found or unavailable. Please select a different model."
                
            # Rate limiting
            elif "rate_limit" in error_code.lower() or "quota" in error_message.lower():
                return "⏱️ Rate limit exceeded. You've hit your daily usage quota for this model. Please try again later or use a different model."
                
            # Model unavailable/down
            elif "unavailable" in error_message.lower() or "down" in error_message.lower():
                return "🚫 This model is temporarily unavailable or under maintenance. Please try a different model."
                
            # Authentication errors
            elif "unauthorized" in error_type.lower() or "auth" in error_code.lower():
                return "🔐 Authentication failed. Please check your API key in Settings."
                
            # Insufficient credits/payment required
            elif "credit" in error_message.lower() or "payment" in error_message.lower() or "billing" in error_message.lower():
                return "💳 Insufficient credits or payment required. Please check your A4F account billing status."
                
            # Model access restricted
            elif "access" in error_message.lower() or "permission" in error_message.lower():
                return "🔒 Access denied to this model. You may need to upgrade your A4F plan to use this model."
                
            # Server errors
            elif "internal_server_error" in error_code or error_type == "api_error":
                return "🔧 A4F service is experiencing issues. Please try again in a few minutes."
                
            # Generic error with original message
            else:
                return f"⚠️ Error: {error_message}"
        
        # Fallback for unknown error format
        return f"❌ API Error: {str(error_response)}"
        
    except Exception as e:
        logger.warning(f"Error parsing A4F error response: {str(e)}")
        return f"❌ Unexpected error: {str(error_response)}"

async def get_full_model_id(model_name: str):
    """Get the full model ID with provider prefix from A4F API"""
    try:
        # First try to fetch all models to find the correct provider prefix
        plans = ["free", "basic", "pro"]
        for plan in plans:
            url = f"https://www.a4f.co/api/get-display-models?plan={plan}"
            headers = {
                'accept': '*/*',
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36'
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url, headers=headers) as response:
                    if response.status == 200:
                        data = await response.json()
                        if "models" in data:
                            for model in data["models"]:
                                if model.get("name") == model_name:
                                    # Return the first available provider
                                    if model.get("proxy_providers"):
                                        provider_id = model["proxy_providers"][0]["id"]
                                        return provider_id
        
        # If no provider found, try the name as-is (might already have prefix)
        return model_name
        
    except Exception as e:
        logger.warning(f"Error getting full model ID: {str(e)}")
        # Fallback to the original name
        return model_name

@api_router.post("/chat")
async def chat_with_model(request: ModelRequest):
    """Chat with a text model"""
    try:
        # Get API key from request or stored keys
        api_key = request.api_key
        if not api_key:
            stored_key = await db.api_keys.find_one({"provider": "a4f"}, {"_id": 0})
            if stored_key:
                api_key = stored_key["api_key"]
        
        if not api_key:
            return {"error": "No API key provided. Please add your A4F API key in settings."}
        
        # Get the full model ID with provider prefix
        full_model_id = await get_full_model_id(request.model_id)
        
        # Make real API call to A4F
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": full_model_id,
            "messages": [{"role": "user", "content": request.prompt}],
            "temperature": request.temperature,
            "max_tokens": request.max_tokens
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.post(
                "https://api.a4f.co/v1/chat/completions", 
                headers=headers, 
                json=payload
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    if "choices" in data and len(data["choices"]) > 0:
                        return {
                            "response": data["choices"][0]["message"]["content"],
                            "model": request.model_id,
                            "usage": data.get("usage", {
                                "prompt_tokens": len(request.prompt.split()),
                                "completion_tokens": 50,
                                "total_tokens": len(request.prompt.split()) + 50
                            })
                        }
                    else:
                        return {"error": "No response from model"}
                else:
                    error_text = await response.text()
                    user_friendly_error = parse_a4f_error(error_text)
                    return {"error": user_friendly_error, "status_code": response.status}
    
    except aiohttp.ClientError as e:
        logger.error(f"Network error in chat: {str(e)}")
        return {"error": "🌐 Network error. Please check your internet connection and try again."}
    except Exception as e:
        logger.error(f"Error in chat: {str(e)}")
        return {"error": f"⚠️ Unexpected error: {str(e)}"}

@api_router.post("/generate-image")
async def generate_image(request: ModelRequest):
    """Generate image with a model"""
    try:
        # Get API key from request or stored keys
        api_key = request.api_key
        if not api_key:
            stored_key = await db.api_keys.find_one({"provider": "a4f"}, {"_id": 0})
            if stored_key:
                api_key = stored_key["api_key"]
        
        if not api_key:
            return {"error": "No API key provided. Please add your A4F API key in settings."}
        
        # Get the full model ID with provider prefix
        full_model_id = await get_full_model_id(request.model_id)
        
        # Make real API call to A4F for image generation
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": full_model_id,
            "prompt": request.prompt,
            "n": 1,
            "size": "512x512"
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.post(
                "https://api.a4f.co/v1/images/generations", 
                headers=headers, 
                json=payload
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    if "data" in data and len(data["data"]) > 0:
                        return {
                            "image_url": data["data"][0]["url"],
                            "model": request.model_id,
                            "prompt": request.prompt,
                            "width": 512,
                            "height": 512
                        }
                    else:
                        return {"error": "No image generated"}
                else:
                    error_text = await response.text()
                    user_friendly_error = parse_a4f_error(error_text)
                    return {"error": user_friendly_error, "status_code": response.status}
    
    except aiohttp.ClientError as e:
        logger.error(f"Network error in image generation: {str(e)}")
        return {"error": "🌐 Network error. Please check your internet connection and try again."}
    except Exception as e:
        logger.error(f"Error in image generation: {str(e)}")
        return {"error": f"⚠️ Unexpected error: {str(e)}"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()