const { asyncHandler } = require("../utils/asyncHandler");
const {
  uploadSingleImageMiddleware,
  uploadSingleVideoMiddleware,
  uploadImage,
  uploadVideo,
} = require("./adminUploadController");

const uploadSellerImage = asyncHandler(async (req, res) => {
  uploadImage(req, res);
});

const uploadSellerVideo = asyncHandler(async (req, res) => {
  uploadVideo(req, res);
});

module.exports = {
  uploadSingleImageMiddleware,
  uploadSingleVideoMiddleware,
  uploadSellerImage,
  uploadSellerVideo,
};
