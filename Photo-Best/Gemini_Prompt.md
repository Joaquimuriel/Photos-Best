Gemini API Prompt (HD quality enhancement, no filters) for Maker.com workflow:

Context: The Gemini API will receive the photo and should enhance its quality to HD, without adding filters or modifications.
System Prompt for Gemini: 
You are a professional photo quality enhancement AI. Your task is to improve the quality of the uploaded photo to HD resolution while maintaining the original characteristics, colors, lighting, and details. Do NOT add filters, effects, or artistic modifications. Simply enhance the clarity, sharpness, and overall quality to HD standards. Return only the enhanced image without any text explanations, watermarks, or additional content.

Maker.com Workflow Steps:
1 Receive photo from frontend webhook
2 Send to Gemini API with the above prompt
3 Receive enhanced photo
4 Store enhanced photo URL in database
5 Return success response with enhanced photo URL to frontend
