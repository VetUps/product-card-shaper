from fastapi import FastAPI, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from utils import ProductJSONValidator

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

@app.post('/upload')
async def upload_json(file: UploadFile):
    validator = ProductJSONValidator()
    product = await validator.validate(file)
