/** EXAMPLE 2 
 * get()
*/

/** requires index.js to import functions */
var reply = require('./../../');

/** Creates option object */
var opts = {
  social: {
    message: 'What is your favorite social media website?'
  }
}
/** 
 * @param {object} options 
 * @param {Function} callback 
 * @returns {callback} - or has an empty return
 */
reply.get(opts, function(err, result){
  if (err) return console.log("Okay maybe next time");

  console.log(result);
})

