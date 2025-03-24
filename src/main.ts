import "./style.css";

import { SetupButton } from "./dm.ts";


const startButton = document.querySelector<HTMLButtonElement>("#start-button");
if (startButton) {
  SetupButton(startButton); 
} else {
  console.error("Start button not found!");
}