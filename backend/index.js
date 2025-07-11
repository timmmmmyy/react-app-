const { app } = require('./server');

const PORT = process.env.PORT || 4000;
 
app.listen(PORT, () => {
  console.log(`🚀 Ascends Backend running on http://localhost:${PORT}`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'not set'}`);
}); 