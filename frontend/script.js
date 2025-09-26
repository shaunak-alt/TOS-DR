// frontend/script.js

// This function runs when the entire HTML document has been loaded.
document.addEventListener('DOMContentLoaded', () => {
  // --- 1. GETTING REFERENCES TO HTML ELEMENTS ---
  // We get all the interactive elements from our index.html so we can manipulate them.
  const tncTextarea = document.getElementById('tnc-textarea');
  const analyzeButton = document.getElementById('analyze-button');
  
  const errorContainer = document.getElementById('error-container');
  const errorMessage = document.getElementById('error-message');

  const initialState = document.getElementById('initial-state');
  const loadingState = document.getElementById('loading-state');
  const resultsState = document.getElementById('results-state');
  
  const chatInputContainer = document.getElementById('chat-input-container');
  const chatForm = document.getElementById('chat-form');
  const chatInput = document.getElementById('chat-input');
  const chatButton = document.getElementById('chat-button');
  
  // The backend API endpoint. Make sure your Flask app is running on this address.
  const API_BASE_URL = 'http://127.0.0.1:5000';

  // --- 2. EVENT LISTENERS ---
  // This is where we tell our buttons what to do when they are clicked.

  // When the "Analyze" button is clicked, call the handleAnalyze function.
  analyzeButton.addEventListener('click', handleAnalyze);

  // When the chat form is submitted, call the handleChatSubmit function.
  chatForm.addEventListener('submit', handleChatSubmit);

  // --- 3. CORE FUNCTIONS ---

  /**
   * Handles the main analysis logic when the "Analyze" button is clicked.
   */
  async function handleAnalyze() {
    const tncText = tncTextarea.value;

    if (!tncText.trim()) {
      showError('Please paste the Terms & Conditions text first.');
      return;
    }

    // A. Update the UI to show the loading state
    setLoadingState(true);
    hideError();
    resultsState.innerHTML = ''; // Clear previous results
    
    try {
      // B. Send the text to our Python backend's /analyze endpoint
      const response = await fetch(`${API_BASE_URL}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tnc_text: tncText }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'An unknown error occurred.');
      }

      // C. Get the analysis result and display it
      const analysisResult = await response.json();
      displayAnalysisResults(analysisResult);

    } catch (error) {
      showError(error.message);
      setInitialState(); // Go back to the initial state on error
    } finally {
      // D. Always turn off the loading state when done
      setLoadingState(false);
    }
  }
  
  /**
   * Handles sending a new chat message to the backend.
   */
  async function handleChatSubmit(event) {
    event.preventDefault(); // Prevent the form from reloading the page
    const question = chatInput.value.trim();

    if (!question) return;

    // A. Add the user's message to the chat window immediately
    addChatMessage('user', question);
    chatInput.value = ''; // Clear the input field
    setChattingState(true); // Disable the chat button

    try {
      // B. Send the question to our Python backend's /chat endpoint
       const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: question }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'An unknown chat error occurred.');
      }

      // C. Get the AI's response and add it to the chat window
      const chatResponse = await response.json();
      addChatMessage('model', chatResponse.response);

    } catch (error) {
       showError(error.message);
    } finally {
      setChattingState(false); // Re-enable the chat button
    }
  }
  

  // --- 4. UI MANIPULATION FUNCTIONS ---
  // These functions are helpers to show/hide elements and create new HTML.

  function setLoadingState(isLoading) {
    if (isLoading) {
      initialState.classList.add('hidden');
      resultsState.classList.add('hidden');
      loadingState.classList.remove('hidden');
      analyzeButton.disabled = true;
      analyzeButton.innerHTML = `
        <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span>Analyzing...</span>`;
    } else {
      loadingState.classList.add('hidden');
      analyzeButton.disabled = false;
      analyzeButton.innerHTML = `<span>Analyze Now</span>`;
    }
  }
  
  function setChattingState(isChatting) {
      chatInput.disabled = isChatting;
      chatButton.disabled = isChatting;
      if (isChatting) {
          addTypingIndicator();
      } else {
          removeTypingIndicator();
      }
  }

  function setInitialState() {
      initialState.classList.remove('hidden');
      resultsState.classList.add('hidden');
      chatInputContainer.classList.add('hidden');
  }

  function showError(message) {
    errorMessage.textContent = message;
    errorContainer.classList.remove('hidden');
  }

  function hideError() {
    errorContainer.classList.add('hidden');
  }

  function displayAnalysisResults(result) {
    initialState.classList.add('hidden');
    resultsState.classList.remove('hidden');
    chatInputContainer.classList.remove('hidden');
    
    // This creates the HTML for the accordion sections using the data from the backend
    const resultsHtml = `
      <div class="space-y-3 mb-6">
        <div>
          <h3 class="font-bold text-lg mb-2 text-gray-800 dark:text-gray-100">Summary</h3>
          <p class="text-gray-600 dark:text-gray-300 text-sm leading-relaxed p-4 bg-gray-100 dark:bg-gray-900/50 rounded-lg">${result.summary}</p>
        </div>
        <div class="space-y-2" id="accordion">
          <div class="border border-gray-200 dark:border-gray-700 rounded-lg">
            <button data-section="risks" class="accordion-toggle w-full flex justify-between items-center p-4 text-left font-semibold text-red-700 dark:text-red-300">
              ... (SVG icon code) ...
              <span>Potential Risks</span>
              ... (SVG arrow code) ...
            </button>
            <div id="risks-content" class="accordion-content hidden p-4 border-t border-gray-200 dark:border-gray-700">
              <ul class="list-disc space-y-2 pl-5 text-sm text-red-800 dark:text-red-200">
                ${result.potentialRisks.map(item => `<li>${item}</li>`).join('')}
              </ul>
            </div>
          </div>
          <div class="border border-gray-200 dark:border-gray-700 rounded-lg">
             <button data-section="privacy" class="accordion-toggle ..."> ... </button>
             <div id="privacy-content" class="accordion-content hidden ...">
                <ul class="...">${result.dataPrivacy.map(item => `<li>${item}</li>`).join('')}</ul>
             </div>
          </div>
          <div class="border border-gray-200 dark:border-gray-700 rounded-lg">
             <button data-section="obligations" class="accordion-toggle ..."> ... </button>
             <div id="obligations-content" class="accordion-content hidden ...">
                <ul class="...">${result.userObligations.map(item => `<li>${item}</li>`).join('')}</ul>
             </div>
          </div>
        </div>
      </div>
      <div id="chat-window" class="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700"></div>
    `;
    
    // NOTE: For brevity, the full SVG icon code is omitted above. 
    // You should copy the full HTML structure from the original for the accordion buttons.
    
    resultsState.innerHTML = resultsHtml;
    
    // Add event listeners to the new accordion buttons
    document.querySelectorAll('.accordion-toggle').forEach(button => {
        button.addEventListener('click', () => {
            const section = button.dataset.section;
            const content = document.getElementById(`${section}-content`);
            content.classList.toggle('hidden');
            // Add arrow rotation logic if desired
        });
    });
    
    // Auto-open the risks section
    document.getElementById('risks-content').classList.remove('hidden');
    
    // Add the initial chat message from the AI
    addChatMessage('model', 'Hello! Ask me anything about this document.');
  }

  function addChatMessage(role, text) {
      const chatWindow = document.getElementById('chat-window');
      if (!chatWindow) return;
      
      const messageWrapper = document.createElement('div');
      messageWrapper.classList.add('flex');
      
      let messageBubble;
      if (role === 'user') {
          messageWrapper.classList.add('justify-end');
          messageBubble = `<div class="bg-blue-500 text-white p-3 rounded-lg max-w-sm"><p class="text-sm">${text}</p></div>`;
      } else {
          // For the model, we can add a basic markdown parser later if needed
          messageWrapper.classList.add('justify-start');
          messageBubble = `<div class="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 p-3 rounded-lg max-w-sm"><div class="text-sm chat-bubble-content">${text}</div></div>`;
      }
      
      messageWrapper.innerHTML = messageBubble;
      chatWindow.appendChild(messageWrapper);
      
      // Scroll to the bottom of the chat
      const outputContainer = document.getElementById('output-container');
      outputContainer.scrollTop = outputContainer.scrollHeight;
  }
  
  function addTypingIndicator() {
      const chatWindow = document.getElementById('chat-window');
      if (!chatWindow) return;
      
      const indicator = document.createElement('div');
      indicator.id = 'typing-indicator';
      indicator.classList.add('flex', 'justify-start');
      indicator.innerHTML = `
        <div class="bg-gray-200 dark:bg-gray-700 p-3 rounded-lg">
            <div class="flex items-center">
                <div class="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div class="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s] mx-1"></div>
                <div class="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
            </div>
        </div>`;
      chatWindow.appendChild(indicator);
      
      const outputContainer = document.getElementById('output-container');
      outputContainer.scrollTop = outputContainer.scrollHeight;
  }
  
  function removeTypingIndicator() {
      const indicator = document.getElementById('typing-indicator');
      if (indicator) {
          indicator.remove();
      }
  }

});