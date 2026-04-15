Maker.com workflow description (for integration):
- Set up a Maker webhook to receive photo data from the frontend.
- On receipt, forward the photo to the Gemini API with the specified system prompt (HD quality, no filters).
- Gemini returns enhanced photo.
- Persist enhanced photo URL to Supabase (Photos.enhanced_photo_url) and track processing status.
- Return success response with enhanced photo URL to frontend for display/download.
- Implement error handling and retries for webhook, Gemini API, and database operations.
