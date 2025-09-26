# gemini_client.py
import os
import json
import google.generativeai as genai

# Load the API key from the .env file
from dotenv import load_dotenv
load_dotenv()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

def analyze_tnc(tnc_text: str):
    """
    Analyzes the Terms and Conditions text using the Gemini API.
    This function replicates the structured JSON output from the original service.
    """
    prompt = f"""You are an expert legal analyst specializing in contract law and consumer protection. A user has provided the following Terms and Conditions text. Your task is to analyze it thoroughly and provide a clear, concise, and easy-to-understand breakdown for a non-expert. Focus on identifying potential risks, liabilities, and clauses that might be unfair or unusual. The user is concerned about scams, hidden fees, data privacy, and their legal rights. Here is the text: \n\n{tnc_text}"""

    model = genai.GenerativeModel('gemini-1.5-flash')
    
    try:
        response = model.generate_content(
            prompt,
            generation_config=genai.types.GenerationConfig(
                response_mime_type="application/json",
                response_schema={
                    "type": "object",
                    "properties": {
                        "summary": {"type": "string", "description": "A brief, one-paragraph summary of the entire document."},
                        "potentialRisks": {"type": "array", "items": {"type": "string"}, "description": "A list of potential risks, liabilities, or concerning clauses. Each item should be a clear, concise sentence."},
                        "dataPrivacy": {"type": "array", "items": {"type": "string"}, "description": "A list of points specifically related to how the user's data is collected, used, and shared."},
                        "userObligations": {"type": "array", "items": {"type": "string"}, "description": "A list of key responsibilities and obligations placed upon the user."}
                    },
                    "required": ["summary", "potentialRisks", "dataPrivacy", "userObligations"]
                }
            )
        )
        return json.loads(response.text)
    except Exception as e:
        print(f"Error during analysis: {e}")
        # In a real app, you'd want more robust error handling
        raise Exception("Failed to analyze the document.")


def start_chat_session(tnc_text: str):
    """
    Initializes a new chat session with the Gemini model, providing the T&C as context.
    """
    system_instruction = f"""You are a helpful legal assistant. Your sole purpose is to answer questions about the following Terms and Conditions document. Your answers must be concise, to-the-point, and based strictly on the provided document. Use Markdown formatting (like **bolding** for important terms and bullet points for lists) to improve readability. Do not provide external legal advice. If the answer isn't in the document, state that clearly. \n\n---DOCUMENT---\n\n{tnc_text}"""
    
    model = genai.GenerativeModel('gemini-1.5-flash', system_instruction=system_instruction)
    
    # We return the chat object itself to maintain the conversation history
    return model.start_chat(history=[])