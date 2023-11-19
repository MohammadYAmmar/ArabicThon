const Alexa = require('ask-sdk-core');
const https = require('https');

const apiEndpoint = 'https://siwar.ksaa.gov.sa/api/alriyadh/random/words?count=1';
const apiKey = 'PLEASE-API-HERE'; // Replace with your actual API key

function getRandomWord() {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'Accept': 'application/json',
        'apikey': apiKey,
      },
    };

    https.get(apiEndpoint, options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const randomWord = JSON.parse(data)[0];
          resolve(randomWord);
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

const states = {
  FIRST_RESPONSE: '_FIRST_RESPONSE',
  WAITING_FOR_RESPONSE: '_WAITING_FOR_RESPONSE',
};
const getRandomWordHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest' ||
      (Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
        Alexa.getIntentName(handlerInput.requestEnvelope) === 'GetRandomWordIntent')
    );
  },
  async handle(handlerInput) {
    try {
      const randomWord = await getRandomWord();
      const speakOutput = `ها هي كلمة عشوائية: ${randomWord.lemma.formRepresentations[0].form}. التعريف: ${randomWord.senses[0].definition.textRepresentations[0].form} هل ترغب في سماع كلمة أخرى؟`;

      handlerInput.attributesManager.setSessionAttributes({
        lastWord: randomWord,
        state: states.WAITING_FOR_RESPONSE, // Update the state to WAITING_FOR_RESPONSE
      });

      return handlerInput.responseBuilder.speak(speakOutput).reprompt('هل ترغب في سماع كلمة أخرى؟').getResponse();
    } catch (error) {
      console.error('Error getting random word:', error);
      const speakOutput = 'عذرًا، حدث خطأ. يرجى المحاولة مرة أخرى لاحقًا.';

      return handlerInput.responseBuilder.speak(speakOutput).getResponse();
    }
  },
};

const yesIntentHandler = {
  canHandle(handlerInput) {
    const state = handlerInput.attributesManager.getSessionAttributes().state;
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.YesIntent' &&
      state === states.WAITING_FOR_RESPONSE
    );
  },
  async handle(handlerInput) {
    try {
      const randomWord = await getRandomWord();
      const speakOutput = `ها هي كلمة عشوائية: ${randomWord.lemma.formRepresentations[0].form}. التعريف: ${randomWord.senses[0].definition.textRepresentations[0].form} هل ترغب في سماع كلمة أخرى؟`;

      handlerInput.attributesManager.setSessionAttributes({
        lastWord: randomWord,
        state: states.WAITING_FOR_RESPONSE, // Keep the state as WAITING_FOR_RESPONSE
      });

      return handlerInput.responseBuilder.speak(speakOutput).reprompt('هل ترغب في سماع كلمة أخرى؟').getResponse();
    } catch (error) {
      console.error('Error getting random word:', error);
      const speakOutput = 'عذرًا، حدث خطأ. يرجى المحاولة مرة أخرى لاحقًا.';

      return handlerInput.responseBuilder.speak(speakOutput).getResponse();
    }
  },
};

const noIntentHandler = {
  canHandle(handlerInput) {
    const state = handlerInput.attributesManager.getSessionAttributes().state;
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.NoIntent' &&
      state === states.WAITING_FOR_RESPONSE
    );
  },
  handle(handlerInput) {
    const speakOutput = 'شكرًا لاستخدام خدمتنا من معجم الرياض';
    handlerInput.attributesManager.setSessionAttributes({
      state: states.FIRST_RESPONSE, // Reset the state to FIRST_RESPONSE
    });
    return handlerInput.responseBuilder.speak(speakOutput).getResponse();
  },
};

exports.handler = Alexa.SkillBuilders.custom()
  .addRequestHandlers(
    getRandomWordHandler,
    yesIntentHandler,
    noIntentHandler,
    // Add other handlers as needed
  )
  .lambda();

