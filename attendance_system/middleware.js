const jwt = require('jsonwebtoken');

module.exports.authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization; 
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).send('You must log in to access this'); 
  }

  const token = authHeader.split(' ')[1];  
  jwt.verify(token, "secret", (err, decoded) => {
    if (err) {
      return res.status(401).send('Invalid token'); 
    }
    
    req.user = decoded; 
    next(); 
  });
};
