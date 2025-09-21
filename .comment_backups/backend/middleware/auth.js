const { verifyToken } = require("../config/jwt");
const User = require("../models/User");
const ErrorResponse = require("../utils/ErrorResponse");

// Protect routes
exports.protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(new ErrorResponse("Not authorized to access this route", 401));
  }

  try {
    // Verify token
    const decoded = verifyToken(token);

    req.user = await User.findById(decoded.id);

    next();
  } catch (err) {
    return next(new ErrorResponse("Not authorized to access this route", 401));
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return async (req, res, next) => {
    // Double check the user from database to ensure fresh data
    const freshUser = await User.findById(req.user._id);
    if (!freshUser) {
      return next(new ErrorResponse("User not found", 401));
    }

    // Accept either authorize('a','b') or authorize(['a','b']), and handle nested arrays or objects
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

    // Normalize roles by coercing to string, trimming and converting to lowercase
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
    const aliasMap = {
      company_admin: "admin",
      branch_head: "manager",
      branch_staff: "staff",
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
