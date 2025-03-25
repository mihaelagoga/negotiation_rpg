import { fromPromise, assign, createActor, setup } from "xstate";
import { Settings, speechstate } from "speechstate";
import { createBrowserInspector } from "@statelyai/inspect";
import { chatGPTKey, KEY } from "./azure";
import { DMContext, DMEvents } from "./types";
import OpenAI from 'openai';
import { Card, Resource } from './types'; 


const inspector = createBrowserInspector();

const azureCredentials = {
  endpoint:
    "https://northeurope.api.cognitive.microsoft.com/sts/v1.0/issuetoken",
  key: KEY,
};

const apiKey = chatGPTKey; 


const openai = new OpenAI({apiKey,  dangerouslyAllowBrowser: true });
const instructionPrompt = "You are a helpful assistant in a negotiation debriefing scenario. Respond concisely and professionally.";
const instructionPromptUmpire = "Be brief, use only 3 sentences. You are the umpire of this negotiation game. Your role is to analyze this transcript from the negociation and to judge whether Prehevil or Almeria gained the upper hand. Consider this a zero-sum game, which one seems to have gotten the better deal. Explain in a phrase who won and why. Make sure to end the phrase with 'Almeria has won' or 'Prehevil' has won' to announce the winner. This is the transcript:"
const modelName = "gpt-4o-2024-08-06";

const settings: Settings = {
  azureCredentials: azureCredentials,
  azureRegion: "northeurope",
  asrDefaultCompleteTimeout: 0,
  asrDefaultNoInputTimeout: 5000,
  locale: "en-US",
  ttsDefaultVoice: "en-US-GuyNeural", 
  ttsFurioVoice: "en-US-GuyNeural",  
  ttsNarratorVoice: "en-US-JennyNeural" 
};

interface GrammarEntry {
   decision?: string;
}

const grammar: { [index: string]: GrammarEntry } = {
  
  yes: { decision: "yes" }, 
  yeah: { decision: "yes" },
  "of course": { decision: "yes" },
  "sure": { decision: "yes" },
  "definitely": { decision: "yes" },
  "absolutely": { decision: "yes" },
  no: { decision: "no" },
  neh: { decision: "no" },
  "no way": { decision: "no" },
  "nope": { decision: "no" },
  "not really": { decision: "no" },
  "almedia":  { decision: "almeria" },
  "prehevil": { decision: "prehevil"},
  "almeria": { decision: "almeria" },
  "preheval": { decision: "prehevil"},
  "preheaval": { decision: "prehevil"},
  "both" : { decision: "both"},
  "all of them" : {decision: "both"},
  "all of the above" : {decision: "both"},
  "no need" : {decision: "neither"},
  "neither" : {decision: "neither"},


  
};

const almeriaAiResource: Resource = { 

  availableResources: "vast fertile lands, sunset olives, livestock and diary,rare herbs and spices, rare earth minerals" 
};

const AiCard: Card = { 
  name: "Furio",
  job: "Grand Vizier of Almeria",
  scenario: "The country of Almeria is an impoverished theocratic republic, with great soil riches and a hardy people and proud people. They would like to open the country up for foreign investment in order to increase their economic prowess and improve the living standards. You were instructed by the Grand Regent Ta'sha to lead the negociation process with you western-aligned neighbour across the Sunset Sea, Prehevil, even though you consider them infidels, they have been neutral on the international stage.You reluctantly accepted to be the negotiator because your people need you.You are Almerian's sharpest political mind and ruthless leader who will not tolerate disrespect. Your people have survived on faith and discipline for centuries.Don't dissapoint them.Be brief, sound natural. Don't use more than 3 sentences.",
  resources: almeriaAiResource,
  utterance: null,
  objective: {
    goals: "Secure foreign investment into Almeria's agricultural sector to modernize infrastructure and diversify the economy, without compromising national sovereignty or Almerian pride."
  }
};

const promptSchema = {
  "prompt": {
    "role": {
      "name": "{name}",
      "position": "{job}"
    },
    "context": {
      "scenario": "{scenario}"
    },
    "objective": {
      "goals": "{goals}"
    },
    "negotiationResources": {
      "availableResources": "{resource}"
    },
    "counterpartInformation": {
      "counterpartStatement": "{utterance}"
    },
    "negotiationStrategy": [
      "Dominate the negotiation with an aggressive and condescending tone.",
      "Exploit Prehevil’s technological dependence on agricultural resources to gain leverage in trade agreements.",
      "Engage in negotiations with your counterpart to achieve the stated goals.",
      "Prioritize minimizing the resources conceded while maximizing the gains achieved.",
      "Utilize the provided resources effectively during the negotiation process."
    ],
    "instructions": "Be brief, sound natural. Use condescending and agressive language. Don't use more than 3 sentences. Based on the information above, formulate your response as {name} in the position of {job}. Your response should be a direct reply to your counterpart's utterance ({utterance}), keeping in mind your goals ({goals}), the current scenario ({scenario}), and the resources you can leverage ({resource}). Remember to prioritize achieving your goals while giving away as few resources as possible for the greatest benefit. The game is structured in turns, with each turn divided in three phases: the Offer, the Counteroffer and the Deal. Turn 1 you initiate the negotation. In the first phase,the Offer phase its your responsability to present the inital proposal. Following this offer,in the second phase, the Counteroffer the player responds accordingly to your offer.In the third phase,the Deal phase you must decide to accept the player's counteroffer and secure a deal or reject it. Either positive or negative result leads to the next turn. "}
  }


