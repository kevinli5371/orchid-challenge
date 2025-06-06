from fastapi import FastAPI, Query, Body
import requests
from fastapi.middleware.cors import CORSMiddleware
import anthropic
from pyppeteer import launch
import base64
import os
import asyncio

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

browser_instance = None

async def get_browser():
    global browser_instance
    if browser_instance is None:
        browser_instance = await launch(
            headless=True,
            args=[
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--no-first-run',
                '--no-default-browser-check',
                '--disable-default-apps'
            ]
        )
    return browser_instance

async def screenshot(url):
    output_path = "images/screenshot.png"
    browser = await get_browser()
    page = await browser.newPage()

    try: 
        await page.setViewport({'width': 1280, 'height': 1080})
        
        await page.goto(url, {
            'waitUntil': 'domcontentloaded',
            'timeout': 10000
        })

        await page.screenshot({
            'path': output_path,
            'fullPage': False,
            'type': 'png',
            'quality': 80
        })

        print(f"Screenshot saved to {output_path}")
    except Exception as e:
        print(f"Error taking screenshot: {e}")
        return f"<html><body><h1>Error generating webpage</h1><p>{str(e)}</p></body></html>"
    finally: 
        await page.close()

def encode_image_to_base64(image_path):
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode('utf-8')

async def clone_from_image(url):
    try:
        await screenshot(url)
        client = anthropic.Anthropic(
            api_key=(os.getenv("ANTHROPIC_API_KEY"))
        )
        
        message = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=8000,
            temperature=0.1,
            system="You are an expert web developer. Create a complete HTML replica based on the screenshot. Return ONLY the HTML code with embedded CSS and JavaScript. No explanations, no markdown blocks, no analysis. Start with <!DOCTYPE html> and end with </html>.",
            
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image",
                            "source": {
                                "type": "base64",
                                "media_type": "image/png",
                                "data": encode_image_to_base64("images/screenshot.png")
                            }
                        },
                        {
                            "type": "text",
                            "text": f"Clone this website (URL: {url}). Return ONLY raw HTML code. No markdown, no backticks, no explanations. Just pure HTML starting with <!DOCTYPE html>."
                        }
                    ]
                }
            ]
        )

        html_content = ""
        if hasattr(message.content, '__iter__') and not isinstance(message.content, str):
            for block in message.content:
                if hasattr(block, 'text'):
                    html_content += block.text
        else:
            html_content = str(message.content)
        
        html_content = html_content.replace('```html', '').replace('```', '').strip()
        
        return html_content

    except Exception as e:
        print(f"Error generating HTML from URL: {e}")
        return f"<html><body><h1>Error generating webpage</h1><p>{str(e)}</p></body></html>"

@app.get("/")
def read_root():
    return {"message": "Hello World"}

@app.post("/clone")
async def clone_url_post(data: dict = Body(...)):
    url = data.get("url")
    if not url:
        return {"error": "URL is required"}
    
    try:
        cloned_html = await clone_from_image(url)
        print("Generated HTML length:", len(cloned_html))
        return {"html": cloned_html}
    except Exception as e:
        print(f"Error in clone endpoint: {e}")
        return {"error": str(e)}

@app.on_event("shutdown")
async def shutdown_event():
    global browser_instance
    if browser_instance:
        await browser_instance.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)