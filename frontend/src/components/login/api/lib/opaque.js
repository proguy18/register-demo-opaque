module.exports = (io, sodium, oprf) => {
  const util = require("./util.js")(sodium, oprf);

  // Sign up as a new user
  const clientRegister = async (password, user_id, op_id) => {
    op_id = op_id + ":pake_init";
    const get = io.get.bind(null, op_id);
    const give = io.give.bind(null, op_id);

    const hashedPassword = util.oprfKdf(password);
    give("sid", user_id);
    give("hashedPassword", hashedPassword);

    return await get("registered");
  };

  // Register a new user for the first time
  const serverRegister = async (t, op_id) => {
    op_id = op_id + ":pake_init";
    const get = io.get.bind(null, op_id);
    const give = io.give.bind(null, op_id);

    const sid = await get("sid");
    const hashedPassword = await get("hashedPassword");

    const serverOPRFKey = sodium.crypto_core_ristretto255_scalar_random();
    const OPRFPassword = util.iteratedHash(util.oprfF(serverOPRFKey, hashedPassword), t);
    const serverPrivateKey = sodium.crypto_core_ristretto255_scalar_random();
    const clientPrivateKey = sodium.crypto_core_ristretto255_scalar_random();
    const serverPublicKey = sodium.crypto_scalarmult_ristretto255_base(serverPrivateKey);
    const clientPublicKey = sodium.crypto_scalarmult_ristretto255_base(clientPrivateKey);
    const asymmetricKeys = {
      clientPrivateKey: util.sodiumAeadEncrypt(OPRFPassword, clientPrivateKey),
      clientPublicKey: util.sodiumAeadEncrypt(OPRFPassword, clientPublicKey),
      serverPublicKey: util.sodiumAeadEncrypt(OPRFPassword, serverPublicKey),
    };

    const user_record = {
      id: sid,
      pepper: { serverOPRFKey: serverOPRFKey, serverPrivateKey: serverPrivateKey, serverPublicKey: serverPublicKey, clientPublicKey: clientPublicKey, asymmetricKeys: asymmetricKeys },
    };
    give("registered", true);

    return user_record;
  };

  // Try to log in
  const clientAuthenticate = async (password, user_id, t, op_id) => {
    op_id = op_id + ":pake";
    const get = io.get.bind(null, op_id);
    const give = io.give.bind(null, op_id);

    const r = sodium.crypto_core_ristretto255_scalar_random();
    const xu = sodium.crypto_core_ristretto255_scalar_random();

    const hashedPassword = util.oprfKdf(password);
    const _H1_x_ = util.oprfH1(hashedPassword);
    const H1_x = _H1_x_.point;
    const mask = _H1_x_.mask;
    const a = util.oprfRaise(H1_x, r);

    const Xu = sodium.crypto_scalarmult_ristretto255_base(xu);
    give("alpha", a);
    give("Xu", Xu);

    const b = await get("beta");

    if (!sodium.crypto_core_ristretto255_is_valid_point(b)) {
      console.log("client_authenticated_1 false " + user_id);
      give("client_authenticated", false);
      throw new Error("client_authenticated_1 false");
    }

    const asymmetricKeys = await get("asymmetricKeys");
    const r_inv = sodium.crypto_core_ristretto255_scalar_invert(r);
    const OPRFPassword = util.iteratedHash(util.oprfH(util.oprfRaise(b, r_inv), mask), t);
    const clientPrivateKey = util.sodiumAeadDecrypt(OPRFPassword, asymmetricKeys.clientPrivateKey);

    if (!sodium.crypto_core_ristretto255_is_valid_point(clientPrivateKey)) {
      console.log("client_authenticated_2 false " + user_id);
      give("client_authenticated", false);
      throw new Error("client_authenticated_2 false");
    }

    const clientPublicKey = util.sodiumAeadDecrypt(OPRFPassword, asymmetricKeys.clientPublicKey);
    const serverPublicKey = util.sodiumAeadDecrypt(OPRFPassword, asymmetricKeys.serverPublicKey);
    const Xs = await get("Xs");
    const K = util.KE(clientPrivateKey, xu, serverPublicKey, Xs, Xu);
    const SK = util.oprfF(K, util.sodiumFromByte(0));
    const As = util.oprfF(K, util.sodiumFromByte(1));
    const Au = util.oprfF(K, util.sodiumFromByte(2));

    const __As = await get("As");

    if (sodium.compare(As, __As) !== 0) {
      // The comparable value of 0 means As equals __As
      console.log("client_authenticated_3 false " + user_id);
      give("client_authenticated", false);
      throw new Error("client_authenticated_3 false");
    }

    give("Au", Au);

    const success = await get("authenticated");
    if (success) {
      const token = sodium.to_hex(SK);
      return token;
    } else {
      console.log("client_authenticated_4 false " + user_id);
      give("client_authenticated", false);
      throw new Error("client_authenticated_4 false");
    }
  };

  // Authenticate a user
  const serverAuthenticate = async (user_id, pepper, op_id) => {
    op_id = op_id + ":pake";
    const get = io.get.bind(null, op_id);
    const give = io.give.bind(null, op_id);

    const a = await get("alpha");
    if (!sodium.crypto_core_ristretto255_is_valid_point(a)) {
      console.log("Authentication failed.  Alpha is not a group element.");
      give("authenticated", false);
      throw new Error("Authentication failed.  Alpha is not a group element.");
    }
    const xs = sodium.crypto_core_ristretto255_scalar_random();
    const b = util.oprfRaise(a, pepper.serverOPRFKey);
    const Xs = sodium.crypto_scalarmult_ristretto255_base(xs);

    const Xu = await get("Xu");
    const K = util.KE(pepper.serverPrivateKey, xs, pepper.clientPublicKey, Xu, Xs);
    const SK = util.oprfF(K, util.sodiumFromByte(0));
    const As = util.oprfF(K, util.sodiumFromByte(1));
    const Au = util.oprfF(K, util.sodiumFromByte(2));

    give("beta", b);
    give("Xs", Xs);
    give("asymmetricKeys", pepper.asymmetricKeys);
    give("As", As);

    const __Au = await get("Au");
    if (sodium.compare(Au, __Au) === 0) {
      // The comparable value of 0 means equality
      give("authenticated", true);
      const token = sodium.to_hex(SK);
      return token;
    } else {
      console.log("Authentication failed.  Wrong password for " + user_id);
      give("authenticated", false);
      throw new Error("Authentication failed.  Wrong password for " + user_id);
    }
  };

  return {
    clientRegister,
    serverRegister,
    clientAuthenticate,
    serverAuthenticate,
  };
};
