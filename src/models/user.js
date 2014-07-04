/**
 * Dependencies
 */
var bcrypt = require("../../lib/bcrypt_thunk"); // version that supports yields
var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var co = require("co");

/**
 * Constants
 */
const SALT_WORK_FACTOR = 10;

var UserSchema = new Schema({
  data: {
    cip: { type: String, required: true, unique: true, lowercase: true, match: /^[a-z]{4}\d{4}$/ },
    email: { type: String },
    name: { type: String },
    concentration: { type: Number },
    promocard: {
      price: { type: Number },
      date: { type: Date },
    },
    points: [{
      event: { type: Schema.ObjectId, ref: "Event" },
      points: { type: Number },
    }],
  },
  meta: {
    password: { type: String },
    provider: {type : String },
    isAdmin: { type: Boolean, default: false }
  }
}, {
  toJSON : {
    transform: function (doc, ret, options) {
      ret = doc.data;
      ret.isAdmin = doc.meta ? doc.meta.isAdmin : undefined;
      ret.id = doc.id;
      return ret;
    }
  }
});

/**
 * Virtuals
 */
UserSchema.virtual("password").set(function (password) {
  this.meta.password = password;
});
UserSchema.virtual("password").get(function () {
  return this.meta.password;
});

/**
 * Middlewares
 */
UserSchema.pre("save", function (done) {
  // only hash the password if it has been modified (or is new)
  if (!this.meta.password || this.meta.password.length < 1 || !this.isModified("meta.password")) {
    return done();
  }

  co(function*() {
    try {
      var salt = yield bcrypt.genSalt();
      var hash = yield bcrypt.hash(this.meta.password, salt);
      this.meta.password = hash;
      done();
    }
    catch (err) {
      done(err);
    }
  }).call(this, done);
});

/**
 * Methods
 */
UserSchema.methods.comparePassword = function *(candidatePassword) {
  // User password is not set yet
  if (!this.meta.password || this.meta.password.length < 1) return false;
  return yield bcrypt.compare(candidatePassword, this.meta.password);
};

/**
 * Statics
 */

UserSchema.statics.findAndComparePassword = function *(cip, password) {
  var user = yield this.findOne({ "data.cip": cip.toLowerCase() }).exec();
  if (!user) throw new Error("User not found");

  if (yield user.comparePassword(password)) {
    user.meta.provider = "local";
    yield user.save();
    return user;
  }

  throw new Error("Password does not match");
};;


var fetchProfile  = function(profile, user) {
  if (!profile.emails) {
    // We dont have informations
    return;
  }
  user.data.email = profile.emails[0].value;
  user.data.name = profile.displayName;
};

UserSchema.statics.findOrCreateCAS = function *(profile, casRes) {
  var user = yield this.findOne({ "data.cip": profile.id }).exec();

  if (!user) {
    user = new this({ data: {cip: profile.id }});
  }

  fetchProfile(profile, user);

  user.meta.provider = profile.provider;
  yield user.save();

  return user;
};

// Model creation
mongoose.model("User", UserSchema);
