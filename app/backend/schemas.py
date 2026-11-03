from pydantic import BaseModel, StringConstraints, Field
from typing import Annotated

NotEmptyStr = Annotated[str, StringConstraints(min_length=1, strip_whitespace=True)]

class Product(BaseModel):
    name: NotEmptyStr
    manufacturer: NotEmptyStr
    specs: dict[str, NotEmptyStr]
    description: NotEmptyStr

class ProductCard(BaseModel):
    headline: str = Field(max_length=70)
    description: str = Field(min_length=800, max_length=1200)
    specs: dict[str, NotEmptyStr]
    search_queries: list[NotEmptyStr] = Field(min_length=3, max_length=5)
    commercial: NotEmptyStr
