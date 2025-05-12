import jwt from 'jsonwebtoken';
// JWT authentication middleware
export const authenticateJWT = (req) => {
  return new Promise((resolve) => {
    const authHeader = req.headers.authorization;
    console.log("Auth header received:", authHeader);
    
    if (authHeader) {
      const token = authHeader.split(' ')[1];
      
      jwt.verify(token, process.env.JWT_SECRET || "your-jwt-secret", (err, user) => {
        if (err) {
          resolve(null);
        } else {
          resolve(user);
        }
      });
    } else {
      resolve(null);
    }
  });
};