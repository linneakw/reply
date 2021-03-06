/** 
 * requires the readline module to allow the user to read 
 * input from the console
 */
var rl, readline = require('readline');

/**
 * @constructor
 * @param {ReadStream} stdin - Stream of standard input
 * @param {WriteStream} stdout - Stream of standard output 
 * @return {Interface} rl - returns the readline interface 
 */
var get_interface = function(stdin, stdout) {
  if (!rl) rl = readline.createInterface(stdin, stdout); // if there isn't an existing interface, create one
  else stdin.resume(); // interface exists
  return rl;
}

/**
 * creates a confirmation response, and evaluates the answer's truthiness
 * @param {String} message - sets confirmation message
 * @param {Function} callback - is called with null, and the answer's evaluated status
 */
var confirm = exports.confirm = function(message, callback) {
  /** creates a question object containing a confirmation reply. */
  var question = {
    'reply': {
      type: 'confirm',
      message: message,
      default: 'yes'
    }
  }
  /**
   * @param {object} question
   * @param {Function} (err,answer) - callback function
   * Gets the new question, calls confirm's callback function on the
   * the truthiness of the response it received.
   */ 
  get(question, function(err, answer) {
    if (err) return callback(err);
    callback(null, answer.reply === true || answer.reply == 'yes');
  });

};

/**
 * @param {object} options 
 * @param {Function} callback 
 * @returns {callback} - or has an empty return
 */