function createNegotiationPrompt(aiCard: Card, userUtterance: string | null): string {
  const schema = promptSchema.prompt;

  let promptText = `Role:\nName: ${aiCard.name}\nPosition: ${aiCard.job}\n\n`;
  promptText += `Context:\nScenario: ${aiCard.scenario}\n\n`;
  promptText += `Objective:\nGoals: ${aiCard.objective.goals}\n\n`;
  promptText += `Negotiation Resources:\nAvailable Resources: ${aiCard.resources.availableResources}\n\n`;
  promptText += `Counterpart Information:\nCounterpart Statement: ${userUtterance ? userUtterance : "None"}\n\n`;
  promptText += `Negotiation Strategy:\n${schema.negotiationStrategy.join("\n")}\n\n`;
  promptText += `Instructions:\n${schema.instructions
    .replace("{name}", aiCard.name)
    .replace("{job}", aiCard.job)
    .replace("{utterance}", userUtterance ? userUtterance : "None")
    .replace("{goals}", aiCard.objective.goals)
    .replace("{resource}", aiCard.resources.availableResources)
    }`;

  return promptText;
}

function isInGrammar(utterance: string) {
  return utterance.toLowerCase() in grammar;
}



function getDebriefDecision(utterance: string) {
  const lowerUtterance = utterance.toLowerCase();
  
  
  if (
    lowerUtterance.includes("almeria") ||
    lowerUtterance.includes("almedia") || 
    lowerUtterance.includes("talk about almeria") ||
    lowerUtterance.includes("tell me about almeria") ||
    lowerUtterance.includes("learn about almeria") ||
    lowerUtterance.includes("want to know about almeria") ||
    lowerUtterance.includes("almeria please") ||
    lowerUtterance.includes("almeria debriefing")
  ) {
    
    console.log("Decision: Almeria"); 
    return "almeria";
  }
  

  if (
    lowerUtterance.includes("prehevil") ||
    lowerUtterance.includes("preheval") || 
    lowerUtterance.includes("preheaval") || 
    lowerUtterance.includes("talk about prehevil") ||
    lowerUtterance.includes("tell me about prehevil") ||
    lowerUtterance.includes("learn about prehevil") ||
    lowerUtterance.includes("want to know about prehevil") ||
    lowerUtterance.includes("prehevil please") ||
    lowerUtterance.includes("prehevil debriefing")
  ) {
    console.log("Decision: Prehevil"); 
    return "almeria";
  }
  

  
  if (
    lowerUtterance.includes("both") ||
    lowerUtterance.includes("all of them") ||
    lowerUtterance.includes("all of the above") ||
    lowerUtterance.includes("talk about both") ||
    lowerUtterance.includes("learn about both") ||
    lowerUtterance.includes("tell me about both") ||
    lowerUtterance.includes("want both") ||
    lowerUtterance.includes("both please") ||
    lowerUtterance.includes("both debriefings") ||
    lowerUtterance.includes("both of them")
  ) {
    console.log("Decision: both"); 
    return "both";
  
  }
  
  if (
    lowerUtterance.includes("no need") ||
    lowerUtterance.includes("neither") ||
    lowerUtterance.includes("no thanks") ||
    lowerUtterance.includes("skip debriefing") ||
    lowerUtterance.includes("neither debriefing") ||
    lowerUtterance.includes("skip it") ||
    lowerUtterance.includes("not interested") ||
    lowerUtterance.includes("no debriefing")
  ) {
    console.log("Decision: Neither")
    return "neither";
  
  }
  
  return null;
}

function updateAvatars(speaker: string) {
  const aiAvatarBox = document.getElementById('ai-avatar-box');
  const playerAvatarBox = document.getElementById('player-avatar-box');

  if (!aiAvatarBox || !playerAvatarBox) {
    console.error("Avatar elements not found!");
    return;
  }

  
  playerAvatarBox.classList.remove('speaking', 'standby'); 
  aiAvatarBox.classList.remove('speaking', 'standby'); 


  if (speaker === 'ai') {
    aiAvatarBox.classList.add('speaking');
    playerAvatarBox.classList.add('standby'); 
  } else if (speaker === 'player') {
    playerAvatarBox.classList.add('speaking');
    aiAvatarBox.classList.add('standby'); 
  }
    else if (speaker === 'null_ai') {
      aiAvatarBox.classList.add("standby");
    }
    else if (speaker === 'null_player'){
      playerAvatarBox.classList.add("standby");
    }
}




