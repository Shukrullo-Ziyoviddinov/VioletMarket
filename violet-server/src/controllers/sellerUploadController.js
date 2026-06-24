const { asyncHandler } = require("../utils/asyncHandler");
const {
  uploadSingleImageMiddleware,
  uploadImage,
} = require("./adminUploadController");

const uploadSellerImage = asyncHandler(async (req, res) => {
  uploadImage(req, res);
});

module.exports = {
  uploadSingleImageMiddleware,
  uploadSellerImage,
};
