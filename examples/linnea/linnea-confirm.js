/** EXAMPLE 1
 *  confirm()
 */

/** requires index.js to import functions */
var reply = require('./../../');

/**
 * @param {string} - confirmation question
 * @param {function} callback(err, yes) 
 * Asks for confirmation, and processes the answer. 
 */
reply.confirm("Do you know what you're doing?", function(err, yes){
  /** If there's no answer and the answer is yes */
  if (!err && yes)
    console.log("HECK YEAH YOU DO!");
  else
    console.log("Oh... You should go back and read the comments.");
});