var get = exports.get = function(options, callback) {
    /** if there's no callback, don't process further */ 
  if (!callback) return; // no point in continuing
  /* if the options isn't an object, tell the user and process their response again */
  if (typeof options != 'object')
    return callback(new Error("Please pass a valid options object."))
  
  /** 
   * object with stream in and out, and gives the the option
   * object's keys to the object's fields
   */
  var answers = {},
      stdin = process.stdin,
      stdout = process.stdout,
      fields = Object.keys(options);
  /**
   * called after something is done, processes answers and closes prompt
   */
  var done = function() {
    close_prompt();
    callback(null, answers);
  }
  /** 
   * pauses input, ends if there's no rl anyways, but closes
   * the prompt if there is
  */
  var close_prompt = function() {
    stdin.pause();
    if (!rl) return;
    rl.close();
    rl = null;
  }
/**
 * @param {string} key
 * @param {object} partial_answers
 * @returns {object} 
 * returns the default options if the options has a field matching the key, 
 * and calls a function with partial answers if the key's default is a function
 */
  var get_default = function(key, partial_answers) {
    if (typeof options[key] == 'object')
      return typeof options[key].default == 'function' ? options[key].default(partial_answers) : options[key].default;
    else
      return options[key];
  }
/**
 * @param {string} reply
 * @returns {string} reply - returns the reply back if it has not yet been evaluated
 * interprets the reply as true or flase, otherwise sends the reply back
 */
  var guess_type = function(reply) {

    if (reply.trim() == '')
      return;
    else if (reply.match(/^(true|y(es)?)$/))
      return true;
    else if (reply.match(/^(false|n(o)?)$/))
      return false;
    else if ((reply*1).toString() === reply)
      return reply*1;

    return reply;
  }
/**
 * @param {string} key
 * @param {boolean} answer - should be passed in as boolean
 * @returns {boolean}
 * analyzes the answer
 */
  var validate = function(key, answer) {

    if (typeof answer == 'undefined')
      return options[key].allow_empty || typeof get_default(key) != 'undefined';
    else if(regex = options[key].regex)
      return regex.test(answer);
    else if(options[key].options)
      return options[key].options.indexOf(answer) != -1;
    else if(options[key].type == 'confirm')
      return typeof(answer) == 'boolean'; // answer was given so it should be
    else if(options[key].type && options[key].type != 'password')
      return typeof(answer) == options[key].type;

    return true;

  }
/**
 * @param {string} key
 * show's the error attached to the key's object, and prints out it's 
 * error and options
 */
  var show_error = function(key) {
    var str = options[key].error ? options[key].error : 'Invalid value.';

    if (options[key].options)
        str += ' (options are ' + options[key].options.join(', ') + ')';

    stdout.write("\033[31m" + str + "\033[0m" + "\n");
  }
/** 
 * @param {string} key
 * writes out the message
 */
  var show_message = function(key) {
    var msg = '';

    if (text = options[key].message)
      msg += text.trim() + ' ';

    if (options[key].options)
      msg += '(options are ' + options[key].options.join(', ') + ')';

    if (msg != '') stdout.write("\033[1m" + msg + "\033[0m\n");
  }

  // taken from commander lib
  /**
   * @param {Object} promppt
   * @param {Function} callback
   * exits if user hits ctrl c, and masks the password as it's typed
   */
  var wait_for_password = function(prompt, callback) {

    var buf = '',
        mask = '*';
    /**
     * @param {string} c
     * @param {string} key
     * is called everytime a key is pressed
     * to process the input
     */
    var keypress_callback = function(c, key) {

      if (key && (key.name == 'enter' || key.name == 'return')) {
        stdout.write("\n");
        stdin.removeAllListeners('keypress');
        // stdin.setRawMode(false);
        return callback(buf);
      }
      /** If the user pressed control c, quit prompt */
      if (key && key.ctrl && key.name == 'c')
        close_prompt();
      /** remove the mask over the password */
      if (key && key.name == 'backspace') {
        buf = buf.substr(0, buf.length-1);
        var masked = '';
        for (i = 0; i < buf.length; i++) { masked += mask; }
        stdout.write('\r\033[2K' + prompt + masked);
      } else {
        stdout.write(mask);
        buf += c;
      }

    };
    /** 
     * calls the keypress_callback after a key has been pressed
     * in input 
     */
    stdin.on('keypress', keypress_callback);
  }
  /**
   * @param {int} index - the current index in the question bank
   * @param {string} curr_key - the current key being evaluated
   * @param {Function} fallback - to return to if the answer is undefined
   * @param {string} reply
   * 
   */
  var check_reply = function(index, curr_key, fallback, reply) {
    var answer = guess_type(reply);
    var return_answer = (typeof answer != 'undefined') ? answer : fallback;

    if (validate(curr_key, answer))
      next_question(++index, curr_key, return_answer);
    else
      show_error(curr_key) || next_question(index); // repeats current
  }
  /**
   * @param {object} conds 
   * @returns {boolean}
   * returns whether or not dependencies were met
   */
  var dependencies_met = function(conds) {
    for (var key in conds) {
      var cond = conds[key];
      if (cond.not) { // object, inverse
        if (answers[key] === cond.not)
          return false;
      } else if (cond.in) { // array 
        if (cond.in.indexOf(answers[key]) == -1) 
          return false;
      } else {
        if (answers[key] !== cond)
          return false; 
      }
    }

    return true;
  }
  /**
   * @param {int} index
   * @param {string} prev_key
   * @param {string} answer
   * @returns {Function}
   * Determines if there's a following question, and asks it or 
   * declares the process done.
   */
  var next_question = function(index, prev_key, answer) {
    if (prev_key) answers[prev_key] = answer;

    var curr_key = fields[index];
    if (!curr_key) return done();

    if (options[curr_key].depends_on) {
      if (!dependencies_met(options[curr_key].depends_on))
        return next_question(++index, curr_key, undefined);
    }

    var prompt = (options[curr_key].type == 'confirm') ?
      ' - yes/no: ' : " - " + curr_key + ": ";
    /** falls back to the default method if it needs to */
    var fallback = get_default(curr_key, answers);
    if (typeof(fallback) != 'undefined' && fallback !== '')
      prompt += "[" + fallback + "] ";
    /** shows the current message */
    show_message(curr_key);

    if (options[curr_key].type == 'password') {

      var listener = stdin._events.keypress; // to reassign down later
      stdin.removeAllListeners('keypress');

      // stdin.setRawMode(true);
      stdout.write(prompt);
      /** gets the password */
      wait_for_password(prompt, function(reply) {
        stdin._events.keypress = listener; // reassign
        check_reply(index, curr_key, fallback, reply)
      });

    } else {

      rl.question(prompt, function(reply) {
        check_reply(index, curr_key, fallback, reply);
      });

    }

  }
  /** gets the interface and starts asking questions */
  rl = get_interface(stdin, stdout);
  next_question(0);
  /**
   * closes the prompt when the readline is closed
   * also closes if the answers have been filled
   */
  rl.on('close', function() {
    close_prompt(); // just in case

    var given_answers = Object.keys(answers).length;
    if (fields.length == given_answers) return;

    var err = new Error("Cancelled after giving " + given_answers + " answers.");
    callback(err, answers);
  });

}
