from fastapi import APIRouter, HTTPException
from typing import List
from schemas.peopleSchema import Person
from config.db import client

router = APIRouter()

@router.get("/people", response_model=List[Person])
def get_people():
    people_collection = client.get_database().get_collection("people")
    people = list(people_collection.find({}, {"_id": 0}))
    return people

@router.post("/people", response_model=Person)
def create_person(person: Person):
    people_collection = client.get_database().get_collection("people")
    people_collection.insert_one(person.dict())
    return person
