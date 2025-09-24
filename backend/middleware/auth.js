const { verifyToken } = require("../config/jwt");
const User = require("../models/User");
const ErrorResponse = require("../utils/ErrorResponse");


exports.protect = async (req, res, next) => {
  let token;
  // Accept token from multiple common locations to support different clients
  try {
    if (req.headers.authorization) {
      // Support case-insensitive 'Bearer' prefix and flexible spacing
      const parts = req.headers.authorization.split(/\s+/);
      if (parts.length === 2 && /^bearer$/i.test(parts[0])) {
        token = parts[1];
      }
    }

    // Fallbacks: x-access-token header, query param, or cookie (if cookie-parser is used)
    if (!token && req.headers['x-access-token']) token = req.headers['x-access-token'];
    if (!token && req.query && req.query.token) token = req.query.token;
    if (!token && req.cookies && req.cookies.token) token = req.cookies.token;

    if (!token) {
      console.warn(`Auth protect: no token provided for ${req.method} ${req.originalUrl}`);
      return next(new ErrorResponse("Not authorized to access this route", 401));
    }

    const decoded = verifyToken(token);
    if (!decoded || !decoded.id) {
      console.warn('Auth protect: token decoded but missing id', { decoded });
      return next(new ErrorResponse("Not authorized to access this route", 401));
    }

    req.user = await User.findById(decoded.id);

    if (!req.user) {
      console.warn('Auth protect: user not found for token id', decoded.id);
      return next(new ErrorResponse("Not authorized to access this route", 401));
    }

    next();
  } catch (err) {
    console.warn('Auth protect: token verification failed', err && err.message ? err.message : err);
    return next(new ErrorResponse("Not authorized to access this route", 401));
  }
};


exports.authorize = (...roles) => {
  return async (req, res, next) => {
    
    const freshUser = await User.findById(req.user._id);
    if (!freshUser) {
      return next(new ErrorResponse("User not found", 401));
    }

    
    const flattenRoles = (arr) => {
      const out = [];
      const helper = (v) => {
        if (Array.isArray(v)) return v.forEach(helper);
        if (v && typeof v === "object") {
          if (v.role) return helper(v.role);
          return out.push(String(v));
        }
        if (v !== undefined && v !== null) out.push(v);
      };
      helper(arr);
      return out;
    };

    const allowedInput = flattenRoles(roles.length === 1 ? roles[0] : roles);

    
    const userRole = String(freshUser.role || "")
      .trim()
      .toLowerCase();
    let normalizedRoles = Array.from(
      new Set(
        allowedInput.map((role) =>
          String(role || "")
            .trim()
            .toLowerCase()
        )
      )
    );
    // Map legacy or alternative role names to canonical roles used in the system
    const aliasMap = {
      company_admin: "admin",
      companny_admin: "admin", // handle typo
      branch_head: "admin",
      branch_admin: "admin",
      manager: "admin",
      branch_staff: "staff",
      branchadmin: "admin",
    };

    const equivalentMap = {};
    Object.entries(aliasMap).forEach(([alias, canonical]) => {
      equivalentMap[alias] = Array.from(new Set([alias, canonical]));
      equivalentMap[canonical] = Array.from(new Set([canonical, alias]));
    });

    const expandedAllowed = normalizedRoles.reduce((acc, r) => {
      acc.add(r);
      if (equivalentMap[r]) equivalentMap[r].forEach((x) => acc.add(x));
      return acc;
    }, new Set());

    const userEquivalents = new Set([userRole]);
    if (equivalentMap[userRole])
      equivalentMap[userRole].forEach((x) => userEquivalents.add(x));

    const intersection = Array.from(userEquivalents).filter((x) =>
      expandedAllowed.has(x)
    );
    if (intersection.length === 0) {
      console.warn("Authorization diagnostic:", {
        path: req.path,
        rolesParam: roles,
        allowedInput,
        userRoleRaw: freshUser.role,
        userRoleNormalized: userRole,
        normalizedRoles,
        expandedAllowed: Array.from(expandedAllowed),
        userEquivalents: Array.from(userEquivalents),
      });
      return next(
        new ErrorResponse(
          `User role ${freshUser.role} is not authorized to access this route`,
          403
        )
      );
    }

    next();
  };
};
