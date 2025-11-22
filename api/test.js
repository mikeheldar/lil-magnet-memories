module.exports = (req, res) => {
  res.status(200).json({ message: 'API route works!', timestamp: new Date().toISOString() });
};
