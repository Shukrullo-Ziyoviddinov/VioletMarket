const commentService = require("../../services/comment/commentService");
const { asyncHandler } = require("../../utils/asyncHandler");

const listByProduct = asyncHandler(async (req, res) => {
  const data = await commentService.getCommentsByProductId(req.params.productId);
  res.json({ ok: true, ...data });
});

const create = asyncHandler(async (req, res) => {
  const data = await commentService.createComment(req.userId, req.body || {});
  res.status(201).json({ ok: true, ...data });
});

module.exports = {
  listByProduct,
  create,
};
