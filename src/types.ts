import { Hypothesis, SpeechStateExternalEvent, Settings as OriginalSettings } from "speechstate";
import { AnyActorRef } from "xstate";

declare module 'speechstate' {
  export interface Settings {
    ttsFurioVoice?: string;
    ttsNarratorVoice?: string;
  }
}


export interface DMContext {
  spstRef: AnyActorRef;
  lastResult: Hypothesis[] | null;
  debriefingDecision : string | null | undefined;
  llmResponse : string | null | undefined;
  chatHistory : string | null | undefined;
  almeriaPoints : number;
  prehevilPoints : number;
  aiCard : Card;
  settings : OriginalSettings;
}



export interface Resource  { 
  availableResources: string;
}


export interface Card {
  name: string;
  job: string;
  scenario: string;
  resources: Resource; 
  utterance: string | null;
  objective: {
    goals: string;
  }
}

export type DMEvents = SpeechStateExternalEvent 
| { type: "CLICK" } | { type: "CHAT_LLM" }
| { type: "CHOOSE_ALMERIA_DEBRIEFING" }
| { type: "CHOOSE_PREHEVIL_DEBRIEFING" }
| { type: "CHOOSE_BOTH_DEBRIEFINGS" }
| { type: "CHOOSE_NEITHER_DEBRIEFING" }
| { type: "CONTINUE_CLICK" };