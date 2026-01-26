"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Turnstile from "react-turnstile";

export default function ELibrarySignup() {
  const BASEURL = process.env.NEXT_PUBLIC_BASEURL || "http://localhost:5000";
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    userName: "",
    email: "",
    contactNumber: "",
    password: "",
    passwordConfirmation: "",
    agreeToTerms: false,
  });
  const [turnstileToken, setTurnstileToken] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({
    type: "",
    text: "",
  });
  const router = useRouter();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (message.text) {
      setMessage({ type: "", text: "" });
    }
  };

  const validateForm = () => {
    if (!formData.firstName.trim()) {
      return "First name is required";
    }
    if (!formData.lastName.trim()) {
      return "Last name is required";
    }
    if (!formData.userName.trim()) {
      return "Username is required";
    }
    if (!formData.email.trim()) {
      return "Email is required";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      return "Invalid email format";
    }

    if (!formData.contactNumber.trim()) {
      return "Contact number is required";
    }
    if (formData.contactNumber.length < 10) {
      return "Contact number must be at least 10 digits";
    }

    if (!formData.password) {
      return "Password is required";
    }
    if (formData.password.length < 6) {
      return "Password must be at least 6 characters";
    }

    if (formData.password !== formData.passwordConfirmation) {
      return "Passwords do not match";
    }

    if (!formData.agreeToTerms) {
      return "You must agree to the terms and conditions";
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setMessage({
        type: "error",
        text: validationError,
      });
      return;
    }

    if (!turnstileToken) {
      setMessage({
        type: "error",
        text: "Please complete the CAPTCHA verification",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${BASEURL}/api/elibrary/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          userName: formData.userName,
          email: formData.email,
          contactNumber: formData.contactNumber,
          password: formData.password,
          turnstileToken,
        }),
        credentials: "include",
      });

      const result = await response.json();

      if (result.success) {
        setMessage({
          type: "success",
          text: "Registration successful! Redirecting to login...",
        });
        setTimeout(() => {
          router.push("/elibrary/login");
        }, 1500);
      } else {
        throw new Error(result.message || "Registration failed");
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: error.message || "Something went wrong. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4 py-8">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Message Display */}
          {message.text && (
            <div
              className={`mb-4 p-3 rounded-lg text-sm ${
                message.type === "success"
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* First Name */}
            <div>
              <label
                htmlFor="firstName"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                First Name
              </label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                value={formData.firstName}
                onChange={handleChange}
                disabled={isLoading}
                className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors disabled:opacity-50 disabled:bg-gray-50"
                placeholder="First Name"
              />
            </div>

            {/* Last Name */}
            <div>
              <label
                htmlFor="lastName"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Last Name
              </label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                value={formData.lastName}
                onChange={handleChange}
                disabled={isLoading}
                className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors disabled:opacity-50 disabled:bg-gray-50"
                placeholder="Last Name"
              />
            </div>

            {/* User Name */}
            <div>
              <label
                htmlFor="userName"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                User Name
              </label>
              <input
                id="userName"
                name="userName"
                type="text"
                value={formData.userName}
                onChange={handleChange}
                disabled={isLoading}
                className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors disabled:opacity-50 disabled:bg-gray-50"
                placeholder="User Name"
              />
            </div>

            {/* E-Mail */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                E-Mail
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                disabled={isLoading}
                className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors disabled:opacity-50 disabled:bg-gray-50"
                placeholder="E-Mail"
              />
            </div>

            {/* Contact Number */}
            <div>
              <label
                htmlFor="contactNumber"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Contact Number
              </label>
              <input
                id="contactNumber"
                name="contactNumber"
                type="tel"
                value={formData.contactNumber}
                onChange={handleChange}
                disabled={isLoading}
                className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors disabled:opacity-50 disabled:bg-gray-50"
                placeholder="Contact Number"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                disabled={isLoading}
                className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors disabled:opacity-50 disabled:bg-gray-50"
                placeholder="Password"
              />
            </div>

            {/* Password Confirmation */}
            <div>
              <label
                htmlFor="passwordConfirmation"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Password Confirmation
              </label>
              <input
                id="passwordConfirmation"
                name="passwordConfirmation"
                type="password"
                value={formData.passwordConfirmation}
                onChange={handleChange}
                disabled={isLoading}
                className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors disabled:opacity-50 disabled:bg-gray-50"
                placeholder="Password Confirmation"
              />
            </div>

            {/* Terms and Conditions */}
            <div className="flex items-start">
              <input
                id="agreeToTerms"
                name="agreeToTerms"
                type="checkbox"
                checked={formData.agreeToTerms}
                onChange={handleChange}
                className="h-4 w-4 mt-1 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label
                htmlFor="agreeToTerms"
                className="ml-2 block text-sm text-gray-700"
              >
                By signing up, I agree with the website's{" "}
                <Link
                  href="/terms"
                  className="text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Terms and Conditions
                </Link>
              </label>
            </div>

            {/* Turnstile Widget */}
            <div className="flex justify-center my-4">
              <Turnstile
                sitekey={process.env.NEXT_PUBLIC_CLOUDFLARE_SITE_KEY}
                onVerify={(token) => setTurnstileToken(token)}
              />
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Registering...
                  </>
                ) : (
                  "Register"
                )}
              </button>
            </div>

            {/* Login Link */}
            <div className="text-center text-sm">
              <span className="text-gray-600">Already have an account? </span>
              <Link
                href="/elibrary/login"
                className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                Sign In
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
