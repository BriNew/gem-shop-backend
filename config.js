const mlabDbUrl =  "mongodb://BriNew:133Finnish@ds137206.mlab.com:37206/rock-inventory";

exports.DATABASE_URL = process.env.DATABASE_URL ||
                       global.DATABASE_URL ||
                       mlabDbUrl;
exports.PORT = process.env.PORT || 8080;
exports.CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'https://young-eyrie-40144.herokuapp.com/';


