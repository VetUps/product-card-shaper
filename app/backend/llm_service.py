from fastapi import HTTPException, status
from openai import AsyncOpenAI, OpenAIError
from pathlib import Path
import json

from schemas import Product, ProductCard

PROMPT_PATH = Path(__file__).parent / "SYSTEM_PROMPT.md"
BASE_PROMPT = PROMPT_PATH.read_text(encoding="utf-8").strip()

SCHEMA_JSON = json.dumps(ProductCard.model_json_schema(), ensure_ascii=False, indent=2)
SYSTEM_PROMPT = (
    f"{BASE_PROMPT}\n\n"
    f"Верни ответ СТРОГО в формате JSON, соответствующем следующей JSON Schema:\n{SCHEMA_JSON}"
)

class LLMService:
    def __init__(self, api_key: str, base_url: str = 'https://api.deepseek.com', model: str = 'deepseek-v4-flash') -> None:
        self.client = AsyncOpenAI(base_url=base_url, api_key=api_key, timeout=30)
        self.model = model

    async def shape_product_card(self, prodcut: Product) -> ProductCard:
        try:
            response = await self.client.beta.chat.completions.create(
                model=self.model,
                messages=[
                    {'role': 'system', 'content': SYSTEM_PROMPT},
                    {'role': 'user', 'content': prodcut.model_dump_json()}
                ],
                response_format={"type": "json_object"},
                temperature=0.2
            )

            content = response.choices[0].message.content
            return ProductCard.model_validate_json(content)

        except OpenAIError as e:
            print(e)
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Ошибка при обращении к LLM-сервису",
            )
        