const dmMachine = setup({
  types: {
    context: {} as DMContext,
    events: {} as DMEvents,
  },
  actors: {
    judgeDeal: fromPromise(async ({ input }: { input: DMContext }) => {
      if (!input.lastResult || input.lastResult.length === 0) {
        return ""; 
      }
     
      const fullPrompt = `${instructionPromptUmpire} ${input.chatHistory}`;
    
      try {
        const completion = await openai.chat.completions.create({
          model: modelName,
          messages: [{ role: "user", content: fullPrompt }],
          max_tokens: 150,
        });
        console.log(completion.choices[0].message.content);
        return completion.choices[0].message.content ?? "";
      } catch (error) {
        console.error("Error calling OpenAI:", error);
        return "Sorry, I encountered an error while processing your request.";
      }
    }),
    callOpenAI: fromPromise(async ({ input }: { input: DMContext }) => {
      if (!input.lastResult || input.lastResult.length === 0) {
        return ""; 
      }
      const userUtterance = input.lastResult[0].utterance;
      const aiCard = input.aiCard || AiCard; 
    
      
      const negotiationPrompt = createNegotiationPrompt(aiCard, userUtterance);
      const fullPrompt = `${negotiationPrompt}\nChat History: ${input.chatHistory}\nAssistant:`;
    
      try {
        const completion = await openai.chat.completions.create({
          model: modelName,
          messages: [{ role: "user", content: fullPrompt }],
          max_tokens: 150,
        });
        console.log(completion.choices[0].message.content);
        return completion.choices[0].message.content ?? "";
      } catch (error) {
        console.error("Error calling OpenAI:", error);
        return "Sorry, I encountered an error while processing your request.";
      }
    }),
    
    callOpenAIStart: fromPromise(async ({ input }: { input: DMContext }) => {
      if (!input.lastResult || input.lastResult.length === 0) {
        return ""; 
      }
      const userUtterance = input.lastResult[0].utterance || "";
      const aiCard = input.aiCard || AiCard; 
    
      // Generate the negotiation prompt using createNegotiationPrompt
      const negotiationPrompt = createNegotiationPrompt(aiCard, null); 
      const fullPrompt = `${negotiationPrompt}\nAdditional Instruction: "You need to begin the negotiation. It’s your turn to present the initial offer to Prehevil’s representative, aiming to secure foreign investment into Almeria’s agricultural sector while preserving national sovereignty and pride."\nUser: ${userUtterance}\nAssistant:`;
    
      try {
        const completion = await openai.chat.completions.create({
          model: modelName,
          messages: [{ role: "user", content: fullPrompt }],
          max_tokens: 150,
        });
        console.log(completion.choices[0].message.content);
        return completion.choices[0].message.content ?? "";
      } catch (error) {
        console.error("Error calling OpenAI:", error);
        return "Sorry, I encountered an error while processing your request.";
      }
    }),
  },
  actions: {
    /** define your actions here */
    "spst.speak": ({ context }, params: { utterance: string; voice?: string }) => {
      updateAvatars('null_player');

      console.log("spst.speak action CALLED:", params.utterance);
      
      
      const selectedVoice = params.voice || context.settings.ttsDefaultVoice;
      
      context.spstRef.send({
        type: "SPEAK",
        value: { 
          utterance: params.utterance,
          voice: selectedVoice 
        },
      });
      console.log("Sent SPEAK to spstRef with voice:", selectedVoice, context.spstRef);
    },
    "spst.listen": ({ context }) =>
      context.spstRef.send({
        type: "LISTEN",
      }),

    "clearLastResult": assign({ lastResult: null }),

    "debriefingDecisionMaker": assign(({ context }) => {
      const utterance = context.lastResult?.[0]?.utterance;
      return utterance ? { debriefingDecision: getDebriefDecision(utterance) || utterance } : {};
    }),

    "assignLastResult": assign(({ event }) => {
      if ('value' in event) {
        return { lastResult: event.value };
      }
      return {};
    }),

    "speakLLMResponse": ({ context }) => {
      if (context.llmResponse) {
        context.spstRef.send({
          type: "SPEAK",
          value: { utterance: context.llmResponse },
        });
      }
    },

    "speakLLMResponseAssistant": ({ context }) => {
      if (context.llmResponse) {
        context.spstRef.send({
          type: "SPEAK",
          value: { utterance: context.llmResponse, voice: settings.ttsNarratorVoice },
        });
      }
    },

    "createDebriefingButtons": ({  }) => {
      const dynamicButtonsContainer = document.getElementById('dynamic-buttons-container');
      if (!dynamicButtonsContainer) {
        console.error("Dynamic buttons container not found!");
        return;
      }
      dynamicButtonsContainer.innerHTML = ''; 

      const almeriaButton = createDynamicButton('Almeria', 'CHOOSE_ALMERIA_DEBRIEFING');
      const prehevilButton = createDynamicButton('Prehevil', 'CHOOSE_PREHEVIL_DEBRIEFING');
      const bothButton = createDynamicButton('Both', 'CHOOSE_BOTH_DEBRIEFINGS');
      const neitherButton = createDynamicButton('Neither', 'CHOOSE_NEITHER_DEBRIEFING');

      dynamicButtonsContainer.appendChild(almeriaButton);
      dynamicButtonsContainer.appendChild(prehevilButton);
      dynamicButtonsContainer.appendChild(bothButton);
      dynamicButtonsContainer.appendChild(neitherButton);
    },

    "displayNewspaper": ({  }) => {
      const welcomeScreen = document.getElementById('welcome-screen');
      const newspaperBox = document.getElementById('newspaper-box');
      if (welcomeScreen) welcomeScreen.style.display = 'none';
      if (newspaperBox) newspaperBox.style.display = 'block';
    },

    "hideNewspaper": ({ }) => {
      const newspaperBox = document.getElementById('newspaper-box');
      if (newspaperBox) newspaperBox.style.display = 'none';
    },
  },
  guards: {
    hasLastResult: ({ context }) => 
      context.lastResult !== null && context.lastResult.length > 0,
    
    isInGrammar: ({ context }) => 
      context.lastResult !== null && 
      context.lastResult.length > 0 && 
      isInGrammar(context.lastResult[0].utterance),

      almeriaHasMorePoints: ({ context }) => context.almeriaPoints > context.prehevilPoints,

      prehevilHasMorePoints: ({ context }) => context.prehevilPoints > context.almeriaPoints,
    


    debriefingDecisionIsAlmeria: ({ context }) =>
      context.debriefingDecision === "almeria",

    debriefingDecisionIsPrehevil: ({ context }) =>
      context.debriefingDecision === "prehevil",

    debriefingDecisionIsBoth: ({ context }) =>
      context.debriefingDecision === "both",

    debriefingDecisionIsNeither: ({ context }) =>
      context.debriefingDecision === "neither",
  
  }
  

  
  
}).createMachine({
  context: ({ spawn }) : DMContext => ({
    spstRef: spawn(speechstate, { input: settings }),
    settings : settings,
    lastResult: null,
    debriefingDecision: null,
    aiCard: AiCard,
    llmResponse: null,
    chatHistory: null,
    almeriaPoints: 0,
    prehevilPoints: 0,
  }),

  id: "DM",
  initial: "Prepare",
  states: {
    Prepare: {
      entry: ({ context }) => context.spstRef.send({ type: "PREPARE" }),
      on: { ASRTTS_READY: "WaitToStart" },
    },

"WaitToStart": {
  entry: () => {
    const aiAvatarBox = document.getElementById('ai-avatar-box');
    const playerAvatarBox = document.getElementById('player-avatar-box');
    if (aiAvatarBox && playerAvatarBox) {
      aiAvatarBox.style.display = 'none';
      playerAvatarBox.style.display = 'none';
    }
  },
  
  on: { CLICK: "ShowNewspaper" },
},

    ShowNewspaper: {
      initial: "NewspaperDisplay",
      states: {
        NewspaperDisplay: {
          entry: "displayNewspaper", 
          on: { CONTINUE_CLICK: "#DM.Greeting" },
        },
      },
    },
    Greeting: {
      initial: "Prompt",
      on: {
        LISTEN_COMPLETE: [
          {
            target: "Debriefing",
            guard: "hasLastResult",
          },
          { target: ".NoInput" },
        ],
      },
      states: {
        Prompt: {
          entry: { type: "spst.speak", params: { utterance: `Hello sir ! I'm your assistant for these negotiations and i'm here to accomodate you with everything you might need during this time.`, voice: settings.ttsNarratorVoice } },
          on: { SPEAK_COMPLETE: "Ask" },
        },
        NoInput: {
          entry: {
            type: "spst.speak",
            params: { utterance: `Oh, I'm sorry for my insolence, I guess your long flight might have gotten you a little dizzy ! Hello again and hope everything works out in your favour today.`, voice: settings.ttsNarratorVoice },
          },
          on: { SPEAK_COMPLETE: "Ask" },
        },
        Ask: {
          entry: { type: "spst.listen" },
          on: {
            RECOGNISED: {
              actions: "assignLastResult",
            },
            ASR_NOINPUT: {
              actions: "clearLastResult",
            },
          },
        },
      },
    },
  
    Debriefing: {
      initial: "Prompt",
      states: {
        Prompt: {
          entry: { type: "spst.speak", params: { utterance: "Since you are here now, let's move on to your debriefing before our important meeting.I'm sure you would need some refresher sir. Would you like to learn more about Almeria or Prehevil?", voice: settings.ttsNarratorVoice } },
          on: { SPEAK_COMPLETE: "Ask" },
        },
        Ask: {
          entry: {type: "spst.listen",},
          on: {
            RECOGNISED: { 
              actions: ["assignLastResult", "debriefingDecisionMaker"]
            },
            ASR_NOINPUT: {
              target: "NoInput",
              actions: "clearLastResult"
            },
            
          },
        },
        NoInput: {
          entry: {
            type: "spst.speak",
            params: { utterance: "Sorry,I didn't hear anything. Would you like to learn about Almeria or Prehevil?", voice: settings.ttsNarratorVoice }
          },
          on: { SPEAK_COMPLETE: "Ask" },
        },
        NotInGrammar: {
          entry: {
            type: "spst.speak",
            params: ({}) => ({
              utterance: `Sorry,I didn't understand your choice. Please say Almeria, Prehevil, Both, or Neither.`, voice: settings.ttsNarratorVoice
            })
          },
          on: { SPEAK_COMPLETE: "Ask" },
        },
      

        AlmeriaDebriefingState: {
          entry: { type: "spst.speak", params: { utterance: "Let me tell you about the coastal region of Almeria—a land of fertile riches and agricultural might. The towering Arda Mountains conceal vast deposits of rare earth minerals, waiting to be found. Almeria is a proud exporter of olive oil, grains, fruits, and vegetables.But once a thriving economy, its brilliance has long vanished. The ravaging  wars in the neighboring lands had left marks on its trade and infrastructure. Now, Almeria stands at a crossroads, desperate for foreign investment to modernize its crumbling roads, neglected ports, and outdated industries", voice: settings.ttsNarratorVoice} },
          on: { SPEAK_COMPLETE: "#DM.Turn11" }, 
        },
        PrehevilDebriefingState: {
          entry: { type: "spst.speak", params: { utterance: " Prehevil  thrives on its vast mineral wealth and advanced manufacturing industry. Its factories buzz with progress, exporting technology and raw materials across the whole world. Yet, beneath its seemingly successful appearance, the growing populations and environmental degradation  are now pushing the prehevils  to seek new markets and agricultural imports to sustain its future.", voice: settings.ttsNarratorVoice } },
          on: { SPEAK_COMPLETE: "#DM.Turn11" }, 
        },
        BothDebriefingsState: {
          entry: { type: "spst.speak", params: { utterance: "Great choice. If you wanna bring victory to your homeland you need to understand what resources your enemy has ,but it is also essential to remember what you can bring at the table. You know....what resources you can use to win ! First let's talk about Almeria,the coastal region, —a land of fertile riches and agricultural might. The towering Arda Mountains conceal vast deposits of rare earth minerals, waiting to be found. Almeria is a proud exporter of olive oil, grains, fruits, and vegetables.But once a thriving economy, its brilliance has long vanished. The ravaging  wars in the neighboring lands had left marks on its trade and infrastructure. Now, Almeria stands at a crossroads, desperate for foreign investment to modernize its crumbling roads, neglected ports, and outdated industries.But don't let me get carried away. Prehevil also has its history.Remember,it thrives on its vast mineral wealth and advanced manufacturing industry. Its factories buzz with progress, exporting technology and raw materials across the whole world. Yet, beneath its seemingly successful appearance, the growing populations and environmental degradation  are now pushing the prehevils to also seek new markets and agricultural imports.", voice: settings.ttsNarratorVoice } },
          on: { SPEAK_COMPLETE: "#DM.Turn11" }, 
        },
        NegotiationState: {
          entry: { type: "spst.speak", params: { utterance: "Ok,then let's begin the negotiations immediately. Good luck !", voice: settings.ttsNarratorVoice } },
          
          on: { SPEAK_COMPLETE: "#DM.Turn11" }, 
        },
      },
      on: {
        LISTEN_COMPLETE: [
        
            
          {
            target: ".AlmeriaDebriefingState",
            guard: "debriefingDecisionIsAlmeria"
          },
          {
            target: ".PrehevilDebriefingState",
            guard: "debriefingDecisionIsPrehevil"
          },
          {
            target: ".BothDebriefingsState",
            guard: "debriefingDecisionIsBoth"
          },
          {
            target: ".NegotiationState",
            guard: "debriefingDecisionIsNeither"
          },
          {

            target: ".NotInGrammar",
            guard: ({ context }) =>
              context.lastResult !== null &&
              context.lastResult.length > 0 &&
              !isInGrammar(context.lastResult[0].utterance) 

          },
          {
            target: ".NoInput"
          }
        ],
      },
    },
    Turn11: {
      initial: "Prompt",
      states: {
        Prompt: {
          entry: [
            () => {
              const aiAvatarBox = document.getElementById('ai-avatar-box');
              
              if (aiAvatarBox) {
                aiAvatarBox.style.display = 'block';
                updateAvatars('ai');

              } else {
                console.error("Avatar elements not found!");
              }
            },
            () => {
              updateAvatars('ai');
            },"hideNewspaper",
            { type: "spst.speak", params: { utterance: "Sorry to interupt the discussion. I'm Furio,Grand Vizier of Almeria and i'm eager to begin the negotiations. I'll make the first offer." } }
          ],
          on: { SPEAK_COMPLETE: { target: "GenerateOffer", actions: () => updateAvatars("null_ai") } }, // Remove AI highlight
        },
        GenerateOffer: {
          invoke: {
            src: "callOpenAIStart",
            input: ({ context }) => ({
              ...context,
              lastResult: [{ utterance: "", confidence: 1 }], 
            }),
            onDone: {
              target: "SpeakOffer",
              actions: [
                assign({ llmResponse: ({ event }) => event.output }),
                assign({ chatHistory: ({ event }) => ("assistant" + event.output).slice(-5000) }),
              ],
            },
            onError: {
              target: "Prompt",
              actions: assign({ llmResponse: () => "I couldn't generate an offer due to an error." }),
            },
          },
        },
        SpeakOffer: {
          entry: [
            () => updateAvatars('ai'), 
            "speakLLMResponse"
          ],
          on: { SPEAK_COMPLETE: { target: "ListenForResponse", actions: () => updateAvatars("null_ai") } }, // Stop AI highlight
        },
        ListenForResponse: {
          entry: [
            () => {
              const playerAvatarBox = document.getElementById('player-avatar-box');
              if (playerAvatarBox){
              playerAvatarBox.style.display = 'block';
            }
          },
            () => updateAvatars('player'), 
            "spst.listen"
          ],
          on: {
            RECOGNISED: {
              actions: [
                "assignLastResult",
                assign({ chatHistory: ({ context, event }) => (context.chatHistory + "user:" + event.value[0].utterance).slice(-5000) }),
                () => updateAvatars("null_player"), 
              ],
              target: "#DM.Turn12",
            },
            ASR_NOINPUT: {
              target: "NoInput",
              actions: [
                "clearLastResult",
                () => updateAvatars("null_player") 
              ],
            },
          },
        },
        NoInput: {
          entry: [
            () => updateAvatars('ai'), 
            { type: "spst.speak", params: { utterance: "I didn't hear your response. Please reply to my offer." } }
          ],
          on: { SPEAK_COMPLETE: { target: "ListenForResponse", actions: () => updateAvatars("null_ai") } },
        },
      }
    },    
    Turn12: {
      initial: "Prompt",
      states: {
        Prompt: {
          entry: [
            () => updateAvatars('ai'), 
            { type: "spst.speak", params: { utterance: "Thank you for your response. Let me make a counteroffer." } }
          ],
          on: { SPEAK_COMPLETE: { target: "GenerateCounteroffer", actions: () => updateAvatars("null_ai") } }, // Stop AI highlight, use null_ai for consistency
          after: {
            2000: "GenerateCounteroffer", 
          },
        },
        GenerateCounteroffer: {
          invoke: {
            src: "callOpenAI",
            input: ({ context }) => context, 
            onDone: {
              target: "SpeakCounteroffer",
              actions: assign({ llmResponse: ({ event }) => event.output, chatHistory: ({ context, event }) => (context.chatHistory + "assistant:" + event.output).slice(-5000)}),
            },
            onError: {
              target: "Error",
              actions: assign({ llmResponse: () => "I couldn't generate a counteroffer." }),
            },
          },
        },
        SpeakCounteroffer: {
          entry: [
            () => updateAvatars('ai'), 
            "speakLLMResponse"
          ],
          on: { SPEAK_COMPLETE: { target: "ListenForResponse", actions: () => updateAvatars("null_ai") } }, 
        },
        ListenForResponse: {
          entry: [
            () => updateAvatars('player'), 
            "spst.listen"
          ],
          on: {
            RECOGNISED: {
              actions: [
                "assignLastResult",
                assign({  chatHistory: ({ context, event }) => (context.chatHistory + "user:" + event.value[0].utterance).slice(-5000)}),
                () => updateAvatars("null_player"), 
              ],
              target: "ProcessResponse",
            },
            ASR_NOINPUT: {
              target: "NoInput",
              actions: [
                "clearLastResult",
                () => updateAvatars("null_player") 
              ],
            },
          },
        },
        ProcessResponse: {
          always: "#DM.Turn13",
        },
        NoInput: {
          entry: [
            () => updateAvatars('ai'), // Highlight AI speaking again
            { type: "spst.speak", params: { utterance: "I didn't hear your response. Please reply to my counteroffer." } },
          ],
          on: { SPEAK_COMPLETE: { target: "ListenForResponse", actions: () => updateAvatars("null_ai") } }, // Stop AI highlight, use null_ai for consistency
        },
        Error: {
          entry: "speakLLMResponse",
          on: { SPEAK_COMPLETE: "ListenForResponse" },
        },
      },
    },
    Turn13: {
      initial: "Prompt",
      states: {
        Prompt: {
          entry: [
            () => updateAvatars('ai'), 
            { type: "spst.speak", params: { utterance: "Let's finalize the deal based on our discussion." } }
          ],
          on: { SPEAK_COMPLETE: { target: "GenerateDeal", actions: () => updateAvatars("null_ai") } }, // Stop AI highlight, use null_ai for consistency
          after: {
            2000: "GenerateDeal",
          },
        },
        GenerateDeal: {
          invoke: {
            src: "callOpenAI",
            input: ({ context }) => context,
            onDone: {
              target: "SpeakDeal",
              actions: assign({ llmResponse: ({ event }) => event.output, chatHistory: ({ context, event }) => (context.chatHistory + "assistant:" + event.output).slice(-5000)}),
            },
            onError: {
              target: "Error",
              actions: assign({ llmResponse: () => "I couldn't finalize the deal." }),
            },
          },
        },
        SpeakDeal: {
          entry: [
            () => updateAvatars('ai'), 
            "speakLLMResponse"
          ],
          on: { SPEAK_COMPLETE: { target: "JudgeWinner", actions: () => updateAvatars("null_ai") } }, 
        },
        JudgeWinner: {
          invoke: {
            src: "judgeDeal",
            input: ({ context }) => context,
            onDone: {
              target: "SpeakWinner",
              actions: [
                assign({
                  llmResponse: ({ event }) => event.output, 
                }),
                assign({
                  almeriaPoints: ({ context, event }) =>
                    event.output.toLowerCase().includes("almeria has won") ? context.almeriaPoints + 1 : context.almeriaPoints,
                  prehevilPoints: ({ context, event }) =>
                    event.output.toLowerCase().includes("prehevil has won") ? context.prehevilPoints + 1 : context.prehevilPoints,
                }),
              ],
            },
            onError: {
              target: "Error",
              actions: assign({ llmResponse: () => "I couldn't finalize the deal." }),
            },
          },
        },
        SpeakWinner: {
          entry: [
            
            "speakLLMResponseAssistant"
          ],
          on: { SPEAK_COMPLETE: { target: "#DM.Turn21" } },
        },
        Error: {
          entry: "speakLLMResponseAssistant",
          on: { SPEAK_COMPLETE: "JudgeWinner" },
        },
        End: {
          entry: "speakLLMResponseAssistant",
          type: "final",
        },
      },
    },
    Turn21: {
      initial: "Prompt",
      states: {
        Prompt: {
          entry: [

            { type: "spst.speak", params: { utterance: "Let's begin the second round of negociations. Please make your initial offer.", voice: settings.ttsNarratorVoice } }
          ],
          on: { SPEAK_COMPLETE: { target: "ListenForOffer" } },
        },
        ListenForOffer: {
          entry: [
            () => updateAvatars('player'), 
            "spst.listen"
          ],
          on: {
            RECOGNISED: {
              actions: [
                "assignLastResult",
                () => updateAvatars('null_player'),
                assign({
                  chatHistory: ({ context, event }) => (context.chatHistory + "user:" + event.value[0].utterance).slice(-5000)
                })
              ],
              target: "#DM.Turn22",
            },
            ASR_NOINPUT: {
              target: "NoInput",
              actions: "clearLastResult",
            },
          },
        },
        NoInput: {
          entry: [
            () => updateAvatars('ai'), 
            { type: "spst.speak", params: { utterance: "I didn't hear your response. Please make your initial offer." } },
          ],
          on: { SPEAK_COMPLETE: { target: "ListenForOffer", actions: () => updateAvatars("null_ai") } }, 
        },
      },
    },
    Turn22: {
      initial: "Prompt",
      states: {
        Prompt: {
          entry: [
            () => updateAvatars('ai'), 
            {
              type: "spst.speak",
              params: {
                utterance: "Thank you for your response. Let me make a counteroffer.",
                voice: settings.ttsFurioVoice 
              }
            }
          ],
          on: { SPEAK_COMPLETE: { target: "GenerateCounteroffer", actions: () => updateAvatars("null_ai") } }, // Stop AI highlight
          after: {
            2000: "GenerateCounteroffer",
          },
        },
        GenerateCounteroffer: {
          invoke: {
            src: "callOpenAI",
            input: ({ context }) => context,
            onDone: {
              target: "SpeakCounteroffer",
              actions: assign({
                llmResponse: ({ event }) => event.output,
                chatHistory: ({ context, event }) => (context.chatHistory + "assistant:" + event.output).slice(-5000)
              }),
            },
            onError: {
              target: "Error",
              actions: assign({ llmResponse: () => "I couldn't generate a counteroffer." }),
            },
          },
        },
        SpeakCounteroffer: {
          entry: [
            () => updateAvatars('ai'), 
            "speakLLMResponse"
          ],
          on: { SPEAK_COMPLETE: { target: "ListenForResponse", actions: () => updateAvatars("null_ai") } }, 
        },
        ListenForResponse: {
          entry: [
            () => updateAvatars('player'), 
            "spst.listen"
          ],
          on: {
            RECOGNISED: {
              actions: [
                "assignLastResult",
                assign({ chatHistory: ({ context, event }) => (context.chatHistory + "user:" + event.value[0].utterance).slice(-5000) }),
                () => updateAvatars("null_player") 
              ],
              target: "ProcessResponse",
            },
            ASR_NOINPUT: {
              target: "NoInput",
              actions: [
                "clearLastResult",
                () => updateAvatars("null_player") 
              ],
            },
          },
        },
        ProcessResponse: {
          always: "#DM.Turn23",
        },
        NoInput: {
          entry: [
            () => updateAvatars('ai'), 
            {
              type: "spst.speak",
              params: {
                utterance: "I didn't hear your response. Please reply to my counteroffer.",
                voice: settings.ttsFurioVoice 
              }
            }
          ],
          on: { SPEAK_COMPLETE: { target: "ListenForResponse", actions: () => updateAvatars("null_ai") } }, 
        },
        Error: {
          entry: [
            () => updateAvatars('ai'), 
            "speakLLMResponse"
          ],
          on: { SPEAK_COMPLETE: { target: "ListenForResponse", actions: () => updateAvatars("null_ai") } },
        },
      },
    },
    Turn23: {
      initial: "Prompt",
      states: {
        Prompt: {
          entry: [
            () => updateAvatars('ai'), 
            {
              type: "spst.speak",
              params: {
                utterance: "Let's finalize the deal based on our discussion.",
                voice: settings.ttsFurioVoice 
              }
            }
          ],
          on: { SPEAK_COMPLETE: { target: "GenerateDeal", actions: () => updateAvatars("null_ai") } }, 
          after: {
            2000: "GenerateDeal",
          },
        },
        GenerateDeal: {
          invoke: {
            src: "callOpenAI",
            input: ({ context }) => context,
            onDone: {
              target: "SpeakDeal",
              actions: assign({
                llmResponse: ({ event }) => event.output,
                chatHistory: ({ context, event }) => (context.chatHistory + "assistant:" + event.output).slice(-5000),
              }),
            },
            onError: {
              target: "Error",
              actions: assign({ llmResponse: () => "I couldn't finalize the deal." }),
            },
          },
        },
        SpeakDeal: {
          entry: [
            () => updateAvatars('ai'), 
            "speakLLMResponse"
          ],
          on: { SPEAK_COMPLETE: { target: "JudgeWinner", actions: () => updateAvatars("null_ai") } }, 
        },
        JudgeWinner: {
          invoke: {
            src: "judgeDeal",
            input: ({ context }) => context,
            onDone: {
              target: "SpeakWinner",
              actions: [
                assign({
                  llmResponse: ({ event }) => event.output,
                }),
                assign({
                  almeriaPoints: ({ context, event }) =>
                    event.output.toLowerCase().includes("almeria") ? context.almeriaPoints + 1 : context.almeriaPoints,
                  prehevilPoints: ({ context, event }) =>
                    event.output.toLowerCase().includes("prehevil") ? context.prehevilPoints + 1 : context.prehevilPoints,
                }),
              ],
            },
            onError: {
              target: "Error",
              actions: assign({ llmResponse: () => "I couldn't finalize the deal." }),
            },
          },
        },
        SpeakWinner: {
          entry: [
            
            "speakLLMResponseAssistant",
          ],
          on: { SPEAK_COMPLETE: { target: "#DM.AnnounceWinner" } },
        },
        Error: {
          entry: "speakLLMResponse",
          on: { SPEAK_COMPLETE: "JudgeWinner" },
        },
        End: {
          entry: "speakLLMResponse",
          type: "final",
        },
      },
    },
    AnnounceWinner: {
      initial: "DetermineWinner",
      states: {
        DetermineWinner: {
          always: [
            { target: "AlmeriaWins", guard: "almeriaHasMorePoints" },
            { target: "PrehevilWins", guard: "prehevilHasMorePoints" },
            { target: "Tie" }, 
          ],
        },
        AlmeriaWins: {
          entry: { type: "spst.speak", params: { utterance: "Almeria has negotiated a more favorable deal! Congratulations !", voice: settings.ttsNarratorVoice } },
          on: { SPEAK_COMPLETE: "End" },
        },
        PrehevilWins: {
          entry: { type: "spst.speak", params: { utterance: "Prehevil has negotiated a more favorable deal! Congratulations !", voice: settings.ttsNarratorVoice } },
          on: { SPEAK_COMPLETE: "End" },
        },
        Tie: {
          entry: { type: "spst.speak", params: { utterance: "It's a tie! Both sides have negotiated equally well.", voice: settings.ttsNarratorVoice } },
          on: { SPEAK_COMPLETE: "End" },
        },
        End: {
          type: "final",
        },
      },
    },
     
    },
  },
)



