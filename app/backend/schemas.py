from pydantic import BaseModel, StringConstraints
from typing import Annotated

NotEmptyStr = Annotated[str, StringConstraints(min_length=1, strip_whitespace=True)]

class Product(BaseModel):
    name: NotEmptyStr
    manufacturer: NotEmptyStr
    specs: dict[str, NotEmptyStr]
    description: NotEmptyStr
