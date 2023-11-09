function log() {
  var delta = new Date().toLocaleString('fr-FR');
  var message = delta + ': ' + arguments[0];

  var args = [];
  if (arguments.length>1) {
      for(var i = 0; i < arguments.length; i++) {
        args.push(arguments[i]);
      }
      console.log(message, args);
  } else  {
      console.log(message);
  }
}

module.exports = {
  log
};