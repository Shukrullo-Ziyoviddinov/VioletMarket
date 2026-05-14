function root(req, res) {
  res.json({ ok: true, message: "Violet Market API" });
}

module.exports = {
  root,
};
