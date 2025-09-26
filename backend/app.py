# app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import gemini_client

app = Flask(__name__)
CORS(app) # Enable Cross-Origin Resource Sharing

# A simple dictionary to store chat sessions.
# In a real-world application, you'd use a more robust solution like a database or a cache.
chat_sessions = {}

@app.route('/analyze', methods=['POST'])
def analyze():
    """
    Endpoint to analyze the T&C text.
    It receives the text, calls our gemini_client, and returns the analysis.
    It also initializes and stores a chat session for follow-up questions.
    """
    data = request.json
    if not data or 'tnc_text' not in data:
        return jsonify({"error": "No text provided"}), 400

    tnc_text = data['tnc_text']
    
    try:
        analysis_result = gemini_client.analyze_tnc(tnc_text)
        
        # Create a unique session ID (for simplicity, we'll just use a static one for now)
        session_id = "user1" 
        chat_sessions[session_id] = gemini_client.start_chat_session(tnc_text)
        
        return jsonify(analysis_result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/chat', methods=['POST'])
def chat():
    """
    Endpoint to handle follow-up questions.
    It uses the stored chat session to maintain context.
    """
    data = request.json
    if not data or 'question' not in data:
        return jsonify({"error": "No question provided"}), 400
        
    session_id = "user1" # Use the same session ID
    if session_id not in chat_sessions:
        return jsonify({"error": "Chat session not found. Please analyze a document first."}), 400

    question = data['question']
    chat_session = chat_sessions[session_id]

    try:
        response = chat_session.send_message(question)
        return jsonify({"response": response.text})
    except Exception as e:
        return jsonify({"error": "Failed to get a response from the assistant."}), 500

if __name__ == '__main__':
    # Runs the Flask app
    app.run(debug=True, port=5000)