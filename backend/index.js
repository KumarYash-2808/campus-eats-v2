const admin = require("firebase-admin");
const serviceAccount = require("./campus-eats-c49b7-firebase-adminsdk-fbsvc-c6318f8cf9.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});