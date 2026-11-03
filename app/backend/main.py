from fastapi import FastAPI, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware

from utils import ProductJSONValidator
from llm_service import LLMService
from config import settings

app = FastAPI()

origins = [
    'http://localhost:3000'
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_methods=['*'],
    allow_headers=['*']
)

@app.post('/upload', status_code=status.HTTP_200_OK)
async def upload_json(file: UploadFile):
    validator = ProductJSONValidator()
    product = await validator.validate(file)

    llm_service = LLMService(settings.API_KEY)
    result = await llm_service.shape_product_card(product)

    return result
