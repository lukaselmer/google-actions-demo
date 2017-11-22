"use strict";

const functions = require("firebase-functions"); // Cloud Functions for Firebase library
const DialogflowApp = require("actions-on-google").DialogflowApp; // Google Assistant helper library
exports.dialogflowFirebaseFulfillment = functions.https.onRequest(
  (request, response) => {
    console.log(
      "Dialogflow Request headers: " + JSON.stringify(request.headers)
    );
    console.log("Dialogflow Request body: " + JSON.stringify(request.body));
    if (request.body.result) {
      console.error("Wrong API Version (V1): processV1Request does not exist");
    } else if (request.body.queryResult) {
      processV2Request(request, response);
    } else {
      console.log("Invalid Request");
      return response
        .status(400)
        .end("Invalid Webhook Request (expecting v1 or v2 webhook request)");
    }
  }
);

/*
* Function to handle v2 webhook requests from Dialogflow
*/
function processV2Request(request, response) {
  // An action is a string used to identify what needs to be done in fulfillment
  let action = request.body.queryResult.action
    ? request.body.queryResult.action
    : "default";
  // Parameters are any entites that Dialogflow has extracted from the request.
  let parameters = request.body.queryResult.parameters || {}; // https://dialogflow.com/docs/actions-and-parameters
  // Contexts are objects used to track and store conversation state
  let inputContexts = request.body.queryResult.contexts; // https://dialogflow.com/docs/contexts
  // Get the request source (Google Assistant, Slack, API, etc)
  let requestSource = request.body.originalDetectIntentRequest
    ? request.body.originalDetectIntentRequest.source
    : undefined;
  // Get the session ID to differentiate calls from different users
  let session = request.body.session ? request.body.session : undefined;
  // Create handlers for Dialogflow actions as well as a 'default' handler
  const actionHandlers = {
    // The default welcome intent has been matched, welcome the user (https://dialogflow.com/docs/events#default_welcome_intent)
    "input.welcome": () => {
      sendResponse("Hello, Welcome to my Dialogflow agent!"); // Send simple response to user
    },
    // The default fallback intent has been matched, try to recover (https://dialogflow.com/docs/intents#fallback_intents)
    "input.unknown": () => {
      // Use the Actions on Google lib to respond to Google requests; for other requests use JSON
      sendResponse("I'm having trouble, can you try that again?"); // Send simple response to user
    },
    rollTheDice: () => {
      const attendees = [
        "TODO"
      ];
      const winner = attendees[Math.floor(Math.random() * attendees.length)];

      const responseToUser = {
        outputContexts: [
          {
            name: `${session}/contexts/winner`,
            lifespanCount: 100,
            parameters: { winner: winner }
          }
        ],
        fulfillmentMessages: richResponsesV2
        // fulfillmentText: "Sure! Rolling the dice... Done!"
      };
      sendResponse(responseToUser);
    },
    // Default handler for unknown or undefined actions
    default: () => {
      const responseToUser = {
        //fulfillmentMessages: richResponsesV2, // Optional, uncomment to enable
        //outputContexts: [{ 'name': `${session}/contexts/weather`, 'lifespanCount': 2, 'parameters': {'city': 'Rome'} }], // Optional, uncomment to enable
        fulfillmentText:
          "This is from Dialogflow's Cloud Functions for Firebase editor! :-)" // displayed response
      };
      sendResponse(responseToUser);
    }
  };
  // If undefined or unknown action use the default handler
  if (!actionHandlers[action]) {
    action = "default";
  }
  // Run the proper handler function to handle the request from Dialogflow
  actionHandlers[action]();
  // Function to send correctly formatted responses to Dialogflow which are then sent to the user
  function sendResponse(responseToUser) {
    // if the response is a string send it as a response to the user
    if (typeof responseToUser === "string") {
      let responseJson = { fulfillmentText: responseToUser }; // displayed response
      response.json(responseJson); // Send response to Dialogflow
    } else {
      // If the response to the user includes rich responses or contexts send them to Dialogflow
      let responseJson = {};
      // Define the text response
      responseJson.fulfillmentText = responseToUser.fulfillmentText;
      // Optional: add rich messages for integrations (https://dialogflow.com/docs/rich-messages)
      if (responseToUser.fulfillmentMessages) {
        responseJson.fulfillmentMessages = responseToUser.fulfillmentMessages;
      }
      // Optional: add contexts (https://dialogflow.com/docs/contexts)
      if (responseToUser.outputContexts) {
        responseJson.outputContexts = responseToUser.outputContexts;
      }
      // Send the response to Dialogflow
      console.log("Response to Dialogflow: " + JSON.stringify(responseJson));
      response.json(responseJson);
    }
  }
}
const richResponsesV2 = [
  {
    platform: "PLATFORM_UNSPECIFIED",
    simple_responses: {
      simple_responses: [
        {
          text_to_speech:
            '<speak>Sure! Rolling the dice... <audio clipBegin="10s" clipEnd="16s" src="https://actions.google.com/sounds/v1/cartoon/drum_roll.ogg">drumroll</audio></speak>',
          display_text: "Sure! Rolling the dice... Done."
        }
      ]
    }
  },
  {
    platform: "ACTIONS_ON_GOOGLE",
    simple_responses: {
      simple_responses: [
        {
          text_to_speech:
            '<speak>Sure! Rolling the dice... <audio clipBegin="10s" clipEnd="16s" src="https://actions.google.com/sounds/v1/cartoon/drum_roll.ogg">drumroll</audio></speak>',
          display_text: "Sure! Rolling the dice... Done."
        }
      ]
    }
  }
];
