
'use strict';

// Project metadata.
var pkg = require('../package.json');

// Display grunt-cli version.
exports.version = function() {
  console.log('ysf v' + pkg.version);
  process.exit();
};

// Show help and exit.
exports.help = function() {
    console.log('\tysf ' + pkg.description + ',v '+pkg.version );
    console.log('ysf help:\n\tysf build-widget: build at src/widget\n\tysf build-page: build begins at src/page, src/base, src/business');
  process.exit();
};
