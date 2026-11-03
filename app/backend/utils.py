from fastapi import UploadFile, HTTPException, status
from pydantic import ValidationError
import json

from schemas import Product

class JSONValidator:
    DEFAULT_ALLOWED_MIMETYPE = ['application/json']

    def __init__(self, allowed_mimetypes: list[str] = None):
        self.allowed_mimetypes = allowed_mimetypes or self.DEFAULT_ALLOWED_MIMETYPE

    def validate_mimetype(self, file: UploadFile) -> None:
        if file.content_type not in self.allowed_mimetypes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f'Недопустимый формат файла. Разрешено: {self.allowed_mimetypes}'
            )

class ProductJSONValidator(JSONValidator):
    async def validate_by_schema(self, file: UploadFile) -> Product:
        try:
            bytes_content = await file.read()

            validated_data = Product.model_validate_json(bytes_content)
            return validated_data
        except json.JSONDecodeError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail='Файл не является валидным JSON'
            )
        except ValidationError:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail='Ошибка валидации полей, проверьте структуру JSON-файла'
            )

    async def validate(self, file: UploadFile) -> Product:
        self.validate_mimetype(file)
        product = await self.validate_by_schema(file)

        return product
    