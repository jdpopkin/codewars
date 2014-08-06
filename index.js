var fs = require("fs"),
    mkdirp = require("mkdirp"),
    rest   = require("restler"),
    Q = require("q");

module.exports = function(opts){
  if (!opts) opts = {};
  var c = new C (opts);
  c.paths = C.paths;
  return c;
}

function C (opts){
}

C.paths = {
  config: process.env.HOME + "/.config/"
}
C.paths.settings = C.paths.config + "codewars/";
C.paths.challenges = C.paths.settings + "challenges/";

C.prototype.setup = function(opts){
  this.token = opts.token || '';
  this.language = opts.language || '';

  var settings = {
    token: this.token,
    language: this.language
  }

  mkdirp(C.paths.challenges, {}, function(err, made){
    if (err) throw "Unable to create ~/.config/codewars";
    fs.writeFile(C.paths.settings + "settings.json", JSON.stringify(settings));
  });
}

C.prototype.next = function(){
  var df = Q.defer();

  fs.readFile(C.paths.settings + "settings.json", {encoding: "utf-8"}, function(err, data){
    if (err) throw "Unable to read from ~/.config/codewars/settings.json. Does it exist?"
    var token = JSON.parse(data).token;
    if (!token) throw "Token not found, run 'codewars setup' first."
    var language = JSON.parse(data).language.toLowerCase();
    if (!language) throw "Language not found, run 'codewars setup' first."
    if (!/ruby|javascript/.test(language)) throw language + " is unsupported. Ruby and JS only."

    rest.post('https://www.codewars.com/api/v1/code-challenges/' + language + '/train', {
      data: { strategy: 'random' },
      headers: { Authorization: token }
    }).on('complete', function(data, response) {
      if (response.statusCode == 200) {
        df.resolve(response);
      }
      else df.reject(response);
    });
  });

  return df.promise;
}

C.prototype.save = function(challenge){
  fs.writeFile(C.paths.challenges + "current.json", JSON.stringify({slug: challenge.slug}));
  fs.writeFile(C.paths.challenges + challenge.slug + ".json", JSON.stringify(challenge));
}

C.prototype.test = function(){
  return this.next();
}
