"use strict";

const functions = require("firebase-functions");
const DialogflowApp = require("actions-on-google").DialogflowApp;

const attendees = [
  "John Doe",
  "Chuck Norris",
  "Mickey Mouse"
];

exports.dialogflowFirebaseFulfillment = functions.https.onRequest(
  (request, response) => {
    console.log(
      "Dialogflow Request headers: " + JSON.stringify(request.headers)
    );
    console.log("Dialogflow Request body: " + JSON.stringify(request.body));
    if (request.body.queryResult) {
      processV2Request(request, response);
    } else {
      console.log("Invalid Request");
      return response
        .status(400)
        .end("Invalid Webhook Request (expecting v2 webhook request)");
    }
  }
);

function processV2Request(request, response) {
  function sendResponse(responseToUser) {
    const responseJson = {};
    responseJson.fulfillmentText = responseToUser.fulfillmentText;
    if (responseToUser.fulfillmentMessages) {
      responseJson.fulfillmentMessages = responseToUser.fulfillmentMessages;
    }
    if (responseToUser.outputContexts) {
      responseJson.outputContexts = responseToUser.outputContexts;
    }
    console.log(`Response to Dialogflow: ${JSON.stringify(responseJson)}`);
    response.json(responseJson);
  }

  // An action is a string used to identify what needs to be done in fulfillment
  const action = request.body.queryResult.action
    ? request.body.queryResult.action
    : "default";
  // Parameters are any entites that Dialogflow has extracted from the request.
  // const parameters = request.body.queryResult.parameters || {}; // https://dialogflow.com/docs/actions-and-parameters
  // Contexts are objects used to track and store conversation state
  // const inputContexts = request.body.queryResult.contexts; // https://dialogflow.com/docs/contexts
  // Get the request source (Google Assistant, Slack, API, etc)
  // const requestSource = request.body.originalDetectIntentRequest
  //   ? request.body.originalDetectIntentRequest.source
  //   : undefined;
  // Get the session ID to differentiate calls from different users
  const session = request.body.session ? request.body.session : undefined;
  // Create handlers for Dialogflow actions as well as a 'default' handler
  const actionHandlers = {
    // The default welcome intent has been matched, welcome the user (https://dialogflow.com/docs/events#default_welcome_intent)
    // "input.welcome": () => {
    //   sendResponse({ fulfillmentText: "Hello, Welcome to my Dialogflow agent!" }); // Send simple response to user
    // },
    // The default fallback intent has been matched, try to recover (https://dialogflow.com/docs/intents#fallback_intents)
    // "input.unknown": () => {
    //   // Use the Actions on Google lib to respond to Google requests; for other requests use JSON
    //   sendResponse({ fulfillmentText: "I'm having trouble, can you try that again?" }); // Send simple response to user
    // },
    // See also: contexts (https://dialogflow.com/docs/contexts)
    rollTheDice: () => {
      const winner = attendees[Math.floor(Math.random() * attendees.length)];
      console.log(`The winner is: ${winner}`);

      sendResponse({
        outputContexts: [
          {
            name: `${session}/contexts/winner`,
            lifespanCount: 100,
            parameters: { winner: winner }
          }
        ],
        fulfillmentMessages: determineWinnerMessages
      });
    },
    default: () => {
      sendResponse({ fulfillmentText: `Action ${action} is not defined` });
    }
  };

  const actionHandler = actionHandlers[action] || actionHandlers['default']
  actionHandler();
}

const determineWinnerResponse = {
  text_to_speech:
    '<speak>Sure! Rolling the dice... <audio clipBegin="10s" clipEnd="16s" src="https://actions.google.com/sounds/v1/cartoon/drum_roll.ogg">drumroll</audio></speak>',
  display_text: "Sure! Rolling the dice... Done."
};

// See rich messages for integrations (https://dialogflow.com/docs/rich-messages)
const determineWinnerMessages = [
  {
    platform: "PLATFORM_UNSPECIFIED",
    simple_responses: { simple_responses: [determineWinnerResponse] }
  },
  {
    platform: "ACTIONS_ON_GOOGLE",
    simple_responses: { simple_responses: [determineWinnerResponse] }
  }
];
