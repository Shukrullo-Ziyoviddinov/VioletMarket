const messageChatService = require("../../services/messageChat/messageChatService");
const { asyncHandler } = require("../../utils/asyncHandler");

const listSellerThreads = asyncHandler(async (req, res) => {
  const data = await messageChatService.listSellerThreads(req.sellerShopId);
  res.json({ ok: true, ...data });
});

const getSellerThreadMessages = asyncHandler(async (req, res) => {
  const data = await messageChatService.getThreadMessagesForSeller(
    req.sellerShopId,
    req.params.userId,
  );
  res.json({ ok: true, ...data });
});

const sendSellerMessage = asyncHandler(async (req, res) => {
  const data = await messageChatService.sendSellerMessage(
    req.sellerShopId,
    req.params.userId,
    req.body || {},
  );
  res.status(201).json({ ok: true, ...data });
});

const markSellerThreadRead = asyncHandler(async (req, res) => {
  const data = await messageChatService.markThreadReadBySeller(
    req.sellerShopId,
    req.params.userId,
  );
  res.json({ ok: true, ...data });
});

module.exports = {
  listSellerThreads,
  getSellerThreadMessages,
  sendSellerMessage,
  markSellerThreadRead,
};
