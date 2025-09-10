# Serialization for new User model
def userEntity(item) -> dict:
    return {
        "id": str(item["_id"]),
        "username": item.get("username"),
        "email": item.get("email"),
        "password": item.get("password"),
        "role": item.get("role", "admin"),
        "permissions": [
            {
                "resource": perm.get("resource"),
                "actions": perm.get("actions", ["view"])
            } for perm in item.get("permissions", [])
        ],
        "createdAt": item.get("createdAt"),
        "updatedAt": item.get("updatedAt"),
    }

def usersEntity(entity) -> list:
    return [userEntity(item) for item in entity]

#Best way
def serializeDict(a) -> dict:
    return {
        **{i: str(a[i]) for i in a if i == '_id'},
        **{i: a[i] for i in a if i != '_id'}
    }

def serializeList(entity) -> list:
    return [serializeDict(a) for a in entity]