const dmActor = createActor(dmMachine, {
  inspect: inspector.inspect,
}).start();

dmActor.subscribe((state) => {
  console.group("State update");
  console.log("State value:", state.value);
  console.log("State context:", state.context);
  console.groupEnd();
});



function createDynamicButton(
  text: string,
  eventType: "CLICK" | "CHAT_LLM" | "CHOOSE_ALMERIA_DEBRIEFING" | "CHOOSE_PREHEVIL_DEBRIEFING" | "CHOOSE_BOTH_DEBRIEFINGS" | "CHOOSE_NEITHER_DEBRIEFING" | "CONTINUE_CLICK"
): HTMLButtonElement {
  const button = document.createElement('button');
  button.textContent = text;
  button.addEventListener('click', () => {
    dmActor.send({ type: eventType });
  });
  button.classList.add('dynamic-button');
  return button;
}


export function SetupButton(speechButtonElement: HTMLButtonElement) {
 
  
  const startButton = document.getElementById('start-button');
  const welcomeScreen = document.getElementById('welcome-screen');
  const gameUI = document.getElementById('game-ui');
  const newspaperBox = document.getElementById('newspaper-box');
  const newspaperContinueButton = document.getElementById('newspaper-continue-button');
  const instructionsButton = document.getElementById('instructions-button');
  const dynamicButtonsContainer = document.getElementById('dynamic-buttons-container'); 


  if (startButton && welcomeScreen && gameUI && newspaperBox && instructionsButton && dynamicButtonsContainer) {
    
      startButton.addEventListener('click', () => {
          dmActor.send({ type: "CLICK" });
          welcomeScreen.style.display = 'none';
          newspaperBox.style.display = 'block';
          gameUI.style.display = 'block';
      });
      startButton.textContent = "Start Game";
      instructionsButton.addEventListener('click', () => {
          alert("Instructions:\n\n1. Click 'Start Game' to begin.\n2. Follow the on-screen prompts.\n3. Use your voice to negotiate !");
      });

  } else {
      console.error("UI elements not found in index.html!");
  }

  speechButtonElement.addEventListener("click", () => {
    dmActor.send({ type: "CLICK" });
  });

  if (newspaperContinueButton) {
    newspaperContinueButton.addEventListener("click", () => {
      dmActor.send({ type: "CONTINUE_CLICK" });
    });
  }

  dmActor.subscribe((snapshot) => {
    const meta: { view?: string } = Object.values(
      snapshot.context.spstRef.getSnapshot().getMeta()
    )[0] || {
      view: undefined,
    };
    speechButtonElement.innerHTML = `${meta.view}`; 
  });
}
