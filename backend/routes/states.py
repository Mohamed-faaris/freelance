from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List

# States data model
class State(BaseModel):
    id: str
    name: str

class StatesResponse(BaseModel):
    states: List[State]

statesRoute = APIRouter()

@statesRoute.get("/", response_model=StatesResponse)
async def get_states():
    try:
        # Return the states data inline
        states_data = StatesResponse(
            states=[
                {"name": "Andaman and Nicobar", "id": "AN"},
                {"name": "Andhra Pradesh", "id": "AP"},
                {"name": "Arunachal Pradesh", "id": "AR"},
                {"name": "Assam", "id": "AS"},
                {"name": "Bihar", "id": "BR"},
                {"name": "Chandigarh", "id": "CH"},
                {"name": "Chhattisgarh", "id": "CG"},
                {"name": "Delhi", "id": "DL"},
                {"name": "Diu and Daman", "id": "DD"},
                {"name": "DNH at Silvasa", "id": "DN"},
                {"name": "Goa", "id": "GA"},
                {"name": "Gujarat", "id": "GJ"},
                {"name": "Haryana", "id": "HR"},
                {"name": "Himachal Pradesh", "id": "HP"},
                {"name": "Jammu and Kashmir", "id": "JK"},
                {"name": "Jharkhand", "id": "JH"},
                {"name": "Karnataka", "id": "KA"},
                {"name": "Kerala", "id": "KL"},
                {"name": "Ladakh", "id": "LD"},
                {"name": "Lakshadweep", "id": "LW"},
                {"name": "Madhya Pradesh", "id": "MP"},
                {"name": "Maharashtra", "id": "MH"},
                {"name": "Manipur", "id": "MN"},
                {"name": "Meghalaya", "id": "MG"},
                {"name": "Mizoram", "id": "MZ"},
                {"name": "Nagaland", "id": "NL"},
                {"name": "Odisha", "id": "OD"},
                {"name": "Puducherry", "id": "PY"},
                {"name": "Punjab", "id": "PB"},
                {"name": "Rajasthan", "id": "RJ"},
                {"name": "Sikkim", "id": "SK"},
                {"name": "Tamil Nadu", "id": "TN"},
                {"name": "Telangana", "id": "TS"},
                {"name": "Tripura", "id": "TR"},
                {"name": "Uttarakhand", "id": "UK"},
                {"name": "Uttar Pradesh", "id": "UP"},
                {"name": "West Bengal", "id": "WB"},
            ]
        )

        return states_data

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch states: {str(e)}")