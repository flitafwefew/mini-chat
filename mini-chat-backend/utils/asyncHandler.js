// 异步错误处理包装器
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((err) => {
      next(err);
    });
  };
};

module.exports = asyncHandler;

