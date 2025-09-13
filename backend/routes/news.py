from fastapi import APIRouter, Query, HTTPException
import requests
import os
from datetime import datetime, timedelta

newsRoute = APIRouter()

@newsRoute.get("/")
async def get_news(
    endpoint: str = Query("everything", description="API endpoint"),
    filter: str = Query("tech", description="Filter category"),
    pageSize: str = Query("20", description="Page size"),
    query: str = Query("", description="User search query")
):
    try:
        api_key = os.getenv("NEWS_API_KEY")
        if not api_key:
            raise HTTPException(status_code=500, detail="NewsAPI key is missing")

        params = {
            "pageSize": pageSize,
            "apiKey": api_key
        }

        if endpoint == "top-headlines":
            # For top-headlines, we need category and country
            if filter == "tech":
                params["category"] = "technology"
                params["country"] = "in"
            elif filter == "business":
                params["category"] = "business"
                params["country"] = "in"
            elif filter == "health":
                params["category"] = "health"
                params["country"] = "in"
            else:
                params["category"] = "general"
                params["country"] = "in"

            # If user has a search query, switch to 'everything' endpoint
            if query:
                return await fetch_everything(query, pageSize, api_key)
        else:
            # For 'everything' endpoint, construct query based on filter and user query
            base_query = ""

            if filter == "tech":
                base_query = "technology OR tech news OR innovation"
            elif filter == "indian-law":
                base_query = "Supreme Court India OR High Court India OR Department of Justice India"
            elif filter == "govt-policies":
                base_query = "India government policy OR India regulation OR Indian ministry"
            elif filter == "cybersecurity":
                base_query = 'cybersecurity OR "cyber security" OR hacking OR "data breach"'
            elif filter == "ai":
                base_query = '"artificial intelligence" OR "machine learning" OR AI OR chatgpt'
            else:
                base_query = "technology"

            # Combine the base query with user query if present
            final_query = f"{query} {base_query}" if query else base_query

            params["q"] = final_query
            params["sortBy"] = "publishedAt"
            params["language"] = "en"

            # Set date range - last 30 days for fresh content
            past_month = datetime.now() - timedelta(days=30)
            params["from"] = past_month.strftime("%Y-%m-%d")

        # Construct the URL and make the request
        url = f"https://newsapi.org/v2/{endpoint}"
        response = requests.get(url, params=params)

        if not response.ok:
            raise HTTPException(status_code=response.status_code, detail=f"News API responded with status: {response.status}")

        data = response.json()
        return data

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch news: {str(e)}")

async def fetch_everything(query: str, pageSize: str, api_key: str):
    # Calculate the date for the last 30 days
    past_month = datetime.now() - timedelta(days=30)
    from_date = past_month.strftime("%Y-%m-%d")

    url = "https://newsapi.org/v2/everything"
    params = {
        "q": query,
        "language": "en",
        "sortBy": "publishedAt",
        "pageSize": pageSize,
        "from": from_date,
        "apiKey": api_key
    }

    response = requests.get(url, params=params)

    if not response.ok:
        raise HTTPException(status_code=response.status_code, detail=f"News API responded with status: {response.status}")

    return response.json()