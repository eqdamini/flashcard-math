'use strict';
var Alexa = require("alexa-sdk");
var appId = ''; //'amzn1.echo-sdk-ams.app.your-skill-id';

exports.handler = function(event, context, callback) {
  var alexa = Alexa.handler(event, context);
  alexa.appId = appId;
  alexa.dynamoDBTableName = 'flashCardMath';
  alexa.registerHandlers(newSessionHandlers, guessModeHandlers, startGameHandlers, guessAttemptHandlers);
  alexa.execute();
};

var states = {
  GUESSMODE: '_GUESSMODE', // User is trying to guess the number.
  STARTMODE: '_STARTMODE'  // Prompt the user to start or restart the game.
};

var newSessionHandlers = {
"NewSession": function() {
  this.handler.state = states.STARTMODE;
	this.emit(":ask", "Welcome to flash card math. Would you like to play?");
},
"AMAZON.StopIntent": function() {
    this.emit(':tell', "Goodbye!");
},
"AMAZON.CancelIntent": function() {
    this.emit(':tell', "Goodbye!");
},
'SessionEndedRequest': function () {
      console.log('session ended!');
      //this.attributes['endedSessionCount'] += 1;
      this.emit(":tell", "Goodbye!");
}
}

var startGameHandlers = Alexa.CreateStateHandler(states.STARTMODE, {
  'NewSession': function () {
      this.emit('NewSession'); // Uses the handler in newSessionHandlers
  },
  'AMAZON.HelpIntent': function() {
      var message = ("I will give you a math problem. Try to give the correct" +
          "answer. Do you want to start the game?");
      this.emit(':ask', message, message);
  },
  'AMAZON.YesIntent': function() {
      var message = "Great! Say 'one digit' or 'two digits'.";
      this.emit(':ask', message, message);
  },
  'singleDigit': function() {
      this.attributes["digit1"] = Math.floor(Math.random() * 10);
      this.attributes["digit2"] = Math.floor(Math.random() * 10);
      var message1 = "Great! Say 'add', 'subtract', or 'multiply'";
      var message2 = "Tell me to add, subtract, or multiply";
      this.emit(':ask', message1, message2);
  },
  'doubleDigits': function() {
      this.attributes["digit1"] = 10 + Math.floor(Math.random() * 90);
      this.attributes["digit2"] = 10 + Math.floor(Math.random() * 90);
      var message1 = "Great! Say 'add', 'subtract', or 'multiply'";
      var message2 = "Tell me to add, subtract, or multiply";
      this.emit(':ask', message1, message2);
  },
  'chooseAdd': function() {
      this.attributes["guessNumber"] = this.attributes["digit1"] + this.attributes["digit2"];
      this.handler.state = states.GUESSMODE;
      var message = "I will give you an addition problem. Add " + this.attributes["digit1"] +
          " and " + this.attributes["digit2"] + ". Try to give the correct answer.";
      this.emit(':ask', message, message);
  },
  'chooseSubtract': function() {
      if (this.attributes["digit2"] > this.attributes["digit1"]) {
        this.attributes["guessNumber"] = this.attributes["digit2"] - this.attributes["digit1"];
        var message = "I will give you a subtraction problem. Subtract " + this.attributes["digit2"] +
            " and " + this.attributes["digit1"] + ". Try to give the correct answer.";
      }
      else {
        this.attributes["guessNumber"] = this.attributes["digit1"] - this.attributes["digit2"];
        var message = "I will give you a subtraction problem. Subtract " + this.attributes["digit1"] +
            " and " + this.attributes["digit2"] + ". Try to give the correct answer.";
      }
      this.handler.state = states.GUESSMODE;
      this.emit(':ask', message, message);
  },
  'chooseMultiply': function() {
      this.attributes["guessNumber"] = this.attributes["digit1"] * this.attributes["digit2"];
      this.handler.state = states.GUESSMODE;
      var message = "I will give you a multiplication problem. Multiply " + this.attributes["digit1"] +
          " and " + this.attributes["digit2"] + ". Try to give the correct answer.";
      this.emit(':ask', message, message);
  },
  'AMAZON.NoIntent': function() {
      console.log("NOINTENT");
      this.emit(':tell', 'Ok, see you next time!');
  },
  "AMAZON.StopIntent": function() {
    console.log("STOPINTENT");
    this.emit(':tell', "Goodbye!");
  },
  "AMAZON.CancelIntent": function() {
    console.log("CANCELINTENT");
    this.emit(':tell', "Goodbye!");
  },
  'SessionEndedRequest': function () {
      console.log("SESSIONENDEDREQUEST");
      //this.attributes['endedSessionCount'] += 1;
      this.emit(':tell', "Goodbye!");
  },
  'Unhandled': function() {
      console.log("UNHANDLED");
      var message = 'Say yes to continue, or no to end the game.';
      this.emit(':ask', message, message);
  },
});

var guessModeHandlers = Alexa.CreateStateHandler(states.GUESSMODE, {
    'NewSession': function () {
        this.handler.state = '';
        this.emitWithState('NewSession'); // Equivalent to the Start Mode NewSession handler
    },
    'NumberGuessIntent': function() {
        var guessNum = parseInt(this.event.request.intent.slots.number.value);
        var targetNum = this.attributes["guessNumber"];
        console.log('user guessed: ' + guessNum);

        if (guessNum === targetNum){
            // With a callback, use the arrow function to preserve the correct 'this' context
            this.emit('JustRight', () => {
                this.emit(':ask', guessNum.toString() + ' is correct! Would you like to play a new game?',
                'Say yes to start a new game, or no to end the game.');
        })
        }
        else if (guessNum != targetNum){
            console.log("guessNum != targetNum")
            this.emit('Incorrect');
        }
        else {
          this.emit('NotANum')
        }
    },
    'AMAZON.HelpIntent': function() {
        this.emit(':ask', 'I am thinking of a number between zero and one hundred, try to guess and I will tell you' +
            ' if it is higher or lower.', 'Try saying a number.');
    },
    "AMAZON.StopIntent": function() {
        console.log("STOPINTENT");
      this.emit(':tell', "Goodbye!");
    },
    "AMAZON.CancelIntent": function() {
        console.log("CANCELINTENT");
    },
    'SessionEndedRequest': function () {
        console.log("SESSIONENDEDREQUEST");
        this.attributes['endedSessionCount'] += 1;
        this.emit(':tell', "Goodbye!");
    },
    'Unhandled': function() {
        console.log("UNHANDLED");
        this.emit(':ask', 'Sorry, I didn\'t get that. Try saying a number.', 'Try saying a number.');
    }
});

// These handlers are not bound to a state
var guessAttemptHandlers = {
    'JustRight': function(callback) {
        this.handler.state = states.STARTMODE;
        callback();
    },
    'Incorrect': function() {
        this.emit(":ask", "That is incorrect. Please try again.");
        console.log("incorrect");
    },
    'NotANum': function() {
        this.emit(':ask', 'Sorry, I didn\'t get that. Try saying a number.', 'Try saying a number.');
    }
};
