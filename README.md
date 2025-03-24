# Almeria-Prehevil Trade Negotiations: A Voice-Controlled RPG

## Embark on a Negotiation Adventure

Welcome to **Almeria-Prehevil Trade Negotiations**, a role-playing game where you step forth to become a skilled negotiator and persuade your AI opponent to settle a deal.Use your voice to persuade and strategize in a turn-based negotiation scenario. 

## Frameworks:

This game is built using a modern web development stack:

*   **TypeScript:**  The main programming language of the game.
*   **XState 5.0:**  Orchestrates the game's state machine and manages the logic of the game and transitions.
*   **SpeechState 2.0:** Implements the voice recognition and text-to-speech feature, enabling voice-controlled gameplay.
*   **Vite:**  Provides the development environment.
*   **OpenAI API (GPT-4o):**  Initialises the
 AI opponent to create a more natural conversation.
*   **Azure Cognitive Services:**  Provides access the speech functionalities of SpeechState, both speech-to-text and text-to-speech services.
*   **Stately Inspector:**  Facilitates the visual state machine and debbuging.

## Setup Instructions

Follow these simple setup steps:

1.  **Clone the Repository:**
    ```bash
    git clone `https://github.com/mihaelagoga/negotiation_rpg`
    cd `negotiation_rpg`
    ```

2.  **Install Dependencies:**
    Ensure you have Node.js and npm (or yarn) installed. Then, run:
    ```bash
    npm install  
    ```

3.  **API Key Configuration:**
     Configure API keys for the game to function correctly:

    *   **OpenAI API Key:**
        *   Locate the `azure.ts` file in your project directory.
        *   You'll find a variable `chatGPTKey`. Replace the placeholder value with your actual OpenAI API key.
        ```typescript
        export const chatGPTKey = 'YOUR_OPENAI_API_KEY'; 
        ```
        *   **Important Security Note:** For production or public repositories, consider using environment variables instead of hardcoding API keys directly in your code.

    *   **Azure Cognitive Services Key:**
        *   In the same `azure.ts` file, you'll find `KEY` variable within `azureCredentials`. Replace the placeholder with your Azure Cognitive Services Speech API key.
        ```typescript
        export const KEY = 'YOUR_AZURE_SPEECH_API_KEY'; 
        ```
        *   Ensure your Azure Cognitive Services resource is set up in the `northeurope` region as configured in `dm.ts`.

4.  **Start the Development Server:**
    Use Vite to start the development server and run the game in your browser:
    ```bash
    npm run dev 
    ```
    Vite will provide a local development server URL (usually `http://localhost:5173/`). Open this URL in your web browser to play the game.

## How to Play

### Game Overview

In **Almeria-Prehevil Trade Negotiations**, you represent Prehevil, a technologically advanced nation, engaging in trade talks with Almeria, a resource-rich theocratic republic. Your goal is to negotiate a deal that benefits Prehevil, leveraging your nation's strengths and understanding Almeria's needs and objectives. The game is structured in turns, each with three phases: **Offer**, **Counteroffer**, and **Deal**.

### Step-by-Step Gameplay

1.  **Start the Game:**
    *   When you open the game in your browser, you'll be greeted by a welcome screen. Click the "Start Game" button to begin.

2.  **Newspaper Scenario:**
    *   A newspaper article sets the initial scenario for the negotiations and provides the background context to the player. Read through it and then click "Continue".

3.  **Debriefing Choice:**
    *   Your assistant will offer you debriefings on Almeria and Prehevil to prepare you for the negotiation.
    *   You can choose to learn about:
        *   **Almeria:** To understand your opponent's resources, goals and background information.
        *   **Prehevil:** To refresh your knowledge of your own nation's strengths and weaknesses.
        *   **Both:** For understanding both sides.
        *   **Neither:** To skip the whole debriefing part and proceed directly to negotiations.
    *   **Make your choice using your voice.**  Supported voice commands include: "Almeria", "Prehevil", "Both", "Neither", and variations like "Talk about Almeria", "No need", etc. (See "Voice Commands and Grammar" section for more details).

4.  **Negotiation Turns:**
    *   The negotiation is turn-based , with each turn consisting of 3 phases:

        *   **Turn 1 - Offer Phase (AI Initiates):**
            *   Grand Vizier Furio of Almeria will make the first offer.Listen carefully.
            *   Furio's avatar will be highlighted when speaking.

        *   **Counteroffer Phase (Your Turn):**
            *   After Furio's offer, it's your turn to respond.You have to formulate a counteroffer using your voice.
            *   Your player avatar will be highlighted when it's your turn to speak.
            *   Speak clearly and concisely. The game uses voice recognition to process your input.

        *   **Deal Phase (AI Response):**
            *   Furio will respond to your counteroffer, potentially accepting, rejecting, or making a further counter-proposal.

        The negotiation continues in a turn-based manner. In **Turn 2**, you will initiate the offer, and Furio will respond. In **Turn 3**, you will finalize the deal.

5.  **Winning the Game:**
    *   After the deal phase in each turn, an umpire (narrator) will analyze the negotiation transcript and decide which side overpowered the other.
    *   Points are awarded based on the umpire's judgment.
    *   After two rounds of negotiation, the game will announce the overall winner based on the accumulated points. The one who gained the most points wins the game but there is always a chance of both sides winning.

### Voice Commands and Grammar

The game utilizes voice recognition for a more immersive experience. Here are the key voice commands and grammar elements:

*   **Debriefing Choices:**
    *   "Almeria", "Almedia", "Talk about Almeria", "Tell me about Almeria", "Learn about Almeria", "Want to know about Almeria", "Almeria please", "Almeria debriefing"
    *   "Prehevil", "Preheval", "Preheaval", "Talk about Prehevil", "Tell me about Prehevil", "Learn about Prehevil", "Want to know about Prehevil", "Prehevil please", "Prehevil debriefing"
    *   "Both", "All of them", "All of the above", "Talk about both", "Learn about both", "Tell me about both", "Want both", "Both please", "Both debriefings", "Both of them"
    *   "No need", "Neither", "No thanks", "Skip debriefing", "Neither debriefing", "Skip it", "Not interested", "No debriefing"

*   **Negotiation Responses:**
    *   Use natural language to negotiate. The AI is designed to understand conversational English related to trade and negotiation.
    *   For simple yes/no decisions in future iterations, the game recognizes:
        *   **Yes:** "yes", "yeah", "of course", "sure", "definitely", "absolutely"
        *   **No:** "no", "neh", "no way", "nope", "not really"

### Game Interface Elements

*   **Avatars:**
    *   **AI Avatar (Furio):** Represents the Grand Vizier of Almeria.
    *   **Player Avatar:** Represents you, the negotiator for Prehevil.
    *   Avatars are visually highlighted when speaking.

*   **Instructions Button:**  Click this button to display a quick guide on how to play the game.

*   **Dynamic Buttons Container:**  Used for potential future interactive elements or choices within the game. Currently not actively used in the negotiation turns but prepared for expansion.



## Future development

This game is a demo for a future expansion.

