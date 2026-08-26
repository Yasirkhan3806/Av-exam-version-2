import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import request from "supertest";
import mongoose from "mongoose";

process.env.JWT_SECRET = process.env.JWT_SECRET || "rbac-test-secret";

// This suite never calls connectDB() — it only cares whether auth/role
// middleware blocks a request before it reaches a controller, not whether
// the request fully succeeds. Disabling query buffering makes any route
// that *does* reach Mongoose fail fast (~ms) with a non-401/403 error
// instead of hanging for the default ~10s buffering timeout waiting on a
// connection that will never come — keeps this test fast and independent
// of any local MongoDB instance.
mongoose.set("bufferCommands", false);

const { buildApp } = await import("../app.js");
const app = buildApp();

// Student and admin sessions share the same cookie name ("token") in this
// app — verifyToken doesn't distinguish them, only the role claim inside
// the JWT does (see backend/utils/middleware.js's requireRole).
const makeTokenCookie = (role) => {
  const token = jwt.sign(
    {
      userId: "507f1f77bcf86cd799439011",
      email: `${role}@example.com`,
      role,
    },
    process.env.JWT_SECRET,
    { expiresIn: "1h" },
  );

  return `token=${token}`;
};

const ADMIN_COOKIE = makeTokenCookie("admin");
const STUDENT_COOKIE = makeTokenCookie("student");
const DUMMY_ID = "507f1f77bcf86cd799439012";

const adminOnlyCases = [
  { method: "delete", path: `/auth/delete-student/${DUMMY_ID}` },
  {
    method: "put",
    path: `/auth/update-student/${DUMMY_ID}`,
    body: { name: "Updated Name" },
  },
  {
    method: "post",
    path: "/subjects/addSubject",
    body: { subjectName: "RBAC Test Subject", subjectCode: "RB-101" },
  },
  {
    method: "post",
    path: "/questions/addQuestions",
    body: { title: "RBAC test payload" },
  },
  { method: "delete", path: `/subjects/deleteSubject/${DUMMY_ID}` },
];

for (const routeCase of adminOnlyCases) {
  test(`No token denied on ${routeCase.method.toUpperCase()} ${routeCase.path}`, async () => {
    const req = request(app)[routeCase.method](routeCase.path);
    if (routeCase.body) {
      req.send(routeCase.body);
    }

    const res = await req;
    assert.equal(res.status, 401);
  });

  test(`Student token forbidden on ${routeCase.method.toUpperCase()} ${routeCase.path}`, async () => {
    const req = request(app)
      [routeCase.method](routeCase.path)
      .set("Cookie", STUDENT_COOKIE);
    if (routeCase.body) {
      req.send(routeCase.body);
    }

    const res = await req;
    assert.equal(res.status, 403);
  });

  test(`Admin token passes authz on ${routeCase.method.toUpperCase()} ${routeCase.path}`, async () => {
    const req = request(app)
      [routeCase.method](routeCase.path)
      .set("Cookie", ADMIN_COOKIE);
    if (routeCase.body) {
      req.send(routeCase.body);
    }

    const res = await req;
    assert.notEqual(res.status, 401);
    assert.notEqual(res.status, 403);
  });
}
