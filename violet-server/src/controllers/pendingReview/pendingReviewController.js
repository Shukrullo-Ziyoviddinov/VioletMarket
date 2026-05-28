const pendingReviewService = require("../../services/pendingReview/pendingReviewService");
const { asyncHandler } = require("../../utils/asyncHandler");

const listMine = asyncHandler(async (req, res) => {
  const data = await pendingReviewService.listPendingForUser(req.userId);
  res.json({ ok: true, ...data });
});

const createBatch = asyncHandler(async (req, res) => {
  const data = await pendingReviewService.createPendingBatch(req.userId, req.body || {});
  res.status(201).json({ ok: true, ...data });
});

module.exports = {
  listMine,
  createBatch,
};
