from pydantic import BaseModel

class Product(BaseModel):
    name: str
    manufacturer: str
    specs: dict[str, str]
    description: str
