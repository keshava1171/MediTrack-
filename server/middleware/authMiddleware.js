
const protect = (req, res, next) => {
    if (req.session && req.session.user) {
        req.user = req.session.user; 
        next();
    } else {
        res.status(401).json({ message: 'Not authorized, please login' });
    }
};
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'User role is not authorized to access this route' });
        }
        next();
    };
};
module.exports = { protect, authorize };
