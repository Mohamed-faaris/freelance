import os
import time
from dotenv import load_dotenv
import requests
from typing import Optional
from datetime import datetime, timedelta

load_dotenv()
class AuthService:
    def __init__(self):
        self.access_token: Optional[str] = None
        self.token_expiry: Optional[float] = None

    async def get_access_token(self) -> str:
        """
        Get a valid access token, either from cache or by requesting a new one
        """
        # Check if we have a valid token
        if self.access_token and self.token_expiry and time.time() < self.token_expiry:
            return self.access_token

        # Request new token
        try:
            # Get credentials from environment variables
            client_id = os.getenv("CLIENT_ID")
            client_secret = os.getenv("CLIENT_SECRET")

            if not client_id or not client_secret:
                raise ValueError("CLIENT_ID and CLIENT_SECRET environment variables are required")

            # Prepare form data for the request
            data = {
                "client_id": client_id,
                "client_secret": client_secret
            }

            # Make the request to get access token
            response = requests.post(
                "https://production.deepvue.tech/v1/authorize",
                data=data,
                headers={
                    "Content-Type": "application/x-www-form-urlencoded"
                }
            )

            response.raise_for_status()  # Raise an exception for bad status codes

            # Extract token and expiry information
            response_data = response.json()
            access_token = response_data.get("access_token")
            token_type = response_data.get("token_type", "Bearer")
            expiry = response_data.get("expiry")

            if not access_token:
                raise ValueError("No access_token received from authorization endpoint")

            # Calculate expiry time
            # If expiry is provided in seconds from now, use it
            # Otherwise default to 24 hours from now
            if expiry and isinstance(expiry, (int, float)):
                expiry_time = time.time() + expiry
            else:
                # Default to 24 hours if no clear expiry
                expiry_time = time.time() + (24 * 60 * 60)

            # Store token and expiry
            self.access_token = access_token
            self.token_expiry = expiry_time

            print(f"Successfully obtained new access token, expires at: {datetime.fromtimestamp(expiry_time)}")
            return access_token

        except requests.RequestException as error:
            print(f"HTTP request failed: {error}")
            raise Exception("Unable to obtain access token - HTTP request failed")
        except ValueError as error:
            print(f"Configuration or response error: {error}")
            raise Exception(f"Unable to obtain access token - {str(error)}")
        except Exception as error:
            print(f"Unexpected error getting access token: {error}")
            raise Exception("Unable to obtain access token")

    def is_token_valid(self) -> bool:
        """
        Check if the current token is still valid
        """
        return (
            self.access_token is not None
            and self.token_expiry is not None
            and time.time() < self.token_expiry
        )

    def clear_token(self):
        """
        Clear the stored token (useful for forcing a refresh)
        """
        self.access_token = None
        self.token_expiry = None


# Create a singleton instance
auth_service = AuthService()
